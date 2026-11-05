import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { configPaths } from './configPaths';
import { scopedField } from './scopedField';

/** The import rules listed on the page, in order. */
export const IMPORT_NOTES = [
  'Column order should not be changed',
  'First Name and Last Name are compulsory',
  'All date fields should be in YYYY-MM-DD format',
  'If gender is specified, value should be either Male or Female',
  'Each import file should be configured for 100 records or less',
  'Multiple import files may be required',
];

export interface ImportSummary {
  imported: number;
  failed: number;
  failedRows: number[];
}

/** PIM > Configuration > Data Import (CSV upload, sent as base64 JSON to /pim/csv-import). */
export class DataImportPage extends BasePage {
  readonly path = configPaths.dataImport;

  readonly title: Locator;
  readonly notes: Locator;
  readonly sampleLink: Locator;
  readonly form: Locator;
  readonly selectFile: FormField;
  readonly fileInput: Locator;
  readonly fileName: Locator;
  readonly hint: Locator;
  readonly uploadButton: Locator;
  readonly resultDialog: Locator;
  readonly okButton: Locator;

  constructor(page: Page) {
    super(page);
    // The card title and the notes are plain paragraphs outside .oxd-layout-context.
    this.title = page.locator('p').filter({ hasText: /^Data Import$/ });
    this.notes = page
      .locator('ul')
      .filter({ has: page.getByText(IMPORT_NOTES[0], { exact: true }) })
      .locator('li p');
    this.sampleLink = page.getByRole('link', { name: 'Download' });
    this.form = page.locator('form');
    this.selectFile = scopedField(this.form, 'Select File');
    this.fileInput = this.form.locator('input[type="file"]');
    this.fileName = this.selectFile.root.locator('.oxd-file-input-div');
    this.hint = this.form.locator('.orangehrm-input-hint');
    this.uploadButton = this.form.getByRole('button', { name: 'Upload' });
    this.resultDialog = page.locator('.oxd-dialog-container-default');
    this.okButton = this.resultDialog.getByRole('button', { name: 'Ok' });
  }

  @step('Open Data Import')
  async load(): Promise<this> {
    await this.open();
    await expect(this.title).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    return this;
  }

  @step('Download the sample CSV')
  async downloadSample(): Promise<Download> {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.sampleLink.click()]);
    return download;
  }

  @step('Choose the file {0}')
  async chooseFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  @step('Click Upload')
  async clickUpload(): Promise<void> {
    await this.uploadButton.click();
  }

  /** Chooses the file, clicks Upload and waits for the result dialog. */
  @step('Import {0}')
  async importFile(filePath: string): Promise<void> {
    await this.chooseFile(filePath);
    await this.clickUpload();
    await expect(this.resultDialog).toBeVisible({ timeout: 30_000 });
  }

  @step('Close the import result')
  async closeResult(): Promise<void> {
    await this.okButton.click();
    await expect(this.resultDialog).toBeHidden();
  }

  // ---- assertions ----

  async expectNotes(): Promise<void> {
    await expect(this.page.getByText('Note:', { exact: true })).toBeVisible();
    await expect(this.notes.filter({ hasNotText: /Sample CSV/ })).toHaveText(IMPORT_NOTES);
    await expect(this.notes.last()).toHaveText(/^Sample CSV file\s*:\s*Download$/);
    await expect(this.sampleLink).toBeVisible();
    await expect(this.hint).toHaveText('Accepts up to 1MB');
  }

  /** "3 Records Successfully Imported", "1 Record Failed to Import", "Failed Rows", line numbers. */
  async expectResult(summary: ImportSummary): Promise<void> {
    const records = (n: number) => `${n} Record${n === 1 ? '' : 's'}`;
    await expect(this.resultDialog).toContainText('Import Details');
    await expect(this.resultDialog).toContainText(`${records(summary.imported)} Successfully Imported`);
    if (summary.failed) {
      await expect(this.resultDialog).toContainText(`${records(summary.failed)} Failed to Import`);
      await expect(this.resultDialog).toContainText(
        new RegExp(`Failed Rows\\s*${summary.failedRows.join('\\s*')}\\s*Ok`),
      );
    }
  }

  async expectFileError(message: string): Promise<void> {
    await this.selectFile.expectError(message);
  }

  async expectChosenFile(name: string): Promise<void> {
    await expect(this.fileName).toHaveText(name);
  }

  async expectNoResultDialog(): Promise<void> {
    await expect(this.resultDialog).toBeHidden();
  }
}
