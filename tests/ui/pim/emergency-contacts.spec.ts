import { test, expect } from '@fixtures/index';
import { detailText, textOfLength } from '@data/pim-details';
import { watchRequests } from '@pages/pim/profileHelpers';

// Test cases: test-cases/json/pim.json (feature "Emergency Contacts"). Source: PIM-FR-012, PIM-VAL-015/016.
// Every test creates its own employee through the API; its contacts are deleted with it at teardown.

const columns = ['', 'Name', 'Relationship', 'Home Telephone', 'Mobile', 'Work Telephone', 'Actions'];

test.describe('Emergency Contacts', () => {
  test(
    '[PIM-UI-044] Emergency contact can be added, edited and deleted',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-012-AC2' },
        { type: 'requirement', description: 'PIM-FR-012-AC3' },
        { type: 'requirement', description: 'PIM-E2E-04' },
      ],
    },
    async ({ emergencyContactsPage: tab, createdEmployee, employeeDetailsApi }) => {
      const contact = {
        name: 'Jane Doe',
        relationship: 'Sister',
        homeTelephone: '',
        mobile: '0771234567',
        workTelephone: '',
      };
      await tab.load(createdEmployee.empNumber);
      await tab.records.expectNoRecords();

      await tab.clickAdd();
      await tab.expectFormTitle('Save Emergency Contact');
      await tab.fillForm({ name: contact.name, relationship: contact.relationship, mobile: contact.mobile });
      await tab.save();
      await tab.toast.expectSuccess(detailText.saved);
      await tab.records.expectRecords(1);
      await tab.records.expectHeaders(columns);
      await tab.records.expectRow(contact.name, {
        Name: contact.name,
        Relationship: contact.relationship,
        'Home Telephone': '',
        Mobile: contact.mobile,
        'Work Telephone': '',
      });

      await tab.edit(tab.records.row(contact.name));
      await tab.expectFormTitle('Edit Emergency Contact');
      await tab.expectForm(contact);
      await tab.fillForm({ relationship: 'Brother' });
      await tab.save();
      await tab.toast.expectSuccess(detailText.updated);
      await tab.records.expectRow(contact.name, { Relationship: 'Brother', Mobile: contact.mobile });

      await tab.deleteRow(tab.records.row(contact.name));
      await tab.toast.expectSuccess(detailText.deleted);
      await tab.records.expectNoRecords();
      expect((await employeeDetailsApi.emergencyContacts.listOrFail(createdEmployee.empNumber)).total).toBe(
        0,
      );
    },
  );

  test(
    '[PIM-UI-045] Emergency contact requires Name, Relationship and at least one telephone',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-012-AC1' },
        { type: 'requirement', description: 'PIM-VAL-015' },
        { type: 'requirement', description: 'PIM-VAL-016' },
      ],
    },
    async ({ page, emergencyContactsPage: tab, createdEmployee, employeeDetailsApi }) => {
      await tab.load(createdEmployee.empNumber);
      const posts = watchRequests(page, 'POST', '/emergency-contacts');
      await tab.clickAdd();
      await tab.save();
      await tab.name.expectError(detailText.required);
      await tab.relationship.expectError(detailText.required);
      await tab.homeTelephone.expectError(detailText.phoneRequired);

      await tab.fillForm({ name: 'Jane Doe', relationship: 'Sister' });
      await tab.save();
      await tab.name.expectNoError();
      await tab.relationship.expectNoError();
      await tab.homeTelephone.expectError(detailText.phoneRequired);
      expect(posts.count()).toBe(0);
      await tab.records.expectNoRecords();
      expect((await employeeDetailsApi.emergencyContacts.listOrFail(createdEmployee.empNumber)).total).toBe(
        0,
      );
    },
  );

  test(
    '[PIM-UI-046] Multiple emergency contacts can be bulk-deleted',
    {
      tag: ['@P3', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-012-AC3' },
    },
    async ({ emergencyContactsPage: tab, createdEmployee, employeeDetailsApi }) => {
      for (const name of ['John Roe', 'Mary Roe']) {
        await employeeDetailsApi.emergencyContacts.createOrFail(createdEmployee.empNumber, {
          name,
          relationship: 'Friend',
          homePhone: '0112223334',
          officePhone: '',
          mobilePhone: '',
        });
      }
      await tab.load(createdEmployee.empNumber);
      await tab.records.expectRecords(2);

      await tab.deleteAllSelected(2);
      await tab.toast.expectSuccess(detailText.deleted);
      await tab.records.expectNoRecords();
      expect((await employeeDetailsApi.emergencyContacts.listOrFail(createdEmployee.empNumber)).total).toBe(
        0,
      );
    },
  );

  test(
    '[PIM-UI-047] Emergency contact Name and Relationship reject 101 characters',
    {
      tag: ['@P3', '@edge'],
      annotation: { type: 'requirement', description: 'PIM-VAL-015' },
    },
    async ({ emergencyContactsPage: tab, createdEmployee }) => {
      await tab.load(createdEmployee.empNumber);
      await tab.clickAdd();
      await tab.fillForm({ name: textOfLength(101, 'Name'), relationship: textOfLength(101, 'Rel') });
      await tab.name.expectError(detailText.max100);
      await tab.relationship.expectError(detailText.max100);

      await tab.fillForm({ name: textOfLength(100, 'Name'), relationship: textOfLength(100, 'Rel') });
      await tab.name.expectNoError();
      await tab.relationship.expectNoError();
    },
  );
});
