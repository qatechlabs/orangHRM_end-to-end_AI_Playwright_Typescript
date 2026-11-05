import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { customFieldPaths } from './CustomFieldsPage';
import { watchRequests } from './profileHelpers';
import { scopedField } from './scopedField';

export interface CustomFieldForm {
  name?: string;
  /** On-screen screen name, e.g. "Personal Details". */
  screen?: string;
  type?: 'Text or Number' | 'Drop Down';
  /** Comma-separated options (Drop Down only). */
  options?: string;
}

/**
 * Add Custom Field form (`/pim/saveCustomFields`, plural): Field Name*, Screen*, Type* and, for
 * Drop Down, Select Options* (comma separated). Save returns to the list with "Successfully Saved".
 */
export class SaveCustomFieldPage extends BasePage {
  readonly path = customFieldPaths.add;

  readonly content: Locator;
  readonly form: Locator;
  readonly formTitle: Locator;
  readonly fieldName: FormField;
  readonly screen: FormField;
  readonly type: FormField;
  readonly selectOptions: FormField;
  readonly requiredHint: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.content = page.locator('.oxd-layout-context');
    this.form = this.content.locator('form');
    this.formTitle = this.content.getByRole('heading', { name: /^(Add|Edit) Custom Field$/ });
    this.fieldName = scopedField(this.form, 'Field Name');
    this.screen = scopedField(this.form, 'Screen');
    this.type = scopedField(this.form, 'Type');
    this.selectOptions = scopedField(this.form, 'Select Options');
    this.requiredHint = this.form.getByText('* Required', { exact: true });
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
  }

  async screenOptions(): Promise<string[]> {
    return this.screen.options();
  }

  async typeOptions(): Promise<string[]> {
    return this.type.options();
  }

  @step('Fill the custom field form {0}')
  async fillForm(data: CustomFieldForm): Promise<void> {
    if (data.screen !== undefined) await this.screen.choose(data.screen);
    if (data.type !== undefined) await this.type.choose(data.type);
    if (data.options !== undefined) await this.selectOptions.fill(data.options);
    if (data.name !== undefined) await this.fieldName.fill(data.name);
    // Blur so the (asynchronous) unique-name validation runs.
    await this.requiredHint.click();
  }

  @step('Click Save')
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /** Saves a valid form; returns the toast (the app then redirects to the list). */
  @step('Save the custom field')
  async saveAndCapture(): Promise<{ title: string; message: string }> {
    const [toast] = await Promise.all([this.toast.capture(), this.clickSave()]);
    return toast;
  }

  /** Clicks Save and reports how many POSTs to /pim/custom-fields were sent (0 when validation blocks). */
  @step('Click Save expecting validation errors')
  async saveBlocked(): Promise<number> {
    const posts = watchRequests(this.page, 'POST', '/api/v2/pim/custom-fields');
    try {
      await this.clickSave();
      await expect(this.form.locator('.oxd-input-field-error-message').first()).toBeVisible();
      await this.waitForReady();
      return posts.count();
    } finally {
      posts.stop();
    }
  }

  // ---- assertions ----

  async expectOnForm(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${customFieldPaths.add}$`));
    await expect(this.formTitle).toHaveText('Add Custom Field');
  }

  async expectSelectOptionsShown(): Promise<void> {
    await expect(this.selectOptions.root).toBeVisible();
    await expect(this.form.getByText('Enter allowed options separated by commas')).toBeVisible();
  }

  async expectErrors(errors: { field: FormField; message: string }[]): Promise<void> {
    for (const { field, message } of errors) await field.expectError(message);
  }
}
