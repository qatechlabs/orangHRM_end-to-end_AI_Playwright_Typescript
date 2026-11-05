import { test, expect } from '@fixtures/index';
import { pimText } from '@data/pim';
import { DISPLAY_FIELD_GROUPS, SELECTION_CRITERIA, type DefineReportPage } from '@pages/pim/DefineReportPage';
import { PREDEFINED_REPORTS } from '@pages/pim/ReportsPage';

// Test cases: test-cases/json/pim.json (feature "Reports"). Source: PIM-FR-029, PIM-FR-030, PIM-VAL-037.
// Reports and job titles are created per test with unique names and deleted by the `pimConfig`
// teardown; the predefined reports are never edited or deleted.

/** Selection criteria as listed by the BRD (PIM-FR-030-AC1). */
const BRD_CRITERIA = [
  'Employee Name',
  'Pay Grade',
  'Education',
  'Employment Status',
  'Service Period',
  'Joined Date',
  'Job Title',
  'Language',
  'Skill',
  'Age Range',
  'Sub Unit',
  'Gender',
  'Location',
];

test.describe('Reports', () => {
  test(
    '[PIM-UI-086] Reports list shows predefined reports and filters by Report Name',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-029-AC1' },
        { type: 'requirement', description: 'PIM-FR-029-AC2' },
        { type: 'requirement', description: 'PIM-FR-029-AC3' },
      ],
    },
    async ({ pimReportsPage: page }) => {
      await page.load();
      await page.expectLayout();
      await page.expectListed(PREDEFINED_REPORTS);
      const sample = page.row('PIM Sample Report');
      for (const icon of ['bi-trash', 'bi-pencil-fill', 'bi-file-text-fill']) {
        await expect(sample.locator(`button:has(i.${icon})`)).toBeVisible();
      }
      const total = await page.list.count();
      expect(total).toBeGreaterThanOrEqual(PREDEFINED_REPORTS.length);

      await page.search('PIM Sample', 'PIM Sample Report');
      await page.expectOnly('PIM Sample Report');

      await page.reset();
      await expect(page.reportNameAutocomplete.input).toHaveValue('');
      await page.expectListed(PREDEFINED_REPORTS);
      expect(await page.list.count()).toBeGreaterThanOrEqual(PREDEFINED_REPORTS.length);
    },
  );

  test(
    '[PIM-UI-087] Custom report filtered by Job Title shows only chosen columns and matching employees, then is edited and deleted',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-030-AC1' },
        { type: 'requirement', description: 'PIM-FR-030-AC2' },
        { type: 'requirement', description: 'PIM-FR-030-AC4' },
        { type: 'requirement', description: 'PIM-FR-030-AC6' },
        { type: 'requirement', description: 'PIM-E2E-11' },
      ],
    },
    async ({ pimReportsPage, defineReportPage, reportOutputPage, pimConfig, employees }) => {
      const jobTitle = await pimConfig.jobTitle();
      const matching = await employees.createMany(2, { job: { jobTitleId: jobTitle.id } });
      await employees.create(); // same run, no job title: must not be listed
      const name = pimConfig.name('AutoRpt');
      pimConfig.trackReportName(name);
      const definition = {
        name,
        criteria: { 'Job Title': jobTitle.title },
        displayFields: { Personal: ['Employee Id', 'Employee Last Name'], Job: ['Job Title'] },
        includeHeader: ['Personal', 'Job'],
      };

      await pimReportsPage.load();
      await defineReportPage.waitForNameList(() => pimReportsPage.clickAdd());
      await defineReportPage.expectTitle('Add Report');
      const criteria = await defineReportPage.optionsOf(defineReportPage.selectionCriteria);
      expect(criteria).toEqual(expect.arrayContaining(BRD_CRITERIA.filter((c) => c !== 'Age Range')));
      expect(criteria).toEqual(SELECTION_CRITERIA);
      expect([...(await defineReportPage.optionsOf(defineReportPage.displayFieldGroup))].sort()).toEqual(
        [...DISPLAY_FIELD_GROUPS].sort(),
      );

      await defineReportPage.define(definition);
      const { toast, id } = await defineReportPage.save();
      pimConfig.trackReport(id);
      expect(toast).toEqual({ title: 'Success', message: pimText.saved });

      await reportOutputPage.waitForGrid();
      await reportOutputPage.expectReport({
        name,
        groups: ['Personal', 'Job'],
        columns: ['Employee Id', 'Employee Last Name', 'Job Title'],
        rows: matching.map((e) => [e.employeeId ?? '', e.lastName, jobTitle.title]),
      });

      await pimReportsPage.load();
      await pimReportsPage.edit(name);
      await defineReportPage.expectTitle('Edit Report');
      await defineReportPage.expectDefinition(definition);

      await pimReportsPage.load();
      expect(await pimReportsPage.delete(name)).toEqual({ title: 'Success', message: pimText.deleted });
      await pimReportsPage.expectNotListed(name);
    },
  );

  test(
    '[PIM-UI-087] Custom report filtered by Job Title shows only chosen columns and matching employees, then is edited and deleted (BRD criterion "Age Range")',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-030-AC1' },
        {
          type: 'issue',
          description:
            'PIM-FR-030-AC1 lists the criterion "Age Range"; the Selection Criteria drop-down offers "Age Group" instead',
        },
      ],
    },
    async ({ defineReportPage }) => {
      test.fail();
      await defineReportPage.openNew();
      expect(await defineReportPage.optionsOf(defineReportPage.selectionCriteria)).toEqual(
        expect.arrayContaining(BRD_CRITERIA),
      );
    },
  );

  const invalid: {
    label: string;
    /** Fills the form; returns the report name used. */
    prepare: (page: DefineReportPage, unique: string) => Promise<string>;
    check: (page: DefineReportPage) => Promise<void>;
  }[] = [
    {
      label: 'blank name',
      prepare: async (page) => {
        await page.addDisplayField('Personal', 'Employee Id');
        return '';
      },
      check: (page) => page.expectNameError(pimText.required),
    },
    {
      label: 'existing name',
      prepare: async (page) => {
        await page.fillName('PIM Sample Report');
        await page.expectNameError('Already exists');
        await page.addDisplayField('Personal', 'Employee Id');
        return 'PIM Sample Report';
      },
      check: (page) => page.expectNameError('Already exists'),
    },
    {
      label: 'no display field',
      prepare: async (page, unique) => {
        await page.fillName(unique);
        return unique;
      },
      check: async (page) => {
        await page.toast.expectInfo('At least one display field should be added');
        await expect(page.toast.title.first()).toHaveText('Warning');
        await page.expectNoNameError();
      },
    },
  ];
  for (const v of invalid) {
    test(
      `[PIM-UI-088] Report requires a unique name and at least one display field (${v.label})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-030-AC3' },
          { type: 'requirement', description: 'PIM-FR-030-AC5' },
          { type: 'requirement', description: 'PIM-VAL-037' },
        ],
      },
      async ({ defineReportPage: page, pimConfigApi, pimConfig }) => {
        const unique = pimConfig.name('AutoRpt');
        const before = await pimConfigApi.reportsOrFail();
        await page.openNew();

        const name = await v.prepare(page, unique);
        await page.clickSave();
        await v.check(page);
        await page.expectStillOnForm();

        const after = await pimConfigApi.reportsOrFail();
        // Anything this attempt created is registered for teardown (never a predefined report).
        const known = new Set(before.map((r) => r.id));
        const created = after.filter((r) => !known.has(r.id) && (r.name === name || r.name === unique));
        created.forEach((r) => pimConfig.trackReport(r.id));
        expect(created).toEqual([]);
      },
    );
  }
});
