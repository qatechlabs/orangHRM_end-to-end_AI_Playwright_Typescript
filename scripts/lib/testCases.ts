import * as fs from 'node:fs';
import * as path from 'node:path';

export interface Step {
  action: string;
  expected: string;
}

export interface TestCase {
  id: string;
  title: string;
  layer: 'UI' | 'API';
  type: 'Positive' | 'Negative' | 'Edge';
  priority: 'P1' | 'P2' | 'P3';
  feature: string;
  requirementIds: string[];
  roles?: string[];
  preconditions: string[];
  testData?: Record<string, unknown>;
  api?: { method: string; endpoint: string; expectedStatus: number };
  steps: Step[];
  expectedResult: string;
  tags?: string[];
  automation: { status: 'Automated' | 'Planned' | 'Manual'; spec?: string; reason?: string };
}

export interface Suite {
  module: string;
  moduleCode: string;
  source: string;
  version: string;
  generatedBy: string;
  notes?: string[];
  testCases: TestCase[];
}

export const TC_DIR = path.resolve('test-cases/json');

export function loadSuites(only: string[] = []): { file: string; suite: Suite }[] {
  const wanted = only.map((m) => m.toLowerCase());
  return fs
    .readdirSync(TC_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !wanted.length || wanted.includes(path.basename(f, '.json').toLowerCase()))
    .map((f) => ({
      file: path.join(TC_DIR, f),
      suite: JSON.parse(fs.readFileSync(path.join(TC_DIR, f), 'utf8')) as Suite,
    }));
}

/** All requirement IDs defined in a BRD markdown file (FR, FR-AC, VAL, BR, NFR, E2E). */
export function requirementIdsIn(mdFile: string): Set<string> {
  const text = fs.readFileSync(path.resolve(mdFile), 'utf8');
  return new Set(
    text.match(
      /(?<![A-Za-z0-9])[A-Z]{2,6}-(?:FR-\d{3}(?:-AC\d+)?|VAL-\d{3}|BR-\d{2}|NFR-\d{2}|E2E-\d{2})(?![0-9])/g,
    ) ?? [],
  );
}

const STOP = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'with',
  'is',
  'are',
  'be',
  'for',
  'as',
  'by',
  'at',
  'it',
  'that',
  'this',
  'click',
  'enter',
  'verify',
  'user',
  'page',
]);

export function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Text that defines what a case actually checks; used for duplicate detection. */
export function fingerprintText(tc: TestCase): string {
  return [
    tc.title,
    tc.api ? `${tc.api.method} ${tc.api.endpoint} ${tc.api.expectedStatus}` : '',
    ...tc.steps.map((s) => `${s.action} ${s.expected}`),
    JSON.stringify(tc.testData ?? {}),
  ].join(' ');
}

/** Optional "scope: <regex>" note limits coverage checks to part of a BRD (e.g. "scope: DSH-FR-00[1-4]"). */
export function scopeOf(suite: Suite): RegExp {
  const note = (suite.notes ?? []).find((n) => n.startsWith('scope:'));
  return new RegExp(`^(${note ? note.slice(6).trim() : '.*'})`);
}
