---
description: Run a set of Playwright tests and fix the failing ones with the playwright-test-healer agent
argument-hint: [spec path or --grep pattern]
---

Run `npx playwright test $ARGUMENTS --workers=4`. If anything fails, use the `playwright-test-healer` agent on
the failing tests, following its OrangeHRM project rules (fix locators in page objects, never weaken
assertions, mark genuine app defects with `test.fail()` and an issue annotation). Re-run with
`--repeat-each=3` to confirm stability and report what changed.
