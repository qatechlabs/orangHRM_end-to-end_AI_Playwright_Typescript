/**
 * Quality gate for AI-generated manual test cases. Fails (exit 1) on:
 *  - JSON schema violations
 *  - duplicate IDs, ID prefix/layer mismatches
 *  - duplicate or near-duplicate cases (same layer, similarity >= threshold)
 *  - requirement IDs that do not exist in the source BRD
 *  - "Automated" cases whose spec file is missing or does not mention the TC ID
 * Reports (does not fail on) BRD acceptance criteria that no case covers.
 *
 *   npm run tc:validate                 -> every module
 *   npm run tc:validate -- pim          -> one module
 *   SIMILARITY=0.8 npm run tc:validate  -> stricter near-duplicate threshold
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  loadSuites,
  requirementIdsIn,
  tokens,
  jaccard,
  fingerprintText,
  scopeOf,
  type TestCase,
} from './lib/testCases';

const THRESHOLD = Number(process.env.SIMILARITY ?? 0.85);
const schema = JSON.parse(fs.readFileSync(path.resolve('test-cases/schema/test-cases.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

let errors = 0;
const err = (file: string, msg: string) => {
  errors++;
  console.error(`  ✖ ${path.basename(file)}: ${msg}`);
};

for (const { file, suite } of loadSuites(process.argv.slice(2))) {
  console.log(
    `\n${suite.module} (${path.relative(process.cwd(), file)}): ${suite.testCases?.length ?? 0} cases`,
  );

  if (!validate(suite)) {
    for (const e of validate.errors ?? []) err(file, `schema ${e.instancePath} ${e.message}`);
    continue;
  }

  const cases = suite.testCases;
  const ids = new Set<string>();
  for (const tc of cases) {
    if (ids.has(tc.id)) err(file, `duplicate id ${tc.id}`);
    ids.add(tc.id);
    if (!tc.id.startsWith(`${suite.moduleCode}-${tc.layer}-`))
      err(file, `${tc.id}: id must start with ${suite.moduleCode}-${tc.layer}-`);
  }

  // Duplicates: exact title, then near-duplicate content within the same layer.
  const titles = new Map<string, string>();
  for (const tc of cases) {
    const key = `${tc.layer}|${tc.title.toLowerCase().replace(/\W+/g, ' ').trim()}`;
    if (titles.has(key)) err(file, `${tc.id} has the same title as ${titles.get(key)}`);
    titles.set(key, tc.id);
  }
  const fp = cases.map((tc) => ({ tc, t: tokens(fingerprintText(tc)) }));
  for (let i = 0; i < fp.length; i++) {
    for (let j = i + 1; j < fp.length; j++) {
      if (fp[i].tc.layer !== fp[j].tc.layer) continue;
      const sim = jaccard(fp[i].t, fp[j].t);
      if (sim >= THRESHOLD)
        err(file, `${fp[i].tc.id} and ${fp[j].tc.id} look like duplicates (similarity ${sim.toFixed(2)})`);
    }
  }

  // Traceability against the BRD.
  if (!fs.existsSync(path.resolve(suite.source))) {
    err(file, `source BRD ${suite.source} not found (run npm run brd:md)`);
  } else {
    const known = requirementIdsIn(suite.source);
    const covered = new Set<string>();
    for (const tc of cases) {
      for (const r of tc.requirementIds) {
        if (!known.has(r)) err(file, `${tc.id}: requirement ${r} is not defined in ${suite.source}`);
        covered.add(r);
        covered.add(r.replace(/-AC\d+$/, ''));
      }
    }
    const scope = scopeOf(suite);
    const uncovered = [...known].filter((r) => /-AC\d+$/.test(r) && scope.test(r) && !covered.has(r));
    if (uncovered.length)
      console.warn(
        `  ⚠ ${uncovered.length} acceptance criteria in scope without a test case: ${uncovered.join(', ')}`,
      );
  }

  // Automation links.
  for (const tc of cases as TestCase[]) {
    if (tc.automation.status !== 'Automated') continue;
    if (!tc.automation.spec) {
      err(file, `${tc.id}: Automated but no automation.spec`);
      continue;
    }
    const spec = path.resolve(tc.automation.spec);
    if (!fs.existsSync(spec)) err(file, `${tc.id}: spec ${tc.automation.spec} not found`);
    else if (!fs.readFileSync(spec, 'utf8').includes(`[${tc.id}]`))
      err(file, `${tc.id}: not referenced in ${tc.automation.spec}`);
  }

  const by = (k: keyof TestCase) =>
    Object.entries(
      cases.reduce<Record<string, number>>((a, c) => ((a[String(c[k])] = (a[String(c[k])] ?? 0) + 1), a), {}),
    )
      .map(([n, c]) => `${n}=${c}`)
      .join(' ');
  console.log(`  layer: ${by('layer')} | type: ${by('type')} | priority: ${by('priority')}`);
  console.log(
    `  automated: ${cases.filter((c) => c.automation.status === 'Automated').length}/${cases.length}`,
  );
}

if (errors) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log('\nAll test case files are valid and duplicate-free.');
