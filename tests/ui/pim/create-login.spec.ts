import { test, expect } from '@fixtures/index';
import { pimData, pimText, savedToast } from '@data/pim';
import { uniqueSuffix } from '@utils/dataFactory';

// Test cases: test-cases/json/pim.json (feature "Create Login"). Source: PIM-FR-007, PIM-VAL-006..008.
// ESS sign-ins run in a fresh guest browser context (guestSessions); the shared Admin session is
// never logged out. Users created by the form are deleted with their employee in teardown.

test.describe('Create Login', () => {
  test.beforeEach(async ({ addEmployeePage }) => {
    await addEmployeePage.open();
  });

  test(
    '[PIM-UI-027] Create Login Details toggle reveals login fields with Enabled default and a password strength meter',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-007-AC1' },
        { type: 'requirement', description: 'PIM-FR-007-AC5' },
      ],
    },
    async ({ addEmployeePage }) => {
      await addEmployeePage.expectLoginFieldsHidden();

      await addEmployeePage.setCreateLogin(true);
      await addEmployeePage.expectLoginFieldsVisible();
      await expect(addEmployeePage.statusRadio('Enabled')).toBeChecked();
      await expect(addEmployeePage.statusRadio('Disabled')).not.toBeChecked();
      await expect(addEmployeePage.strengthMeter).toHaveCount(0);

      await addEmployeePage.password.fill('ab1');
      await expect(addEmployeePage.strengthMeter).toHaveText('Very Weak');
      await addEmployeePage.password.fill('Valid123!Abc$%^');
      await expect(addEmployeePage.strengthMeter).toHaveText('Strongest');

      await addEmployeePage.setCreateLogin(false);
      await addEmployeePage.expectLoginFieldsHidden();
    },
  );

  test(
    '[PIM-UI-028] Employee created with enabled login gets an ESS user who can log in without PIM menu',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-007-AC2' },
        { type: 'requirement', description: 'PIM-FR-007-AC3' },
        { type: 'requirement', description: 'PIM-E2E-02' },
      ],
    },
    async ({ addEmployeePage, usersApi, employees, guestSessions }) => {
      const data = { firstName: 'Ess', lastName: `Login${uniqueSuffix()}`, employeeId: pimData.employeeId() };
      const login = pimData.login();
      employees.trackByName(data.lastName);

      const { empNumber, toast } = await addEmployeePage.addEmployee(data, { ...login, status: 'Enabled' });
      employees.track(empNumber);
      expect(toast).toEqual(savedToast);

      const user = await usersApi.findByUsername(login.username);
      expect(user).toBeDefined();
      employees.trackUser(user!.id);
      expect({
        role: user!.userRole.name,
        status: user!.status,
        empNumber: user!.employee.empNumber,
        name: `${user!.employee.firstName} ${user!.employee.lastName}`,
      }).toEqual({ role: 'ESS', status: true, empNumber, name: `${data.firstName} ${data.lastName}` });

      const ess = await guestSessions.open();
      await ess.loginPage.open();
      await ess.loginPage.loginSuccessfully(login);
      await ess.dashboardPage.expectLoaded();
      const menu = await ess.dashboardPage.sidebar.menuNames();
      expect(menu).toContain('My Info');
      expect(menu.filter((m) => ['PIM', 'Admin', 'Maintenance'].includes(m))).toEqual([]);
    },
  );

  test(
    '[PIM-UI-029] Employee created with a Disabled login cannot sign in and sees Account disabled',
    {
      tag: ['@P1', '@negative'],
      annotation: { type: 'requirement', description: 'PIM-FR-007-AC3' },
    },
    async ({ addEmployeePage, usersApi, employees, guestSessions }) => {
      const data = {
        firstName: 'Ess',
        lastName: `Disabled${uniqueSuffix()}`,
        employeeId: pimData.employeeId(),
      };
      const login = pimData.login('auto.dis');
      employees.trackByName(data.lastName);

      const { empNumber, toast } = await addEmployeePage.addEmployee(data, { ...login, status: 'Disabled' });
      employees.track(empNumber);
      expect(toast).toEqual(savedToast);
      const user = await usersApi.findByUsername(login.username);
      employees.trackUser(user!.id);
      expect(user!.status).toBe(false);

      const ess = await guestSessions.open();
      await ess.loginPage.open();
      await ess.loginPage.login(login);
      await expect(ess.loginPage.errorAlert).toHaveText(pimText.accountDisabled);
      await ess.loginPage.expectOnLoginPage();
    },
  );

  test(
    '[PIM-UI-030] Username that already exists is rejected with Username already exists',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-007-AC4' },
        { type: 'requirement', description: 'PIM-VAL-006' },
      ],
    },
    async ({ addEmployeePage, employeesApi, employees, env }) => {
      const lastName = `DupUser${uniqueSuffix()}`;
      const password = pimData.login().password;
      employees.trackByName(lastName);

      await addEmployeePage.fillForm({ firstName: 'Dup', lastName });
      await addEmployeePage.fillUsernameChecked(env.admin.username);
      await addEmployeePage.fillLogin({ password });
      await addEmployeePage.username.expectError(pimText.usernameExists);

      await addEmployeePage.save();
      await addEmployeePage.expectNotSaved();
      expect(
        (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
      ).toBe(0);
    },
  );

  // Unique letters padded to the exact length (usernames must not collide with real users).
  const username = (len: number) => `u${uniqueSuffix()}${'x'.repeat(40)}`.toLowerCase().slice(0, len);
  const rejectedLengths = [
    { len: 4, message: pimText.usernameMin },
    { len: 41, message: pimText.usernameMax },
  ];
  for (const v of rejectedLengths) {
    test(
      `[PIM-UI-031] Username length boundaries: 4 and 41 characters rejected, 5 and 40 accepted (${v.len} characters)`,
      {
        tag: ['@P2', '@edge'],
        annotation: { type: 'requirement', description: 'PIM-VAL-006' },
      },
      async ({ addEmployeePage }) => {
        await addEmployeePage.fillLogin({ username: username(v.len) });
        await addEmployeePage.username.input.blur();
        await addEmployeePage.username.expectError(v.message);
      },
    );
  }
  for (const len of [5, 40]) {
    test(
      `[PIM-UI-031] Username length boundaries: 4 and 41 characters rejected, 5 and 40 accepted (${len} characters)`,
      {
        tag: ['@P2', '@edge'],
        annotation: { type: 'requirement', description: 'PIM-VAL-006' },
      },
      async ({ addEmployeePage }) => {
        const value = username(len);
        await addEmployeePage.fillUsernameChecked(value);
        await expect(addEmployeePage.username.input).toHaveValue(value);
        await addEmployeePage.username.expectNoError();
      },
    );
  }

  const passwordRules = [
    {
      label: 'too short',
      password: 'ab1',
      confirm: 'ab1',
      field: 'password',
      message: 'Should have at least 7 characters',
    },
    {
      label: 'no number',
      password: 'abcdefgh',
      confirm: 'abcdefgh',
      field: 'password',
      message: 'Your password must contain minimum 1 number',
    },
    {
      label: 'no lower-case letter',
      password: 'ABCDEF12',
      confirm: 'ABCDEF12',
      field: 'password',
      message: 'Your password must contain minimum 1 lower-case letter',
    },
    {
      label: 'confirm mismatch',
      password: 'Valid123',
      confirm: 'Valid124',
      field: 'confirmPassword',
      message: pimText.passwordsDoNotMatch,
    },
  ] as const;
  for (const v of passwordRules) {
    test(
      `[PIM-UI-032] Password policy violations and confirm mismatch show the specific messages (${v.label})`,
      {
        tag: ['@P1', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-VAL-007' },
          { type: 'requirement', description: 'PIM-VAL-008' },
          { type: 'requirement', description: 'PIM-E2E-03' },
        ],
      },
      async ({ addEmployeePage, employeesApi, employees }) => {
        const lastName = `Pwd${uniqueSuffix()}`;
        employees.trackByName(lastName);
        await addEmployeePage.fillForm({ firstName: 'Pwd', lastName });
        await addEmployeePage.fillLogin({
          username: pimData.login().username,
          password: v.password,
          confirmPassword: v.confirm,
        });
        await addEmployeePage[v.field].expectError(v.message);

        await addEmployeePage.save();
        await addEmployeePage.expectNotSaved();
        await addEmployeePage[v.field].expectError(v.message);
        expect(
          (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
        ).toBe(0);
      },
    );
  }

  test(
    '[PIM-UI-033] Login fields become mandatory only when Create Login Details is on',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-VAL-006' },
        { type: 'requirement', description: 'PIM-VAL-007' },
        { type: 'requirement', description: 'PIM-VAL-008' },
        {
          type: 'issue',
          description:
            'PIM-VAL-008: with all login fields blank, Confirm Password shows "Passwords do not match" instead of "Required"',
        },
      ],
    },
    async ({ page, addEmployeePage, employees }) => {
      test.fail();
      const userRequests: string[] = [];
      page.on('request', (r) => {
        if (r.method() === 'POST' && r.url().includes('/api/v2/admin/users')) userRequests.push(r.url());
      });
      const data = {
        firstName: 'Cond',
        lastName: `Mandatory${uniqueSuffix()}`,
        employeeId: pimData.employeeId(),
      };
      employees.trackByName(data.lastName);
      await addEmployeePage.fillForm(data);

      await addEmployeePage.setCreateLogin(true);
      await addEmployeePage.save();
      await addEmployeePage.username.expectError(pimText.required);
      await addEmployeePage.password.expectError(pimText.required);
      // Soft, so the toggle-off part below is still verified.
      await expect.soft(addEmployeePage.confirmPassword.error).toHaveText(pimText.required);
      await addEmployeePage.expectNotSaved();

      await addEmployeePage.setCreateLogin(false);
      await addEmployeePage.expectLoginFieldsHidden();
      const { empNumber, toast } = await addEmployeePage.saveAndOpenProfile();
      employees.track(empNumber);
      expect(toast).toEqual(savedToast);
      expect(userRequests).toEqual([]);
    },
  );
});
