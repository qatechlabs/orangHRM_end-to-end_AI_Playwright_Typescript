import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { AutocompleteField } from '@pages/components/AutocompleteField';
import { Pagination } from '@pages/components/Pagination';
import type { DataTable } from '@pages/components/DataTable';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { pimPaths } from './pimPaths';

export type IncludeOption = 'Current Employees Only' | 'Current and Past Employees' | 'Past Employees Only';

export interface EmployeeSearch {
  /** Employee Name text. Free text (searched as nameOrId) unless `pickName` is given. */
  name?: string;
  /** Autocomplete suggestion to click after typing `name`. */
  pickName?: string | RegExp;
  employeeId?: string;
  employmentStatus?: string;
  include?: IncludeOption;
  jobTitle?: string;
  subUnit?: string;
}

/** What the list request returned: the page asserts on the UI, tests can compare with the API. */
export interface ListResult {
  total: number;
  rows: number;
  query: URLSearchParams;
}

export interface DeleteResult extends ListResult {
  toast: { title: string; message: string };
}

export const EMPLOYEE_LIST_COLUMNS = [
  'Id',
  'First (& Middle) Name',
  'Last Name',
  'Job Title',
  'Employment Status',
  'Sub Unit',
  'Supervisor',
  'Actions',
];

/** PIM > Employee List (search panel + results table). */
export class EmployeeListPage extends BasePage {
  readonly path = pimPaths.employeeList;

