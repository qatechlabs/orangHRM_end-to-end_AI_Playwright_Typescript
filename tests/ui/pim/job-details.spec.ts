import { test, expect } from '@fixtures/index';
import { jobFiles, normalized, pickByName, seedJob, uiDate, writePdfOfSize } from '@data/pimJob';
import { pimText } from '@data/pim';
import { jobText } from '@pages/pim/EmployeeJobPage';
import { recordApiCalls } from '@pages/pim/jobRequests';
import * as path from 'node:path';

// Test cases: test-cases/json/pim.json (feature "Job Details"). Source: PIM-FR-015, PIM-FR-016, PIM-VAL-020, PIM-BR-11.
// Every test works on its own API-created employee; job titles created as test data are deleted in teardown.

test.describe('Job Details', () => {
  test(
    '[PIM-UI-052] Job details saved from master data appear in the Employee List row',
    {
      tag: ['@P1', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-015-AC1' },
        { type: 'requirement', description: 'PIM-FR-015-AC3' },
        { type: 'requirement', description: 'PIM-E2E-04' },
      ],
    },
    async ({ employeeJobPage, employeeListPage, employeeJobApi, masterDataApi, createdEmployee }) => {
      const masterData = () =>
        Promise.all([
          masterDataApi.jobTitles(),
          masterDataApi.employmentStatuses(),
          masterDataApi.subunits(),
          employeeJobApi.jobCategories(),
          employeeJobApi.locations(),
        ]);
      let [titles, statuses, subunits, categories, locations] = await masterData();
      const namesOf = ([t, st, su, c, l]: Awaited<ReturnType<typeof masterData>>) => ({
        jobTitle: normalized(t.map((x) => x.title)),
        jobCategory: normalized(c.map((x) => x.name)),
        // The organisation root (level 0) is not a sub unit.
        subUnit: normalized(su.filter((u) => u.level > 0).map((u) => u.name)),
        location: normalized(l.map((x) => x.name)),
        employmentStatus: normalized(st.map((x) => x.name)),
      });

      // Each drop-down offers exactly the Admin master data. Other users (and our own PIM-UI-053
      // fixture on another worker) edit the shared demo's master data concurrently, so the data is
      // snapshotted BEFORE the page opens and AFTER the options are read; a drop-down is accepted
      // when it equals either snapshot (exact equality with live master data). A mismatch with both
      // is retried on a fresh page + fresh snapshots.
      await expect(async () => {
        const before = namesOf(await masterData());
        await employeeJobPage.openJobFor(createdEmployee.empNumber);
        const read = {
          jobTitle: await employeeJobPage.jobTitle.options(),
          jobCategory: await employeeJobPage.jobCategory.options(),
          subUnit: await employeeJobPage.subUnit.options(),
          location: await employeeJobPage.location.options(),
          employmentStatus: await employeeJobPage.employmentStatus.options(),
        };
        [titles, statuses, subunits, categories, locations] = await masterData();
        const after = namesOf([titles, statuses, subunits, categories, locations]);
        for (const key of Object.keys(read) as (keyof typeof read)[]) {
          const options = read[key];
          expect(options[0], key).toBe('-- Select --');
          const actual = normalized(options.slice(1));
          if (JSON.stringify(actual) !== JSON.stringify(before[key])) {
            expect(actual, `${key} drop-down vs master data`).toEqual(after[key]);
          }
        }
      }).toPass({ timeout: 40_000 });

      const job = {
        jobTitle: pickByName(titles, (t) => t.title, seedJob.jobTitle).title,
        jobCategory: pickByName(categories, (c) => c.name, seedJob.jobCategory).name,
        subUnit: pickByName(
          subunits.filter((u) => u.level > 0),
          (u) => u.name,
          seedJob.subUnit,
        ).name,
        location: pickByName(locations, (l) => l.name, seedJob.location).name,
        employmentStatus: pickByName(statuses, (s) => s.name, seedJob.employmentStatus).name,
        joinedDate: uiDate(new Date()),
      };
      await employeeJobPage.fillJob(job);
      expect(await employeeJobPage.save()).toEqual({ title: 'Success', message: pimText.updated });
      await employeeJobPage.expectJob(job);

      const saved = await employeeJobApi.jobDetailsOrFail(createdEmployee.empNumber);
      expect({
        jobTitle: saved.jobTitle.title,
        jobCategory: saved.jobCategory.name,
        subUnit: saved.subunit.name,
        location: saved.location.name,
        employmentStatus: saved.empStatus.name,
      }).toEqual({
        jobTitle: job.jobTitle,
        jobCategory: job.jobCategory,
        subUnit: job.subUnit,
        location: job.location,
        employmentStatus: job.employmentStatus,
      });

      await employeeListPage.load();
      await employeeListPage.searchById(createdEmployee.employeeId!);
      await employeeListPage.expectOnly(createdEmployee.employeeId!);
      const row = employeeListPage.results.rows.first();
      await employeeListPage.expectCellText(row, 'Job Title', job.jobTitle);
      await employeeListPage.expectCellText(row, 'Employment Status', job.employmentStatus);
      await employeeListPage.expectCellText(row, 'Sub Unit', job.subUnit);
    },
  );

  test(
    '[PIM-UI-053] Job Title with a specification shows the specification file as a download link',
    {
      tag: ['@P3', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-015-AC2' },
    },
    async ({ employeeJobPage, jobTitles, createdEmployee }) => {
      const title = await jobTitles.createWithSpecification(jobFiles.specification);
      const fileName = path.basename(jobFiles.specification);
      expect(title.jobSpecification.filename).toBe(fileName);

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.expectNoJobSpecification();

      await employeeJobPage.chooseJobTitle(title.title);
      await employeeJobPage.expectJobSpecification(fileName);

      const download = await employeeJobPage.downloadJobSpecification();
      expect(download.suggestedFilename()).toBe(fileName);
    },
  );

  test(
    '[PIM-UI-054] Employment contract end date before start date is rejected',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-016-AC1' },
        { type: 'requirement', description: 'PIM-VAL-020' },
      ],
    },
    async ({ page, employeeJobPage, employeeJobApi, createdEmployee }) => {
      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      const puts = recordApiCalls(page, 'PUT', `/pim/employees/${createdEmployee.empNumber}/`);

      await employeeJobPage.fillContract({
        startDate: uiDate(new Date(2025, 9, 10)),
        endDate: uiDate(new Date(2025, 0, 1)),
      });
      await employeeJobPage.clickSave();

      await employeeJobPage.contractEnd.expectError(jobText.contractEndBeforeStart);
      await employeeJobPage.contractStart.expectNoError();
      await expect(employeeJobPage.toast.root).toHaveCount(0);
      expect(puts).toEqual([]);
      expect((await employeeJobApi.contractOrFail(createdEmployee.empNumber)).startDate).toBeNull();
    },
  );

  // The small-file variant is split into upload / replace / delete so that each test stays well
  // inside the 60 s limit on a slow demo: replace and delete get their saved contract through the API
  // (the upload test covers the UI upload path), and each test needs only one UI save.
  const contract = {
    ui: { startDate: uiDate(new Date(2026, 0, 15)), endDate: uiDate(new Date(2027, 0, 14)) },
    api: { startDate: '2026-01-15', endDate: '2027-01-14' },
  };
  const smallFileAnnotation = [
    { type: 'requirement', description: 'PIM-FR-016-AC2' },
    { type: 'requirement', description: 'PIM-BR-11' },
  ];

  test(
    '[PIM-UI-055] Contract file within 1 MB is saved and can be replaced or deleted; larger files are rejected (small file: upload)',
    { tag: ['@P3', '@positive'], annotation: smallFileAnnotation },
    async ({ employeeJobPage, employeeJobApi, createdEmployee }) => {
      const first = path.basename(jobFiles.contract);

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.fillContract({ ...contract.ui, file: jobFiles.contract });
      expect(await employeeJobPage.save()).toEqual({ title: 'Success', message: pimText.updated });

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await expect(employeeJobPage.contractCheckbox).toBeChecked();
      await expect(employeeJobPage.contractStart.input).toHaveValue(contract.ui.startDate);
      await expect(employeeJobPage.contractEnd.input).toHaveValue(contract.ui.endDate);
      await employeeJobPage.expectContractFile(first);
      await expect(employeeJobPage.contractFileOption('Keep Current').getByRole('radio')).toBeChecked();
      expect((await employeeJobApi.contractOrFail(createdEmployee.empNumber)).contractAttachment.filename).toBe(
        first,
      );
    },
  );

  test(
    '[PIM-UI-055] Contract file within 1 MB is saved and can be replaced or deleted; larger files are rejected (small file: replace)',
    { tag: ['@P3', '@positive'], annotation: smallFileAnnotation },
    async ({ employeeJobPage, employeeJobApi, createdEmployee }) => {
      const first = path.basename(jobFiles.contract);
      const second = path.basename(jobFiles.contractReplacement);
      await employeeJobApi.saveContractWithFileOrFail(createdEmployee.empNumber, {
        ...contract.api,
        file: jobFiles.contract,
      });

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.expectContractFile(first);
      await employeeJobPage.pickContractFileOption('Replace Current');
      await employeeJobPage.chooseContractFile(jobFiles.contractReplacement);
      expect(await employeeJobPage.save()).toEqual({ title: 'Success', message: pimText.updated });

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.expectContractFile(second);
      expect((await employeeJobApi.contractOrFail(createdEmployee.empNumber)).contractAttachment.filename).toBe(
        second,
      );
    },
  );

  test(
    '[PIM-UI-055] Contract file within 1 MB is saved and can be replaced or deleted; larger files are rejected (small file: delete)',
    { tag: ['@P3', '@positive'], annotation: smallFileAnnotation },
    async ({ employeeJobPage, employeeJobApi, createdEmployee }) => {
      await employeeJobApi.saveContractWithFileOrFail(createdEmployee.empNumber, {
        ...contract.api,
        file: jobFiles.contract,
      });

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.expectContractFile(path.basename(jobFiles.contract));
      await employeeJobPage.pickContractFileOption('Delete Current');
      expect(await employeeJobPage.save()).toEqual({ title: 'Success', message: pimText.updated });

      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      await employeeJobPage.expectNoContractFile();
      const saved = await employeeJobApi.contractOrFail(createdEmployee.empNumber);
      expect(saved.contractAttachment.filename).toBeNull();
      await expect(employeeJobPage.contractStart.input).toHaveValue(contract.ui.startDate);
    },
  );

  test(
    '[PIM-UI-055] Contract file within 1 MB is saved and can be replaced or deleted; larger files are rejected (file over 1 MB)',
    {
      tag: ['@P3', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-016-AC2' },
        { type: 'requirement', description: 'PIM-BR-11' },
      ],
    },
    async ({ page, employeeJobPage, employeeJobApi, createdEmployee }, testInfo) => {
      const tooLarge = writePdfOfSize(testInfo.outputPath('contract-large.pdf'), 1_300_000);
      await employeeJobPage.openJobFor(createdEmployee.empNumber);
      const puts = recordApiCalls(page, 'PUT', `/pim/employees/${createdEmployee.empNumber}/`);

      await employeeJobPage.fillContract({
        startDate: uiDate(new Date(2026, 0, 15)),
        endDate: uiDate(new Date(2027, 0, 14)),
        file: tooLarge,
      });
      await employeeJobPage.contractDetails.expectError(jobText.attachmentSizeExceeded);
      await employeeJobPage.clickSave();
      await employeeJobPage.contractDetails.expectError(jobText.attachmentSizeExceeded);
      await expect(employeeJobPage.toast.root).toHaveCount(0);
      expect(puts).toEqual([]);
      expect(
        (await employeeJobApi.contractOrFail(createdEmployee.empNumber)).contractAttachment.filename,
      ).toBeNull();
    },
  );
});
