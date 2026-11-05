import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { env } from '../config/env';
import { EVIDENCE_INDEX, EVIDENCE_PREFIX, maskSecrets, type EvidenceEntry } from '../evidence/capture';

/**
 * Evidence reporter: for every test it writes
 *  - an event log (`logs/<test>.log`) with each Playwright action as it happened: the button that was
 *    clicked, the field and value that was filled, the navigation, the assertion, nested under the
 *    page-object steps, with timestamps and durations (also appended to `run.log`);
 *  - a JSON record (`tests/<test>.json`) with metadata, outcome, errors, the event list and the
 *    evidence screenshots (copied to `attachments/<test>/`), plus API request/response attachments;
 * and one `run-<timestamp>.json` per invocation with environment and totals.
 * `scripts/word-report.ts` turns the folder into the Word report.
 *
 * Options: `outputDir` (default `evidence-results`). Env: `EVIDENCE_KEEP=1` keeps earlier results in
 * the folder (used by `npm test` for its second phase); `EVENT_LOG=console` also streams the actions
 * and assertions of every test to stdout as they complete.
 */
export interface EvidenceEvent {
  /** Milliseconds since the test started. */
  t: number;
  depth: number;
  kind: 'STEP' | 'ACTION' | 'ASSERT' | 'HOOK' | 'FIXTURE' | 'EVIDENCE' | 'OTHER';
  title: string;
  durationMs: number;
  error?: string;
}

export interface EvidenceItem extends Partial<EvidenceEntry> {
  n: number;
  caption: string;
  /** Relative to the results folder. */
  file: string;
}

export interface ApiCallItem {
  name: string;
  file: string;
}

export interface TestRecord {
  key: string;
  tcId?: string;
  title: string;
  describe?: string;
  file: string;
  line: number;
  layer: string;
  module: string;
  feature: string;
  project: string;
  tags: string[];
  annotations: { type: string; description?: string }[];
  status: TestResult['status'];
  expectedStatus: TestCase['expectedStatus'];
  outcome: ReturnType<TestCase['outcome']>;
  startTime: string;
  durationMs: number;
  retry: number;
  workerIndex: number;
  errors: string[];
  events: EvidenceEvent[];
  evidence: EvidenceItem[];
  failureScreenshots: string[];
  apiCalls: ApiCallItem[];
  logFile: string;
}

export interface RunRecord {
  startTime: string;
  endTime?: string;
  durationMs?: number;
  status?: FullResult['status'];
  projects: string[];
  env: { name: string; label: string; baseURL: string; appVersion: string };
  workers: number;
  node: string;
  os: string;
  hostname: string;
  ci?: string;
  totals: {
    total: number;
    passed: number;
    failed: number;
    expectedFailures: number;
    flaky: number;
    skipped: number;
  };
}

const KIND: Record<string, EvidenceEvent['kind']> = {
  'test.step': 'STEP',
  'pw:api': 'ACTION',
  expect: 'ASSERT',
  hook: 'HOOK',
  fixture: 'FIXTURE',
  'test.attach': 'EVIDENCE',
};

const LAYER: Record<string, string> = { ui: 'UI', api: 'API', setup: 'Setup' };

/**
 * `Click getByRole('button', { name: 'Save' })`: Playwright gives reporters the action (`title`) and,
 * as an undocumented `subtitle`, the locator / URL it was applied to (the HTML report joins them the
 * same way). Expect steps carry the locator there too.
 */
