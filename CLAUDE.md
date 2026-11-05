# OrangeHRM E2E automation: guide for Claude Code

AI-agent driven Playwright + TypeScript framework for OrangeHRM 5.x (UI + REST API v2).
Target by default: the shared public demo https://opensource-demo.orangehrmlive.com (Admin / admin123).

## Pipeline (one module at a time)

```
requirements/brd/*.docx --npm run brd:md--> requirements/md/<module>.md
   └─ test-case-designer ─> test-case-reviewer ─> test-cases/json/<module>.json ─> test-cases/excel/<Module>_TestCases.xlsx
        └─ playwright-test-planner (MCP) ─> specs/<module>.plan.md
             └─ playwright-test-generator (MCP) ─> tests/_generated/<module>/ (drafts, git-ignored)
                  └─ automation-engineer ─> src/pages, src/api, src/fixtures, tests/ui|api/<module>
                       └─ playwright-test-healer (MCP) ─> green suite ─> Allure report
```

Slash commands: `/design-test-cases <Module>`, `/automate-module <Module>`, `/heal-tests [path]`.
Agents live in `.claude/agents/`. The three `playwright-test-*` agents come from `npx playwright init-agents --loop=claude`;
each has an "OrangeHRM project rules" section appended. Keep it if you regenerate them (`npm run agents:init`).

## Conventions (mandatory)

- **Test cases are the source of truth.** Every automated test title starts with its TC ID, `[PIM-UI-004] ...`,
  copied from `test-cases/json/<module>.json`; `npm run tc:validate` fails if an Automated case is not referenced.
- **Tags**: priority `@P1|@P2|@P3`, type `@positive|@negative|@edge`, optional `@smoke`, `@security`.
  Requirement IDs go in `annotation: { type: 'requirement', description: 'PIM-FR-003-AC2' }`.
- **Layout**: `tests/<ui|api>/<module>/<feature>.spec.ts`. The Allure suite tree (layer → module → feature) is derived
  from this path automatically by `src/utils/allureMeta.ts`, so stick to it.
- **Imports**: specs import `test`, `expect` only from `@fixtures/index`. Never construct page objects inside specs.
- **Evidence** (`src/evidence/`): page-object `expect*` methods and `expect(locator|page)` from `@fixtures/index`
  automatically become named steps with a screenshot; use `evidence.capture('caption')` for an important state
  no assertion covers. Keep assertions in `expect*` methods so they show up as evidence. Never log secrets:
  `maskSecrets` hides passwords, `registerSecret()` for other values.
- **Page objects** (`src/pages/**`) extend `BasePage`; locators are readonly fields; actions are `async` methods with
  `@step('...')`; assertions live in `expect*` methods. Use `this.field('Label')` (oxd input groups), `this.table()`,
  `this.toast`, `this.dialog`, `this.sidebar` instead of raw selectors.
- **Locator priority**: getByRole / getByPlaceholder / label → `FormField` → oxd-* CSS as last resort.
- **API**: `ApiClient` wraps the OrangeHRM session-cookie API (`/web/index.php/api/v2`). Services in
  `src/api/services/` are used for API tests and for fast data setup/cleanup in UI tests.
- **Parallel safety**: the demo is shared. Every test creates its own data with `dataFactory`/`uniqueSuffix()` and
  removes it in fixture teardown. Never log out or change the password of the shared admin session
  (use `guestSession` + a fresh login). Never change global configuration without restoring it.
- **Global-configuration specs** (settings that change what other tests see, e.g. PIM optional fields, custom
  fields): add the spec to `globalConfigSpecs` in `playwright.config.ts`. They are excluded from the parallel
  projects and run in the `global-config` project (one worker) as the second phase of `npm test`
  (`scripts/run-tests.ts`) and as a separate CI job. Never run them next to the rest of the suite.
- **No** `waitForTimeout`, `force: true`, `test.only`, skipped tests, or weakened assertions to get green.
  An app behaviour that contradicts the BRD stays asserted and is marked `test.fail()` with an `issue` annotation.

## Commands

| Command | Purpose |
|---|---|
| `npm test` | All UI + API tests: parallel phase, then the `global-config` phase (auth setup runs first) |
| `npm run test:parallel` / `npm run test:global-config` | One phase only |
| `npm run test:smoke` | `@smoke` only |
| `npx playwright test tests/ui/pim tests/api/pim` | One module |
| `npm run check` | Typecheck + lint + test-case gate |
| `npm run tc:validate -- <module>` / `npm run tc:excel -- <module>` | Test-case gate / Excel export |
| `npm run report:allure:open` | Build and open the Allure report (needs Java) |
| `npm run report:word` | Word evidence report (event logs + screenshots) from `evidence-results/`; `npm test` runs it at the end |
| `npm run seed` | Run the MCP agents' seed test |
