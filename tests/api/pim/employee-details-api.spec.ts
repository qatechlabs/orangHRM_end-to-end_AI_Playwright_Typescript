import { test, expect } from '@fixtures/index';
import { expectStatus } from '@api/ApiClient';
import type { ApiValidationError } from '@api/types/pim';
import { Gender } from '@api/types/pim-details';
import { selectable } from '@data/pim';
import { uniqueSuffix } from '@utils/dataFactory';

// Test cases: test-cases/json/pim.json (feature "Employee Details API").
// Endpoints: PUT /pim/employees/{n}/personal-details, PUT /pim/employee/{n}/contact-details (singular "employee").

const invalidKeys = (body: unknown) => (body as ApiValidationError).error?.data?.invalidParamKeys ?? [];

test.describe('Employee Details API', () => {
  test(
    '[PIM-API-010] PUT personal-details updates the employee and leaves job details unchanged',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-008-AC4' },
        { type: 'requirement', description: 'PIM-NFR-01' },
      ],
    },
    async ({ employees, masterDataApi, employeeDetailsApi }) => {
      const [jobTitle] = selectable(await masterDataApi.jobTitles(), (t) => t.title);
      const employee = await employees.create({ job: { jobTitleId: jobTitle.id } });
      const jobBefore = await employeeDetailsApi.jobDetailsOrFail(employee.empNumber);
      const nationality = (await employeeDetailsApi.nationalities()).find((n) => n.name === 'Indian');
      expect(nationality, 'nationality "Indian" in master data').toBeDefined();

      const payload = {
        firstName: 'Upd',
        middleName: '',
        lastName: `Emp${uniqueSuffix()}`,
        // The PUT replaces the record: the UI always sends the current employeeId (omitted = cleared).
        employeeId: employee.employeeId,
        gender: Gender.Male,
        maritalStatus: 'Married' as const,
        birthday: '1990-06-15',
        nationalityId: nationality!.id,
      };
      const res = await employeeDetailsApi.updatePersonalDetails(employee.empNumber, payload);
      expectStatus(res, 200);
      const expected = {
        empNumber: employee.empNumber,
        firstName: payload.firstName,
        middleName: '',
        lastName: payload.lastName,
        employeeId: employee.employeeId,
        gender: Gender.Male,
        maritalStatus: 'Married',
        birthday: '1990-06-15',
        nationality: { id: nationality!.id, name: 'Indian' },
      };
      expect(res.body.data).toMatchObject(expected);

      expect(await employeeDetailsApi.personalDetailsOrFail(employee.empNumber)).toMatchObject(expected);
      const jobAfter = await employeeDetailsApi.jobDetailsOrFail(employee.empNumber);
      expect(jobAfter.jobTitle).toEqual({ id: jobTitle.id, title: jobTitle.title, isDeleted: false });
      expect(jobAfter).toEqual(jobBefore);
    },
  );

  const emailVariants = [
    {
      label: 'malformed workEmail',
      body: (_taken: string, u: string) => ({ workEmail: `not-an-email${u}` }),
    },
    { label: "another employee's workEmail", body: (taken: string) => ({ workEmail: taken }) },
  ];
  for (const v of emailVariants) {
    test(
      `[PIM-API-011] PUT contact-details rejects malformed and duplicate emails (${v.label})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-011-AC3' },
          { type: 'requirement', description: 'PIM-FR-011-AC4' },
          { type: 'requirement', description: 'PIM-VAL-014' },
        ],
      },
      async ({ employees, employeeDetailsApi }) => {
        const [employee, other] = await employees.createMany(2);
        const taken = `taken${uniqueSuffix()}@example.com`;
        await employeeDetailsApi.updateContactDetailsOrFail(other.empNumber, { workEmail: taken });
        const before = await employeeDetailsApi.updateContactDetailsOrFail(employee.empNumber, {
          city: 'Austin',
          workEmail: `own${uniqueSuffix()}@example.com`,
        });

        const res = await employeeDetailsApi.updateContactDetails(
          employee.empNumber,
          v.body(taken, uniqueSuffix()),
        );
        expectStatus(res, 422);
        expect(invalidKeys(res.body)).toEqual(['workEmail']);
        expect(await employeeDetailsApi.contactDetailsOrFail(employee.empNumber)).toEqual(before);
      },
    );
  }

  test(
    '[PIM-API-011] PUT contact-details rejects malformed and duplicate emails (workEmail equals otherEmail)',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-011-AC4' },
        { type: 'requirement', description: 'PIM-VAL-014' },
        {
          type: 'issue',
          description:
            'PIM-VAL-014: PUT contact-details with workEmail equal to otherEmail is rejected with 400 "Work Email and Other Email Cannot Be The Same" instead of 422 (nothing is stored)',
        },
      ],
    },
    async ({ createdEmployee, employeeDetailsApi }) => {
      test.fail();
      const before = await employeeDetailsApi.updateContactDetailsOrFail(createdEmployee.empNumber, {
        city: 'Austin',
      });
      const same = `x${uniqueSuffix()}@e.com`;
      const res = await employeeDetailsApi.updateContactDetails(createdEmployee.empNumber, {
        workEmail: same,
        otherEmail: same,
      });
      // Not stored either way; checked first so the status assertion is the only expected failure.
      expect(await employeeDetailsApi.contactDetailsOrFail(createdEmployee.empNumber)).toEqual(before);
      expectStatus(res, 422);
    },
  );
});
