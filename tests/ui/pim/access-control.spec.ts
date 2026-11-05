import { test, expect } from '@fixtures/index';
import { pickByName, seedJob } from '@data/pimJob';
import { jobPaths } from '@pages/pim/jobPaths';
import { uniqueSuffix } from '@utils/dataFactory';

// Test cases: test-cases/json/pim.json (feature "Access Control"). Source: PIM-NFR-05, PIM-FR-015-AC4, PIM-FR-019-AC5.
// ESS / supervisor users are created via API and sign in through a fresh guest context (signIn fixture).
// OrangeHRM 5.9 has no /pim/viewOptionalFields (HTTP 404); the Optional Fields page is /pim/configurePim.

test.describe('Access Control', () => {
  test(
    '[PIM-UI-089] ESS user has no PIM menu and is denied direct PIM URLs',
    {
      tag: ['@P1', '@negative', '@security'],
      annotation: { type: 'requirement', description: 'PIM-NFR-05' },
    },
    async ({ essEmployee, createdEmployee, signIn }) => {
      const ess = await signIn(essEmployee.login);
      const menu = await ess.dashboardPage.sidebar.menuNames();
      expect(menu).toContain('My Info');
      expect(menu.filter((m) => ['PIM', 'Admin', 'Maintenance', 'Recruitment'].includes(m))).toEqual([]);

      // PIM module pages: HTTP 403 rendered as "Credential Required" with no data.
      for (const path of [jobPaths.employeeList, jobPaths.addEmployee, jobPaths.configurePim, jobPaths.reports]) {
        const result = await ess.access.visit(path);
        expect(result.status, path).toBe(403);
        await ess.access.expectDenied();
      }
      // The route named in the BRD does not exist in 5.9: nothing is served.
      expect((await ess.access.visit(jobPaths.legacyOptionalFields)).status).toBe(404);

      // The PIM entry point only leads to the user's own profile.
      await ess.access.visit(jobPaths.pimModule);
      await ess.profilePage.waitForPersonalDetails();
      await ess.profilePage.expectOpenFor(essEmployee.empNumber);

      // Another employee's profile tabs show no data.
      for (const path of [
        jobPaths.personalDetails(createdEmployee.empNumber),
        jobPaths.jobDetails(createdEmployee.empNumber),
        jobPaths.reportTo(createdEmployee.empNumber),
      ]) {
        await ess.access.visit(path);
        await ess.access.expectNoEmployeeData();
        await expect(ess.page.getByText(createdEmployee.lastName), path).toHaveCount(0);
      }
    },
  );

  test(
    '[PIM-UI-090] Supervisor sees subordinate Job and Report-to read-only and cannot edit Salary',
    {
      tag: ['@P2', '@negative', '@security'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-015-AC4' },
        { type: 'requirement', description: 'PIM-FR-019-AC5' },
      ],
    },
    async ({ supervisorPair, employeesApi, employeeJobApi, masterDataApi, signIn }) => {
      const { supervisor, subordinate } = supervisorPair;
      const title = pickByName(await masterDataApi.jobTitles(), (t) => t.title, seedJob.jobTitle);
      const status = pickByName(await masterDataApi.employmentStatuses(), (s) => s.name, seedJob.employmentStatus);
      expect(
        (await employeesApi.updateJobDetails(subordinate.empNumber, { jobTitleId: title.id, empStatusId: status.id }))
          .status,
      ).toBe(200);
      await employeeJobApi.addSalaryOrFail(subordinate.empNumber, {
        salaryComponent: `Base${uniqueSuffix()}`,
        salaryAmount: '3000',
        currencyId: 'USD',
        addDirectDeposit: false,
      });

      const sup = await signIn(supervisor.login);

      // Job: values visible, nothing editable, no Save / Terminate Employment.
      await sup.jobPage.openJobFor(subordinate.empNumber);
      await sup.jobPage.expectJob({ jobTitle: title.title, employmentStatus: status.name });
      await sup.jobPage.expectReadOnly();
      await expect(sup.jobPage.terminateButton).toHaveCount(0);
      // No Salary tab for a supervisor.
      await expect(sup.jobPage.tab('Job')).toBeVisible();
      await expect(sup.jobPage.tab('Salary')).toHaveCount(0);

      // Salary: no + Add / edit actions (the page itself is denied).
      const salary = await sup.access.visit(jobPaths.salaryList(subordinate.empNumber));
      expect(salary.status).toBe(403);
      await sup.access.expectDenied();
      await expect(sup.salaryPage.addButton).toHaveCount(0);

      // Report-to: read-only.
      await sup.reportToPage.openReportToFor(subordinate.empNumber);
      await sup.reportToPage.supervisors.expectRow(supervisor.fullName, 'Direct');
      await sup.reportToPage.expectReadOnly();

      // Personal Details: editable with Save.
      await sup.profilePage.openFor(subordinate.empNumber);
      await expect(sup.profilePage.firstName).toBeEditable();
      await expect(sup.profilePage.button('Save').first()).toBeVisible();
    },
  );
});
