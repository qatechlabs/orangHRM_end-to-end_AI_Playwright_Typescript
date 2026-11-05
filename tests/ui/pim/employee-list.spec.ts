import { test, expect } from '@fixtures/index';
import { pimData, selectable } from '@data/pim';
import type { SeededEmployee } from '@data/EmployeeSeeder';
import type { EmployeeSearch } from '@pages/pim/EmployeeListPage';
import { pimPaths } from '@pages/pim/pimPaths';

// Test cases: test-cases/json/pim.json (feature "Employee List"). Source: PIM-FR-001..003.
// Every test searches for its own API-created employees; totals of the shared demo are only
// compared with the response of the same request.

test.describe('Employee List', () => {
  test(
    '[PIM-UI-001] Employee List opens with search panel, expected columns, record count and current employees only',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-001-AC1' },
        { type: 'requirement', description: 'PIM-FR-001-AC2' },
        { type: 'requirement', description: 'PIM-FR-001-AC3' },
      ],
    },
    async ({ dashboardPage, employeeListPage }) => {
      await dashboardPage.open();
      const list = await employeeListPage.openFromMenu();

      await employeeListPage.expectLoaded();
      await employeeListPage.expectFilterLabels();
      await employeeListPage.expectColumns();
      expect(list.total).toBeGreaterThan(0);
      await employeeListPage.expectCount(list.total);
      await expect(employeeListPage.include.select).toHaveText('Current Employees Only');
      expect(list.query.get('includeEmployees')).toBe('onlyCurrent');
    },
  );

  test(
    '[PIM-UI-002] Row action icons and row click open the expected employee',
    {
      tag: ['@P2', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-001-AC4' },
    },
    async ({ page, employeeListPage, createdEmployee }) => {
      const profileUrl = new RegExp(`${pimPaths.personalDetails(createdEmployee.empNumber)}$`);
      await employeeListPage.load();
      await employeeListPage.searchById(createdEmployee.employeeId!);
      await employeeListPage.expectOnly(createdEmployee.employeeId!);
      const row = employeeListPage.results.rows.first();
      await expect(employeeListPage.editButton(row)).toBeVisible();
      await expect(employeeListPage.deleteButton(row)).toBeVisible();

      await employeeListPage.editButton(row).click();
      await expect(page).toHaveURL(profileUrl);

      // Back does not restore the previous search, so search again.
      await employeeListPage.goBack();
      await employeeListPage.expectLoaded();
      await employeeListPage.searchById(createdEmployee.employeeId!);
      await employeeListPage.expectOnly(createdEmployee.employeeId!);
      await employeeListPage.clickCell(employeeListPage.results.rows.first(), 'Last Name');
      await expect(page).toHaveURL(profileUrl);
    },
  );

  const searchVariants: { by: string; criteria: (e: SeededEmployee) => EmployeeSearch }[] = [
    { by: 'Employee Id', criteria: (e) => ({ employeeId: e.employeeId! }) },
    {
      by: 'Employee Name (autocomplete pick)',
      criteria: (e) => ({ name: e.lastName, pickName: e.fullName }),
    },
    // Drop the last character: a partial, still unique, piece of the last name.
    { by: 'Employee Name partial free text', criteria: (e) => ({ name: e.lastName.slice(0, -1) }) },
  ];
  for (const v of searchVariants) {
    test(
      `[PIM-UI-003] Search by Employee Id or by name returns only the matching employee (${v.by})`,
      {
        tag: ['@P1', '@smoke', '@positive'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-002-AC1' },
          { type: 'requirement', description: 'PIM-FR-002-AC3' },
          { type: 'requirement', description: 'PIM-E2E-01' },
        ],
      },
      async ({ employeeListPage, createdEmployee }) => {
        await employeeListPage.load();
        await employeeListPage.search(v.criteria(createdEmployee));
        await employeeListPage.expectOnly(createdEmployee.employeeId!);
        await employeeListPage.expectCellText(
          employeeListPage.results.rows.first(),
          'Last Name',
          createdEmployee.lastName,
        );
      },
    );
  }

  test(
    '[PIM-UI-004] Combined drop-down filters apply AND logic across Employment Status, Job Title and Sub Unit',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-002-AC2' },
        { type: 'requirement', description: 'PIM-FR-002-AC3' },
      ],
    },
    async ({ employeeListPage, employees, masterDataApi }) => {
      const [jobTitles, statuses, subunits] = await Promise.all([
        masterDataApi.jobTitles(),
        masterDataApi.employmentStatuses(),
        masterDataApi.subunits(),
      ]);
      const [title] = selectable(jobTitles, (t) => t.title);
      const [status, otherStatus] = selectable(statuses, (s) => s.name);
      const unit = selectable(subunits, (u) => u.name).find((u) => u.level > 0)!;
      const employee = await employees.create({
        job: { jobTitleId: title.id, empStatusId: status.id, subunitId: unit.id },
      });

      await employeeListPage.load();
      // Options come from Admin master data.
      const trimmed = (names: string[]) => names.map((n) => n.trim()).sort();
      const statusOptions = await employeeListPage.employmentStatus.options();
      expect(statusOptions[0]).toBe('-- Select --');
      expect(trimmed(statusOptions.slice(1))).toEqual(trimmed(statuses.map((s) => s.name)));
      const titleOptions = await employeeListPage.jobTitle.options();
      expect(trimmed(titleOptions.slice(1))).toEqual(trimmed(jobTitles.map((t) => t.title)));
      const unitOptions = await employeeListPage.subUnit.options();
      expect(trimmed(unitOptions.slice(1))).toEqual(trimmed(subunits.map((u) => u.name)));

      const match = await employeeListPage.search({
        employeeId: employee.employeeId!,
        employmentStatus: status.name,
        jobTitle: title.title,
        subUnit: unit.name,
      });
      expect(
        Object.fromEntries(['empStatusId', 'jobTitleId', 'subunitId'].map((k) => [k, match.query.get(k)])),
      ).toEqual({
        empStatusId: String(status.id),
        jobTitleId: String(title.id),
        subunitId: String(unit.id),
      });
      await employeeListPage.expectOnly(employee.employeeId!);
      const row = employeeListPage.results.rows.first();
      await employeeListPage.expectCellText(row, 'Job Title', title.title);
      await employeeListPage.expectCellText(row, 'Employment Status', status.name);
      await employeeListPage.expectCellText(row, 'Sub Unit', unit.name);

      await employeeListPage.search({ employmentStatus: otherStatus.name });
      await employeeListPage.expectNoRecords();
    },
  );

  test(
    '[PIM-UI-005] Searching by a parent Sub Unit also returns employees of its child sub units',
    {
      tag: ['@P3', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-002-AC4' },
    },
    async ({ employeeListPage, employees, masterDataApi }) => {
      const units = selectable(await masterDataApi.subunits(), (u) => u.name);
      // A non-root unit with a direct child, both selectable by name.
      const pairs = units.flatMap((parent) =>
        units
          .filter(
            (c) =>
              parent.level > 0 &&
              c.level === parent.level + 1 &&
              c.left > parent.left &&
              c.right < parent.right,
          )
          .map((child) => ({ parent, child })),
      );
      expect(pairs.length, 'Organization structure needs a parent sub unit with a child').toBeGreaterThan(0);
      const { parent, child } = pairs[0];
      const employee = await employees.create({ job: { subunitId: child.id } });

      await employeeListPage.load();
      const result = await employeeListPage.search({
        employeeId: employee.employeeId!,
        subUnit: parent.name,
      });
      expect(result.query.get('subunitId')).toBe(String(parent.id));
      await employeeListPage.expectOnly(employee.employeeId!);
      await employeeListPage.expectCellText(employeeListPage.results.rows.first(), 'Sub Unit', child.name);
    },
  );

  test(
    '[PIM-UI-006] Search with no matching record shows No Records Found in count and info toast',
    {
      tag: ['@P2', '@negative'],
      annotation: { type: 'requirement', description: 'PIM-FR-002-AC5' },
    },
    async ({ employeeListPage }) => {
      await employeeListPage.load();
      await employeeListPage.searchById(pimData.token('ZZ').slice(0, 10));
      await employeeListPage.expectNoRecords();
    },
  );

  test(
    '[PIM-UI-007] Reset clears every search criterion and reloads the default list',
    {
      tag: ['@P2', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-002-AC6' },
    },
    async ({ employeeListPage, employees, masterDataApi }) => {
      const [status] = selectable(await masterDataApi.employmentStatuses(), (s) => s.name);
      const past = await employees.create({ job: { empStatusId: status.id }, terminated: true });

      await employeeListPage.load();
      await employeeListPage.search({
        name: past.lastName,
        employeeId: past.employeeId!,
        employmentStatus: status.name,
        include: 'Past Employees Only',
      });
      await employeeListPage.expectOnly(past.employeeId!);

      const reset = await employeeListPage.reset();
      await employeeListPage.expectFiltersCleared();
      expect(reset.query.get('includeEmployees')).toBe('onlyCurrent');
      expect(
        ['nameOrId', 'employeeId', 'empStatusId', 'empNumber'].filter((k) => reset.query.has(k)),
      ).toEqual([]);
      expect(reset.total).toBeGreaterThan(1);
      await employeeListPage.expectCount(reset.total);
    },
  );

  test(
    '[PIM-UI-008] Include filter separates current and past employees after termination and re-activation',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-002-AC7' },
        { type: 'requirement', description: 'PIM-FR-017-AC3' },
        { type: 'requirement', description: 'PIM-FR-018-AC2' },
        { type: 'requirement', description: 'PIM-E2E-06' },
      ],
    },
    async ({ employeeListPage, employeeJobPage, employees, createdEmployee }) => {
      const id = createdEmployee.employeeId!;
      await employees.terminate(createdEmployee.empNumber);

      await employeeListPage.load();
      await employeeListPage.searchById(id, 'Current Employees Only');
      await employeeListPage.expectNoRecords();
      await employeeListPage.searchById(id, 'Past Employees Only');
      await employeeListPage.expectOnly(id);
      await employeeListPage.searchById(id, 'Current and Past Employees');
      await employeeListPage.expectOnly(id);

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      // reactivate() returns the toast and waits for the page's self-reload, so the navigation
      // below cannot be aborted by it (net::ERR_ABORTED).
      expect(await employeeJobPage.reactivate()).toEqual({ title: 'Success', message: 'Successfully Updated' });

      await employeeListPage.load();
      await employeeListPage.searchById(id, 'Current Employees Only');
      await employeeListPage.expectOnly(id);
      await employeeListPage.expectCellText(
        employeeListPage.results.rows.first(),
        'Last Name',
        createdEmployee.lastName,
      );
    },
  );

  const sortColumns = [
    // Created in mixed order and case; expected order is case-insensitive.
    { column: 'Last Name', value: (e: SeededEmployee) => e.lastName, ascendingSuffixes: ['a', 'b', 'C'] },
    { column: 'Id', value: (e: SeededEmployee) => e.employeeId!, ascendingSuffixes: ['1', '2', '3'] },
  ];
  for (const v of sortColumns) {
    test(
      `[PIM-UI-009] Sorting a column ascending and descending orders the rows accordingly (${v.column})`,
      {
        tag: ['@P2', '@positive'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-003-AC1' },
          { type: 'requirement', description: 'PIM-FR-003-AC2' },
        ],
      },
      async ({ employeeListPage, employees }) => {
        const token = pimData.token('Srt');
        const idBase = pimData.employeeId().slice(0, 9);
        const created = await employees.createMany(3, (i) => ({
          lastName: `${token}${['b', 'C', 'a'][i]}`,
          employeeId: `${idBase}${['2', '3', '1'][i]}`,
        }));
        const ascending = v.ascendingSuffixes.map((s) =>
          v.value(created.find((e) => v.value(e).endsWith(s))!),
        );

        await employeeListPage.load();
        await employeeListPage.search({ name: token });
        await employeeListPage.expectRows(3);

        const items = await employeeListPage.results.openSortMenu(v.column);
        await expect(items).toHaveText(['Ascending', 'Descending']);

        const asc = await employeeListPage.sortBy(v.column, 'Ascending');
        expect(asc.query.get('sortOrder')).toBe('ASC');
        expect(asc.query.get('nameOrId')).toBe(token);
        expect(await employeeListPage.columnValues(v.column)).toEqual(ascending);

        const desc = await employeeListPage.sortBy(v.column, 'Descending');
        expect(desc.query.get('sortOrder')).toBe('DESC');
        expect(await employeeListPage.columnValues(v.column)).toEqual([...ascending].reverse());
      },
    );
  }

  test(
    '[PIM-UI-010] Pagination shows at most 50 rows per page and keeps search criteria between pages',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-003-AC3' },
        { type: 'requirement', description: 'PIM-FR-003-AC4' },
      ],
    },
    async ({ employeeListPage, employees }) => {
      test.slow();
      // Own data set: 51 employees sharing a token, one of them a past employee, so the expected
      // counts are exact and only "Current and Past Employees" needs a second page.
      const token = pimData.token('Pg');
      const created = await employees.createMany(51, { lastName: token });
      await employees.terminate(created[0].empNumber);

      await employeeListPage.load();
      const page1 = await employeeListPage.search({ name: token, include: 'Current and Past Employees' });
      expect(page1.total).toBe(51);
      await employeeListPage.expectRows(50);
      await employeeListPage.expectCount(51);
      await expect(employeeListPage.pagination.page(2)).toBeVisible();
      await employeeListPage.pagination.expectSelected(1);
      const page1Ids = await employeeListPage.columnValues('Id');

      const page2 = await employeeListPage.nextPage();
      expect(page2.query.get('offset')).toBe('50');
      expect(page2.query.get('includeEmployees')).toBe('currentAndPast');
      expect(page2.query.get('nameOrId')).toBe(token);
      await employeeListPage.pagination.expectSelected(2);
      await employeeListPage.expectRows(1);
      await employeeListPage.expectCount(51);
      await expect(employeeListPage.include.select).toHaveText('Current and Past Employees');
      const page2Ids = await employeeListPage.columnValues('Id');
      expect(page2Ids.filter((id) => page1Ids.includes(id))).toEqual([]);
      expect(new Set([...page1Ids, ...page2Ids])).toEqual(new Set(created.map((e) => e.employeeId)));
    },
  );
});
