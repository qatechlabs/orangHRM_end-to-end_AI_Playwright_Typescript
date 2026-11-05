import { test, expect } from '@fixtures/index';
import { pickByName, seedJob, uiDate } from '@data/pimJob';
import { pimText } from '@data/pim';
import { jobText } from '@pages/pim/EmployeeJobPage';
import { recordApiCalls } from '@pages/pim/jobRequests';

// Test cases: test-cases/json/pim.json (feature "Termination"). Source: PIM-FR-017, PIM-FR-018, PIM-BR-05, PIM-VAL-021.
// The Job tab reloads itself after Terminate / Activate; page methods wait for that reload.

test.describe('Termination', () => {
  test(
    '[PIM-UI-056] Terminate Employment records the termination and Activate Employment reverses it',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-017-AC1' },
        { type: 'requirement', description: 'PIM-FR-017-AC2' },
        { type: 'requirement', description: 'PIM-FR-018-AC1' },
      ],
    },
    async ({ employeeJobPage, employeesApi, masterDataApi, createdEmployee }) => {
      const today = new Date();
      const reasons = await masterDataApi.terminationReasons();
      const reason = pickByName(reasons, (r) => r.name, seedJob.terminationReason);

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.expectActive();
      await employeeJobPage.openTerminateDialog();
      await employeeJobPage.expectTerminationDialog();

      const toast = await employeeJobPage.confirmTermination({
        date: uiDate(today),
        reason: reason.name,
        note: 'auto',
      });
      expect(toast).toEqual({ title: 'Success', message: pimText.updated });
      await employeeJobPage.expectTerminated(uiDate(today));
      await employeeJobPage.expectPastEmployeeHeader(true);
      expect((await employeesApi.get(createdEmployee.empNumber)).body.data.terminationId).not.toBeNull();

      expect(await employeeJobPage.reactivate()).toEqual({ title: 'Success', message: pimText.updated });
      await employeeJobPage.expectActive();
      await employeeJobPage.expectPastEmployeeHeader(false);
      expect((await employeesApi.get(createdEmployee.empNumber)).body.data.terminationId).toBeNull();
    },
  );

  test(
    '[PIM-UI-057] Terminated employee is labelled Past Employee in lists and autocompletes',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-017-AC4' },
        { type: 'requirement', description: 'PIM-BR-05' },
      ],
    },
    async ({ employeeListPage, employeeProfilePage, employeeJobPage, employees, masterDataApi }) => {
      const title = pickByName(await masterDataApi.jobTitles(), (t) => t.title, seedJob.jobTitle);
      const employee = await employees.create({ job: { jobTitleId: title.id }, terminated: true });

      await employeeListPage.load();
      // The default Include (Current Employees Only) does not offer past employees at all.
      await employeeListPage.employeeName.type(employee.lastName);
      await expect(employeeListPage.employeeName.options).toHaveText(['No Records Found']);

      await employeeListPage.include.choose('Current and Past Employees');
      await employeeListPage.employeeName.type(employee.lastName);
      const suggestion = employeeListPage.employeeName.options.filter({ hasText: employee.lastName });
      await expect(suggestion).toHaveCount(1);
      await expect(suggestion).toContainText(employee.fullName);
      await expect(suggestion).toContainText(jobText.pastEmployee);
      await employeeListPage.employeeName.input.clear();

      await employeeListPage.searchById(employee.employeeId!, 'Past Employees Only');
      await employeeListPage.expectOnly(employee.employeeId!);
      const row = employeeListPage.results.rows.first();
      await employeeListPage.expectCellText(row, 'Last Name', `${employee.lastName} ${jobText.pastEmployee}`);
      await employeeListPage.expectCellText(row, 'Job Title', title.title);

      // Data is retained on the profile.
      await employeeListPage.clickCell(row, 'Last Name');
      await employeeProfilePage.waitForPersonalDetails();
      await employeeProfilePage.expectOpenFor(employee.empNumber);
      await employeeProfilePage.expectPersonalDetails({
        firstName: employee.firstName,
        lastName: employee.lastName,
      });
      await employeeJobPage.openJobFor(employee.empNumber);
      await employeeJobPage.expectPastEmployeeHeader(true);
      await employeeJobPage.expectJob({ jobTitle: title.title });
      await employeeJobPage.expectTerminated(uiDate(new Date()));
    },
  );

  test(
    '[PIM-UI-058] Terminate dialog requires Termination Date and Reason',
    {
      tag: ['@P2', '@negative'],
      annotation: { type: 'requirement', description: 'PIM-VAL-021' },
    },
    async ({ page, employeeJobPage, employeesApi, createdEmployee }) => {
      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      const posts = recordApiCalls(page, 'POST', '/terminations');
      await employeeJobPage.openTerminateDialog();
      // The date is empty by default; clear it anyway, as the case says.
      await employeeJobPage.fillTermination({ date: '' });
      await employeeJobPage.clickTerminationSave();

      await employeeJobPage.terminationDate.expectError(pimText.required);
      await employeeJobPage.terminationReason.expectError(pimText.required);
      await employeeJobPage.terminationNote.expectNoError();
      await expect(employeeJobPage.terminationDialog).toBeVisible();
      await expect(employeeJobPage.toast.root).toHaveCount(0);
      expect(posts).toEqual([]);
      expect((await employeesApi.get(createdEmployee.empNumber)).body.data.terminationId).toBeNull();
    },
  );
});
