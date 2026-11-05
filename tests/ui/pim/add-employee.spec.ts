import { test, expect } from '@fixtures/index';
import { pimData, pimText, savedToast } from '@data/pim';
import { uniqueSuffix } from '@utils/dataFactory';
import type { NameField } from '@pages/pim/AddEmployeePage';

// Test cases: test-cases/json/pim.json (feature "Add Employee"). Source: PIM-FR-005, PIM-VAL-001..004.
// Employees saved through the UI are registered with `employees.track*` so teardown deletes them.

test.describe('Add Employee', () => {
  test.beforeEach(async ({ addEmployeePage }) => {
    await addEmployeePage.open();
  });

  test(
    '[PIM-UI-015] Add Employee form shows required fields, photo placeholder and a pre-filled editable Employee Id',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-005-AC1' },
        { type: 'requirement', description: 'PIM-FR-005-AC2' },
        { type: 'requirement', description: 'PIM-NFR-03' },
      ],
    },
    async ({ addEmployeePage }) => {
      await addEmployeePage.expectLoaded();
      await expect(addEmployeePage.fullNameLabel).toBeVisible();
      await expect(addEmployeePage.fullNameLabel).toHaveClass(/oxd-input-field-required/);
      await expect(addEmployeePage.firstName).toBeVisible();
      await expect(addEmployeePage.middleName).toBeVisible();
      await expect(addEmployeePage.lastName).toBeVisible();
      await expect(addEmployeePage.employeeId.input).toHaveValue(/^\d+$/);
      await addEmployeePage.expectPhotoIsPlaceholder();
      await expect(addEmployeePage.photoAddButton).toBeVisible();
      await expect(addEmployeePage.photoHint).toHaveText(pimText.photoHint);
      await expect(addEmployeePage.requiredHint).toBeVisible();
      await expect(addEmployeePage.createLoginCheckbox).not.toBeChecked();

      const newId = pimData.employeeId();
      await addEmployeePage.fillEmployeeIdChecked(newId);
      await expect(addEmployeePage.employeeId.input).toHaveValue(newId);
      await addEmployeePage.employeeId.expectNoError();
    },
  );

  test(
    '[PIM-UI-016] Adding an employee with first and last name saves and opens Personal Details, and the employee is searchable',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-005-AC3' },
        { type: 'requirement', description: 'PIM-FR-005-AC4' },
        { type: 'requirement', description: 'PIM-BR-01' },
        { type: 'requirement', description: 'PIM-E2E-01' },
      ],
    },
    async ({ addEmployeePage, employeeProfilePage, employeeListPage, employees }) => {
      const data = {
        firstName: 'Auto',
        middleName: '',
        lastName: `Emp${uniqueSuffix()}`,
        employeeId: pimData.employeeId(),
      };
      employees.trackByName(data.lastName);

      const { empNumber, toast } = await addEmployeePage.addEmployee(data);
      employees.track(empNumber);
      expect(toast).toEqual(savedToast);
      await employeeProfilePage.waitForPersonalDetails();
      await employeeProfilePage.expectOpenFor(empNumber);
      await employeeProfilePage.expectTabSelected('Personal Details');
      await employeeProfilePage.expectHeaderName(`${data.firstName} ${data.lastName}`);
      await employeeProfilePage.expectPersonalDetails(data);

      await employeeListPage.load();
      await employeeListPage.searchById(data.employeeId);
      await employeeListPage.expectOnly(data.employeeId);
      await employeeListPage.reset();
      await employeeListPage.search({ name: data.lastName });
      await employeeListPage.expectOnly(data.employeeId);
    },
  );

  test(
    '[PIM-UI-017] Cancel on Add Employee returns to the list without creating a record',
    {
      tag: ['@P3', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-005-AC5' },
    },
    async ({ addEmployeePage, employeeListPage, employeesApi, employees }) => {
      const lastName = `Cancel${uniqueSuffix()}`;
      employees.trackByName(lastName);
      await addEmployeePage.fillForm({ firstName: 'Plan', lastName });
      await addEmployeePage.cancel();

      await employeeListPage.expectLoaded();
      await employeeListPage.search({ name: lastName, include: 'Current and Past Employees' });
      await employeeListPage.expectNoRecords();
      expect(
        (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
      ).toBe(0);
    },
  );

  test(
    '[PIM-UI-018] Leading and trailing spaces in names are trimmed on save',
    {
      tag: ['@P3', '@edge'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-005-AC6' },
        {
          type: 'issue',
          description:
            'PIM-FR-005-AC6: names are saved untrimmed; "  Trim  " is stored and returned by the API with its spaces',
        },
      ],
    },
    async ({ addEmployeePage, employeeProfilePage, employeesApi, employees }) => {
      test.fail();
      const lastName = `Space${uniqueSuffix()}`;
      employees.trackByName(lastName);
      const { empNumber, toast } = await addEmployeePage.addEmployee({
        firstName: '  Trim  ',
        lastName: `  ${lastName}  `,
        employeeId: pimData.employeeId(),
      });
      employees.track(empNumber);
      expect(toast).toEqual(savedToast);

      await employeeProfilePage.waitForPersonalDetails();
      await employeeProfilePage.expectHeaderName(`Trim ${lastName}`);
      await employeeProfilePage.expectPersonalDetails({ firstName: 'Trim', lastName });
      const stored = (await employeesApi.get(empNumber)).body.data;
      expect({ firstName: stored.firstName, lastName: stored.lastName }).toEqual({
        firstName: 'Trim',
        lastName,
      });
    },
  );

  test(
    '[PIM-UI-019] Saving Add Employee with blank First and Last Name shows Required on both',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-VAL-001' },
        { type: 'requirement', description: 'PIM-VAL-003' },
        { type: 'requirement', description: 'PIM-BR-01' },
        { type: 'requirement', description: 'PIM-E2E-03' },
      ],
    },
    async ({ addEmployeePage, employeesApi }) => {
      const suggestedId = await addEmployeePage.employeeId.value();
      await addEmployeePage.save();

      await expect(addEmployeePage.nameError('First Name')).toHaveText(pimText.required);
      await expect(addEmployeePage.nameError('Last Name')).toHaveText(pimText.required);
      await expect(addEmployeePage.nameError('Middle Name')).toHaveCount(0);
      await addEmployeePage.expectNotSaved();
      // The suggested id would be taken if a record had been created.
      expect(await employeesApi.isEmployeeIdUnique(suggestedId)).toBe(true);
    },
  );

  const nameFields: NameField[] = ['First Name', 'Middle Name', 'Last Name'];
  for (const field of nameFields) {
    test(
      `[PIM-UI-020] Name fields accept 30 characters and reject 31 with Should not exceed 30 characters (${field})`,
      {
        tag: ['@P2', '@edge'],
        annotation: [
          { type: 'requirement', description: 'PIM-VAL-001' },
          { type: 'requirement', description: 'PIM-VAL-002' },
          { type: 'requirement', description: 'PIM-VAL-003' },
        ],
      },
      async ({ addEmployeePage }) => {
        const input = addEmployeePage.nameInput(field);
        await input.fill(pimData.name(31));
        await input.blur();
        await expect(addEmployeePage.nameError(field)).toHaveText(pimText.max30);

        await input.fill(pimData.name(30));
        await input.blur();
        await expect(addEmployeePage.nameError(field)).toHaveCount(0);
      },
    );
  }

  const existingIds = [
    { reuseIdOf: 'current employee', terminated: false },
    { reuseIdOf: 'past employee', terminated: true },
  ];
  for (const v of existingIds) {
    test(
      `[PIM-UI-021] Employee Id that already exists (current or past employee) is rejected (${v.reuseIdOf})`,
      {
        tag: ['@P1', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-VAL-004' },
          { type: 'requirement', description: 'PIM-BR-02' },
          { type: 'requirement', description: 'PIM-E2E-03' },
        ],
      },
      async ({ addEmployeePage, employeesApi, employees }) => {
        const existing = await employees.create({ terminated: v.terminated });
        const lastName = `Dup${uniqueSuffix()}`;
        employees.trackByName(lastName);

        await addEmployeePage.fillForm({ firstName: 'Dup', lastName });
        await addEmployeePage.fillEmployeeIdChecked(existing.employeeId!);
        await addEmployeePage.employeeId.expectError(pimText.employeeIdExists);
        await addEmployeePage.save();
        await addEmployeePage.expectNotSaved();
        await addEmployeePage.employeeId.expectError(pimText.employeeIdExists);
        expect(
          (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
        ).toBe(0);
      },
    );
  }

  test(
    '[PIM-UI-022] Employee Id longer than 10 characters is rejected',
    {
      tag: ['@P3', '@edge'],
      annotation: { type: 'requirement', description: 'PIM-VAL-004' },
    },
    async ({ addEmployeePage, employeesApi, employees }) => {
      const lastName = `Long${uniqueSuffix()}`;
      employees.trackByName(lastName);
      await addEmployeePage.fillForm({ firstName: 'Long', lastName, employeeId: '12345678901' });
      await addEmployeePage.employeeId.expectError(pimText.max10);

      await addEmployeePage.save();
      await addEmployeePage.expectNotSaved();
      await addEmployeePage.employeeId.expectError(pimText.max10);
      expect(
        (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
      ).toBe(0);
    },
  );

  const literalNames = [
    { label: 'unicode and apostrophe', firstName: 'José-Ñuño', lastPrefix: "O'Brien" },
    { label: 'script-like text', firstName: '<script>alert(1)</script>', lastPrefix: 'Xss' },
  ];
  for (const v of literalNames) {
    test(
      `[PIM-UI-023] Names with unicode, apostrophes and script-like text are stored and rendered literally (${v.label})`,
      {
        tag: ['@P2', '@edge', '@security'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-005-AC3' },
          { type: 'requirement', description: 'PIM-BR-01' },
        ],
      },
      async ({ page, addEmployeePage, employeeProfilePage, employeeListPage, employeesApi, employees }) => {
        const dialogs: string[] = [];
        page.on('dialog', (d) => {
          dialogs.push(d.message());
          void d.dismiss();
        });
        const data = {
          firstName: v.firstName,
          lastName: `${v.lastPrefix}${uniqueSuffix()}`,
          employeeId: pimData.employeeId(),
        };
        employees.trackByName(data.employeeId);

        const { empNumber, toast } = await addEmployeePage.addEmployee(data);
        employees.track(empNumber);
        expect(toast).toEqual(savedToast);
        await employeeProfilePage.waitForPersonalDetails();
        await employeeProfilePage.expectHeaderName(`${data.firstName} ${data.lastName}`);
        await employeeProfilePage.expectPersonalDetails(data);
        const stored = (await employeesApi.get(empNumber)).body.data;
        expect({ firstName: stored.firstName, lastName: stored.lastName }).toEqual({
          firstName: data.firstName,
          lastName: data.lastName,
        });

        await employeeListPage.load();
        await employeeListPage.searchById(data.employeeId);
        await employeeListPage.expectOnly(data.employeeId);
        const row = employeeListPage.results.rows.first();
        await employeeListPage.expectCellText(row, 'First (& Middle) Name', data.firstName);
        await employeeListPage.expectCellText(row, 'Last Name', data.lastName);
        expect(dialogs).toEqual([]);
      },
    );
  }
});
