/**
 * Builds the Allure report from allure-results/:
 *  - carries over history from the previous report so trend graphs work
 *  - writes executor.json (who/where ran it: local machine or GitHub Actions run link)
 *  - generates allure-report/ (requires Java 8+, used by allure-commandline)
 *
 *   npm run report:allure          -> generate
 *   npm run report:allure -- open  -> generate and open
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { env } from '../src/config/env';

const RESULTS = path.resolve('allure-results');
const REPORT = path.resolve('allure-report');

if (!fs.existsSync(RESULTS)) {
  console.error('No allure-results/ found. Run the tests first.');
  process.exit(1);
}

const history = path.join(REPORT, 'history');
if (fs.existsSync(history)) fs.cpSync(history, path.join(RESULTS, 'history'), { recursive: true });

const gh = process.env.GITHUB_RUN_ID;
const runUrl = gh
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${gh}`
  : undefined;
fs.writeFileSync(
  path.join(RESULTS, 'executor.json'),
  JSON.stringify(
    {
      name: gh ? 'GitHub Actions' : 'Local',
      type: gh ? 'github' : 'local',
      buildName: gh
        ? `${process.env.GITHUB_WORKFLOW} #${process.env.GITHUB_RUN_NUMBER}`
        : `Local run on ${env.label}`,
      buildOrder: Number(process.env.GITHUB_RUN_NUMBER ?? Date.now()),
      buildUrl: runUrl,
      reportName: `OrangeHRM E2E · ${env.label}`,
    },
    null,
    2,
  ),
);

execSync(`npx allure generate "${RESULTS}" --clean -o "${REPORT}"`, { stdio: 'inherit' });
if (process.argv.includes('open')) execSync(`npx allure open "${REPORT}"`, { stdio: 'inherit' });
