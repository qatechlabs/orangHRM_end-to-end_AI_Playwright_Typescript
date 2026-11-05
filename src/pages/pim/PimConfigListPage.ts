import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { DataTable } from '@pages/components/DataTable';
import type { FormField } from '@pages/components/FormField';
import { pimText } from '@data/pim';
import { step } from '@utils/step';
import { withDataLoad } from './profileHelpers';
import { scopedField } from './scopedField';

export interface ConfigListSpec {
  /** List heading, e.g. "Reporting Methods". */
  title: string;
  /** Singular used by the add/edit page titles, e.g. "Reporting Method". */
  singular: string;
  /** API resource, e.g. "reporting-methods". */
  resource: string;
  listPath: string;
  addPath: string;
  editPath: (id: number) => string;
  /** Error toast when deleting an entry that is in use. */
  inUseMessage: string;
  /**
   * The Add/Edit page fetches every name (`?limit=0`) for its "Already exists" check (Reporting
   * Methods); Termination Reasons render the names into the page instead.
   */
  loadsNameList: boolean;
}

/**
 * A PIM > Configuration lookup list (Reporting Methods, Termination Reasons): the list page with
 * Add / pencil / trash, and the separate Add/Edit page with a single Name field.
 */
export abstract class PimConfigListPage extends BasePage {
  path: string;

  readonly content: Locator;
  readonly listTitle: Locator;
  readonly addButton: Locator;
  readonly list: DataTable;
  readonly formTitle: Locator;
  readonly name: FormField;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    page: Page,
    readonly spec: ConfigListSpec,
  ) {
    super(page);
    this.path = spec.listPath;
    this.content = page.locator('.oxd-layout-context');
    this.listTitle = this.content
      .locator('.orangehrm-header-container')
      .getByText(spec.title, { exact: true });
    // Accessible name is "+ Add" (icon + text).
    this.addButton = this.content.getByRole('button', { name: 'Add' });
    this.list = this.table(this.content);
    this.formTitle = this.content.getByText(new RegExp(`^(Add|Edit) ${spec.singular}$`));
    this.name = scopedField(this.content.locator('form'), 'Name');
    this.saveButton = this.content.getByRole('button', { name: 'Save' });
    this.cancelButton = this.content.getByRole('button', { name: 'Cancel' });
  }

  /** Row whose Name cell is exactly `name`. */
  row(name: string): Locator {
    return this.list.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  @step('Open the configuration list')
  async load(): Promise<this> {
    await withDataLoad(this.page, `/api/v2/pim/${this.spec.resource}?`, () =>
      this.page.goto(this.spec.listPath),
    );
    await this.waitForList();
    return this;
  }

  async waitForList(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${this.spec.listPath}$`));
    await expect(this.listTitle).toBeVisible();
    await this.waitForReady();
    await this.list.waitForLoaded();
    await expect(this.list.recordCount.first()).toBeVisible();
  }

  @step('Click Add')
  async clickAdd(): Promise<void> {
    await this.withNameList(() => this.addButton.click());
    await expect(this.formTitle).toHaveText(`Add ${this.spec.singular}`);
  }

  @step('Open the Add page')
  async openAdd(): Promise<void> {
    await this.withNameList(() => this.page.goto(this.spec.addPath));
    await expect(this.formTitle).toHaveText(`Add ${this.spec.singular}`);
  }

  /** Runs a navigation to the Add/Edit page and waits until its name list is available. */
  private async withNameList(action: () => Promise<unknown>): Promise<void> {
    if (this.spec.loadsNameList) {
      await withDataLoad(this.page, `/api/v2/pim/${this.spec.resource}?limit=0`, action);
    } else {
      await action();
    }
    await this.waitForReady();
  }

  @step('Type the name {0}')
  async fillName(name: string): Promise<void> {
    await this.name.fill(name);
    await this.formTitle.click();
  }

  @step('Click Save')
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /** Saves the open form; returns the toast once the app is back on the list. */
  @step('Save and return to the list')
  async saveToList(): Promise<{ title: string; message: string }> {
    const [toast] = await Promise.all([this.toast.capture(), this.clickSave()]);
    await this.waitForList();
    return toast;
  }

  @step('Add {0}')
  async add(name: string): Promise<{ title: string; message: string }> {
    await this.clickAdd();
    await this.fillName(name);
    return this.saveToList();
  }

  /** Opens the edit page of a row and waits for the name to be pre-filled. */
  @step('Edit {0}')
  async openEdit(name: string): Promise<void> {
    await this.list.clickAction(this.row(name), 'edit');
    await expect(this.formTitle).toHaveText(`Edit ${this.spec.singular}`);
    await expect(this.name.input).toHaveValue(name);
  }

  @step('Rename {0} to {1}')
  async rename(name: string, newName: string): Promise<{ title: string; message: string }> {
    await this.openEdit(name);
    await this.fillName(newName);
    return this.saveToList();
  }

  @step('Click the trash of {0}')
  async clickDelete(name: string): Promise<void> {
    await this.list.clickAction(this.row(name), 'delete');
  }

  @step('Delete {0} and confirm')
  async delete(name: string): Promise<{ title: string; message: string }> {
    await this.clickDelete(name);
    await expect(this.dialog.root.locator('.oxd-text--card-body')).toHaveText(pimText.deleteDialogText);
    const [toast] = await Promise.all([this.toast.capture(), this.dialog.confirm('Yes, Delete')]);
    return toast;
  }

  // ---- assertions ----

  async expectListed(name: string): Promise<void> {
    await expect(this.row(name)).toHaveCount(1);
  }

  async expectNotListed(name: string): Promise<void> {
    await expect(this.row(name)).toHaveCount(0);
  }

  async expectNameError(message: string): Promise<void> {
    await this.name.expectError(message);
  }

  async expectStillOnForm(): Promise<void> {
    await expect(this.formTitle).toBeVisible();
    await expect(this.page).not.toHaveURL(new RegExp(`${this.spec.listPath}$`));
  }

  /** In-use entries: an error toast instead of the confirmation dialog. */
  async expectInUseRefused(): Promise<void> {
    await this.toast.expectError(this.spec.inUseMessage);
    await expect(this.dialog.root).toBeHidden();
  }
}
