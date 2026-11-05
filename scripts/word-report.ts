/**
 * Builds the Word test execution report from the evidence reporter's output (evidence-results/):
 * title page with environment and totals, results by module / feature, a test case index, the
 * failures, and one section per test with its execution log (the literal Playwright actions:
 * which button was clicked, what was filled, what was asserted) and its evidence screenshots.
 *
 *   npm run report:word                       -> evidence-report/OrangeHRM_E2E_Report_<date>.docx
 *   npm run report:word -- --log full         -> every event (fixtures, hooks, ...), not only steps/actions/asserts
 *   npm run report:word -- --log none         -> screenshots only
 *   npm run report:word -- --max-log-lines 400 --results evidence-results --out evidence-report
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
  type ITableCellOptions,
} from 'docx';
import type { EvidenceEvent, RunRecord, TestRecord } from '../src/reporters/evidenceReporter';

// ---- CLI ----
const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const RESULTS = path.resolve(opt('results', 'evidence-results'));
const OUT_DIR = path.resolve(opt('out', 'evidence-report'));
const LOG_MODE = opt('log', 'steps') as 'steps' | 'full' | 'none';
const MAX_LOG_LINES = Number(opt('max-log-lines', '250'));
const IMAGE_WIDTH = 640; // px, fits an A4 page with 2 cm margins

if (!fs.existsSync(path.join(RESULTS, 'tests'))) {
  console.error(`No evidence results in ${RESULTS}. Run the tests first (npm test).`);
  process.exit(1);
}

// ---- data ----
const runs: RunRecord[] = fs
  .readdirSync(RESULTS)
  .filter((f) => /^run-.*\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS, f), 'utf8')) as RunRecord);

const allRecords: TestRecord[] = fs
  .readdirSync(path.join(RESULTS, 'tests'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS, 'tests', f), 'utf8')) as TestRecord)
  // The auth setup project is infrastructure, not a test case.
  .filter((r) => r.project !== 'setup');

// Keep the final attempt of every test (retries), ordered by layer, module, feature, file, line.
const finalByTest = new Map<string, TestRecord>();
for (const r of allRecords) {
  const id = `${r.project}|${r.file}|${r.line}|${r.title}`;
  const prev = finalByTest.get(id);
  if (!prev || r.retry > prev.retry) finalByTest.set(id, r);
}
const LAYER_ORDER: Record<string, number> = { UI: 0, API: 1, Setup: 2 };
const tests = [...finalByTest.values()].sort(
  (a, b) =>
    (LAYER_ORDER[a.layer] ?? 9) - (LAYER_ORDER[b.layer] ?? 9) ||
    a.module.localeCompare(b.module) ||
    a.feature.localeCompare(b.feature) ||
    a.file.localeCompare(b.file) ||
    a.line - b.line ||
    a.title.localeCompare(b.title),
);

type Verdict = 'Passed' | 'Failed' | 'Known issue' | 'Flaky' | 'Skipped';
const verdictOf = (t: TestRecord): Verdict => {
  if (t.outcome === 'skipped') return 'Skipped';
  if (t.outcome === 'flaky') return 'Flaky';
  if (t.outcome === 'unexpected') return 'Failed';
  return t.status === 'passed' ? 'Passed' : 'Known issue';
};
const VERDICT_FILL: Record<Verdict, string> = {
  Passed: 'C6EFCE',
  Failed: 'FFC7CE',
  'Known issue': 'FFEB9C',
  Flaky: 'FFEB9C',
  Skipped: 'E7E6E6',
};
const totals = { total: tests.length, Passed: 0, Failed: 0, 'Known issue': 0, Flaky: 0, Skipped: 0 };
for (const t of tests) totals[verdictOf(t)]++;
const passRate = totals.total
  ? Math.round(((totals.Passed + totals['Known issue']) / totals.total) * 100)
  : 0;

const env = runs[0]?.env ?? { name: '-', label: '-', baseURL: '-', appVersion: '-' };
const startedAt = runs[0]?.startTime ?? tests[0]?.startTime ?? new Date().toISOString();
const endedAt = runs.at(-1)?.endTime ?? new Date().toISOString();
const totalDurationMs = runs.reduce((sum, r) => sum + (r.durationMs ?? 0), 0);

// ---- helpers ----
const FONT = 'Calibri';
const MONO = 'Consolas';
const fmtDuration = (ms: number) =>
  ms >= 60_000 ? `${(ms / 60_000).toFixed(1)} min` : `${(ms / 1000).toFixed(1)} s`;
const fmtTime = (iso: string) => iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
const stamp = (ms: number) => {
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const tagValue = (t: TestRecord, re: RegExp) => t.tags.find((tag) => re.test(tag))?.replace('@', '') ?? '-';

const text = (content: string, opts: Partial<ConstructorParameters<typeof TextRun>[0] & object> = {}) =>
  new TextRun({ text: content, font: FONT, size: 20, ...opts });
const para = (
  content: string,
  opts: {
    bold?: boolean;
    size?: number;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    after?: number;
  } = {},
) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.after ?? 80 },
    children: [text(content, { bold: opts.bold, size: opts.size, color: opts.color })],
  });
const heading = (content: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [text(content, { bold: true })],
  });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (
  content: string | Paragraph[],
  opts: { fill?: string; bold?: boolean; width?: number; size?: number } = {},
): TableCell =>
  new TableCell({
    borders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children:
      typeof content === 'string'
        ? [
            new Paragraph({
              spacing: { after: 0 },
              children: [text(content, { bold: opts.bold, size: opts.size ?? 18 })],
            }),
          ]
        : content,
  } satisfies ITableCellOptions);
const table = (rows: TableRow[], widths?: number[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths?.map((w) => Math.round(w * 90)),
    rows,
  });
const headerRow = (labels: string[], widths?: number[]) =>
  new TableRow({
    tableHeader: true,
    children: labels.map((l, i) => cell(l, { fill: 'D9E2F3', bold: true, width: widths?.[i] })),
  });
const kvTable = (pairs: [string, string][]) =>
  table(
    pairs.map(
      ([k, v]) =>
        new TableRow({
          children: [cell(k, { fill: 'F2F2F2', bold: true, width: 28 }), cell(v, { width: 72 })],
        }),
    ),
    [28, 72],
  );

/** Width/height of a JPEG or PNG, read from its header, so pictures keep their aspect ratio. */
function imageSize(buffer: Buffer): { width: number; height: number } {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  let i = 2;
  while (i < buffer.length - 9) {
    if (buffer[i] !== 0xff) break;
    const marker = buffer[i + 1];
    const length = buffer.readUInt16BE(i + 2);
    if ([0xc0, 0xc1, 0xc2].includes(marker))
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return { width: 1440, height: 900 };
}

function image(relFile: string, caption: string, sub?: string): Paragraph[] {
  const file = path.join(RESULTS, relFile);
  if (!fs.existsSync(file)) return [para(`(missing screenshot ${relFile})`, { color: 'C00000' })];
  const data = fs.readFileSync(file);
  const { width, height } = imageSize(data);
  const w = Math.min(IMAGE_WIDTH, width);
  const h = Math.round((height / width) * w);
  return [
    new Paragraph({
      keepNext: true,
      spacing: { before: 120, after: 40 },
      children: [
        text(caption, { bold: true, size: 18 }),
        ...(sub ? [text(`  ${sub}`, { size: 16, color: '595959' })] : []),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new ImageRun({
          type: relFile.toLowerCase().endsWith('.png') ? 'png' : 'jpg',
          data,
          transformation: { width: w, height: h },
          altText: { title: caption, description: caption, name: path.basename(relFile) },
        }),
      ],
    }),
  ];
}

/**
 * Event lines for the Word report. `steps` mode keeps the business steps, the literal Playwright
 * actions and assertions of the test body, and only the data-setup steps (API calls) of the hooks;
 * `full` keeps everything. Depth is recomputed from the kept ancestors.
 */
function logLines(events: EvidenceEvent[]): EvidenceEvent[] {
  if (LOG_MODE === 'none') return [];
  const kept: EvidenceEvent[] = [];
  const displayDepth: number[] = [];
  const inHook: boolean[] = [];
  for (const e of events) {
    const parentDepth = e.depth === 0 ? -1 : (displayDepth[e.depth - 1] ?? -1);
    const hook = e.kind === 'HOOK' || (e.depth > 0 && (inHook[e.depth - 1] ?? false));
    inHook[e.depth] = hook;
    let keep = true;
    if (LOG_MODE === 'steps') {
      if (e.kind === 'HOOK' || e.kind === 'FIXTURE' || e.kind === 'OTHER') keep = false;
      else if (hook) keep = e.kind === 'STEP';
      else if (e.kind === 'EVIDENCE') keep = /^Attach "evidence #/.test(e.title);
    }
    if (keep) {
      const depth = parentDepth + 1;
      displayDepth[e.depth] = depth;
      kept.push({ ...e, depth });
    } else {
      displayDepth[e.depth] = parentDepth;
    }
  }
  return kept;
}

const KIND_COLOR: Record<EvidenceEvent['kind'], string> = {
  STEP: '1F3864',
  ACTION: '000000',
  ASSERT: '0B5394',
  EVIDENCE: '7F6000',
  HOOK: '7F7F7F',
  FIXTURE: '7F7F7F',
  OTHER: '7F7F7F',
};

function logParagraphs(t: TestRecord): Paragraph[] {
  const lines = logLines(t.events);
  if (!lines.length) return [];
  const out: Paragraph[] = [heading('Execution log', HeadingLevel.HEADING_4)];
  for (const e of lines.slice(0, MAX_LOG_LINES)) {
    const title =
      e.kind === 'EVIDENCE'
        ? e.title.replace(/^Attach "evidence #(\d+): (.*)"$/, 'Screenshot #$1: $2')
        : e.title;
    out.push(
      new Paragraph({
        spacing: { after: 0, line: 240 },
        indent: { left: 200 * e.depth },
        children: [
          new TextRun({ text: `${stamp(e.t)}  `, font: MONO, size: 15, color: '7F7F7F' }),
          new TextRun({
            text: `${e.kind.padEnd(8)} `,
            font: MONO,
            size: 15,
            bold: true,
            color: KIND_COLOR[e.kind],
          }),
          new TextRun({
            text: truncate(title, 260),
            font: MONO,
            size: 15,
            bold: e.kind === 'STEP',
            color: e.error ? 'C00000' : KIND_COLOR[e.kind],
          }),
          new TextRun({ text: `  (${e.durationMs} ms)`, font: MONO, size: 14, color: '7F7F7F' }),
          ...(e.error
            ? [new TextRun({ text: `  ✗ ${truncate(e.error, 200)}`, font: MONO, size: 15, color: 'C00000' })]
            : []),
        ],
      }),
    );
  }
  if (lines.length > MAX_LOG_LINES)
    out.push(
      para(
        `… ${lines.length - MAX_LOG_LINES} more events; the complete log is in ${path.join('evidence-results', t.logFile)}`,
        { size: 16, color: '595959' },
      ),
    );
  return out;
}

function apiParagraphs(t: TestRecord): Paragraph[] {
  if (!t.apiCalls.length || t.layer !== 'API') return [];
  const out: Paragraph[] = [heading('API requests and responses', HeadingLevel.HEADING_4)];
  for (const [i, call] of t.apiCalls.entries()) {
    const file = path.join(RESULTS, call.file);
    const body = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '(missing)';
    out.push(para(`${i + 1}. ${call.name}`, { bold: true, size: 18, after: 20 }));
    out.push(
      new Paragraph({
        spacing: { after: 120 },
        shading: { fill: 'F7F7F7', type: ShadingType.CLEAR, color: 'auto' },
        children: truncate(body, 1500)
          .split('\n')
          .flatMap((line, k) => [
            ...(k ? [new TextRun({ break: 1 })] : []),
            new TextRun({ text: line, font: MONO, size: 14 }),
          ]),
      }),
    );
  }
  return out;
}

function testSection(t: TestRecord): (Paragraph | Table)[] {
  const verdict = verdictOf(t);
  const title = t.title.replace(/^\[[^\]]+\]\s*/, '');
  const requirements = t.annotations
    .filter((a) => a.type === 'requirement')
    .map((a) => a.description ?? '')
    .join(', ');
  const issues = t.annotations.filter((a) => a.type === 'issue').map((a) => a.description ?? '');
  const out: (Paragraph | Table)[] = [
    heading(`${t.tcId ? `${t.tcId} — ` : ''}${title}`, HeadingLevel.HEADING_3),
    table(
      [
        new TableRow({
          children: [
            cell('Result', { fill: 'F2F2F2', bold: true, width: 14 }),
            cell(verdict + (verdict === 'Known issue' ? ` (expected ${t.status})` : ''), {
              fill: VERDICT_FILL[verdict],
              bold: true,
              width: 20,
            }),
            cell('Duration', { fill: 'F2F2F2', bold: true, width: 14 }),
            cell(fmtDuration(t.durationMs), { width: 18 }),
            cell('Started', { fill: 'F2F2F2', bold: true, width: 14 }),
            cell(fmtTime(t.startTime), { width: 20 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Priority', { fill: 'F2F2F2', bold: true }),
            cell(tagValue(t, /^@P\d$/i)),
            cell('Type', { fill: 'F2F2F2', bold: true }),
            cell(tagValue(t, /^@(positive|negative|edge)$/i)),
            cell('Project', { fill: 'F2F2F2', bold: true }),
            cell(`${t.project}${t.retry ? ` (retry ${t.retry})` : ''}`),
          ],
        }),
        new TableRow({
          children: [
            cell('Requirements', { fill: 'F2F2F2', bold: true }),
            new TableCell({
              borders,
              columnSpan: 3,
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({ spacing: { after: 0 }, children: [text(requirements || '-', { size: 18 })] }),
              ],
            }),
            cell('Spec', { fill: 'F2F2F2', bold: true }),
            cell(`${t.file}:${t.line}`, { size: 16 }),
          ],
        }),
      ],
      [14, 20, 14, 18, 14, 20],
    ),
  ];
  for (const issue of issues) out.push(para(`Known issue: ${issue}`, { size: 18, color: '7F6000' }));
  if (t.errors.length) {
    out.push(
      heading(
        verdict === 'Known issue' ? 'Expected failure (app behaviour differs from the BRD)' : 'Failure',
        HeadingLevel.HEADING_4,
      ),
    );
    for (const err of t.errors)
      out.push(
        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: 'FFF2F2', type: ShadingType.CLEAR, color: 'auto' },
          children: truncate(err, 1800)
            .split('\n')
            .flatMap((line, k) => [
              ...(k ? [new TextRun({ break: 1 })] : []),
              new TextRun({ text: line, font: MONO, size: 14, color: '7F0000' }),
            ]),
        }),
      );
  }
  out.push(...logParagraphs(t));
  out.push(...apiParagraphs(t));
  if (t.evidence.length || t.failureScreenshots.length) {
    out.push(
      heading(
        `Evidence (${t.evidence.length + t.failureScreenshots.length} screenshot${t.evidence.length + t.failureScreenshots.length === 1 ? '' : 's'})`,
        HeadingLevel.HEADING_4,
      ),
    );
    for (const ev of t.evidence)
      out.push(
        ...image(
          ev.file,
          `Screenshot #${ev.n}${ev.status === 'failed' ? ' (FAILED)' : ''}: ${truncate(ev.caption, 180)}`,
          [ev.elapsedMs !== undefined ? stamp(ev.elapsedMs) : '', ev.url ?? ''].filter(Boolean).join('  '),
        ),
      );
    for (const [i, file] of t.failureScreenshots.entries())
      out.push(...image(file, `Failure screenshot ${i + 1} (page state when the test failed)`));
  } else {
    out.push(para('No screenshot evidence (no UI assertion in this test).', { size: 18, color: '595959' }));
  }
  return out;
}

