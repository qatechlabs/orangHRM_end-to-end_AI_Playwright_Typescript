import { test, expect } from '@fixtures/index';
import type { ConfigListResource } from '@api/types/pim-config';
import { pimText } from '@data/pim';
import type { PimConfigListPage } from '@pages/pim/PimConfigListPage';
import type { PimConfigSeeder } from '@fixtures/pim-config.fixture';
import type { EmployeeSeeder } from '@data/EmployeeSeeder';

// Test cases: test-cases/json/pim.json (feature "Configuration Lists"). Source: PIM-FR-027, PIM-FR-028, PIM-VAL-036.
// Every entry is created by the test with a unique name and removed by the `pimConfig` teardown;
// seed entries (Direct, Indirect, Dismissed, Resigned, ...) are never touched.

const saved = { title: 'Success', message: pimText.saved };
const updated = { title: 'Success', message: pimText.updated };
const deleted = { title: 'Success', message: pimText.deleted };

test.describe('Configuration Lists', () => {
  test(
    '[PIM-UI-083] New reporting method is saved, offered on Report-to, then edited and deleted',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-027-AC1' },
        { type: 'requirement', description: 'PIM-FR-027-AC2' },
      ],
    },
    async ({
      reportingMethodsPage: page,
      employeeReportToPage,
      pimConfigApi,
      pimConfig,
      createdEmployee,
    }) => {
      const name = pimConfig.name('AutoRM');
      const edited = `${name} Edited`;
      pimConfig.trackItemName('reporting-methods', name);
      pimConfig.trackItemName('reporting-methods', edited);

      await page.load();
      expect(await page.add(name)).toEqual(saved);
      await page.expectListed(name);

      await employeeReportToPage.openReportToFor(createdEmployee.empNumber);
      await employeeReportToPage.supervisors.clickAdd();
      expect(await employeeReportToPage.supervisors.method.options()).toContain(name);

      await page.load();
      expect(await page.rename(name, edited)).toEqual(updated);
      await page.expectListed(edited);
      await page.expectNotListed(name);

      expect(await page.delete(edited)).toEqual(deleted);
      await page.expectNotListed(edited);
      const left = await pimConfigApi.listItemsOrFail('reporting-methods');
      expect(left.map((m) => m.name)).not.toContain(edited);
    },
  );

  test(
    '[PIM-UI-084] New termination reason is saved, offered in Terminate Employment, then edited and deleted',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-028-AC1' },
        { type: 'requirement', description: 'PIM-FR-028-AC2' },
      ],
    },
    async ({ terminationReasonsPage: page, employeeJobPage, pimConfigApi, pimConfig, createdEmployee }) => {
      const name = pimConfig.name('AutoTR');
      const edited = `${name} Edited`;
      pimConfig.trackItemName('termination-reasons', name);
      pimConfig.trackItemName('termination-reasons', edited);

      await page.load();
      expect(await page.add(name)).toEqual(saved);
      await page.expectListed(name);

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.openTerminateDialog();
      expect(await employeeJobPage.terminationReason.options()).toContain(name);
      await employeeJobPage.terminationCancel.click();
      await expect(employeeJobPage.terminationDialog).toBeHidden();

      await page.load();
      expect(await page.rename(name, edited)).toEqual(updated);
      await page.expectListed(edited);
      await page.expectNotListed(name);

      expect(await page.delete(edited)).toEqual(deleted);
      await page.expectNotListed(edited);
      const left = await pimConfigApi.listItemsOrFail('termination-reasons');
      expect(left.map((r) => r.name)).not.toContain(edited);
    },
  );

  const screens: {
    label: string;
    resource: ConfigListResource;
    page: 'reportingMethodsPage' | 'terminationReasonsPage';
    /** Creates an own entry and puts it in use; returns its name. */
    inUse: (pimConfig: PimConfigSeeder, employees: EmployeeSeeder) => Promise<string>;
  }[] = [
    {
      label: 'Reporting Methods',
      resource: 'reporting-methods',
      page: 'reportingMethodsPage',
      inUse: async (pimConfig, employees) => {
        const method = await pimConfig.reportingMethod();
        const [subordinate, supervisor] = await employees.createMany(2);
        await pimConfig.useReportingMethod(subordinate.empNumber, supervisor.empNumber, method.id);
        return method.name;
      },
    },
    {
      label: 'Termination Reasons',
      resource: 'termination-reasons',
      page: 'terminationReasonsPage',
      inUse: async (pimConfig, employees) => {
        const reason = await pimConfig.terminationReason();
        const employee = await employees.create();
        await pimConfig.useTerminationReason(employee.empNumber, reason.id);
        return reason.name;
      },
    },
  ];

  const invalidNames: {
    label: string;
    message: string;
    /** The name to type (may create an own "existing" entry first). */
    name: (pimConfig: PimConfigSeeder, resource: ConfigListResource) => Promise<string>;
  }[] = [
    { label: 'blank name', message: pimText.required, name: async () => '' },
    {
      label: 'existing name',
      message: 'Already exists',
      name: async (pimConfig, resource) =>
        (resource === 'reporting-methods'
          ? await pimConfig.reportingMethod()
          : await pimConfig.terminationReason()
        ).name,
    },
    {
      label: '101 characters',
      message: 'Should not exceed 100 characters',
      name: async (pimConfig) => pimConfig.name('AutoLong').padEnd(101, 'x'),
    },
  ];

  for (const screen of screens) {
    for (const v of invalidNames) {
      test(
        `[PIM-UI-085] Reporting Methods and Termination Reasons reject blank, duplicate and over-long names and block deleting in-use entries (${screen.label}, ${v.label})`,
        {
          tag: ['@P2', '@negative'],
          annotation: [
            { type: 'requirement', description: 'PIM-FR-027-AC1' },
            { type: 'requirement', description: 'PIM-FR-028-AC1' },
            { type: 'requirement', description: 'PIM-VAL-036' },
          ],
        },
        async ({ reportingMethodsPage, terminationReasonsPage, pimConfigApi, pimConfig }) => {
          const page: PimConfigListPage = { reportingMethodsPage, terminationReasonsPage }[screen.page];
          const name = await v.name(pimConfig, screen.resource);
          pimConfig.trackItemName(screen.resource, name);
          const before = await pimConfigApi.listItemsOrFail(screen.resource);

          await page.openAdd();
          await page.fillName(name);
          await page.clickSave();
          await page.expectNameError(v.message);
          await page.expectStillOnForm();
          await expect(page.toast.root).toHaveCount(0);

          const after = await pimConfigApi.listItemsOrFail(screen.resource);
          expect(after.filter((i) => i.name === name)).toEqual(before.filter((i) => i.name === name));
        },
      );
    }

    test(
      `[PIM-UI-085] Reporting Methods and Termination Reasons reject blank, duplicate and over-long names and block deleting in-use entries (${screen.label}, in-use entry)`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-027-AC3' },
          { type: 'requirement', description: 'PIM-FR-028-AC3' },
        ],
      },
      async ({ reportingMethodsPage, terminationReasonsPage, pimConfigApi, pimConfig, employees }) => {
        const page: PimConfigListPage = { reportingMethodsPage, terminationReasonsPage }[screen.page];
        const name = await screen.inUse(pimConfig, employees);

        await page.load();
        await page.expectListed(name);
        await page.clickDelete(name);
        await page.expectInUseRefused();
        await page.expectListed(name);
        const items = await pimConfigApi.listItemsOrFail(screen.resource);
        expect(items.map((i) => i.name)).toContain(name);
      },
    );
  }
});
