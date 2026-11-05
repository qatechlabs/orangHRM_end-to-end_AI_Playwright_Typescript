import { test, expect } from '@fixtures/index';
import { ApiClient, expectStatus } from '@api/ApiClient';
import { AuthApi } from '@api/services/AuthApi';
import { EmployeesApi } from '@api/services/EmployeesApi';
import { UserRole, type ApiValidationError, type IncludeEmployees } from '@api/types/pim';
import { pimData, sortedCI } from '@data/pim';

// Test cases: test-cases/json/pim.json (feature "Employees API").
// Source: PIM-FR-002..005, PIM-VAL-001..004, PIM-BR-01/02/04/06. Endpoint: /web/index.php/api/v2/pim/employees.

const invalidKeys = (body: unknown) => (body as ApiValidationError).error?.data?.invalidParamKeys ?? [];

test.describe('Employees API', () => {
  test(
    '[PIM-API-001] POST employees with first and last name creates the employee and returns its empNumber',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-005-AC3' },
        { type: 'requirement', description: 'PIM-BR-01' },
      ],
    },
    async ({ employeesApi, employees }) => {
      const payload = {
        firstName: 'Api',
        lastName: `Emp${pimData.token('')}`,
        employeeId: pimData.employeeId(),
      };
      const created = await employeesApi.create(payload);
      expectStatus(created, 200);
      employees.track(created.body.data.empNumber);
      expect(typeof created.body.data.empNumber).toBe('number');
      expect(created.body.data).toMatchObject({ ...payload, middleName: '', terminationId: null });

      const fetched = await employeesApi.get(created.body.data.empNumber);
      expectStatus(fetched, 200);
      expect(fetched.body.data).toEqual(created.body.data);
    },
  );

  const missingNames = [
    { label: 'firstName missing', body: { lastName: 'X' }, keys: ['firstName'] },
    { label: 'lastName missing', body: { firstName: 'X' }, keys: ['lastName'] },
    { label: 'both empty', body: { firstName: '', lastName: '' }, keys: ['firstName', 'lastName'] },
  ];
  for (const v of missingNames) {
    test(
      `[PIM-API-002] POST employees without firstName or lastName is rejected with 422 (${v.label})`,
      {
        tag: ['@P1', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-BR-01' },
          { type: 'requirement', description: 'PIM-VAL-001' },
          { type: 'requirement', description: 'PIM-VAL-003' },
        ],
      },
      async ({ api, employeesApi }) => {
        const employeeId = pimData.employeeId();
        // Raw call: the service would default middleName, the contract under test is the bare body.
        const res = await api.post('/pim/employees', { ...v.body, employeeId });
        expectStatus(res, 422);
        expect(invalidKeys(res.body).sort()).toEqual(v.keys);
        expect(await employeesApi.isEmployeeIdUnique(employeeId)).toBe(true);
      },
    );
  }

  const boundaries = [
    { label: 'firstName 30 characters', field: { firstName: pimData.name(30) }, expected: 200, stored: 1 },
    { label: 'firstName 31 characters', field: { firstName: pimData.name(31) }, expected: 422, stored: 0 },
    {
      label: 'employeeId 10 characters',
      field: { employeeId: pimData.employeeId().padEnd(10, '0') },
      expected: 200,
      stored: 1,
    },
    {
      label: 'employeeId 11 characters',
      field: { employeeId: `${pimData.employeeId().padEnd(10, '0')}1` },
      expected: 422,
      stored: 0,
    },
  ];
  for (const v of boundaries) {
    test(
      `[PIM-API-003] POST employees enforces 30-character names and 10-character employeeId boundaries (${v.label})`,
      {
        tag: ['@P2', '@edge'],
        annotation: [
          { type: 'requirement', description: 'PIM-VAL-001' },
          { type: 'requirement', description: 'PIM-VAL-004' },
        ],
      },
      async ({ employeesApi, employees }) => {
        const lastName = pimData.token('Bnd');
        employees.trackByName(lastName);
        const res = await employeesApi.create({
          firstName: 'Bnd',
          lastName,
          employeeId: pimData.employeeId(),
          ...v.field,
        });
        expectStatus(res, v.expected);
        const stored = await employeesApi.listOrFail({
          nameOrId: lastName,
          includeEmployees: 'currentAndPast',
        });
        expect(stored.total).toBe(v.stored);
      },
    );
  }

  test(
    '[PIM-API-004] POST employees with an existing employeeId is rejected',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-VAL-004' },
        { type: 'requirement', description: 'PIM-BR-02' },
      ],
    },
    async ({ employeesApi, employees, createdEmployee }) => {
      const lastName = pimData.token('Dup');
      employees.trackByName(lastName);
      const res = await employeesApi.create({
        firstName: 'Dup',
        lastName,
        employeeId: createdEmployee.employeeId!,
      });
      expect([422, 409]).toContain(res.status);
      expect(invalidKeys(res.body)).toEqual(['employeeId']);
      const sameId = await employeesApi.listOrFail({
        employeeId: createdEmployee.employeeId!,
        includeEmployees: 'currentAndPast',
      });
      expect(sameId.items.map((e) => e.empNumber)).toEqual([createdEmployee.empNumber]);
    },
  );

  const includeVariants: { includeEmployees: IncludeEmployees; expected: string[] }[] = [
    { includeEmployees: 'onlyCurrent', expected: ['current'] },
    { includeEmployees: 'onlyPast', expected: ['past'] },
    { includeEmployees: 'currentAndPast', expected: ['current', 'past'] },
  ];
  for (const v of includeVariants) {
    test(
      `[PIM-API-005] GET employees filters by nameOrId and includeEmployees (${v.includeEmployees})`,
      {
        tag: ['@P1', '@positive'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-002-AC1' },
          { type: 'requirement', description: 'PIM-FR-002-AC3' },
          { type: 'requirement', description: 'PIM-FR-002-AC7' },
        ],
      },
      async ({ employeesApi, employees }) => {
        const lastName = pimData.token('Inc');
        const current = await employees.create({ firstName: 'current', lastName });
        const past = await employees.create({ firstName: 'past', lastName, terminated: true });
        const byFirstName = { current: current.empNumber, past: past.empNumber };

        const res = await employeesApi.listOrFail({
          nameOrId: lastName,
          includeEmployees: v.includeEmployees,
        });
        expect(res.total).toBe(v.expected.length);
        expect(res.items.map((e) => e.empNumber).sort()).toEqual(
          v.expected.map((k) => byFirstName[k as keyof typeof byFirstName]).sort(),
        );
      },
    );
  }

  test(
    '[PIM-API-006] GET employees honours limit, offset, sortField and sortOrder',
    {
      tag: ['@P2', '@edge'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-003-AC2' },
        { type: 'requirement', description: 'PIM-FR-003-AC3' },
      ],
    },
    async ({ employeesApi, employees }) => {
      // Ten own employees with distinct, mixed-case last names created out of order.
      const token = pimData.token('Pag');
      const suffixes = ['d', 'J', 'a', 'G', 'c', 'i', 'B', 'f', 'e', 'h'];
      await employees.createMany(10, (i) => ({ lastName: `${token}${suffixes[i]}` }));
      const query = { nameOrId: token, sortField: 'employee.lastName', sortOrder: 'ASC' as const, limit: 5 };

      const page1 = await employeesApi.listOrFail({ ...query, offset: 0 });
      const page2 = await employeesApi.listOrFail({ ...query, offset: 5 });
      expect(page1.items).toHaveLength(5);
      expect(page2.items).toHaveLength(5);
      expect(page1.total).toBe(10);
      expect(page2.total).toBe(page1.total);
      const ids1 = page1.items.map((e) => e.empNumber);
      expect(page2.items.filter((e) => ids1.includes(e.empNumber))).toEqual([]);

      const all = [...page1.items, ...page2.items].map((e) => e.lastName);
      expect(all).toEqual(sortedCI(all, 'ASC'));
      const desc = await employeesApi.listOrFail({ ...query, sortOrder: 'DESC', limit: 50 });
      expect(desc.items.map((e) => e.lastName)).toEqual(sortedCI(all, 'DESC'));
    },
  );

  test(
    '[PIM-API-007] DELETE employees with ids removes them; deleted ids return 404',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-004-AC3' },
        { type: 'requirement', description: 'PIM-FR-004-AC4' },
        { type: 'requirement', description: 'PIM-BR-04' },
        {
          type: 'issue',
          description:
            'GET /pim/employees/{deleted empNumber} returns 422 "Invalid Parameter" (invalidParamKeys [empNumber]) instead of 404',
        },
      ],
    },
    async ({ employeesApi, employees }) => {
      test.fail();
      const lastName = pimData.token('Del');
      const [a, b] = await employees.createMany(2, { lastName });

      const res = await employeesApi.delete([a.empNumber, b.empNumber]);
      expectStatus(res, 200);
      expect(res.body.data.map(Number).sort()).toEqual([a.empNumber, b.empNumber].sort());
      expect(
        (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
      ).toBe(0);

      expectStatus(await employeesApi.get(a.empNumber), 404);
    },
  );

  const notFound = [
    {
      method: 'GET',
      call: (api: EmployeesApi) => api.get(999999999),
      issue: [
        {
          type: 'issue',
          description:
            'GET /pim/employees/999999999 returns 422 "Invalid Parameter" (invalidParamKeys [empNumber]) instead of 404',
        },
      ],
      appDiffers: true,
    },
    { method: 'DELETE', call: (api: EmployeesApi) => api.delete([999999999]), issue: [], appDiffers: false },
  ];
  for (const v of notFound) {
    test(
      `[PIM-API-008] GET or DELETE a non-existent employee returns 404 (${v.method})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [{ type: 'requirement', description: 'PIM-FR-004-AC3' }, ...v.issue],
      },
      async ({ employeesApi }) => {
        test.fail(v.appDiffers, 'App returns 422 instead of 404, see the issue annotation');
        const res = await v.call(employeesApi);
        expectStatus(res, 404);
        expect((res.body as unknown as ApiValidationError).error.message).toMatch(/Not Found/);
      },
    );
  }

  test(
    '[PIM-API-009] Admin cannot delete their own employee record through the API',
    {
      tag: ['@P1', '@negative', '@security'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-004-AC6' },
        { type: 'requirement', description: 'PIM-BR-06' },
      ],
    },
    async ({ playwright, env, usersApi, employeesApi, employees }) => {
      // A dedicated Admin user linked to a throwaway employee: the shared Admin record is never put
      // at risk, and the guard under test (self-delete) is the same for every Admin.
      const own = await employees.create();
      const credentials = pimData.login('auto.adm');
      const admin = await usersApi.createOrFail({
        ...credentials,
        status: true,
        userRoleId: UserRole.Admin,
        empNumber: own.empNumber,
      });
      employees.trackUser(admin.id);

      const ctx = await playwright.request.newContext({
        baseURL: env.baseURL,
        storageState: { cookies: [], origins: [] },
      });
      try {
        await new AuthApi(ctx).login(credentials);
        const asAdmin = new EmployeesApi(new ApiClient(ctx));
        const me = await asAdmin.myself();
        expectStatus(me, 200);
        expect(me.body.data.empNumber).toBe(own.empNumber);

        const res = await asAdmin.delete([own.empNumber]);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
        expect(invalidKeys(res.body)).toEqual(['ids']);
      } finally {
        await ctx.dispose();
      }
      expectStatus(await employeesApi.get(own.empNumber), 200);
    },
  );
});
