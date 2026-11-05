import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { AutocompleteField } from '@pages/components/AutocompleteField';
import type { DataTable } from '@pages/components/DataTable';
import type { FormField } from '@pages/components/FormField';
import { pimText } from '@data/pim';
import { step } from '@utils/step';
import { configPaths } from './configPaths';
import { withDataLoad } from './profileHelpers';

/** The OrangeHRM seed reports (never edit or delete them on the shared demo). */
export const PREDEFINED_REPORTS = [
  'All Employee Sub Unit Hierarchy Report',
  'Employee Contact info report',
  'Employee Job Details',
  'PIM Sample Report',
];

/** PIM > Reports: "Employee Reports" list with the Report Name filter. */
export class ReportsPage extends BasePage {
  readonly path = configPaths.reports;

  readonly content: Locator;
  readonly title: Locator;
  readonly reportName: FormField;
  readonly reportNameAutocomplete: AutocompleteField;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly addButton: Locator;
  readonly list: DataTable;

  constructor(page: Page) {
    super(page);
    this.content = page.locator('.oxd-layout-context');
    this.title = this.content.getByRole('heading', { name: 'Employee Reports', exact: true });
    this.reportName = this.field('Report Name');
    this.reportNameAutocomplete = new AutocompleteField(this.content.getByPlaceholder('Type for hints...'));
    this.searchButton = this.content.getByRole('button', { name: 'Search' });
    this.resetButton = this.content.getByRole('button', { name: 'Reset' });
    this.addButton = this.content.getByRole('button', { name: 'Add' });
    this.list = this.table(this.content);
  }

  /** Row whose name is exactly `name`. */
  row(name: string): Locator {
    return this.list.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  private async reloadList(action: () => Promise<unknown>): Promise<void> {
    await withDataLoad(this.page, /\/api\/v2\/pim\/reports\/defined\?limit=50/, action);
    await this.list.waitForLoaded();
  }

  @step('Open PIM > Reports')
  async load(): Promise<this> {
    await this.reloadList(() => this.page.goto(this.path));
    await expect(this.title).toBeVisible();
    return this;
  }

  @step('Search the report {1} (typed {0})')
  async search(typed: string, pick: string): Promise<void> {
    await this.reportNameAutocomplete.select(typed, pick);
    await this.reloadList(() => this.searchButton.click());
  }

  @step('Type {0} in Report Name and Search without picking a suggestion')
  async searchTypedOnly(typed: string): Promise<void> {
    await this.reportNameAutocomplete.type(typed);
    await this.searchButton.click();
  }

  @step('Reset the filter')
  async reset(): Promise<void> {
    await this.reloadList(() => this.resetButton.click());
  }

  @step('Click Add')
  async clickAdd(): Promise<void> {
    await this.addButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${configPaths.defineReport}$`));
  }

  @step('Edit report {0}')
  async edit(name: string): Promise<void> {
    await this.list.clickAction(this.row(name), 'edit');
    await expect(this.page).toHaveURL(/\/pim\/definePredefinedReport\/\d+$/);
  }

  @step('Delete report {0} and confirm')
  async delete(name: string): Promise<{ title: string; message: string }> {
    await this.list.clickAction(this.row(name), 'delete');
    await expect(this.dialog.root.locator('.oxd-text--card-body')).toHaveText(pimText.deleteDialogText);
    const [toast] = await Promise.all([this.toast.capture(), this.dialog.confirm('Yes, Delete')]);
    return toast;
  }

  // ---- assertions ----

  async expectLayout(): Promise<void> {
    await expect(this.title).toBeVisible();
    await this.list.expectHeaders(['', 'Name', 'Actions']);
    await expect(this.list.recordCount.first()).toHaveText(/^\s*\(\d+\) Records? Found\s*$/);
  }

  async expectListed(names: string[]): Promise<void> {
    for (const name of names) await expect(this.row(name)).toHaveCount(1);
  }

  async expectNotListed(name: string): Promise<void> {
    await expect(this.row(name)).toHaveCount(0);
  }

  async expectOnly(name: string): Promise<void> {
    await expect(this.list.rows).toHaveCount(1);
    await expect(this.row(name)).toHaveCount(1);
    await expect(this.list.recordCount.first()).toHaveText('(1) Record Found');
  }

  async expectReportNameError(message: string): Promise<void> {
    await this.reportName.expectError(message);
  }
}
