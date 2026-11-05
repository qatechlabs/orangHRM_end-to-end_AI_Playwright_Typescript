import { test, expect } from '@fixtures/index';
import { ApiClient, expectStatus, type Envelope } from '@api/ApiClient';
import { paths } from '@config/env';

// Test cases: test-cases/json/auth.json (feature "Session API"). Source: DSH-FR-001..004, DSH-BR-01.

test.describe('Session API', () => {
  test(
    '[AUTH-API-001] Authenticated session can call a protected REST endpoint and gets the v2 envelope',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: { type: 'requirement', description: 'DSH-BR-01' },
    },
    async ({ api }) => {
      const res = await api.get<Envelope<unknown[], { total: number }>>('/pim/employees', { limit: 1 });
      expectStatus(res, 200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(typeof res.body.meta.total).toBe('number');
    },
  );

  for (const endpoint of ['/pim/employees', '/admin/users', '/leave/leave-requests']) {
    test(
      `[AUTH-API-002] Protected REST endpoints return 401 without a session (${endpoint})`,
      {
        tag: ['@P1', '@smoke', '@negative', '@security'],
        annotation: { type: 'requirement', description: 'DSH-BR-01' },
      },
      async ({ anonymousApi }) => {
        const res = await anonymousApi.get<{ error?: unknown; data?: unknown }>(endpoint);
        expectStatus(res, 401);
        expect(res.body?.data).toBeUndefined();
      },
    );
  }

  test(
    '[AUTH-API-003] HTTP login with CSRF token and valid credentials creates a usable session',
    {
      tag: ['@P1', '@positive'],
      annotation: { type: 'requirement', description: 'DSH-FR-001-AC2' },
    },
    async ({ playwright, env }) => {
      const ctx = await playwright.request.newContext({
        baseURL: env.baseURL,
        storageState: { cookies: [], origins: [] },
      });
      const { AuthApi } = await import('@api/services/AuthApi');
      await new AuthApi(ctx).login(env.admin);
      expectStatus(await new ApiClient(ctx).get('/pim/employees', { limit: 1 }), 200);
      await ctx.dispose();
    },
  );

  test(
    '[AUTH-API-004] HTTP login with a wrong password redirects back to login and grants no API access',
    {
      tag: ['@P1', '@negative'],
      annotation: { type: 'requirement', description: 'DSH-FR-002-AC2' },
    },
    async ({ playwright, env }) => {
      const ctx = await playwright.request.newContext({
        baseURL: env.baseURL,
        storageState: { cookies: [], origins: [] },
      });
      const { AuthApi } = await import('@api/services/AuthApi');
      const token = await new AuthApi(ctx).csrfToken();
      const res = await ctx.post(`${paths.web}/auth/validate`, {
        form: { _token: token, username: env.admin.username, password: 'wrongPass1' },
        maxRedirects: 0,
      });
      expect(res.status()).toBe(302);
      expect(res.headers()['location']).toMatch(/auth\/login/);
      expectStatus(await new ApiClient(ctx).get('/pim/employees'), 401);
      await ctx.dispose();
    },
  );

  for (const token of ['', 'forged-token-123']) {
    test(
      `[AUTH-API-005] HTTP login with a missing or forged CSRF token is not authenticated (${token ? 'forged' : 'missing'})`,
      {
        tag: ['@P2', '@edge', '@security'],
        annotation: { type: 'requirement', description: 'DSH-FR-002-AC2' },
      },
      async ({ playwright, env }) => {
        const ctx = await playwright.request.newContext({
          baseURL: env.baseURL,
          storageState: { cookies: [], origins: [] },
        });
        await ctx.get(paths.login); // obtain a session cookie, as a browser would
        const res = await ctx.post(`${paths.web}/auth/validate`, {
          form: { _token: token, username: env.admin.username, password: env.admin.password },
          maxRedirects: 0,
        });
        expect(res.status()).toBe(302);
        expect(res.headers()['location']).toMatch(/auth\/login/);
        expectStatus(await new ApiClient(ctx).get('/pim/employees'), 401);
        await ctx.dispose();
      },
    );
  }

  test(
    '[AUTH-API-006] API access is revoked after logging out',
    {
      tag: ['@P2', '@negative', '@security'],
      annotation: { type: 'requirement', description: 'DSH-FR-003-AC2' },
    },
    async ({ playwright, env }) => {
      const ctx = await playwright.request.newContext({
        baseURL: env.baseURL,
        storageState: { cookies: [], origins: [] },
      });
      const { AuthApi } = await import('@api/services/AuthApi');
      const auth = new AuthApi(ctx);
      const client = new ApiClient(ctx);
      await auth.login(env.admin);
      expectStatus(await client.get('/pim/employees', { limit: 1 }), 200);
      await auth.logout();
      expectStatus(await client.get('/pim/employees'), 401);
      await ctx.dispose();
    },
  );
});
