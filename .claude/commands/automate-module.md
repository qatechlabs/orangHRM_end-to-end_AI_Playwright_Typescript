---
description: Full AI pipeline for one module - BRD to test cases to Playwright plan, recorded drafts, POM code, healing and Allure report
argument-hint: <Module> [feature or TC IDs]
---

Automate the **$ARGUMENTS** module end to end with the project's agents. Work feature by feature and keep
the main thread for orchestration only; delegate each stage to its agent.

1. **Test cases** - if `test-cases/json/<module>.json` is missing or has no Planned cases, run the
   `/design-test-cases` flow first (test-case-designer, then test-case-reviewer).
2. **Plan** (Playwright MCP) - use `playwright-test-planner` to explore the live screens the test cases
   touch, starting from `tests/seed.spec.ts`, and save `specs/<module>.plan.md`.
3. **Record** (Playwright MCP) - for scenarios whose locators or flows are not obvious from the plan, use
   `playwright-test-generator` to record drafts into `tests/_generated/<module>/`.
4. **Build** - use `automation-engineer` to produce page objects, components, API services, fixtures, data
   builders and the final specs under `tests/ui/<module>/` and `tests/api/<module>/`, then mark the cases
   Automated.
5. **Heal** (Playwright MCP) - run `npx playwright test tests/ui/<module> tests/api/<module>`; for failures use
   `playwright-test-healer`. Repeat until green or every remaining failure is an app defect marked
   `test.fail()` with an issue annotation.
6. **Gate** - `npm run check`, `npm run tc:excel -- <module>`, then `npm run report:allure`.
7. Report: cases automated / planned / manual, pass/fail counts, defects found, and files changed.
