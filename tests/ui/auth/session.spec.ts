import { test, expect, guestSession } from '@fixtures/index';

// Test cases: test-cases/json/auth.json (feature "Session"). Source: DSH-FR-003, DSH-FR-004.
// Every test logs in through its own guest context: logging out the shared admin storage
// state would end the server session for all other parallel workers.
test.use(guestSession);

test.describe('Session', () => {
  test(
    '[AUTH-UI-012] Logout from the user menu returns to the login page',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: { type: 'requirement', description: 'DSH-FR-003-AC1' },
    },
    async ({ loginPage, dashboardPage, env }) => {
      await loginPage.open();
      await loginPage.loginSuccessfully(env.admin);
      await dashboardPage.topBar.logout();
      await loginPage.expectOnLoginPage();
    },
  );

  test(
    '[AUTH-UI-013] After logout, browser Back and direct internal URL both redirect to login',
    {
      tag: ['@P1', '@negative', '@security'],
      annotation: { type: 'requirement', description: 'DSH-FR-003-AC2' },
    },
    async ({ page, loginPage, dashboardPage, env }) => {
      await loginPage.open();
      await loginPage.loginSuccessfully(env.admin);
      await dashboardPage.topBar.logout();
      await loginPage.expectOnLoginPage();

      await page.goBack();
      await page.reload();
      await loginPage.expectOnLoginPage();

      await page.goto('/web/index.php/pim/viewEmployeeList');
      await loginPage.expectOnLoginPage();
    },
  );

  const protectedUrls = [
    '/web/index.php/dashboard/index',
    '/web/index.php/pim/viewEmployeeList',
    '/web/index.php/admin/viewSystemUsers',
    '/web/index.php/leave/viewLeaveList',
  ];
  for (const url of protectedUrls) {
    test(
      `[AUTH-UI-014] Internal module URLs opened without any session redirect to login (${url.split('/').slice(-2).join('/')})`,
      {
        tag: ['@P1', '@negative', '@security'],
        annotation: [
          { type: 'requirement', description: 'DSH-FR-004-AC1' },
          { type: 'requirement', description: 'DSH-BR-01' },
        ],
      },
      async ({ page, loginPage }) => {
        await page.goto(url);
        await loginPage.expectOnLoginPage();
      },
    );
  }

  test(
    '[AUTH-UI-015] When the session cookie is lost mid-session the next navigation redirects to login',
    {
      tag: ['@P2', '@edge'],
      annotation: { type: 'requirement', description: 'DSH-FR-004-AC2' },
    },
    async ({ page, loginPage, dashboardPage, env }) => {
      await loginPage.open();
      await loginPage.loginSuccessfully(env.admin);
      await page.context().clearCookies();
      await expect(dashboardPage.topBar.moduleTitle).toHaveText('Dashboard');
      await dashboardPage.sidebar.item('PIM').click();
      await loginPage.expectOnLoginPage();
    },
  );
});
