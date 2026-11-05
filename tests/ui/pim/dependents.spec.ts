import { test, expect } from '@fixtures/index';
import { detailText } from '@data/pim-details';
import { watchRequests } from '@pages/pim/profileHelpers';

// Test cases: test-cases/json/pim.json (feature "Dependents"). Source: PIM-FR-013, PIM-VAL-017.
// Every test creates its own employee through the API; its dependents are deleted with it at teardown.

test.describe('Dependents', () => {
  test(
    '[PIM-UI-048] Dependent with Relationship Other requires Please Specify and can be edited and deleted',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-013-AC1' },
        { type: 'requirement', description: 'PIM-FR-013-AC2' },
        { type: 'requirement', description: 'PIM-FR-013-AC3' },
        { type: 'requirement', description: 'PIM-VAL-017' },
      ],
    },
    async ({ dependentsPage: tab, createdEmployee, employeeDetailsApi }) => {
      // Date of Birth 10 March 2015, typed in the UI format yyyy-dd-mm.
      const dependent = {
        name: 'Kid One',
        relationship: 'Other' as const,
        specify: 'Nephew',
        dateOfBirth: '2015-10-03',
      };
      await tab.load(createdEmployee.empNumber);
      await tab.clickAdd();
      await tab.expectFormTitle('Add Dependent');
      await expect(tab.pleaseSpecify.root).toBeHidden();
      await tab.fillForm({ name: dependent.name, relationship: dependent.relationship });
      await expect(tab.pleaseSpecify.input).toBeVisible();

      await tab.save();
      await tab.pleaseSpecify.expectError(detailText.required);
      await tab.name.expectNoError();
      await tab.relationship.expectNoError();

      await tab.fillForm({ specify: dependent.specify, dateOfBirth: dependent.dateOfBirth });
      await tab.save();
      await tab.toast.expectSuccess(detailText.saved);
      await tab.records.expectRecords(1);
      await tab.records.expectHeaders(['', 'Name', 'Relationship', 'Date of Birth', 'Actions']);
      // For "Other" the Relationship column shows the specified text.
      await tab.records.expectRow(dependent.name, {
        Name: dependent.name,
        Relationship: dependent.specify,
        'Date of Birth': dependent.dateOfBirth,
      });
      expect((await employeeDetailsApi.dependents.listOrFail(createdEmployee.empNumber)).items).toEqual([
        expect.objectContaining({
          name: dependent.name,
          relationshipType: 'other',
          relationship: 'Nephew',
          dateOfBirth: '2015-03-10',
        }),
      ]);

      await tab.edit(tab.records.row(dependent.name));
      await tab.expectFormTitle('Edit Dependent');
      await tab.expectForm(dependent);
      await tab.fillForm({ relationship: 'Child' });
      await expect(tab.pleaseSpecify.root).toBeHidden();
      await tab.save();
      await tab.toast.expectSuccess(detailText.updated);
      await tab.records.expectRow(dependent.name, {
        Relationship: 'Child',
        'Date of Birth': dependent.dateOfBirth,
      });

      await tab.deleteRow(tab.records.row(dependent.name));
      await tab.toast.expectSuccess(detailText.deleted);
      await tab.records.expectNoRecords();
      expect((await employeeDetailsApi.dependents.listOrFail(createdEmployee.empNumber)).total).toBe(0);
    },
  );

  test(
    '[PIM-UI-049] Dependent Name and Relationship are mandatory',
    {
      tag: ['@P2', '@negative'],
      annotation: { type: 'requirement', description: 'PIM-VAL-017' },
    },
    async ({ page, dependentsPage: tab, createdEmployee, employeeDetailsApi }) => {
      await tab.load(createdEmployee.empNumber);
      const posts = watchRequests(page, 'POST', '/dependents');
      await tab.clickAdd();
      await tab.save();

      await tab.name.expectError(detailText.required);
      await tab.relationship.expectError(detailText.required);
      await tab.dateOfBirth.expectNoError();
      expect(posts.count()).toBe(0);
      expect((await employeeDetailsApi.dependents.listOrFail(createdEmployee.empNumber)).total).toBe(0);
    },
  );
});
