import { test, expect, guestSession } from '@fixtures/index';
import { dataFactory } from '@utils/dataFactory';

// Test cases: test-cases/json/auth.json (feature "Login"). Source: DSH-FR-001, DSH-FR-002.
test.use(guestSession);

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test(
    '[AUTH-UI-001] Login page shows branding, credential fields, Login button and forgot-password link',
    {
      tag: ['@P2', '@smoke', '@positive'],
      annotation: { type: 'requirement', description: 'DSH-FR-001-AC1' },
    },
    async ({ loginPage }) => {
      await expect(loginPage.brandingLogo).toBeVisible();
      await expect(loginPage.username).toBeVisible();
      await expect(loginPage.password).toHaveAttribute('type', 'password');
      await expect(loginPage.loginButton).toBeEnabled();
      await expect(loginPage.forgotPasswordLink).toBeVisible();
    },
  );

  test(
    '[AUTH-UI-002] Admin logs in with valid credentials and lands on the Dashboard with name and photo in the header',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'DSH-FR-001-AC2' },
        { type: 'requirement', description: 'DSH-FR-001-AC4' },
      ],
    },
    async ({ loginPage, dashboardPage, env }) => {
      await loginPage.loginSuccessfully(env.admin);
      await dashboardPage.expectLoaded();
      await expect(dashboardPage.topBar.userName).not.toBeEmpty();
      await expect(dashboardPage.topBar.userDropdown.locator('img')).toBeVisible();
    },
  );

  test(
    '[AUTH-UI-003] Admin side menu lists exactly the twelve default modules',
    {
      tag: ['@P2', '@positive'],
      annotation: { type: 'requirement', description: 'DSH-FR-001-AC3' },
    },
    async ({ loginPage, dashboardPage, env }) => {
      await loginPage.loginSuccessfully(env.admin);
      await dashboardPage.sidebar.expectMenuNames([
        'Admin',
        'PIM',
        'Leave',
        'Time',
        'Recruitment',
        'My Info',
        'Performance',
        'Dashboard',
        'Directory',
        'Maintenance',
        'Claim',
        'Buzz',
      ]);
    },
  );

  test(
    '[AUTH-UI-004] Submitting the login form with both fields empty shows Required under each field',
    {
      tag: ['@P1', '@negative'],
      annotation: { type: 'requirement', description: 'DSH-FR-002-AC1' },
    },
    async ({ loginPage }) => {
      await loginPage.loginButton.click();
      await expect(loginPage.requiredMessages).toHaveText(['Required', 'Required']);
      await loginPage.expectOnLoginPage();
    },
  );

  const oneBlank = [
    { username: 'Admin', password: '', requiredUnder: 'Password' },
    { username: '', password: 'admin123', requiredUnder: 'Username' },
  ];
  for (const v of oneBlank) {
    test(
      `[AUTH-UI-005] Leaving exactly one credential blank flags only that field as Required (${v.requiredUnder} blank)`,
      {
        tag: ['@P2', '@negative'],
        annotation: { type: 'requirement', description: 'DSH-FR-002-AC1' },
      },
      async ({ loginPage }) => {
        await loginPage.login({ username: v.username, password: v.password });
        await expect(loginPage.requiredMessages).toHaveCount(1);
        await loginPage.field(v.requiredUnder).expectError('Required');
        await loginPage.expectOnLoginPage();
      },
    );
  }

  const invalid = [
    { label: 'wrong password', username: 'Admin', password: 'wrongPass1' },
    { label: 'unknown user', username: 'no.such.user.x9', password: 'admin123' },
  ];
  for (const v of invalid) {
    test(
      `[AUTH-UI-006] Wrong password or unknown username shows Invalid credentials and stays on login (${v.label})`,
      {
        tag: ['@P1', '@smoke', '@negative'],
        annotation: { type: 'requirement', description: 'DSH-FR-002-AC2' },
      },
      async ({ loginPage }) => {
        await loginPage.login(v);
        await loginPage.expectInvalidCredentials();
        await loginPage.expectOnLoginPage();
      },
    );
  }

  test(
    '[AUTH-UI-007] Password is case-sensitive: correct password in upper case is rejected',
    {
      tag: ['@P2', '@negative'],
      annotation: { type: 'requirement', description: 'DSH-FR-002-AC4' },
    },
    async ({ loginPage, env }) => {
      await loginPage.login({ username: env.admin.username, password: env.admin.password.toUpperCase() });
      await loginPage.expectInvalidCredentials();
    },
  );

  test(
    '[AUTH-UI-009] SQL-injection style credentials are rejected as Invalid credentials without an error page',
    {
      tag: ['@P2', '@edge', '@security'],
      annotation: { type: 'requirement', description: 'DSH-FR-002-AC2' },
    },
    async ({ loginPage }) => {
      await loginPage.login({ username: "' OR '1'='1' -- ", password: "' OR '1'='1" });
      await loginPage.expectInvalidCredentials();
    },
  );

  test(
    '[AUTH-UI-010] Over-long username of 300 characters is handled gracefully',
    {
      tag: ['@P3', '@edge'],
      annotation: { type: 'requirement', description: 'DSH-FR-002-AC2' },
    },
    async ({ loginPage }) => {
      await loginPage.login({ username: dataFactory.text(300), password: 'admin123' });
      await loginPage.expectInvalidCredentials();
      await expect(loginPage.loginButton).toBeEnabled();
    },
  );

  test(
    '[AUTH-UI-011] Pressing Enter in the Password field submits the login form',
    {
      tag: ['@P3', '@edge'],
      annotation: { type: 'requirement', description: 'DSH-FR-001-AC2' },
    },
    async ({ loginPage, dashboardPage, env }) => {
      await loginPage.username.fill(env.admin.username);
      await loginPage.password.fill(env.admin.password);
      await loginPage.password.press('Enter');
      await dashboardPage.expectLoaded();
    },
  );
});
