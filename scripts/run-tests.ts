/**
 * `npm test`: the whole suite in two phases, because a few specs change the demo's GLOBAL
 * configuration (PIM optional fields, custom fields; see `globalConfigSpecs` in playwright.config.ts)
 * and would break tests running next to them:
 *   1. `--project=ui-* --project=api`   everything else, fully parallel
 *   2. `--project=global-config`         the global-config specs, one worker
 * Phase 2 always runs, even when phase 1 fails; the exit code is the first non-zero one.
 * Extra arguments (e.g. `--grep @P1`, `--repeat-each 2`) are passed to both phases.
 * Each phase writes its own HTML report (playwright-report/ and playwright-report/global-config/);
 * Allure results accumulate in allure-results/, so one Allure report covers both phases, and so do the
 * evidence results (evidence-results/), from which the Word report is built at the end
 * (evidence-report/OrangeHRM_E2E_Report_<date>.docx; skip with --no-word-report).
 *
 *   npm test                       -> both phases
 *   npm test -- --grep PIM-UI      -> both phases, filtered
 *   npm run test:parallel          -> phase 1 only
 *   npm run test:global-config     -> phase 2 only
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const wordReport = !process.argv.includes('--no-word-report');
const extraArgs = process.argv.slice(2).filter((a) => a !== '--no-word-report');

const phases: { title: string; args: string[]; env?: NodeJS.ProcessEnv }[] = [
  { title: 'parallel projects (ui-*, api)', args: ['--project=ui-*', '--project=api'] },
  {
    title: 'global-config project (one worker)',
    args: ['--project=global-config'],
    env: { PLAYWRIGHT_HTML_OUTPUT_DIR: 'playwright-report/global-config', EVIDENCE_KEEP: '1' },
  },
];

let exitCode = 0;
for (const [index, phase] of phases.entries()) {
  console.log(`\n=== Phase ${index + 1}/${phases.length}: ${phase.title} ===\n`);
  const result = spawnSync(process.execPath, [playwrightCli, 'test', ...phase.args, ...extraArgs], {
    stdio: 'inherit',
    env: { ...process.env, ...phase.env },
  });
  if (result.signal) {
    console.error(`\nPlaywright was terminated by ${result.signal}; stopping.`);
    process.exit(1);
  }
  if (result.status !== 0) exitCode ||= result.status ?? 1;
}

if (wordReport) {
  console.log('\n=== Word report ===\n');
  const result = spawnSync(
    process.execPath,
    [require.resolve('tsx/cli'), path.join(__dirname, 'word-report.ts')],
    {
      stdio: 'inherit',
    },
  );
  if (result.status !== 0) exitCode ||= result.status ?? 1;
}
process.exit(exitCode);
