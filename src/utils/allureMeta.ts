import * as path from 'node:path';
import * as allure from 'allure-js-commons';
import type { TestInfo } from '@playwright/test';
import { env } from '@config/env';

/**
 * Applies the report metadata every test gets automatically, derived from the file layout
 *   tests/<layer>/<module>/<feature>.spec.ts
 * and from the test title / tags:
 *   test('[PIM-UI-001] Add employee with mandatory fields', { tag: ['@P1', '@smoke', '@positive'] }, ...)
 *
 * Resulting Allure tree:  Suites -> <Layer> -> <Module> -> <Feature>,  Behaviors -> <Module> -> <Feature>.
 */
const SEVERITY: Record<string, string> = {
  '@p1': allure.Severity.CRITICAL,
  '@p2': allure.Severity.NORMAL,
  '@p3': allure.Severity.MINOR,
  '@blocker': allure.Severity.BLOCKER,
};

const LAYER: Record<string, string> = { ui: 'UI', api: 'API', setup: 'Setup' };

function titleCase(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function moduleInfo(testInfo: TestInfo) {
  const rel = path.relative(path.resolve('tests'), testInfo.file).split(path.sep);
  const layer = LAYER[rel[0]] ?? titleCase(rel[0]);
  const moduleName = rel.length > 2 ? titleCase(rel[1]) : 'General';
  const feature = titleCase(path.basename(testInfo.file).replace(/\.(spec|setup)\.ts$/, ''));
  return { layer, moduleName, feature };
}

export async function applyAllureMetadata(testInfo: TestInfo): Promise<void> {
  const { layer, moduleName, feature } = moduleInfo(testInfo);
  const tags = testInfo.tags.map((t) => t.toLowerCase());
  const tcId = testInfo.title.match(/^\[([A-Z]+-(?:UI|API)-\d{3,})\]/)?.[1];

  await allure.parentSuite(layer);
  await allure.suite(moduleName);
  await allure.subSuite(feature);
  await allure.epic(moduleName);
  await allure.feature(feature);
  const describe = testInfo.titlePath.slice(-2, -1)[0];
  await allure.story(describe && !describe.endsWith('.ts') ? describe : feature);
  await allure.layer(layer);
  await allure.label('module', moduleName);
  await allure.label('environment', env.name);
  await allure.owner(process.env.TEST_OWNER ?? 'QA Automation');

  const severity = tags.map((t) => SEVERITY[t]).find(Boolean);
  if (severity) await allure.severity(severity);

  const category = tags.find((t) => ['@positive', '@negative', '@edge'].includes(t));
  if (category) await allure.label('testType', titleCase(category.slice(1)));

  if (tcId) {
    await allure.label('tcId', tcId);
    await allure.tms(
      `${process.env.TMS_BASE_URL ?? 'test-cases/json/'}${moduleName.toLowerCase().replace(/\s+/g, '-')}.json#${tcId}`,
      tcId,
    );
  }
  for (const ann of testInfo.annotations) {
    if (ann.type === 'requirement' && ann.description) await allure.label('requirement', ann.description);
    if (ann.type === 'issue' && ann.description) await allure.issue(ann.description);
  }

  await allure.parameter('Environment', `${env.label} (${env.name})`);
  await allure.parameter('Base URL', env.baseURL);
}
