import { test as base } from './base.fixture';
import type { Locator, Page } from '@playwright/test';
import { beginEvidence, captureEvidence, evidenceEntries, EVIDENCE_INDEX } from '../evidence/capture';

export interface Evidence {
  /**
   * Attaches a screenshot with a caption as report evidence, e.g. `evidence.capture('Employee saved')`.
   * Assertions already do this automatically (page-object `expect*` methods and `expect(locator)` in
   * specs); use it for important states that no assertion covers. Defaults to the test's page.
   */
  capture(caption: string, subject?: Page | Locator): Promise<void>;
}

export interface EvidenceFixtures {
  evidence: Evidence;
  /** Auto fixture: attaches the `evidence-index` JSON (url / time per screenshot) for the reporter. */
  _evidence: void;
}

export const test = base.extend<EvidenceFixtures>({
  evidence: async ({ page }, use) => {
    await use({
      capture: (caption, subject = page) => captureEvidence(caption, subject, { force: true }),
    });
  },
  _evidence: [
    async ({}, use, testInfo) => {
      beginEvidence(testInfo);
      await use();
      const entries = evidenceEntries(testInfo);
      if (entries.length)
        await testInfo.attach(EVIDENCE_INDEX, {
          body: JSON.stringify(entries),
          contentType: 'application/json',
        });
    },
    { auto: true },
  ],
});
