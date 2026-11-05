import { test, expect } from '@fixtures/index';
import { expectStatus } from '@api/ApiClient';
import type { ApiValidationError } from '@api/types/pim';
import { DocumentType } from '@api/types/pim-details';
import type { IncludeEmployees } from '@api/types/pim';
import { ReportingMethod, type SalaryComponentRequest } from '@api/types/pim-job';
import type { PayGradeInfo } from '@fixtures/pim-job.fixture';
import { isoDate, pickByName, seedJob } from '@data/pimJob';
import { uniqueSuffix } from '@utils/dataFactory';

// Test cases: test-cases/json/pim.json (feature "Employee Records API").
// Endpoints: /pim/employees/{n}/emergency-contacts | dependents | immigrations (GET/POST, DELETE { ids }).
// Every test creates its own employee; its records are deleted with it at teardown.
// Group C (PIM-API-014/016/017): /pim/employees/{n}/terminations | salary-components | supervisors.

const invalidKeys = (body: unknown) => (body as ApiValidationError).error?.data?.invalidParamKeys ?? [];

test.describe('Employee Records API', () => {
  test(
    '[PIM-API-012] Emergency contacts and dependents support create, list and bulk delete (emergency-contacts)',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-012-AC2' },
        { type: 'requirement', description: 'PIM-FR-012-AC3' },
      ],
    },
    async ({ createdEmployee, employeeDetailsApi }) => {
      const records = employeeDetailsApi.emergencyContacts;
      const empNumber = createdEmployee.empNumber;
      const bodies = [
        { name: 'Jane', relationship: 'Sister', homePhone: '', officePhone: '', mobilePhone: '0771234567' },
        { name: 'John', relationship: 'Brother', homePhone: '0112223334', officePhone: '', mobilePhone: '' },
      ];
      const created = [];
      for (const body of bodies) {
        const res = await records.create(empNumber, body);
        expectStatus(res, 200);
        expect(res.body.data).toMatchObject(body);
        created.push(res.body.data);
      }

      const list = await records.list(empNumber);
      expectStatus(list, 200);
      expect(list.body.meta).toEqual({ empNumber, total: 2 });
      expect(list.body.data).toEqual(expect.arrayContaining(created));

      const del = await records.delete(
        empNumber,
        created.map((c) => c.id),
      );
      expectStatus(del, 200);
      expect((await records.listOrFail(empNumber)).total).toBe(0);
    },
  );

  test(
    '[PIM-API-012] Emergency contacts and dependents support create, list and bulk delete (dependents)',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-012-AC3' },
        { type: 'requirement', description: 'PIM-FR-013-AC2' },
      ],
    },
    async ({ createdEmployee, employeeDetailsApi }) => {
      const records = employeeDetailsApi.dependents;
      const empNumber = createdEmployee.empNumber;
      const bodies = [
        { name: 'Kid', relationshipType: 'child' as const, dateOfBirth: '2015-03-10' },
        {
          name: 'Nephew Kid',
          relationshipType: 'other' as const,
          relationship: 'Nephew',
          dateOfBirth: '2018-07-01',
        },
      ];
      const created = [];
      for (const body of bodies) {
        const res = await records.create(empNumber, body);
        expectStatus(res, 200);
        expect(res.body.data).toMatchObject(body);
        created.push(res.body.data);
      }

      const list = await records.list(empNumber);
      expectStatus(list, 200);
      expect(list.body.meta).toEqual({ empNumber, total: 2 });
      expect(list.body.data).toEqual(expect.arrayContaining(created));

      const del = await records.delete(
        empNumber,
        created.map((c) => c.id),
      );
      expectStatus(del, 200);
      expect((await records.listOrFail(empNumber)).total).toBe(0);
    },
  );

  test(
    '[PIM-API-013] POST emergency contact without any telephone number is rejected',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-012-AC1' },
        { type: 'requirement', description: 'PIM-VAL-016' },
      ],
    },
    async ({ createdEmployee, employeeDetailsApi }) => {
      const records = employeeDetailsApi.emergencyContacts;
      const res = await records.create(createdEmployee.empNumber, { name: 'Jane', relationship: 'Sister' });
      expectStatus(res, 422);
      expect(invalidKeys(res.body).length).toBeGreaterThan(0);
      expect(['homePhone', 'officePhone', 'mobilePhone']).toEqual(
        expect.arrayContaining(invalidKeys(res.body)),
      );
      expect((await records.listOrFail(createdEmployee.empNumber)).total).toBe(0);
    },
  );

  test(
    '[PIM-API-015] POST immigration with expiry date before issued date is rejected',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-014-AC3' },
        { type: 'requirement', description: 'PIM-VAL-019' },
        {
          type: 'issue',
          description:
            'PIM-VAL-019: POST immigrations with expiryDate 2024-01-01 before issuedDate 2025-01-01 returns 200 and stores the record; only the UI checks the date order',
        },
      ],
    },
    async ({ createdEmployee, employeeDetailsApi }) => {
      test.fail();
      const records = employeeDetailsApi.immigrations;
      const res = await records.create(createdEmployee.empNumber, {
        number: 'P123',
        type: DocumentType.Passport,
        issuedDate: '2025-01-01',
        expiryDate: '2024-01-01',
      });
      expectStatus(res, 422);
      expect((await records.listOrFail(createdEmployee.empNumber)).total).toBe(0);
    },
  );

  // ---- Group C: terminations, salary components, supervisors ----

  test(
    '[PIM-API-014] Terminating and re-activating via API moves the employee between current and past lists',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-017-AC1' },
        { type: 'requirement', description: 'PIM-FR-017-AC3' },
        { type: 'requirement', description: 'PIM-FR-018-AC1' },
        { type: 'requirement', description: 'PIM-BR-05' },
      ],
    },
    async ({ createdEmployee, employeesApi, masterDataApi }) => {
      const { empNumber } = createdEmployee;
      const reason = pickByName(await masterDataApi.terminationReasons(), (r) => r.name, seedJob.terminationReason);
      const date = isoDate(new Date());
      const listed = async (includeEmployees: IncludeEmployees) =>
        (await employeesApi.listOrFail({ nameOrId: createdEmployee.employeeId!, includeEmployees })).items.filter(
          (e) => e.empNumber === empNumber,
        );

      const terminated = await employeesApi.terminate(empNumber, { date, terminationReasonId: reason.id, note: 'api' });
      expectStatus(terminated, 200);
      expect(terminated.body.data).toMatchObject({
        date,
        note: 'api',
        terminationReason: { id: reason.id, name: reason.name },
      });
      const past = await listed('onlyPast');
      expect(past.map((e) => e.terminationId)).toEqual([terminated.body.data.id]);
      expect(await listed('onlyCurrent')).toEqual([]);

      const activated = await employeesApi.activate(empNumber);
      expectStatus(activated, 200);
      const current = await listed('onlyCurrent');
      expect(current.map((e) => e.terminationId)).toEqual([null]);
      expect(await listed('onlyPast')).toEqual([]);
    },
  );

  // Case data (grade USD 1000-5000: 999 / 5001 / 3000) mapped onto the seed grade "Grade 1" (USD 50000-60000).
  const pim016 = {
    title: '[PIM-API-016] Salary amount outside the pay grade range is rejected by the API',
    requirements: [
      { type: 'requirement', description: 'PIM-FR-019-AC2' },
      { type: 'requirement', description: 'PIM-BR-09' },
    ],
  };
  const salaryBody = (grade: PayGradeInfo, amount: number): SalaryComponentRequest => ({
    salaryComponent: `Api${uniqueSuffix()}`,
    salaryAmount: String(amount),
    payGradeId: grade.id,
    currencyId: grade.currency.id,
    payFrequencyId: '4',
    comment: null,
    addDirectDeposit: false,
  });
  const outOfRange = [
    { label: 'amount below minimum', amount: (g: PayGradeInfo) => g.min - 1 },
    { label: 'amount above maximum', amount: (g: PayGradeInfo) => g.max + 1 },
  ];
  for (const v of outOfRange) {
    test(
      `${pim016.title} (${v.label})`,
      {
        tag: ['@P1', '@negative'],
        annotation: [
          ...pim016.requirements,
          {
            type: 'issue',
            description:
              'PIM-BR-09: an out-of-range amount is rejected with 400 {"message":"Salary should be within min and max"} instead of 422 Invalid Parameter; nothing is stored',
          },
        ],
      },
      async ({ createdEmployee, employeeJobApi, payGrade }) => {
        test.fail();
        const res = await employeeJobApi.addSalary(createdEmployee.empNumber, salaryBody(payGrade, v.amount(payGrade)));
        expect(await employeeJobApi.salariesOrFail(createdEmployee.empNumber)).toEqual([]);
        expectStatus(res, 422);
      },
    );
  }

  test(
    `${pim016.title} (amount inside the range)`,
    { tag: ['@P1', '@positive'], annotation: pim016.requirements },
    async ({ createdEmployee, employeeJobApi, payGrade }) => {
      const amount = (payGrade.min + payGrade.max) / 2;
      const res = await employeeJobApi.addSalary(createdEmployee.empNumber, salaryBody(payGrade, amount));
      expectStatus(res, 200);
      expect({
        amount: Number(res.body.data.amount),
        payGrade: res.body.data.payGrade.id,
        currency: res.body.data.currencyType.id,
      }).toEqual({ amount, payGrade: payGrade.id, currency: payGrade.currency.id });
      expect(await employeeJobApi.salariesOrFail(createdEmployee.empNumber)).toHaveLength(1);
    },
  );

  const pim017 = [
    {
      label: 'self',
      supervisorOf: (pair: { supervisor: number; subordinate: number }) => pair.subordinate,
      issue:
        'PIM-FR-021-AC2 / PIM-BR-08: POST supervisors with the employee\'s own empNumber returns 200 and stores a self relation (only the UI blocks it)',
    },
    {
      label: 'existing supervisor again',
      supervisorOf: (pair: { supervisor: number; subordinate: number }) => pair.supervisor,
      issue:
        'PIM-FR-021-AC3: POST supervisors with an already assigned supervisor and the same method returns 500 "Unexpected Error Occurred" instead of a 4xx (with another method it returns 200 and stores a second row)',
    },
  ];
  for (const v of pim017) {
    test(
      `[PIM-API-017] Supervisors API rejects self-assignment and duplicate relations (${v.label})`,
      {
        tag: ['@P1', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-021-AC2' },
          { type: 'requirement', description: 'PIM-FR-021-AC3' },
          { type: 'requirement', description: 'PIM-BR-08' },
          { type: 'issue', description: v.issue },
        ],
      },
      async ({ employees, employeeJobApi }) => {
        test.fail();
        const [supervisor, subordinate] = await employees.createMany(2);
        await employeeJobApi.addSupervisorOrFail(subordinate.empNumber, {
          empNumber: supervisor.empNumber,
          reportingMethodId: ReportingMethod.Direct,
        });
        const before = await employeeJobApi.supervisorsOrFail(subordinate.empNumber);
        expect(before).toHaveLength(1);

        const res = await employeeJobApi.addSupervisor(subordinate.empNumber, {
          empNumber: v.supervisorOf({ supervisor: supervisor.empNumber, subordinate: subordinate.empNumber }),
          reportingMethodId: ReportingMethod.Direct,
        });
        expect.soft(await employeeJobApi.supervisorsOrFail(subordinate.empNumber)).toEqual(before);
        expect(res.status, JSON.stringify(res.body)).toBeGreaterThanOrEqual(400);
        expect(res.status, JSON.stringify(res.body)).toBeLessThan(500);
      },
    );
  }
});
