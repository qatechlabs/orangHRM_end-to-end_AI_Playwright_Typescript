import { expect, type Locator, type Page } from '@playwright/test';
import { RecordSection } from '@pages/components/RecordSection';
import { pimText } from '@data/pim';
import { step } from '@utils/step';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { withDataLoad } from './profileHelpers';

/**
 * A profile tab made of an "Assigned ..." record list and an inline add/edit form above it
 * (Emergency Contacts, Dependents, Immigration). Subclasses define the route, the section title,
 * the form fields and the API resource whose GET loads the list.
 *
 * Form fields use the page-level `this.field(label)`: the labels are unique on these tabs, and
 * FormField's label filter is only relative (and therefore correct) when its scope is the page.
 */
export abstract class RecordTabPage extends EmployeeProfilePage {
  readonly records: RecordSection;
  /** The inline add/edit form (only one form is open at a time above the record list). */
  readonly form: Locator;
  readonly formTitle: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  protected abstract route(empNumber: number): string;
  /** API resource segment, e.g. `emergency-contacts`. */
  protected abstract readonly resource: string;

  constructor(page: Page, sectionTitle: string, formTitles: RegExp) {
    super(page);
    this.records = new RecordSection(page, sectionTitle);
    this.formTitle = this.content.getByRole('heading', { name: formTitles });
    // The form directly follows its title (the Attachments form, when open, has another title).
    this.form = this.formTitle.locator('xpath=following-sibling::form[1]');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
  }

  @step('Open the record tab of employee {0}')
  async load(empNumber: number): Promise<this> {
    this.path = this.route(empNumber);
    await withDataLoad(this.page, `/pim/employees/${empNumber}/${this.resource}?`, () =>
      this.page.goto(this.path),
    );
    await this.waitForReady();
    await expect(this.records.heading).toBeVisible();
    return this;
  }

  @step('Click Add')
  async clickAdd(): Promise<void> {
    await this.records.clickAdd();
    await expect(this.formTitle).toBeVisible();
  }

  @step('Save the form')
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  @step('Edit a record')
  async edit(row: Locator): Promise<void> {
    // The edit form loads the record (GET .../<resource>/<id>) after it opens.
    await withDataLoad(this.page, new RegExp(`/${this.resource}/\\d+$`), () => this.records.clickEdit(row));
    await expect(this.formTitle).toBeVisible();
  }

  @step('Delete a record and confirm')
  async deleteRow(row: Locator): Promise<void> {
    await this.records.clickDelete(row);
    await this.expectDeleteDialog();
    await this.dialog.confirm('Yes, Delete');
  }

  @step('Select all records and delete them')
  async deleteAllSelected(expectedCount: number): Promise<void> {
    await this.records.selectAll();
    await this.records.expectSelected(expectedCount);
    await this.records.clickDeleteSelected();
    await this.expectDeleteDialog();
    await this.dialog.confirm('Yes, Delete');
  }

  /** Clicks the form title: blurs the current field and closes an open date picker. */
  async blurForm(): Promise<void> {
    await this.formTitle.click();
  }

  // ---- assertions ----

  async expectDeleteDialog(): Promise<void> {
    await expect(this.dialog.root).toBeVisible();
    await expect(this.dialog.root.locator('.oxd-text--card-title')).toHaveText(pimText.deleteDialogTitle);
    await expect(this.dialog.root.locator('.oxd-text--card-body')).toHaveText(pimText.deleteDialogText);
    await expect(this.dialog.root.getByRole('button', { name: 'No, Cancel' })).toBeVisible();
    await expect(this.dialog.root.getByRole('button', { name: 'Yes, Delete' })).toBeVisible();
  }

  async expectFormTitle(title: string): Promise<void> {
    await expect(this.formTitle).toHaveText(title);
  }

  async expectFormClosed(): Promise<void> {
    await expect(this.formTitle).toBeHidden();
  }
}
