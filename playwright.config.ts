import { defineConfig, devices, type Project } from '@playwright/test';
import * as os from 'node:os';
import { env, authFiles } from './src/config/env';

const isCI = !!process.env.CI;
const browsers = (process.env.BROWSERS ?? 'chromium').split(',').map((b) => b.trim());
const deviceFor: Record<string, (typeof devices)[string]> = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};

/**
 * Specs that change GLOBAL OrangeHRM configuration (PIM optional fields, custom fields). The shared demo
 * has one configuration for everybody, so these specs alter screens that every other test uses while
 * they run (e.g. the Personal Details form gains fields that the server then rejects once they are
 * switched off again). They are excluded from the parallel projects and run in the `global-config`
 * project: after everything else, with a single worker. `npm test` runs both phases in order
 * (scripts/run-tests.ts); CI runs `global-config` as its own job after the sharded one.
 */
const globalConfigSpecs = [
  '**/ui/pim/optional-fields.spec.ts',
  '**/ui/pim/custom-fields.spec.ts',
  '**/api/pim/optional-fields-api.spec.ts',
];

// One UI project per requested browser, each depending on the auth setup project.
const uiProjects: Project[] = browsers.map((browser) => ({
  name: `ui-${browser}`,
  testDir: './tests/ui',
  testIgnore: globalConfigSpecs,
  dependencies: ['setup'],
  use: { ...deviceFor[browser], storageState: authFiles.admin },
}));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // The public demo is shared, so keep worker count modest unless overridden.
  workers: process.env.WORKERS
    ? Number(process.env.WORKERS)
    : isCI
      ? 4
      : Math.max(1, Math.floor(os.cpus().length / 2)),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: 'test-results',

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // Event logs + evidence screenshots per test (evidence-results/), source of the Word report.
    ['./src/reporters/evidenceReporter.ts', { outputDir: 'evidence-results' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          Environment: `${env.label} (${env.name})`,
          'Base URL': env.baseURL,
          'App Version': `OrangeHRM ${env.appVersion}`,
          Browsers: browsers.join(', '),
          Workers: String(process.env.WORKERS ?? (isCI ? 4 : 'auto')),
          'Node.js': process.version,
          OS: `${os.platform()} ${os.release()}`,
          Branch: process.env.GITHUB_REF_NAME ?? 'local',
          Commit: process.env.GITHUB_SHA?.slice(0, 7) ?? 'local',
        },
        categories: [
          { name: 'Product defects', matchedStatuses: ['failed'], messageRegex: '.*expect.*' },
          {
            name: 'Locator / timing issues',
            matchedStatuses: ['broken', 'failed'],
            messageRegex: '.*(Timeout|waiting for|locator).*',
          },
          { name: 'API contract issues', matchedStatuses: ['failed'], messageRegex: '.*(status|schema).*' },
          { name: 'Test infrastructure', matchedStatuses: ['broken'] },
        ],
      },
    ],
  ],

  use: {
    baseURL: env.baseURL,
    headless: process.env.HEADLESS !== 'false',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/ },
    ...uiProjects,
    {
      name: 'api',
      testDir: './tests/api',
      testIgnore: globalConfigSpecs,
      dependencies: ['setup'],
      use: { storageState: authFiles.admin },
    },
    // Global-configuration specs (UI + API), one at a time, in the first requested browser. Never run
    // this project next to the others: `npm test` runs it as the second phase.
    {
      name: 'global-config',
      testDir: './tests',
      testMatch: globalConfigSpecs,
      fullyParallel: false,
      workers: 1,
      dependencies: ['setup'],
      use: { ...deviceFor[browsers[0]], storageState: authFiles.admin },
    },
    // Raw drafts written by the playwright-test-generator agent (git-ignored, refactored into POM specs).
    {
      name: 'drafts',
      testDir: './tests/_generated',
      dependencies: ['setup'],
      use: { storageState: authFiles.admin },
    },
    // Used by the Playwright MCP planner/generator agents as their starting point.
    {
      name: 'seed',
      testMatch: /seed\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: authFiles.admin },
    },
  ],
});
