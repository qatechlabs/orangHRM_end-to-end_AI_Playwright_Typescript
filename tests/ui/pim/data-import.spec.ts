import * as fs from 'node:fs';
import * as path from 'node:path';
import { test, expect } from '@fixtures/index';
import { pimText } from '@data/pim';
import { PIM_CSV_HEADER, writeLargePimCsv, writeNonCsv, writePimCsv } from '@data/pimCsv';
import type { DataImportPage } from '@pages/pim/DataImportPage';
import { watchRequests } from '@pages/pim/profileHelpers';

// Test cases: test-cases/json/pim.json (feature "Data Import"). Source: PIM-FR-026, PIM-VAL-035.
// Import files are generated per test into the test's output folder (never committed).

test.describe('Data Import', () => {
  test(
    '[PIM-UI-081] CSV import creates valid rows, reports the imported count and skips invalid rows',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-026-AC1' },
        { type: 'requirement', description: 'PIM-FR-026-AC3' },
        { type: 'requirement', description: 'PIM-FR-026-AC4' },
        { type: 'requirement', description: 'PIM-E2E-10' },
      ],
    },
    async ({ dataImportPage, employeeListPage, employeesApi, pimConfig }, testInfo) => {
      await dataImportPage.load();
      await dataImportPage.expectNotes();

      const sample = await dataImportPage.downloadSample();
      expect(sample.suggestedFilename()).toBe('importData.csv');
      const sampleLines = fs
        .readFileSync(await sample.path(), 'utf8')
        .trim()
        .split(/\r?\n/);
      expect(sampleLines).toEqual([PIM_CSV_HEADER.join(',')]);

      const csv = writePimCsv(testInfo.outputPath('import'));
      // Registered before the upload: teardown deletes whatever the import created.
      pimConfig.trackImported(csv.token);

      await dataImportPage.importFile(csv.path);
      await dataImportPage.expectResult({ imported: 3, failed: 1, failedRows: [csv.failedRow] });
      await dataImportPage.closeResult();
      await dataImportPage.expectChosenFile('No file selected');

      await employeeListPage.load();
      const found = await employeeListPage.search({ name: csv.token, include: 'Current and Past Employees' });
      expect(found.total).toBe(3);
      expect((await employeeListPage.columnValues('Last Name')).sort()).toEqual(
        csv.valid.map((e) => e.lastName).sort(),
      );
      const invalid = await employeesApi.listOrFail({
        nameOrId: csv.invalidFirstName,
        includeEmployees: 'currentAndPast',
      });
      expect(invalid.total).toBe(0);
    },
  );

  const rejected: {
    label: string;
    message: string;
    /** Chooses the file (if any) and checks what shows before Upload. */
    prepare: (page: DataImportPage, dir: string) => Promise<void>;
  }[] = [
    {
      label: 'employees.xlsx',
      message: pimText.fileTypeNotAllowed,
      prepare: async (page, dir) => {
        const file = writeNonCsv(dir);
        await page.chooseFile(file);
        await page.expectChosenFile(path.basename(file));
      },
    },
    {
      label: 'CSV over 1 MB',
      message: pimText.attachmentSizeExceeded,
      prepare: async (page, dir) => {
        await page.chooseFile(writeLargePimCsv(dir));
        // The size check runs as soon as the file is chosen.
        await page.expectFileError(pimText.attachmentSizeExceeded);
      },
    },
    { label: 'no file', message: pimText.required, prepare: async () => {} },
  ];
  for (const v of rejected) {
    test(
      `[PIM-UI-082] Data Import rejects non-CSV files and CSV files over 1 MB (${v.label})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-026-AC2' },
          { type: 'requirement', description: 'PIM-VAL-035' },
        ],
      },
      async ({ dataImportPage }, testInfo) => {
        await dataImportPage.load();
        const imports = watchRequests(dataImportPage.page, 'POST', '/api/v2/pim/csv-import');

        await v.prepare(dataImportPage, testInfo.outputPath('import'));
        await dataImportPage.clickUpload();
        await dataImportPage.expectFileError(v.message);
        await dataImportPage.expectNoResultDialog();
        await expect(dataImportPage.toast.root).toHaveCount(0);
        expect(imports.count(), 'no import request may be sent').toBe(0);
        imports.stop();
      },
    );
  }
});
