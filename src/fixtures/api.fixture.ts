import { test as base } from './base.fixture';
import { ApiClient } from '@api/ApiClient';
import { AuthApi } from '@api/services/AuthApi';

export interface ApiFixtures {
  /** API client authenticated as Admin (uses the project's storage state). */
  api: ApiClient;
  /** API client with no session, for authorization negative tests. */
  anonymousApi: ApiClient;
  authApi: AuthApi;
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
  anonymousApi: async ({ playwright, env }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: env.baseURL,
      storageState: { cookies: [], origins: [] },
    });
    await use(new ApiClient(ctx));
    await ctx.dispose();
  },
  authApi: async ({ playwright, env }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: env.baseURL,
      storageState: { cookies: [], origins: [] },
    });
    await use(new AuthApi(ctx));
    await ctx.dispose();
  },
});
