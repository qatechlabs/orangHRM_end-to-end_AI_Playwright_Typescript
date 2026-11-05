import { test, expect } from '@fixtures/index';
import { detailText, yearsFromToday } from '@data/pim-details';
import { uniqueSuffix } from '@utils/dataFactory';
import { watchRequests } from '@pages/pim/profileHelpers';

// Test cases: test-cases/json/pim.json (feature "Immigration"). Source: PIM-FR-014, PIM-VAL-018/019.
// Every test creates its own employee through the API; its records are deleted with it at teardown.

test.describe('Immigration', () => {
  test(
    '[PIM-UI-050] Passport record is added with default document type and listed with its details',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-014-AC1' },
        { type: 'requirement', description: 'PIM-FR-014-AC2' },
        { type: 'requirement', description: 'PIM-FR-014-AC4' },
      ],
    },
    async ({ immigrationPage: tab, createdEmployee, employeeDetailsApi }) => {
      const issued = yearsFromToday(-1);
      const expiry = yearsFromToday(9);
      const record = {
        document: 'Passport' as const,
        number: `P${uniqueSuffix()}`,
        issuedDate: issued.ui,
        expiryDate: expiry.ui,
        issuedBy: 'India',
      };
      await tab.load(createdEmployee.empNumber);
      await tab.clickAdd();
      await tab.expectFormTitle('Add Immigration');
      await tab.expectDocument('Passport');
      const countries = await tab.issuedBy.options();
      expect(countries[0]).toBe('-- Select --');
      expect(countries).toEqual(expect.arrayContaining(['Afghanistan', 'India', 'United States']));
      expect(countries.length).toBeGreaterThan(200);

      await tab.fillForm({
        number: record.number,
        issuedDate: record.issuedDate,
        expiryDate: record.expiryDate,
        issuedBy: record.issuedBy,
      });
      await tab.save();
      await tab.toast.expectSuccess(detailText.saved);
      await tab.records.expectRecords(1);
      await tab.records.expectHeaders([
        '',
        'Document',
        'Number',
        'Issued By',
        'Issued Date',
        'Expiry Date',
        'Actions',
      ]);
      await tab.records.expectRow(record.number, {
        Document: 'Passport',
        Number: record.number,
        'Issued By': 'India',
        'Issued Date': issued.ui,
        'Expiry Date': expiry.ui,
      });
      expect((await employeeDetailsApi.immigrations.listOrFail(createdEmployee.empNumber)).items).toEqual([
        expect.objectContaining({
          number: record.number,
          type: 1,
          issuedDate: issued.iso,
          expiryDate: expiry.iso,
          country: { code: 'IN', name: 'India' },
        }),
      ]);

      await tab.edit(tab.records.row(record.number));
      await tab.expectFormTitle('Edit Immigration');
      await tab.expectForm(record);
      const newNumber = `N${uniqueSuffix()}`;
      await tab.fillForm({ number: newNumber });
      await tab.save();
      await tab.toast.expectSuccess(detailText.updated);
      await tab.records.expectRow(newNumber, {
        Document: 'Passport',
        Number: newNumber,
        'Issued By': 'India',
      });
      await expect(tab.records.row(record.number)).toHaveCount(0);

      await tab.deleteRow(tab.records.row(newNumber));
      await tab.toast.expectSuccess(detailText.deleted);
      await tab.records.expectNoRecords();
      expect((await employeeDetailsApi.immigrations.listOrFail(createdEmployee.empNumber)).total).toBe(0);
    },
  );

  test(
    '[PIM-UI-051] Immigration record rejects missing Number and Expiry Date before Issued Date',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-014-AC3' },
        { type: 'requirement', description: 'PIM-VAL-018' },
        { type: 'requirement', description: 'PIM-VAL-019' },
      ],
    },
    async ({ page, immigrationPage: tab, createdEmployee, employeeDetailsApi }) => {
      await tab.load(createdEmployee.empNumber);
      const posts = watchRequests(page, 'POST', '/immigrations');
      await tab.clickAdd();
      await tab.save();
      await tab.number.expectError(detailText.required);

      // 1 Jan 2025 / 1 Jan 2024 read the same in yyyy-dd-mm and yyyy-mm-dd.
      await tab.fillForm({
        number: `P${uniqueSuffix()}`,
        issuedDate: '2025-01-01',
        expiryDate: '2024-01-01',
      });
      await tab.number.expectNoError();
      await tab.expiryDate.expectError(detailText.expiryBeforeIssued);
      await tab.save();
      await tab.expiryDate.expectError(detailText.expiryBeforeIssued);
      expect(posts.count()).toBe(0);
      expect((await employeeDetailsApi.immigrations.listOrFail(createdEmployee.empNumber)).total).toBe(0);
    },
  );
});
