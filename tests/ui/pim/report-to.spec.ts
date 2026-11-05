import { test, expect } from '@fixtures/index';
import { pimText } from '@data/pim';
import { ReportingMethod } from '@api/types/pim-job';
import { uniqueSuffix } from '@utils/dataFactory';
import { recordApiCalls } from '@pages/pim/jobRequests';

// Test cases: test-cases/json/pim.json (feature "Report-to"). Source: PIM-FR-001-AC5, PIM-FR-021, PIM-BR-07/08, PIM-VAL-026/027.
// The UI prevents self / duplicate relations through the autocomplete (`report-to/allowed`); the API
// does not (see PIM-API-017). Supervisor sign-ins use a fresh guest context; Admin is never logged out.

test.describe('Report-to', () => {
  test(
    '[PIM-UI-063] Assigning a supervisor shows the relation on both employees and in the Supervisor column',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-021-AC1' },
        { type: 'requirement', description: 'PIM-FR-021-AC4' },
        { type: 'requirement', description: 'PIM-FR-021-AC5' },
      ],
    },
    async ({ employeeReportToPage, employeeListPage, employees, employeeJobApi }) => {
      const [supervisor, subordinate] = await employees.createMany(2, (i) => ({ firstName: i ? 'Sub' : 'Sup' }));

      await employeeReportToPage.openReportToFor(subordinate.empNumber);
      const supervisors = employeeReportToPage.supervisors;
      await supervisors.expectCount(0);
      await supervisors.clickAdd();
      await expect(supervisors.formTitle).toHaveText('Add Supervisor');
      await expect(supervisors.nameAutocomplete.input).toHaveAttribute('placeholder', 'Type for hints...');
      expect(await supervisors.method.options()).toEqual(expect.arrayContaining(['Direct', 'Indirect']));

      const toast = await supervisors.assign(supervisor.fullName, 'Direct', supervisor.lastName);
      expect(toast).toEqual({ title: 'Success', message: pimText.saved });
      await supervisors.expectCount(1);
      await supervisors.expectRow(supervisor.fullName, 'Direct');
      const [relation] = await employeeJobApi.supervisorsOrFail(subordinate.empNumber);
      expect({ empNumber: relation.supervisor.empNumber, method: relation.reportingMethod.id }).toEqual({
        empNumber: supervisor.empNumber,
        method: ReportingMethod.Direct,
      });

      await employeeReportToPage.openReportToFor(supervisor.empNumber);
      await employeeReportToPage.subordinates.expectCount(1);
      await employeeReportToPage.subordinates.expectRow(subordinate.fullName, 'Direct');
      await employeeReportToPage.supervisors.expectCount(0);

      await employeeListPage.load();
      await employeeListPage.searchById(subordinate.employeeId!);
      await employeeListPage.expectOnly(subordinate.employeeId!);
      await employeeListPage.expectCellText(employeeListPage.results.rows.first(), 'Supervisor', supervisor.fullName);
    },
  );

  test(
    '[PIM-UI-064] An employee cannot be assigned as their own supervisor or subordinate',
    {
      tag: ['@P1', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-021-AC2' },
        { type: 'requirement', description: 'PIM-BR-08' },
      ],
    },
    async ({ page, employeeReportToPage, employeeJobApi, createdEmployee }) => {
      const posts = recordApiCalls(page, 'POST', /\/(supervisors|subordinates)$/);
      for (const card of ['supervisors', 'subordinates'] as const) {
        await employeeReportToPage.openReportToFor(createdEmployee.empNumber);
        const section = employeeReportToPage[card];
        await section.clickAdd();
        const offered = await section.typeName(createdEmployee.lastName);
        expect(offered).not.toContain(createdEmployee.fullName);
        await section.expectNoSuggestions();

        await section.chooseMethod('Direct');
        await section.clickSave();
        await section.name.expectError('Invalid');
        await section.method.expectNoError();
        await expect(section.formTitle).toBeVisible();
      }
      expect(posts).toEqual([]);
      expect(await employeeJobApi.supervisorsOrFail(createdEmployee.empNumber)).toEqual([]);
    },
  );

  test(
    '[PIM-UI-065] The same supervisor cannot be assigned twice to one employee',
    {
      tag: ['@P2', '@negative'],
      annotation: { type: 'requirement', description: 'PIM-FR-021-AC3' },
    },
    async ({ employeeReportToPage, employees, employeeJobApi }) => {
      const [supervisor, subordinate] = await employees.createMany(2, (i) => ({ firstName: i ? 'Sub' : 'Sup' }));
      await employeeJobApi.addSupervisorOrFail(subordinate.empNumber, {
        empNumber: supervisor.empNumber,
        reportingMethodId: ReportingMethod.Direct,
      });

      await employeeReportToPage.openReportToFor(subordinate.empNumber);
      const supervisors = employeeReportToPage.supervisors;
      await supervisors.expectCount(1);
      await supervisors.clickAdd();
      expect(await supervisors.typeName(supervisor.lastName)).not.toContain(supervisor.fullName);
      await supervisors.expectNoSuggestions();
      expect(await supervisors.typeName(supervisor.fullName)).not.toContain(supervisor.fullName);
      await supervisors.expectNoSuggestions();

      await employeeReportToPage.openReportToFor(subordinate.empNumber);
      await supervisors.expectCount(1);
      await supervisors.expectRow(supervisor.fullName, 'Direct');
      expect(await employeeJobApi.supervisorsOrFail(subordinate.empNumber)).toHaveLength(1);
    },
  );

  test(
    '[PIM-UI-066] Report-to requires an employee picked from autocomplete and a reporting method',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-VAL-026' },
        { type: 'requirement', description: 'PIM-VAL-027' },
      ],
    },
    async ({ page, employeeReportToPage, employeeJobApi, createdEmployee }) => {
      await employeeReportToPage.openReportToFor(createdEmployee.empNumber);
      const posts = recordApiCalls(page, 'POST', /\/supervisors$/);
      const supervisors = employeeReportToPage.supervisors;
      await supervisors.clickAdd();

      await supervisors.clickSave();
      await supervisors.name.expectError(pimText.required);
      await supervisors.method.expectError(pimText.required);

      await supervisors.typeName(`zzzNoSuchPerson${uniqueSuffix()}`);
      await supervisors.expectNoSuggestions();
      await supervisors.clickSave();
      await supervisors.name.expectError('Invalid');
      await supervisors.method.expectError(pimText.required);

      await expect(employeeReportToPage.toast.root).toHaveCount(0);
      expect(posts).toEqual([]);
      expect(await employeeJobApi.supervisorsOrFail(createdEmployee.empNumber)).toEqual([]);
    },
  );

  test(
    '[PIM-UI-067] Supervisor sees only subordinates in PIM, and loses visibility when the relation is removed',
    {
      tag: ['@P1', '@positive', '@security'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-001-AC5' },
        { type: 'requirement', description: 'PIM-BR-07' },
        { type: 'requirement', description: 'PIM-E2E-05' },
      ],
    },
    async ({ supervisorPair, employeeJobApi, signIn }) => {
      const { supervisor, subordinate } = supervisorPair;
      const first = await signIn(supervisor.login);
      expect(await first.dashboardPage.sidebar.menuNames()).toContain('PIM');
      await first.dashboardPage.sidebar.navigateTo('PIM');
      await first.listPage.expectLoaded();
      await expect(first.listPage.results.rows).toHaveCount(1);
      await first.listPage.expectCount(1);
      await first.listPage.expectCellText(first.listPage.results.rows.first(), 'Id', subordinate.employeeId!);
      await first.listPage.expectCellText(first.listPage.results.rows.first(), 'Supervisor', supervisor.fullName);

      // Admin removes the relation (API, shared Admin session untouched).
      const removed = await employeeJobApi.deleteSupervisors(subordinate.empNumber, [supervisor.empNumber]);
      expect(removed.status).toBe(200);

      // The supervisor reloads PIM in the same session: the subordinate is gone.
      const reload = await first.access.visit(first.listPage.path);
      expect(reload.status).toBe(403);
      await first.access.expectDenied();
      await expect(first.page.getByText(subordinate.lastName)).toHaveCount(0);

      // A fresh sign-in no longer offers PIM at all.
      const second = await signIn(supervisor.login);
      expect(await second.dashboardPage.sidebar.menuNames()).not.toContain('PIM');
      const denied = await second.access.visit(second.listPage.path);
      expect(denied.status).toBe(403);
      await second.access.expectDenied();
    },
  );
});