// ---- document ----
const children: (Paragraph | Table | TableOfContents)[] = [];

children.push(
  new Paragraph({
    spacing: { before: 2400, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [text('OrangeHRM E2E Test Execution Report', { bold: true, size: 56 })],
  }),
  para(env.label, { size: 32, align: AlignmentType.CENTER }),
  para(`Playwright UI + API automation · ${fmtTime(startedAt)}`, {
    size: 24,
    align: AlignmentType.CENTER,
    color: '595959',
    after: 600,
  }),
  kvTable([
    ['Environment', `${env.label} (${env.name})`],
    ['Base URL', env.baseURL],
    ['Application', `OrangeHRM ${env.appVersion}`],
    ['Run started', fmtTime(startedAt)],
    ['Run finished', fmtTime(endedAt)],
    ['Execution time', fmtDuration(totalDurationMs)],
    ['Phases / projects', runs.map((r) => r.projects.join(', ')).join('  |  ') || '-'],
    ['Workers', runs.map((r) => String(r.workers)).join(' | ') || '-'],
    ['Machine', runs[0] ? `${runs[0].hostname} · ${runs[0].os} · Node ${runs[0].node}` : '-'],
    ...(runs[0]?.ci ? ([['CI run', runs[0].ci]] as [string, string][]) : []),
  ]),
  para('', { after: 200 }),
  heading('Summary', HeadingLevel.HEADING_2),
  table([
    headerRow(['Total', 'Passed', 'Failed', 'Known issues', 'Flaky', 'Skipped', 'Pass rate']),
    new TableRow({
      children: [
        cell(String(totals.total), { bold: true }),
        cell(String(totals.Passed), { fill: VERDICT_FILL.Passed, bold: true }),
        cell(String(totals.Failed), { fill: totals.Failed ? VERDICT_FILL.Failed : undefined, bold: true }),
        cell(String(totals['Known issue']), {
          fill: totals['Known issue'] ? VERDICT_FILL['Known issue'] : undefined,
        }),
        cell(String(totals.Flaky)),
        cell(String(totals.Skipped)),
        cell(`${passRate} %`, { bold: true }),
      ],
    }),
  ]),
  para(
    '"Known issues" are tests marked test.fail() with an issue annotation: the application behaviour differs from the BRD, the BRD assertion stays in place and the test is expected to fail until the defect is fixed.',
    { size: 16, color: '595959' },
  ),
  pageBreak(),
  heading('Contents', HeadingLevel.HEADING_1),
  new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  pageBreak(),
);

// Results by module / feature
children.push(heading('Results by module and feature', HeadingLevel.HEADING_1));
const groups = new Map<string, TestRecord[]>();
for (const t of tests) {
  const k = `${t.layer}|${t.module}|${t.feature}`;
  groups.set(k, [...(groups.get(k) ?? []), t]);
}
const groupRows = [...groups.entries()].map(([k, list]) => {
  const [layer, mod, feature] = k.split('|');
  const count = (v: Verdict) => list.filter((t) => verdictOf(t) === v).length;
  const failed = count('Failed');
  return new TableRow({
    children: [
      cell(layer),
      cell(mod),
      cell(feature),
      cell(String(list.length)),
      cell(String(count('Passed')), { fill: VERDICT_FILL.Passed }),
      cell(String(failed), { fill: failed ? VERDICT_FILL.Failed : undefined }),
      cell(String(count('Known issue'))),
      cell(String(count('Skipped') + count('Flaky'))),
    ],
  });
});
children.push(
  table([
    headerRow(['Layer', 'Module', 'Feature', 'Tests', 'Passed', 'Failed', 'Known issues', 'Other']),
    ...groupRows,
  ]),
);

// Test case index
children.push(heading('Test case index', HeadingLevel.HEADING_1));
children.push(
  table(
    [
      headerRow(
        ['TC ID', 'Title', 'Module / Feature', 'Pri.', 'Type', 'Result', 'Time', 'Shots'],
        [12, 38, 16, 6, 8, 10, 6, 4],
      ),
      ...tests.map(
        (t) =>
          new TableRow({
            children: [
              cell(t.tcId ?? '-', { size: 16 }),
              cell(truncate(t.title.replace(/^\[[^\]]+\]\s*/, ''), 140), { size: 16 }),
              cell(`${t.module} / ${t.feature}`, { size: 16 }),
              cell(tagValue(t, /^@P\d$/i), { size: 16 }),
              cell(tagValue(t, /^@(positive|negative|edge)$/i), { size: 16 }),
              cell(verdictOf(t), { fill: VERDICT_FILL[verdictOf(t)], size: 16, bold: true }),
              cell(fmtDuration(t.durationMs), { size: 16 }),
              cell(String(t.evidence.length), { size: 16 }),
            ],
          }),
      ),
    ],
    [12, 38, 16, 6, 8, 10, 6, 4],
  ),
);

