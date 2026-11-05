import { test, expect } from '@fixtures/index';
import { deletedToast, pimData, pimText } from '@data/pim';

// Test cases: test-cases/json/pim.json (feature "Delete Employee"). Source: PIM-FR-004, PIM-BR-04, PIM-BR-06.

test.describe('Delete Employee', () => {
  test(
    '[PIM-UI-011] Delete confirmation dialog shows the warning and No, Cancel keeps the record',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-004-AC1' },
        { type: 'requirement', description: 'PIM-FR-004-AC2' },
      ],
    },
    async ({ employeeListPage, employeesApi, createdEmployee }) => {
      await employeeListPage.load();
      await employeeListPage.searchById(createdEmployee.employeeId!);
      await employeeListPage.clickDelete(employeeListPage.results.rows.first());

      const dialog = employeeListPage.dialog;
      await expect(dialog.root).toContainText(pimText.deleteDialogTitle);
      await expect(dialog.root).toContainText(pimText.deleteDialogText);
      await expect(dialog.cancelButton).toHaveText(/No, Cancel/);
      await expect(dialog.confirmButton).toHaveText(/Yes, Delete/);

      await dialog.cancel();
      await employeeListPage.expectOnly(createdEmployee.employeeId!);
      expect((await employeesApi.get(createdEmployee.empNumber)).status).toBe(200);
    },
  );

  test(
    '[PIM-UI-012] Deleting a single employee shows Successfully Deleted and removes them from every search',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-004-AC3' },
        { type: 'requirement', description: 'PIM-BR-04' },
        { type: 'requirement', description: 'PIM-E2E-07' },
      ],
    },
    async ({ employeeListPage, createdEmployee }) => {
      await employeeListPage.load();
      await employeeListPage.searchById(createdEmployee.employeeId!);
      const deleted = await employeeListPage.deleteRow(employeeListPage.results.rows.first());
      expect(deleted.toast).toEqual(deletedToast);

      await employeeListPage.searchById(createdEmployee.employeeId!, 'Current and Past Employees');
      await employeeListPage.expectNoRecords();
    },
  );

  test(
    '[PIM-UI-013] Bulk delete removes all selected employees and header checkbox toggles the page selection',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-004-AC4' },
        { type: 'requirement', description: 'PIM-FR-004-AC5' },
        {
          type: 'issue',
          description:
            'PIM-FR-004-AC4: the "Delete Selected" button has no selected count; the count is shown as separate text "(2) Records Selected"',
        },
      ],
    },
    async ({ employeeListPage, employees }) => {
      test.fail();
      const token = pimData.token('Bulk');
      const created = await employees.createMany(3, { lastName: token });

      await employeeListPage.load();
      await employeeListPage.search({ name: token });
      await employeeListPage.expectRows(3);
      const table = employeeListPage.results;
      const checkboxes = table.rows.locator('input[type="checkbox"]');

      await table.toggleSelectAll();
      await expect(checkboxes).toHaveCount(3);
      for (const box of await checkboxes.all()) await expect(box).toBeChecked();
      await table.toggleSelectAll();
      for (const box of await checkboxes.all()) await expect(box).not.toBeChecked();

      await table.selectRow(table.rows.nth(0));
      await table.selectRow(table.rows.nth(1));
      await expect(employeeListPage.recordCount).toHaveText('(2) Records Selected');
      // BRD: the button itself shows the selected count. Soft, so the deletion below still runs.
      await expect.soft(employeeListPage.deleteSelectedButton).toContainText('(2)');

      const kept = await table.cell(table.rows.nth(2), 'Id').then((c) => c.innerText());
      const deleted = await employeeListPage.deleteSelected();
      expect(deleted.toast).toEqual(deletedToast);
      await employeeListPage.expectOnly(kept.trim());
      expect(created.map((e) => e.employeeId)).toContain(kept.trim());
    },
  );

  test(
    '[PIM-UI-014] Logged-in Admin cannot select or delete their own employee record',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-004-AC6' },
        { type: 'requirement', description: 'PIM-BR-06' },
      ],
    },
    async ({ employeeListPage, usersApi, env }) => {
      // Read-only on the shared Admin record: nothing is confirmed or saved here.
      const admin = await usersApi.findByUsername(env.admin.username);
      const own = admin!.employee;

      await employeeListPage.load();
      await employeeListPage.searchById(own.employeeId!);
      await employeeListPage.expectOnly(own.employeeId!);
      const row = employeeListPage.results.rows.first();
      await expect(employeeListPage.editButton(row)).toBeVisible();
      await expect(employeeListPage.deleteButton(row)).toHaveCount(0);

      // The checkbox is rendered, but ticking it does not select the row.
      await employeeListPage.results.selectRow(row);
      await expect(employeeListPage.deleteSelectedButton).toHaveCount(0);
      await employeeListPage.expectCount(1);
    },
  );
});
