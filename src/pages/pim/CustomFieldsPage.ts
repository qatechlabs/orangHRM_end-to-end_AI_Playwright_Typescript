import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { DataTable } from '@pages/components/DataTable';
import type { FormField } from '@pages/components/FormField';
import { pimText } from '@data/pim';
import { step } from '@utils/step';
import { PersonalDetailsPage } from './PersonalDetailsPage';
import { withDataLoad } from './profileHelpers';
import { scopedField } from './scopedField';

const web = '/web/index.php';

export const customFieldPaths = {
  list: `${web}/pim/listCustomFields`,
  add: `${web}/pim/saveCustomFields`,
};

/** Exact on-screen texts of PIM > Configuration > Custom Fields (verified on the live demo). */
export const customFieldText = {
  saved: 'Successfully Saved',
  updated: 'Successfully Updated',
  deleted: 'Successfully Deleted',
  required: 'Required',
  alreadyExists: 'Already exists',
  inUse: 'Custom field(s) in use',
  /** Screens listed by PIM-FR-025-AC1. */
  brdScreens: [
    'Personal Details',
    'Contact Details',
    'Emergency Contacts',
    'Dependents',
    'Immigration',
    'Job',
    'Salary',
    'Report-to',
    'Qualifications',
    'Memberships',
  ],
  types: ['Text or Number', 'Drop Down'],
  placeholder: '-- Select --',
} as const;

const CUSTOM_FIELDS_API = '/api/v2/pim/custom-fields';

/**
 * PIM > Configuration > Custom Fields list: remaining-count text, Add, table with
 * Custom Field Name / Screen / Field Type and trash + pencil per row.
 */
export class CustomFieldsPage extends BasePage {
  readonly path = customFieldPaths.list;

  readonly content: Locator;
  readonly title: Locator;
  readonly remaining: Locator;
  readonly addButton: Locator;
  readonly list: DataTable;

  constructor(page: Page) {
    super(page);
    this.content = page.locator('.oxd-layout-context');
    this.title = this.content.getByRole('heading', { name: 'Custom Fields', exact: true });
    this.remaining = this.content.getByText(/^Remaining number of custom fields: \d+$/);
    // The accessible name starts with the icon-font glyph of the "+" icon.
    this.addButton = this.content.getByRole('button', { name: /^\W*Add$/ });
    this.list = this.table(this.content);
  }

  /** Row whose Custom Field Name cell is exactly `name`. */
  row(name: string): Locator {
    return this.list.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  @step('Open the Custom Fields list')
  async load(): Promise<this> {
    await withDataLoad(this.page, `${CUSTOM_FIELDS_API}?`, () => this.page.goto(this.path));
    await this.waitForList();
    return this;
  }

  async waitForList(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${customFieldPaths.list}$`));
    await expect(this.title).toBeVisible();
    await this.waitForReady();
    await this.list.waitForLoaded();
    await expect(this.list.recordCount.first()).toBeVisible();
  }

  /** Number from "Remaining number of custom fields: N". */
  async remainingCount(): Promise<number> {
    const text = await this.remaining.innerText();
    return Number(text.match(/(\d+)\s*$/)?.[1] ?? NaN);
  }

  @step('Click Add')
  async clickAdd(): Promise<void> {
    // The add form loads every definition (for its "Already exists" check) before it is usable.
    await withDataLoad(this.page, /\/api\/v2\/pim\/custom-fields$/, () => this.addButton.click());
  }

  @step('Click the trash of custom field {0}')
  async clickDelete(name: string): Promise<void> {
    await this.list.clickAction(this.row(name), 'delete');
  }

  @step('Delete custom field {0} and confirm')
  async delete(name: string): Promise<{ title: string; message: string }> {
    await this.clickDelete(name);
    await expect(this.dialog.root.locator('.oxd-text--card-body')).toHaveText(pimText.deleteDialogText);
    const [toast] = await Promise.all([this.toast.capture(), this.dialog.confirm('Yes, Delete')]);
    await this.list.waitForLoaded();
    return toast;
  }

  // ---- assertions ----

  async expectListed(name: string, screen: string, type: string): Promise<void> {
    const row = this.row(name);
    await expect(row).toHaveCount(1);
    await expect(await this.list.cell(row, 'Custom Field Name')).toHaveText(name);
    await expect(await this.list.cell(row, 'Screen')).toHaveText(screen);
    await expect(await this.list.cell(row, 'Field Type')).toHaveText(type);
  }

  async expectNotListed(name: string): Promise<void> {
    await expect(this.row(name)).toHaveCount(0);
  }

  async expectRemaining(n: number): Promise<void> {
    await expect(this.remaining).toHaveText(`Remaining number of custom fields: ${n}`);
  }

  /** A field with stored values: error toast instead of the confirmation dialog. */
  async expectInUseRefused(): Promise<void> {
    await this.toast.expectError(customFieldText.inUse);
    await expect(this.dialog.root).toBeHidden();
  }
}

/**
 * The "Custom Fields" form of an employee's Personal Details tab (below the main form, with its
 * own Save). Each custom field is an oxd input group labelled with the field name.
 */
export class ProfileCustomFieldsPage extends PersonalDetailsPage {
  readonly customHeading: Locator;
  readonly customForm: Locator;
  readonly customSaveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.customHeading = this.content.getByRole('heading', { name: 'Custom Fields', exact: true });
    this.customForm = this.customHeading.locator('xpath=following-sibling::form[1]');
    this.customSaveButton = this.customForm.getByRole('button', { name: 'Save' });
  }

  customField(name: string): FormField {
    return scopedField(this.customForm, name);
  }

  /** Opens Personal Details and waits for the custom field values to be loaded into the form. */
  @step('Open the Custom Fields of employee {0}')
  async openCustomFieldsFor(empNumber: number): Promise<void> {
    await withDataLoad(this.page, `/api/v2/pim/employees/${empNumber}/custom-fields`, () =>
      this.openFor(empNumber),
    );
    await expect(this.customHeading).toBeVisible();
  }

  @step('Reload the Custom Fields')
  async reloadCustomFields(): Promise<void> {
    await withDataLoad(this.page, `/api/v2/pim/employees/${this.empNumber()}/custom-fields`, () =>
      this.reload(),
    );
    await expect(this.customHeading).toBeVisible();
  }

  /** Options of a Drop Down custom field (including the "-- Select --" placeholder). */
  async customOptions(name: string): Promise<string[]> {
    // FormField.options() closes with Escape, after which this select ignores the next click;
    // close it by clicking a neutral element instead.
    const dropdown = this.page.locator('.oxd-select-dropdown');
    await this.customField(name).select.click();
    await expect(dropdown.getByRole('option').first()).toBeVisible();
    const texts = (await dropdown.getByRole('option').allInnerTexts()).map((t) => t.trim());
    await this.customHeading.click();
    await expect(dropdown).toBeHidden();
    return texts;
  }

  @step('Choose {1} in custom field {0}')
  async chooseCustomValue(name: string, option: string): Promise<void> {
    await this.customField(name).choose(option);
  }

  @step('Save the Custom Fields form')
  async saveCustomFields(): Promise<void> {
    await this.customSaveButton.click();
  }

  // ---- assertions ----

  async expectCustomSelect(name: string, value: string): Promise<void> {
    await expect(this.customField(name).select).toHaveText(value);
  }

  async expectCustomFieldShown(name: string): Promise<void> {
    await expect(this.customField(name).root).toBeVisible();
  }

  async expectCustomFieldAbsent(name: string): Promise<void> {
    await expect(this.customHeading).toBeVisible();
    await expect(this.customField(name).root).toHaveCount(0);
  }
}