// Failures
const failures = tests.filter((t) => verdictOf(t) === 'Failed' || verdictOf(t) === 'Flaky');
children.push(heading('Failures', HeadingLevel.HEADING_1));
if (!failures.length) children.push(para('No unexpected failures.', { color: '375623', bold: true }));
else
  children.push(
    table([
      headerRow(['TC ID', 'Title', 'Error']),
      ...failures.map(
        (t) =>
          new TableRow({
            children: [
              cell(t.tcId ?? '-', { size: 16 }),
              cell(truncate(t.title.replace(/^\[[^\]]+\]\s*/, ''), 120), { size: 16 }),
              cell(truncate((t.errors[0] ?? '').split('\n').slice(0, 4).join(' '), 300), { size: 16 }),
            ],
          }),
      ),
    ]),
  );

// Detailed results
children.push(pageBreak(), heading('Detailed results', HeadingLevel.HEADING_1));
let currentModule = '';
let currentFeature = '';
for (const t of tests) {
  const mod = `${t.layer} — ${t.module}`;
  if (mod !== currentModule) {
    currentModule = mod;
    currentFeature = '';
    children.push(heading(mod, HeadingLevel.HEADING_1));
  }
  if (t.feature !== currentFeature) {
    currentFeature = t.feature;
    children.push(heading(t.feature, HeadingLevel.HEADING_2));
  }
  children.push(...testSection(t));
}