function fullTitle(step: TestStep): string {
  const subtitle = (step as TestStep & { subtitle?: string }).subtitle;
  return maskSecrets(subtitle ? `${step.title} ${subtitle}` : step.title);
}
const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const safe = (s: string) => s.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
const stamp = (ms: number) => {
  const sign = ms < 0 ? '-' : '+';
  ms = Math.abs(ms);
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

export default class EvidenceReporter implements Reporter {
  private readonly outputDir: string;
  private readonly console = process.env.EVENT_LOG === 'console';
  private run!: RunRecord;
  private rootDir = process.cwd();

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = path.resolve(options.outputDir ?? 'evidence-results');
  }

  printsToStdio(): boolean {
    return this.console;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootDir = config.rootDir;
    if (!process.env.EVIDENCE_KEEP) fs.rmSync(this.outputDir, { recursive: true, force: true });
    for (const dir of ['tests', 'logs', 'attachments'])
      fs.mkdirSync(path.join(this.outputDir, dir), { recursive: true });
    this.run = {
      startTime: new Date().toISOString(),
      projects: suite.suites.map((s) => s.project()?.name ?? s.title).filter(Boolean),
      env: { name: env.name, label: env.label, baseURL: env.baseURL, appVersion: env.appVersion },
      workers: config.workers,
      node: process.version,
      os: `${os.platform()} ${os.release()}`,
      hostname: os.hostname(),
      ci: process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined,
      totals: { total: 0, passed: 0, failed: 0, expectedFailures: 0, flaky: 0, skipped: 0 },
    };
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    if (!this.console) return;
    const kind = KIND[step.category] ?? 'OTHER';
    if (kind !== 'ACTION' && kind !== 'ASSERT' && kind !== 'STEP') return;
    const depth = this.depthOf(step);
    const id = this.tcIdOf(test) ?? path.basename(test.location.file);
    console.log(
      `[w${result.workerIndex}] ${id} ${stamp(step.startTime.getTime() - result.startTime.getTime())} ${'  '.repeat(depth)}${kind} ${fullTitle(step)}${step.error ? '  ✗' : ''}`,
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const record = this.buildRecord(test, result);
    const logText = this.renderLog(record);
    fs.writeFileSync(path.join(this.outputDir, record.logFile), logText);
    fs.appendFileSync(path.join(this.outputDir, 'run.log'), `${logText}\n`);
    fs.writeFileSync(
      path.join(this.outputDir, 'tests', `${record.key}.json`),
      JSON.stringify(record, null, 2),
    );

    const totals = this.run.totals;
    totals.total++;
    if (record.outcome === 'skipped') totals.skipped++;
    else if (record.outcome === 'flaky') totals.flaky++;
    else if (record.outcome === 'unexpected') totals.failed++;
    else if (record.status === 'passed') totals.passed++;
    else totals.expectedFailures++;
  }

  onEnd(result: FullResult): void {
    this.run.endTime = new Date().toISOString();
    this.run.durationMs = result.duration;
    this.run.status = result.status;
    const name = `run-${this.run.startTime.replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.join(this.outputDir, name), JSON.stringify(this.run, null, 2));
  }

  // ---- record building ----

  private tcIdOf(test: TestCase): string | undefined {
    return test.title.match(/^\[([A-Z]+-(?:UI|API)-\d{3,}[^\]]*)\]/)?.[1];
  }

  private depthOf(step: TestStep): number {
    let depth = 0;
    for (let parent = step.parent; parent; parent = parent.parent) depth++;
    return depth;
  }

  private buildRecord(test: TestCase, result: TestResult): TestRecord {
    const rel = path.relative(this.rootDir, test.location.file).split(path.sep);
    const layer = LAYER[rel[0]] ?? titleCase(rel[0]);
    const moduleName = rel.length > 2 ? titleCase(rel[1]) : 'General';
    const feature = titleCase(path.basename(test.location.file).replace(/\.(spec|setup)\.ts$/, ''));
    const project = test.parent.project()?.name ?? 'default';
    const tcId = this.tcIdOf(test);
    const specName = rel.join('-').replace(/\.ts$/, '');
    // Data-driven variants share a TC ID, so the unique Playwright test id is part of the key.
    const key = safe(
      `${project}--${specName}--${tcId ?? `L${test.location.line}`}--${test.id.replace(/[^a-z0-9]/gi, '').slice(-6)}--r${result.retry}`,
    );
    const titlePath = test.titlePath().filter(Boolean);
    const describe = titlePath.length >= 3 ? titlePath[titlePath.length - 2] : undefined;

    const events: EvidenceEvent[] = [];
    const walk = (steps: TestStep[], depth: number) => {
      for (const step of steps) {
        if (step.category === 'test.attach' && /Allure Metadata/.test(step.title)) continue;
        events.push({
          t: step.startTime.getTime() - result.startTime.getTime(),
          depth,
          kind: KIND[step.category] ?? 'OTHER',
          title: fullTitle(step),
          durationMs: Math.round(step.duration),
          error: step.error ? firstLine(step.error.message ?? '') : undefined,
        });
        walk(step.steps, depth + 1);
      }
    };
    walk(result.steps, 0);

    const attachDir = path.join(this.outputDir, 'attachments', key);
    const index = this.readIndex(result);
    const evidence: EvidenceItem[] = [];
    const failureScreenshots: string[] = [];
    const apiCalls: ApiCallItem[] = [];
    for (const [i, att] of result.attachments.entries()) {
      if (att.name.startsWith(EVIDENCE_PREFIX)) {
        const n = Number(att.name.slice(EVIDENCE_PREFIX.length).match(/^(\d+)/)?.[1] ?? evidence.length + 1);
        const file = this.copyAttachment(att, attachDir, key, `evidence-${String(n).padStart(3, '0')}.jpg`);
        if (file)
          evidence.push({
            ...index.find((e) => e.n === n),
            n,
            caption: att.name.replace(/^evidence #\d+:\s*/, ''),
            file,
          });
      } else if (att.name === 'screenshot' && att.contentType.startsWith('image/')) {
        const file = this.copyAttachment(att, attachDir, key, `failure-${i}.png`);
        if (file) failureScreenshots.push(file);
      } else if (att.name.startsWith('api: ')) {
        const file = this.copyAttachment(
          att,
          attachDir,
          key,
          `api-${String(apiCalls.length + 1).padStart(3, '0')}.json`,
        );
        if (file) apiCalls.push({ name: att.name.slice(5), file });
      }
    }

    return {
      key,
      tcId,
      title: test.title,
      describe,
      file: path.relative(process.cwd(), test.location.file),
      line: test.location.line,
      layer,
      module: moduleName,
      feature,
      project,
      tags: test.tags,
      annotations: test.annotations.map((a) => ({ type: a.type, description: a.description })),
      status: result.status,
      expectedStatus: test.expectedStatus,
      outcome: test.outcome(),
      startTime: result.startTime.toISOString(),
      durationMs: Math.round(result.duration),
      retry: result.retry,
      workerIndex: result.workerIndex,
      errors: result.errors.map((e) => stripAnsi(e.message ?? String(e.value ?? ''))),
      events,
      evidence,
      failureScreenshots,
      apiCalls,
      logFile: path.join('logs', `${key}.log`),
    };
  }

  private readIndex(result: TestResult): EvidenceEntry[] {
    const att = result.attachments.find((a) => a.name === EVIDENCE_INDEX);
    try {
      const text = att?.body?.toString('utf8') ?? (att?.path ? fs.readFileSync(att.path, 'utf8') : undefined);
      return text ? (JSON.parse(text) as EvidenceEntry[]) : [];
    } catch {
      return [];
    }
  }

  private copyAttachment(
    att: TestResult['attachments'][number],
    dir: string,
    key: string,
    fileName: string,
  ): string | undefined {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, fileName);
      if (att.body) fs.writeFileSync(target, att.body);
      else if (att.path && fs.existsSync(att.path)) fs.copyFileSync(att.path, target);
      else return undefined;
      return path.join('attachments', key, fileName);
    } catch {
      return undefined;
    }
  }

  // ---- log rendering ----

  private renderLog(r: TestRecord): string {
    const lines: string[] = [];
    const mark = { expected: 'PASSED', unexpected: 'FAILED', flaky: 'FLAKY', skipped: 'SKIPPED' }[r.outcome];
    lines.push('='.repeat(100));
    lines.push(
      `${mark} ${r.status !== 'passed' && r.outcome === 'expected' ? `(expected ${r.status}) ` : ''}${r.tcId ? `[${r.tcId}] ` : ''}${r.title.replace(/^\[[^\]]+\]\s*/, '')}`,
    );
    lines.push(
      `  ${r.layer} > ${r.module} > ${r.feature}   ${r.file}:${r.line}   project=${r.project} worker=${r.workerIndex}${r.retry ? ` retry=${r.retry}` : ''}`,
    );
    lines.push(
      `  tags=${r.tags.join(' ') || '-'}   started=${r.startTime}   duration=${(r.durationMs / 1000).toFixed(1)}s`,
    );
    const reqs = r.annotations.filter((a) => a.type === 'requirement').map((a) => a.description);
    if (reqs.length) lines.push(`  requirements=${reqs.join(', ')}`);
    for (const a of r.annotations.filter((a) => a.type === 'issue'))
      lines.push(`  known issue: ${a.description}`);
    lines.push('-'.repeat(100));
    for (const e of r.events) {
      const indent = '  '.repeat(e.depth);
      const dur = e.durationMs >= 0 ? ` (${e.durationMs} ms)` : '';
      lines.push(
        `${stamp(e.t)} │ ${indent}${e.kind.padEnd(8)} ${e.title}${dur}${e.error ? `  ✗ ${e.error}` : ''}`,
      );
    }
    if (r.evidence.length) {
      lines.push('-'.repeat(100));
      lines.push(`  evidence screenshots: ${r.evidence.length}`);
      for (const ev of r.evidence)
        lines.push(
          `    #${String(ev.n).padStart(3, '0')} ${ev.status === 'failed' ? '✗ ' : ''}${ev.caption}  [${ev.url ?? ''}]  -> ${ev.file}`,
        );
    }
    if (r.errors.length) {
      lines.push('-'.repeat(100));
      for (const err of r.errors) lines.push(...err.split('\n').map((l) => `  ${l}`));
    }
    lines.push('='.repeat(100));
    return lines.join('\n') + '\n';
  }
}

function firstLine(text: string): string {
  return stripAnsi(text).split('\n')[0].trim();
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}
