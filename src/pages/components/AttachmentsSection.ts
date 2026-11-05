import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';
import { scopedField } from '@pages/pim/scopedField';
import { pimText } from '@data/pim';
import { step } from '@utils/step';
import { ConfirmDialog } from './ConfirmDialog';
import type { FormField } from './FormField';
import { RecordSection } from './RecordSection';
import { Toast } from './Toast';

/**
 * The "Attachments" block at the bottom of every employee profile tab: a RecordSection (Add,
 * selection bar, table with File Name, Description, Size, Type, Date Added, Added By, Actions) and
 * the inline "Add Attachment" / "Edit Attachment" form with a hidden file input and a Comment.
 * Rows carry pencil, trash and download icon buttons. Uploads are sent as base64 JSON.
 */
export class AttachmentsSection {
  readonly records: RecordSection;
  readonly toast: Toast;
  readonly dialog: ConfirmDialog;
  readonly formTitle: Locator;
  readonly form: Locator;
  readonly fileInput: Locator;
  readonly selectFile: FormField;
  readonly fileName: Locator;
  readonly hint: Locator;
  readonly comment: FormField;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    this.records = new RecordSection(page, 'Attachments');
    this.toast = new Toast(page);
    this.dialog = new ConfirmDialog(page);
    const content = page.locator('.orangehrm-edit-employee-content');
    this.formTitle = content.getByRole('heading', { name: /^(Add|Edit) Attachment$/ });
    this.form = this.formTitle.locator('xpath=following-sibling::form[1]');
    this.fileInput = this.form.locator('input[type="file"]');
    this.selectFile = scopedField(this.form, 'Select File');
    this.fileName = this.selectFile.root.locator('.oxd-file-input-div');
    this.hint = this.form.locator('.orangehrm-input-hint');
    this.comment = scopedField(this.form, 'Comment');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
    instrumentAssertions(this, () => page);
  }

  get rows(): Locator {
    return this.records.rows;
  }

  row(fileName: string): Locator {
    return this.records.row(fileName);
  }

  @step('Click Add in Attachments')
  async clickAdd(): Promise<void> {
    await this.records.clickAdd();
    await expect(this.formTitle).toHaveText('Add Attachment');
  }

  @step('Choose the attachment file {0}')
  async chooseFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  @step('Type the attachment comment')
  async fillComment(text: string): Promise<void> {
    await this.comment.fillTextarea(text);
    // Blur so the length validation runs.
    await this.formTitle.click();
  }

  @step('Click Save in the attachment form')
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /** Add, choose, comment, Save; returns the toast (the list refreshes after it). */
  @step('Upload attachment {0}')
  async upload(filePath: string, comment = ''): Promise<{ title: string; message: string }> {
    await this.clickAdd();
    await this.chooseFile(filePath);
    if (comment) await this.fillComment(comment);
    const [toast] = await Promise.all([this.toast.capture(), this.clickSave()]);
    return toast;
  }

  /** Clicks the row's download icon and returns the browser download. */
  @step('Download an attachment')
  async download(row: Locator): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      row.locator('button:has(i.bi-download)').click(),
    ]);
    return download;
  }

  @step('Delete an attachment and confirm')
  async deleteRow(row: Locator): Promise<void> {
    await this.records.clickDelete(row);
    await this.expectDeleteDialog();
    await this.dialog.confirm('Yes, Delete');
  }

  @step('Select all attachments and delete them')
  async deleteAllSelected(expectedCount: number): Promise<void> {
    await this.records.selectAll();
    await this.records.expectSelected(expectedCount);
    await this.records.clickDeleteSelected();
    await this.expectDeleteDialog();
    await this.dialog.confirm('Yes, Delete');
  }

  // ---- assertions ----

  async expectAddForm(): Promise<void> {
    await expect(this.formTitle).toHaveText('Add Attachment');
    await expect(this.selectFile.root.locator('label')).toHaveText(/^\s*Select File\s*\*?\s*$/);
    await expect(this.selectFile.root.getByText('Browse', { exact: true })).toBeVisible();
    await expect(this.fileName).toHaveText('No file selected');
    await expect(this.hint).toHaveText('Accepts up to 1MB');
    await expect(this.comment.textarea).toHaveAttribute('placeholder', 'Type comment here');
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async expectChosenFile(name: string): Promise<void> {
    await expect(this.fileName).toHaveText(name);
  }

  async expectDeleteDialog(): Promise<void> {
    await expect(this.dialog.root).toBeVisible();
    await expect(this.dialog.root.locator('.oxd-text--card-title')).toHaveText(pimText.deleteDialogTitle);
    await expect(this.dialog.root.locator('.oxd-text--card-body')).toHaveText(pimText.deleteDialogText);
  }

  async expectFormClosed(): Promise<void> {
    await expect(this.formTitle).toBeHidden();
  }
}
