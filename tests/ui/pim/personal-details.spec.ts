import { test, expect } from '@fixtures/index';
import { selectable } from '@data/pim';
import { detailText, maritalStatuses, textOfLength, yearsFromToday } from '@data/pim-details';
import { uniqueSuffix } from '@utils/dataFactory';
import { watchRequests } from '@pages/pim/profileHelpers';

// Test cases: test-cases/json/pim.json (feature "Personal Details"). Source: PIM-FR-008, PIM-VAL-004/009/010, PIM-NFR-01.
// Every test creates its own employee through the API; teardown deletes it (with its details).

test.describe('Personal Details', () => {
  test(
    '[PIM-UI-034] Personal details are saved with Successfully Updated and persist after reload',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-008-AC1' },
        { type: 'requirement', description: 'PIM-FR-008-AC2' },
        { type: 'requirement', description: 'PIM-FR-008-AC4' },
        { type: 'requirement', description: 'PIM-E2E-04' },
      ],
    },
    async ({ personalDetailsPage, createdEmployee, employeeDetailsApi }) => {
      await personalDetailsPage.openFor(createdEmployee.empNumber);
      await personalDetailsPage.expectPersonalDetails({
        firstName: createdEmployee.firstName,
        middleName: '',
        lastName: createdEmployee.lastName,
        employeeId: createdEmployee.employeeId ?? '',
      });

      const nationalities = await personalDetailsPage.nationality.options();
      expect(nationalities[0]).toBe('-- Select --');
      expect(nationalities).toContain('Indian');
      expect(nationalities.length).toBeGreaterThan(100);
      expect(await personalDetailsPage.maritalStatus.options()).toEqual(maritalStatuses);
      await personalDetailsPage.expectGenderOptions();

      const licenseExpiry = yearsFromToday(2);
      const data = {
        otherId: `OT${uniqueSuffix()}`,
        licenseNumber: `DL${uniqueSuffix()}`,
        licenseExpiry: licenseExpiry.ui,
        nationality: 'Indian',
        maritalStatus: 'Married' as const,
        dateOfBirth: '1990-15-06',
        gender: 'Female' as const,
      };
      await personalDetailsPage.fillForm(data);
      await personalDetailsPage.save();
      await personalDetailsPage.toast.expectSuccess(detailText.updated);

      await personalDetailsPage.reload();
      await personalDetailsPage.expectForm(data);
      const stored = await employeeDetailsApi.personalDetailsOrFail(createdEmployee.empNumber);
      expect(stored).toMatchObject({
        otherId: data.otherId,
        drivingLicenseNo: data.licenseNumber,
        drivingLicenseExpiredDate: licenseExpiry.iso,
        maritalStatus: 'Married',
        birthday: '1990-06-15',
        gender: 2,
        nationality: { name: 'Indian' },
      });
    },
  );

  test(
    '[PIM-UI-035] Renaming an employee updates the profile header and the Employee List',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-008-AC5' },
        {
          type: 'issue',
          description:
            'PIM-FR-008-AC5: after saving a new First Name the profile header keeps the old name until the page is reloaded; the Employee List shows the new name',
        },
      ],
    },
    async ({ personalDetailsPage, employeeListPage, createdEmployee }) => {
      test.fail();
      await personalDetailsPage.openFor(createdEmployee.empNumber);
      await personalDetailsPage.expectHeaderName(createdEmployee.fullName);
      await personalDetailsPage.fillForm({ firstName: 'Renamed' });
      await personalDetailsPage.save();
      await personalDetailsPage.toast.expectSuccess(detailText.updated);
      const newName = `Renamed ${createdEmployee.lastName}`;
      // BRD: the header shows the new name right after the save (soft, so the list is still checked).
      await expect.soft(personalDetailsPage.headerName).toHaveText(newName);

      await personalDetailsPage.reload();
      await personalDetailsPage.expectHeaderName(newName);
      await employeeListPage.load();
      await employeeListPage.searchById(createdEmployee.employeeId ?? '');
      await employeeListPage.expectOnly(createdEmployee.employeeId ?? '');
      await employeeListPage.expectCellText(
        employeeListPage.results.rows.first(),
        'First (& Middle) Name',
        'Renamed',
      );
    },
  );

  const invalidDates = [
    { field: 'Date of Birth', value: '15/06/1990', apiKey: 'birthday' },
    { field: 'License Expiry Date', value: '2026-31-02', apiKey: 'drivingLicenseExpiredDate' },
  ] as const;
  for (const v of invalidDates) {
    test(
      `[PIM-UI-036] Invalid date formats in Date of Birth and License Expiry Date are rejected (${v.field} ${v.value})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-008-AC3' },
          { type: 'requirement', description: 'PIM-VAL-010' },
        ],
      },
      async ({ page, personalDetailsPage, createdEmployee, employeeDetailsApi }) => {
        await personalDetailsPage.openFor(createdEmployee.empNumber);
        const field = personalDetailsPage.fieldByLabel(v.field);
        const puts = watchRequests(page, 'PUT', '/personal-details');
        await field.fill(v.value);
        await personalDetailsPage.save();

        await field.expectError(detailText.invalidDate);
        expect(puts.count()).toBe(0);
        puts.stop();
        const stored = await employeeDetailsApi.personalDetailsOrFail(createdEmployee.empNumber);
        expect(stored[v.apiKey]).toBeNull();
      },
    );
  }

  const lengthVariants = [
    { field: 'Other Id', apiKey: 'otherId' },
    { field: "Driver's License Number", apiKey: 'drivingLicenseNo' },
  ] as const;
  for (const v of lengthVariants) {
    test(
      `[PIM-UI-037] Other Id and Driver License accept 30 characters, reject 31, and edited Employee Id stays unique (${v.field} 31 characters)`,
      {
        tag: ['@P3', '@edge'],
        annotation: { type: 'requirement', description: 'PIM-VAL-009' },
      },
      async ({ page, personalDetailsPage, createdEmployee, employeeDetailsApi }) => {
        await personalDetailsPage.openFor(createdEmployee.empNumber);
        const field = personalDetailsPage.fieldByLabel(v.field);
        const puts = watchRequests(page, 'PUT', '/personal-details');
        await field.fill(textOfLength(31, 'L'));
        await personalDetailsPage.save();
        await field.expectError(detailText.max30);
        expect(puts.count()).toBe(0);

        const max = textOfLength(30, uniqueSuffix());
        await field.fill(max);
        await field.expectNoError();
        await personalDetailsPage.save();
        await personalDetailsPage.toast.expectSuccess(detailText.updated);
        expect((await employeeDetailsApi.personalDetailsOrFail(createdEmployee.empNumber))[v.apiKey]).toBe(
          max,
        );
      },
    );
  }

  test(
    '[PIM-UI-037] Other Id and Driver License accept 30 characters, reject 31, and edited Employee Id stays unique (Employee Id of another employee)',
    {
      tag: ['@P3', '@edge'],
      annotation: { type: 'requirement', description: 'PIM-VAL-004' },
    },
    async ({ page, personalDetailsPage, employees, employeeDetailsApi }) => {
      const [employee, other] = await employees.createMany(2);
      await personalDetailsPage.openFor(employee.empNumber);
      const puts = watchRequests(page, 'PUT', '/personal-details');
      await personalDetailsPage.employeeId.fill(other.employeeId ?? '');
      await personalDetailsPage.save();

      await personalDetailsPage.employeeId.expectError(detailText.employeeIdExists);
      expect(puts.count()).toBe(0);
      expect((await employeeDetailsApi.personalDetailsOrFail(employee.empNumber)).employeeId).toBe(
        employee.employeeId,
      );
    },
  );

  test(
    '[PIM-UI-038] Saving Personal Details does not change data on other profile tabs',
    {
      tag: ['@P1', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-NFR-01' },
    },
    async ({
      personalDetailsPage,
      contactDetailsPage,
      employeeJobPage,
      employees,
      masterDataApi,
      employeeDetailsApi,
    }) => {
      const [jobTitle] = selectable(await masterDataApi.jobTitles(), (t) => t.title);
      const employee = await employees.create({ job: { jobTitleId: jobTitle.id } });
      const contact = {
        street1: '1 Main St',
        city: 'Austin',
        mobile: '0771234567',
        workEmail: `iso${uniqueSuffix()}@example.com`,
      };
      await employeeDetailsApi.updateContactDetailsOrFail(employee.empNumber, contact);

      await personalDetailsPage.openFor(employee.empNumber);
      await personalDetailsPage.fillForm({ maritalStatus: 'Married' });
      await personalDetailsPage.save();
      await personalDetailsPage.toast.expectSuccess(detailText.updated);

      await contactDetailsPage.openFromTab(employee.empNumber);
      await contactDetailsPage.expectForm(contact);
      await employeeJobPage.openJobFor(employee.empNumber);
      await expect(employeeJobPage.field('Job Title').select).toHaveText(jobTitle.title);

      // The three reads are independent: one parallel round instead of three sequential ones.
      const [storedContact, storedJob, storedPersonal] = await Promise.all([
        employeeDetailsApi.contactDetailsOrFail(employee.empNumber),
        employeeDetailsApi.jobDetailsOrFail(employee.empNumber),
        employeeDetailsApi.personalDetailsOrFail(employee.empNumber),
      ]);
      expect(storedContact).toMatchObject(contact);
      expect(storedJob.jobTitle.id).toBe(jobTitle.id);
      expect(storedPersonal.maritalStatus).toBe('Married');
    },
  );
});
