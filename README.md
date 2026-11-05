# OrangeHRM End-to-End AI Automation (Playwright + TypeScript)

Production-grade end-to-end automation for [OrangeHRM 5.x](https://opensource-demo.orangehrmlive.com), where
**AI agents** generate the manual test cases from the business requirement documents and then generate the
automation (page objects, fixtures, API services, specs) from those test cases.

- Page Object Model with reusable oxd-component wrappers
- UI **and** REST API (`/web/index.php/api/v2`) tests in one runner
- Fully parallel, sharded in CI, parallel-safe test data
- Allure report with environment, module, feature, layer, priority, test type, TC ID and requirement IDs
- Manual test cases in **JSON and Excel**, deduplicated and traced to requirement IDs by a CI gate
- Claude Code subagents + Playwright MCP (Planner, Generator, Healer)

## Quick start

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env              # optional, defaults target the public demo
npm test                          # UI + API in parallel, then the global-config specs alone
npm run report:allure:open        # Allure report (Java 8+ required)
```

Useful variants: `npm run test:smoke`, `npm run test:headed`, `npm run test:all-browsers`,
`TEST_ENV=qa BASE_URL=http://localhost:8080 npm test`, `WORKERS=8 npm test`,
`npx playwright test tests/ui/pim tests/api/pim` (one module).

`npm test` runs in two phases (`scripts/run-tests.ts`). The few specs that change the demo's **global**
configuration (PIM optional fields and custom fields, listed in `globalConfigSpecs` in `playwright.config.ts`)
alter screens that every other test uses while they run, so they are excluded from the parallel `ui-*` / `api`
projects and run afterwards in the `global-config` project with a single worker (`npm run test:global-config`;
`npm run test:parallel` is the first phase on its own). CI does the same with a dedicated job after the shards.

## Event logs and the Word evidence report

Every run also produces, next to Allure and the HTML report:

- **Event logs** (`evidence-results/logs/<test>.log`, all tests in `evidence-results/run.log`): one line per
  Playwright action as it happened, with timestamp, duration and the literal target, e.g.
  `Click getByRole('button', { name: 'Save' })`, `Fill "OT3fq8n2o09" ... Other Id ...`,
  `Expect "toHaveText" locator('.oxd-toast')`, nested under the page-object steps. Passwords are masked.
  `EVENT_LOG=console npm test` streams the actions to the terminal as well.
- **Screenshot evidence**: every page-object `expect*` method and every `expect(locator)` / `expect(page)`
  assertion in a spec attaches a screenshot once it passes (or `FAILED: ...` when it fails); consecutive
  identical screenshots are skipped. `evidence.capture('caption')` adds one explicitly. `EVIDENCE=off` disables it.
- **Word report** (`evidence-report/OrangeHRM_E2E_Report_<date>.docx`, built at the end of `npm test` or with
  `npm run report:word`): environment and totals, results by module and feature, a test case index, failures,
  and per test the execution log plus the evidence screenshots with captions, timestamps and URLs (API tests
  include their requests and responses). `--log full|steps|none` and `--max-log-lines N` control the log detail.

## AI agent pipeline

| Stage | Agent (`.claude/agents/`) | Output |
|---|---|---|
| Requirements | `npm run brd:md` (script) | `requirements/md/<module>.md` from the BRD `.docx` |
| Test design | `test-case-designer` | `test-cases/json/<module>.json` (UI + API, positive / negative / edge) |
| Review | `test-case-reviewer` | Deduplicated, gap-checked cases + `test-cases/excel/<Module>_TestCases.xlsx` |
| Explore | `playwright-test-planner` (Playwright MCP) | `specs/<module>.plan.md` with real screens, locators, API calls |
| Record | `playwright-test-generator` (Playwright MCP) | Draft specs in `tests/_generated/` |
| Build | `automation-engineer` | Page objects, components, API services, fixtures, data builders, specs |
| Heal | `playwright-test-healer` (Playwright MCP) | Fixed locators/timing, defects flagged with `test.fail()` |

In Claude Code, run the whole thing with `/automate-module PIM`, or just the test design with
`/design-test-cases PIM`. Both Playwright MCP servers are declared in `.mcp.json`
(`playwright-test` for the three agents, `@playwright/mcp` for ad-hoc exploration).

**Quality gate** (`npm run tc:validate`, runs in CI): JSON schema, unique IDs, exact and near-duplicate detection
(token similarity ≥ 0.85 within a layer), every requirement ID must exist in the BRD, and every case marked
Automated must be referenced by TC ID in its spec. Uncovered acceptance criteria are listed as warnings.

## Project layout

```
.claude/agents/            AI agents (3 custom + 3 Playwright MCP)
.claude/commands/          /design-test-cases, /automate-module, /heal-tests
requirements/brd|md/       BRDs (source) and their Markdown conversion
test-cases/json|excel/     Manual test cases (JSON = source of truth, Excel = export)
specs/                     Test plans from the planner agent
src/config/                Environments (demo, qa, staging) and env resolution
src/pages/                 Page objects + components (FormField, DataTable, Toast, ConfirmDialog, Sidebar, TopBar)
src/api/                   ApiClient + resource services
src/fixtures/              Playwright fixtures (pages, api, auth, module data)
src/utils/                 @step decorator, Allure metadata, data factory, logger, dates
tests/setup/               Auth setup (logs in once, saves storage state)
tests/ui|api/<module>/     Specs
scripts/                   BRD conversion, test-case gate, Excel export, Allure report
```

## Allure report

Each test is labelled automatically from its path and title: Suites = Layer → Module → Feature;
Behaviors = Epic (module) → Feature → Story; plus severity (from `@P1..@P3`), test type, TC ID with a link to the
JSON case, requirement IDs, environment and project/browser parameters. The Environment widget shows target env,
base URL, app version, browsers, workers, Node, OS, branch and commit; Executor shows the CI run; Categories split
failures into product defects, locator/timing, API contract and infrastructure; history is kept for trends.

## Environments

`src/config/environments.ts` defines `demo`, `qa` and `staging`. Pick with `TEST_ENV`; override `BASE_URL`,
`ADMIN_USERNAME`, `ADMIN_PASSWORD` through `.env` locally or repository secrets in CI.

## CI

`.github/workflows/e2e.yml`: static checks (types, lint, test-case gate) → 4 parallel shards → merged Allure report
artifact with history. Runs on PRs, `main`, nightly, and manually with env/browser/grep inputs.

## Module status

| Module | Test cases | Automated |
|---|---|---|
| Login & Session (pilot) | 21 | 20 |
| PIM | 110 (90 UI, 20 API) | in progress |
| Leave, Admin, Time, Recruitment, My Info, Performance, Dashboard, Directory, Maintenance, Claim, Buzz | planned | |
