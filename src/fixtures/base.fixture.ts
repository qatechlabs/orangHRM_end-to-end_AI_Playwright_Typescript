import { test as base } from '@playwright/test';
import { env } from '@config/env';
import type { EnvironmentConfig } from '@config/environments';
import { applyAllureMetadata } from '@utils/allureMeta';

export interface BaseFixtures {
  env: EnvironmentConfig;
  /** Auto fixture: tags every test with env/module/suite/severity/TC-id metadata for Allure. */
  _allureMeta: void;
}

export const test = base.extend<BaseFixtures>({
  env: async ({}, use) => {
    await use(env);
  },
  _allureMeta: [
    async ({}, use, testInfo) => {
      await applyAllureMetadata(testInfo);
      await use();
    },
    { auto: true },
  ],
});