  readonly heading: Locator;
  readonly filterPanel: Locator;
  readonly filterLabels: Locator;
  readonly employeeName: AutocompleteField;
  readonly supervisorName: AutocompleteField;
  readonly employeeId: FormField;
  readonly employmentStatus: FormField;
  readonly include: FormField;
  readonly jobTitle: FormField;
  readonly subUnit: FormField;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly addButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly results: DataTable;
  readonly recordCount: Locator;
  readonly pagination: Pagination;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Employee Information' });
    this.filterPanel = page.locator('.oxd-table-filter');
    this.filterLabels = this.filterPanel.locator('label');
    this.employeeName = new AutocompleteField(page.getByPlaceholder('Type for hints...').first());
    this.supervisorName = new AutocompleteField(page.getByPlaceholder('Type for hints...').nth(1));
    this.employeeId = this.field('Employee Id');
    this.employmentStatus = this.field('Employment Status');
    this.include = this.field('Include');
    this.jobTitle = this.field('Job Title');
    this.subUnit = this.field('Sub Unit');
    this.searchButton = this.button('Search');
    this.resetButton = this.button('Reset');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.deleteSelectedButton = page.getByRole('button', { name: /Delete Selected/ });
    this.results = this.table();
    this.recordCount = this.results.recordCount.first();
    this.pagination = new Pagination(page);
  }

  /** Opens the list and returns what the default request returned. */
  @step('Open the Employee List')
  async load(): Promise<ListResult> {
    return this.waitForPage(() => this.page.goto(this.path));
  }

  @step('Open PIM from the side menu')
  async openFromMenu(): Promise<ListResult> {
    return this.waitForPage(() => this.sidebar.navigateTo('PIM'));
  }

  /** Page load: the list plus the master data behind the Employment Status / Job Title / Sub Unit drop-downs. */
  private async waitForPage(action: () => Promise<unknown>): Promise<ListResult> {
    const masterData = ['employment-statuses', 'job-titles', 'subunits'].map((resource) =>
      this.page.waitForResponse((r) => r.url().includes(`/api/v2/admin/${resource}`)),
    );
    const [list] = await Promise.all([this.waitForList(action), ...masterData]);
    return list;
  }

  /** Browser Back to the list (the list reloads with default criteria). */
  @step('Go back to the Employee List')
  async goBack(): Promise<ListResult> {
    return this.waitForList(() => this.page.goBack());
  }

  @step('Search employees {0}')
  async search(criteria: EmployeeSearch): Promise<ListResult> {
    if (criteria.name !== undefined) {
      if (criteria.pickName !== undefined) await this.employeeName.select(criteria.name, criteria.pickName);
      else await this.employeeName.fillFreeText(criteria.name);
    }
    if (criteria.employeeId !== undefined) await this.employeeId.fill(criteria.employeeId);
    if (criteria.employmentStatus) await this.employmentStatus.choose(criteria.employmentStatus);
    if (criteria.jobTitle) await this.jobTitle.choose(criteria.jobTitle);
    if (criteria.subUnit) await this.subUnit.choose(criteria.subUnit);
    if (criteria.include) await this.include.choose(criteria.include);
    return this.waitForList(() => this.searchButton.click());
  }

  @step('Search by Employee Id {0}')
  async searchById(employeeId: string, include?: IncludeOption): Promise<ListResult> {
    return this.search({ employeeId, include });
  }

  @step('Reset the search')
  async reset(): Promise<ListResult> {
    return this.waitForList(() => this.resetButton.click());
  }

  @step('Sort {0} {1}')
  async sortBy(column: string, order: 'Ascending' | 'Descending'): Promise<ListResult> {
    return this.waitForList(() => this.results.sortBy(column, order));
  }

  @step('Go to the next results page')
  async nextPage(): Promise<ListResult> {
    return this.waitForList(() => this.pagination.next.click());
  }

  /** Row whose Id cell (or any cell) contains the given text. */
  row(text: string | RegExp): Locator {
    return this.results.row(text);
  }

  editButton(row: Locator): Locator {
    return row.locator('button:has(.bi-pencil-fill)');
  }

  deleteButton(row: Locator): Locator {
    return row.locator('button:has(.bi-trash)');
  }

  @step('Open the delete dialog of a row')
  async clickDelete(row: Locator): Promise<void> {
    await this.deleteButton(row).click();
    await expect(this.dialog.root).toBeVisible();
  }

  @step('Delete a row and confirm')
  async deleteRow(row: Locator): Promise<DeleteResult> {
    await this.clickDelete(row);
    return this.confirmDelete();
  }

  @step('Delete the selected rows and confirm')
  async deleteSelected(): Promise<DeleteResult> {
    await this.deleteSelectedButton.click();
    await expect(this.dialog.root).toBeVisible();
    return this.confirmDelete();
  }

  /** Confirms the open delete dialog; the toast is captured while the list refreshes (it auto-hides). */
  private async confirmDelete(): Promise<DeleteResult> {
    const [toast, list] = await Promise.all([
      this.toast.capture(),
      this.waitForList(() => this.dialog.confirm()),
    ]);
    return { ...list, toast };
  }

  @step('Open a row by clicking its {1} cell')
  async clickCell(row: Locator, column: string): Promise<void> {
    await (await this.results.cell(row, column)).click();
  }

  /** Values of one column on the current page. */
  async columnValues(column: string): Promise<string[]> {
    return this.results.columnValues(column);
  }

  /**
   * Runs `action` and waits for the employee list request it triggers (the autocomplete
   * suggestions request has no `model=detailed`, so it is ignored), then for the table to render.
   */
  private async waitForList(action: () => Promise<unknown>): Promise<ListResult> {
    const isList = (r: Response) =>
      r.request().method() === 'GET' && /\/api\/v2\/pim\/employees\?.*model=detailed/.test(r.url());
    const [response] = await Promise.all([this.page.waitForResponse(isList), action()]);
    const body = (await response.json()) as { data: unknown[]; meta: { total: number } };
    await this.waitForReady();
    await this.results.waitForLoaded();
    return { total: body.meta.total, rows: body.data.length, query: new URL(response.url()).searchParams };
  }

  // ---- assertions ----

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pim\/viewEmployeeList/);
    await expect(this.heading).toBeVisible();
  }

  async expectColumns(): Promise<void> {
    await this.results.expectHeaders(['', ...EMPLOYEE_LIST_COLUMNS]);
    await expect(this.results.selectAll).toBeVisible();
  }

  async expectFilterLabels(): Promise<void> {
    await expect(this.filterLabels).toHaveText([
      'Employee Name',
      'Employee Id',
      'Employment Status',
      'Include',
      'Supervisor Name',
      'Job Title',
      'Sub Unit',
    ]);
    await expect(this.searchButton).toBeVisible();
    await expect(this.resetButton).toBeVisible();
  }

  /** Landing-state search criteria. */
  async expectFiltersCleared(): Promise<void> {
    await expect(this.employeeName.input).toHaveValue('');
    await expect(this.supervisorName.input).toHaveValue('');
    await expect(this.employeeId.input).toHaveValue('');
    await expect(this.employmentStatus.select).toHaveText('-- Select --');
    await expect(this.jobTitle.select).toHaveText('-- Select --');
    await expect(this.subUnit.select).toHaveText('-- Select --');
    await expect(this.include.select).toHaveText('Current Employees Only');
  }

  /** "(N) Records Found" / "(1) Record Found" / "No Records Found". */
  async expectCount(n: number): Promise<void> {
    const text = n === 0 ? 'No Records Found' : n === 1 ? '(1) Record Found' : `(${n}) Records Found`;
    await expect(this.recordCount).toHaveText(text);
  }

  async expectRows(n: number): Promise<void> {
    await expect(this.results.rows).toHaveCount(n);
  }

  async expectNoRecords(): Promise<void> {
    await this.expectRows(0);
    await this.expectCount(0);
    // Consecutive searches can stack toasts; check the newest one.
    const info = this.toast.root.filter({ hasText: 'Info' }).last();
    await expect(info.locator('.oxd-text--toast-title')).toHaveText('Info');
    await expect(info.locator('.oxd-text--toast-message')).toHaveText('No Records Found');
  }

  /** Exactly one row, for the given Employee Id. */
  async expectOnly(employeeId: string): Promise<void> {
    await this.expectRows(1);
    await this.expectCount(1);
    await expect(await this.results.cell(this.results.rows.first(), 'Id')).toHaveText(employeeId);
  }

  async expectCellText(row: Locator, column: string, text: string | RegExp): Promise<void> {
    await expect(await this.results.cell(row, column)).toHaveText(text);
  }
}
