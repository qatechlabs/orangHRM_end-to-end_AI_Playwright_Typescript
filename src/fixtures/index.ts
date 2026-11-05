import { expect as baseExpect, mergeTests } from '@playwright/test';
import { withEvidence } from '../evidence/assertions';
import { test as evidenceTest } from './evidence.fixture';
import { test as pageTest } from './pages.fixture';
import { test as apiTest } from './api.fixture';
import { test as pimTest } from './pim.fixture';
import { test as pimDetailsTest } from './pim-details.fixture';
import { test as pimJobTest } from './pim-job.fixture';
import { test as pimConfigTest } from './pim-config.fixture';
import { test as pimOptionalTest } from './pim-optional.fixture';

/**
 * Single entry point for specs:
 *   import { test, expect } from '@fixtures/index';
 * Module fixtures (e.g. PIM data builders) are merged in here as modules are added.
 */
export const test = mergeTests(
  evidenceTest,
  pageTest,
  apiTest,
  pimTest,
  pimDetailsTest,
  pimJobTest,
  pimConfigTest,
  pimOptionalTest,
);
/** Playwright's `expect`; assertions on a Page or Locator also attach an evidence screenshot. */
export const expect: typeof baseExpect = withEvidence(baseExpect);

/** Run a spec without the admin session (login page, auth negatives). */
export const guestSession = { storageState: { cookies: [], origins: [] } };
