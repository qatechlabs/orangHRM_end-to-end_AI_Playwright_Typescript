import { test, expect } from '@fixtures/index';

/**
 * Seed for the Playwright MCP agents (planner / generator / healer). It starts every agent
 * session logged in as Admin on the dashboard, using the same auth state as the real suite.
 * Run with: npx playwright test --project=seed
 */
test.describe('Seed', () => {
  test('seed', async ({ dashboardPage }) => {
    await dashboardPage.open();
    await expect(dashboardPage.topBar.moduleTitle).toHaveText('Dashboard');
  });
});
