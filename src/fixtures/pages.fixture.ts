import { test as base } from './base.fixture';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import type { Page } from '@playwright/test';

/**
 * Page objects as fixtures. Module PRs add their pages here (or in a module fixture merged in
 * src/fixtures/index.ts) so specs only ever ask for what they need: `async ({ loginPage }) => ...`.
 */
export interface GuestSession {
  page: Page;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
}

export interface PageFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  /**
   * Opens extra browser contexts with no session (e.g. to sign in as a freshly created ESS user)
   * next to the Admin page. Contexts are closed at teardown; the Admin session is never touched.
   */
  guestSessions: { open(): Promise<GuestSession> };
}

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  guestSessions: async ({ browser, env, viewport }, use) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use({
      async open() {
        const context = await browser.newContext({
          baseURL: env.baseURL,
          viewport,
          storageState: { cookies: [], origins: [] },
        });
        contexts.push(context);
        const page = await context.newPage();
        return { page, loginPage: new LoginPage(page), dashboardPage: new DashboardPage(page) };
      },
    });
    await Promise.all(contexts.map((c) => c.close()));
  },
});
