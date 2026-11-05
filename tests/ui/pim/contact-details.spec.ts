import { test, expect } from '@fixtures/index';
import { detailText, emailOfLength, textOfLength } from '@data/pim-details';
import { uniqueSuffix } from '@utils/dataFactory';
import { watchRequests } from '@pages/pim/profileHelpers';

// Test cases: test-cases/json/pim.json (feature "Contact Details"). Source: PIM-FR-011, PIM-VAL-011..014.
// Every test creates its own employee through the API; teardown deletes it (with its contact details).

const empty = {
  workEmail: null,
  otherEmail: null,
  homeTelephone: null,
  mobile: null,
  workTelephone: null,
};

test.describe('Contact Details', () => {
  test(
    '[PIM-UI-039] Contact details with a US address use the state drop-down and persist after save',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-011-AC1' },
        { type: 'requirement', description: 'PIM-FR-011-AC5' },
        { type: 'requirement', description: 'PIM-E2E-04' },
        {
          type: 'issue',
          description:
            'PIM-FR-011-AC5: with Country "United States" State/Province stays a free-text input; no drop-down of states appears',
        },
      ],
    },
    async ({ contactDetailsPage, createdEmployee, employeeDetailsApi }) => {
      test.fail();
      const data = {
        street1: '1 Main St',
        city: 'Austin',
        country: 'United States',
        province: 'Texas',
        zip: '73301',
        mobile: '+1 (512) 555-0100',
        workEmail: `auto${uniqueSuffix()}@example.com`,
      };
      await contactDetailsPage.load(createdEmployee.empNumber);
      await contactDetailsPage.country.choose(data.country);
      // BRD: State/Province becomes a drop-down. Soft, so the save and persistence are still verified.
      await expect.soft(contactDetailsPage.province.select).toBeVisible();

      await contactDetailsPage.fillForm(data);
      await contactDetailsPage.save();
      await contactDetailsPage.toast.expectSuccess(detailText.updated);

      await contactDetailsPage.reload(createdEmployee.empNumber);
      await contactDetailsPage.expectForm(data);
      expect(await employeeDetailsApi.contactDetailsOrFail(createdEmployee.empNumber)).toMatchObject({
        street1: data.street1,
        city: data.city,
        province: data.province,
        countryCode: 'US',
        zipCode: data.zip,
        mobile: data.mobile,
        workEmail: data.workEmail,
      });
    },
  );

  const invalidPhones = [
    { field: 'Home', value: '12ab34' },
    { field: 'Mobile', value: '555#123' },
  ];
  for (const v of invalidPhones) {
    test(
      `[PIM-UI-040] Telephone fields reject letters and symbols other than + - / ( ) (${v.field} ${v.value})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-011-AC2' },
          { type: 'requirement', description: 'PIM-VAL-013' },
        ],
      },
      async ({ page, contactDetailsPage, createdEmployee, employeeDetailsApi }) => {
        await contactDetailsPage.load(createdEmployee.empNumber);
        await contactDetailsPage.enter(v.field, v.value);
        await contactDetailsPage.fieldByLabel(v.field).expectError(detailText.phoneChars);

        const puts = watchRequests(page, 'PUT', '/contact-details');
        await contactDetailsPage.save();
        await contactDetailsPage.fieldByLabel(v.field).expectError(detailText.phoneChars);
        expect(puts.count()).toBe(0);
        expect(await employeeDetailsApi.contactDetailsOrFail(createdEmployee.empNumber)).toMatchObject(empty);
      },
    );
  }

  test(
    '[PIM-UI-040] Telephone fields reject letters and symbols other than + - / ( ) (Work +1 (212) 555-01/22 is valid)',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-011-AC2' },
        { type: 'requirement', description: 'PIM-VAL-013' },
      ],
    },
    async ({ contactDetailsPage, createdEmployee, employeeDetailsApi }) => {
      const value = '+1 (212) 555-01/22';
      await contactDetailsPage.load(createdEmployee.empNumber);
      await contactDetailsPage.enter('Work', value);
      await contactDetailsPage.work.expectNoError();
      await contactDetailsPage.save();
      await contactDetailsPage.toast.expectSuccess(detailText.updated);
      expect((await employeeDetailsApi.contactDetailsOrFail(createdEmployee.empNumber)).workTelephone).toBe(
        value,
      );
    },
  );

  for (const email of ['plainaddress', 'a@b', 'a@@example.com', 'a b@example.com']) {
    test(
      `[PIM-UI-041] Invalid email formats are rejected with Expected format admin@example.com (${email})`,
      {
        tag: ['@P1', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-011-AC3' },
          { type: 'requirement', description: 'PIM-VAL-014' },
        ],
      },
      async ({ page, contactDetailsPage, createdEmployee, employeeDetailsApi }) => {
        await contactDetailsPage.load(createdEmployee.empNumber);
        await contactDetailsPage.enter('Work Email', email);
        const puts = watchRequests(page, 'PUT', '/contact-details');
        await contactDetailsPage.save();

        await contactDetailsPage.workEmail.expectError(detailText.emailFormat);
        expect(puts.count()).toBe(0);
        expect(
          (await employeeDetailsApi.contactDetailsOrFail(createdEmployee.empNumber)).workEmail,
        ).toBeNull();
      },
    );
  }

  test(
    "[PIM-UI-042] Work Email already used by another employee, or equal to Other Email, is rejected (another employee's Work Email)",
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-011-AC4' },
        { type: 'requirement', description: 'PIM-VAL-014' },
      ],
    },
    async ({ page, contactDetailsPage, employees, employeeDetailsApi }) => {
      const [employee, other] = await employees.createMany(2);
      const otherEmail = `taken${uniqueSuffix()}@example.com`;
      await employeeDetailsApi.updateContactDetailsOrFail(other.empNumber, { workEmail: otherEmail });

      await contactDetailsPage.load(employee.empNumber);
      await contactDetailsPage.enter('Work Email', otherEmail);
      await contactDetailsPage.workEmail.expectError(detailText.emailExists);
      const puts = watchRequests(page, 'PUT', '/contact-details');
      await contactDetailsPage.save();

      await contactDetailsPage.workEmail.expectError(detailText.emailExists);
      expect(puts.count()).toBe(0);
      expect((await employeeDetailsApi.contactDetailsOrFail(employee.empNumber)).workEmail).toBeNull();
    },
  );

  test(
    '[PIM-UI-042] Work Email already used by another employee, or equal to Other Email, is rejected (Work Email equals Other Email)',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-011-AC4' },
        { type: 'requirement', description: 'PIM-VAL-014' },
      ],
    },
    async ({ page, contactDetailsPage, createdEmployee, employeeDetailsApi }) => {
      const same = `same${uniqueSuffix()}@example.com`;
      await contactDetailsPage.load(createdEmployee.empNumber);
      await contactDetailsPage.fillForm({ workEmail: same, otherEmail: same });
      const puts = watchRequests(page, 'PUT', '/contact-details');
      await contactDetailsPage.save();

      await contactDetailsPage.workEmail.expectError(detailText.emailsSame);
      await contactDetailsPage.otherEmail.expectError(detailText.emailsSame);
      expect(puts.count()).toBe(0);
      expect(await employeeDetailsApi.contactDetailsOrFail(createdEmployee.empNumber)).toMatchObject(empty);
    },
  );

  const limits = [
    { field: 'Street 1', max: 70, value: (n: number) => textOfLength(n, 'Street') },
    { field: 'City', max: 70, value: (n: number) => textOfLength(n, 'City') },
    { field: 'Zip/Postal Code', max: 10, value: (n: number) => '1'.repeat(n) },
    { field: 'Mobile', max: 25, value: (n: number) => '5'.repeat(n) },
    { field: 'Work Email', max: 50, value: emailOfLength },
  ];
  for (const v of limits) {
    test(
      `[PIM-UI-043] Contact field length limits: address 70, zip 10, phone 25, email 50 (${v.field} ${v.max + 1} characters)`,
      {
        tag: ['@P3', '@edge'],
        annotation: [
          { type: 'requirement', description: 'PIM-VAL-011' },
          { type: 'requirement', description: 'PIM-VAL-012' },
          { type: 'requirement', description: 'PIM-VAL-013' },
          { type: 'requirement', description: 'PIM-VAL-014' },
        ],
      },
      async ({ contactDetailsPage, createdEmployee }) => {
        const field = contactDetailsPage.fieldByLabel(v.field);
        await contactDetailsPage.load(createdEmployee.empNumber);
        const tooLong = v.value(v.max + 1);
        expect(tooLong).toHaveLength(v.max + 1);
        await contactDetailsPage.enter(v.field, tooLong);
        await field.expectError(detailText.maxChars(v.max));

        const atMax = v.value(v.max);
        expect(atMax).toHaveLength(v.max);
        await contactDetailsPage.enter(v.field, atMax);
        await field.expectNoError();
      },
    );
  }
});
