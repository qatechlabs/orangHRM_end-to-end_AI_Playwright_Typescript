import { test, expect } from '@fixtures/index';
import { expectStatus, type ApiClient, type ApiResult } from '@api/ApiClient';
import type { SeededEmployee } from '@data/EmployeeSeeder';
import { pimData } from '@data/pim';

// Test cases: test-cases/json/pim.json (feature "Access Control API"). Source: PIM-NFR-05.
// The ESS user signs in over HTTP in its own request context; the shared Admin session is untouched.

const UNAUTHORIZED = { error: { status: 403, message: 'Unauthorized' } };

const variants: {
  method: 'GET' | 'POST' | 'DELETE';
  /** Calls the endpoint as the ESS user. */
  call: (ess: ApiClient, ctx: { target: SeededEmployee; lastName: string }) => Promise<ApiResult>;
  /** What the ESS user gets back. */
  check: (res: ApiResult) => void;
}[] = [
  {
    method: 'GET',
    call: (ess) => ess.get('/pim/employees', { limit: 50, offset: 0 }),
    // 403, or an empty list: an ESS user sees no other employee.
    check: (res) => {
      expect([200, 403]).toContain(res.status);
      expect(res.status === 403 ? res.body : (res.body as { data: unknown[] }).data).toEqual(
        res.status === 403 ? UNAUTHORIZED : [],
      );
    },
  },
  {
    method: 'POST',
    call: (ess, { lastName }) =>
      ess.post('/pim/employees', { firstName: 'Ess', middleName: '', lastName, employeeId: '' }),
    check: (res) => {
      expectStatus(res, 403);
      expect(res.body).toEqual(UNAUTHORIZED);
    },
  },
  {
    method: 'DELETE',
    call: (ess, { target }) => ess.delete('/pim/employees', { ids: [target.empNumber] }),
    check: (res) => {
      expectStatus(res, 403);
      expect(res.body).toEqual(UNAUTHORIZED);
    },
  },
];

test.describe('Access Control API', () => {
  for (const v of variants) {
    test(
      `[PIM-API-020] ESS session cannot list, create or delete employees through the PIM API (${v.method})`,
      {
        tag: ['@P1', '@negative', '@security'],
        annotation: { type: 'requirement', description: 'PIM-NFR-05' },
      },
      async ({ employees, employeesApi, apiSessions }) => {
        const [essEmployee, target] = await Promise.all([
          employees.create({ login: true }),
          employees.create(),
        ]);
        const lastName = `EssCreated${pimData.token('')}`;
        employees.trackByName(lastName);
        const ess = await apiSessions.login(essEmployee.login!);

        v.check(await v.call(ess, { target, lastName }));

        // No data change, seen from the Admin session.
        expectStatus(await employeesApi.get(target.empNumber), 200);
        const created = await employeesApi.listOrFail({
          nameOrId: lastName,
          includeEmployees: 'currentAndPast',
        });
        expect(created.total).toBe(0);
      },
    );
  }
});