const doc = new Document({
  creator: 'OrangeHRM E2E automation',
  title: 'OrangeHRM E2E Test Execution Report',
  description: `Test execution evidence for ${env.label}, ${fmtTime(startedAt)}`,
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, color: '1F3864', font: FONT },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, color: '2F5496', font: FONT },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 22, bold: true, color: '000000', font: FONT },
        paragraph: { spacing: { before: 240, after: 100 } },
      },
      {
        id: 'Heading4',
        name: 'Heading 4',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 20, bold: true, color: '404040', font: FONT },
        paragraph: { spacing: { before: 160, after: 60 } },
      },
    ],
  },
  sections: [
    {
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                text(`OrangeHRM E2E Test Execution Report · ${env.label}`, { size: 16, color: '7F7F7F' }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                text('Page ', { size: 16, color: '7F7F7F' }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '7F7F7F' }),
                text(' of ', { size: 16, color: '7F7F7F' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '7F7F7F' }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const stampForFile = startedAt
  .replace(/:/g, '-')
  .replace(/\.\d+Z$/, '')
  .replace('T', '_');
const outFile = path.join(OUT_DIR, `OrangeHRM_E2E_Report_${stampForFile}.docx`);
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outFile, buffer);
  const shots = tests.reduce((n, t) => n + t.evidence.length + t.failureScreenshots.length, 0);
  console.log(
    `Word report: ${path.relative(process.cwd(), outFile)} (${(buffer.length / 1024 / 1024).toFixed(1)} MB, ${tests.length} tests, ${shots} screenshots, log mode "${LOG_MODE}")`,
  );
});
