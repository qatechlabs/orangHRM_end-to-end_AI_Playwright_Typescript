---
description: Generate and review deduplicated manual test cases (UI + API) for a module from its BRD, then export JSON and Excel
argument-hint: <Module> (e.g. PIM, Leave, Admin)
---

Generate manual test cases for the **$ARGUMENTS** module.

1. Make sure `requirements/md/` has the module's BRD; if not run `npm run brd:md -- $ARGUMENTS`.
2. Use the `test-case-designer` agent to write `test-cases/json/<module>.json` from the BRD.
3. Then use the `test-case-reviewer` agent on the same module to remove duplicates, fill gaps and correct
   expectations. It must not see the designer's reasoning, only the files.
4. Run `npm run tc:validate -- <module>` and `npm run tc:excel -- <module>`; both must pass.
5. Summarise: counts by layer/type/priority, uncovered acceptance criteria with reasons, reviewer changes,
   and the paths of the JSON and Excel files.
