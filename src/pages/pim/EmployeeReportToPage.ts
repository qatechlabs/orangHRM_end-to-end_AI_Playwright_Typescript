import { expect, type Locator, type Page } from '@playwright/test';
import { AutocompleteField } from '@pages/components/AutocompleteField';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { scopedField } from './scopedField';
import { toastOf } from './jobRequests';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { jobPaths } from './jobPaths';

export type ReportToSection = 'Assigned Supervisors' | 'Assigned Subordinates';
export type ReportingMethodName = 'Direct' | 'Indirect';

/** One "Assigned Supervisors" / "Assigned Subordinates" card with its inline Add form. */
export class ReportToCard {
  readonly root: Locator;
  readonly addButton: Locator;
  readonly formTitle: Locator;
  readonly form: Locator;
  readonly name: FormField;
  readonly nameAutocomplete: AutocompleteField;
  readonly method: FormField;
  readonly saveButton: Locator;
  readonly recordCount: Locator;
  readonly rows: Locator;
  readonly suggestions: Locator;

  constructor(
    private readonly owner: EmployeeReportToPage,
    readonly title: ReportToSection,
  ) {
    const page = owner.page;
    // Direct children of the tab content: header, supervisors card, subordinates card, attachments.
    this.root = owner.tabContent
      .locator(':scope > div')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
    this.addButton = this.root.locator('.orangehrm-action-header').getByRole('button', { name: 'Add' });
    this.formTitle = this.root.getByRole('heading', { name: /^Add (Supervisor|Subordinate)$/ });
    this.form = this.root.locator('form');
    this.name = scopedField(this.form, 'Name');
    this.nameAutocomplete = new AutocompleteField(this.form.getByPlaceholder('Type for hints...'));
    this.method = scopedField(this.form, 'Reporting Method');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.recordCount = this.root.locator('.oxd-text--span').filter({ hasText: /Record/ });
    this.rows = this.root.locator('.oxd-table-body .oxd-table-card');
    this.suggestions = page.locator('.oxd-autocomplete-dropdown').getByRole('option');
  }

  row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  @step('Click Add')
  async clickAdd(): Promise<void> {
    await this.addButton.click();
    await expect(this.formTitle).toBeVisible();
  }

  /**
   * Types into Name and waits for the `report-to/allowed` answer for the full text, so the
   * suggestions on screen belong to that text. Returns the names the server allowed.
   */
  @step('Type {0} in Name')
  async typeName(text: string): Promise<string[]> {
    const page = this.owner.page;
    const allowed = page.waitForResponse(
      (r) => r.url().includes('/report-to/allowed') && new URL(r.url()).searchParams.get('nameOrId') === text,
    );
    await this.nameAutocomplete.type(text);
    const body = (await (await allowed).json()) as { data: { firstName: string; lastName: string }[] };
    await expect(page.locator('.oxd-autocomplete-dropdown')).not.toContainText('Searching');
    return body.data.map((e) => `${e.firstName} ${e.lastName}`);
  }

  @step('Pick {0} with method {1} and Save')
  async assign(
    name: string,
    method: ReportingMethodName,
    typed = name,
  ): Promise<{ title: string; message: string }> {
    if (!(await this.formTitle.isVisible())) await this.clickAdd();
    await this.typeName(typed);
    await this.suggestions.filter({ hasText: name }).first().click();
    await this.method.choose(method);
    const toast = await toastOf(this.owner.toast, () => this.saveButton.click());
    await expect(this.formTitle).toBeHidden();
    await expect(this.row(name)).toBeVisible();
    return toast;
  }

  @step('Choose reporting method {0}')
  async chooseMethod(method: ReportingMethodName): Promise<void> {
    await this.method.choose(method);
  }

  @step('Click Save in the Report-to form')
  async clickSave(): Promise<void> {
    // Move focus off the autocomplete first so its blur handling does not swallow the click.
    await this.formTitle.click();
    await this.saveButton.click();
  }

  // ---- assertions ----

  async expectCount(n: number): Promise<void> {
    const text = n === 0 ? 'No Records Found' : n === 1 ? '(1) Record Found' : `(${n}) Records Found`;
    await expect(this.recordCount).toHaveText(text);
  }

  async expectRow(name: string, method: ReportingMethodName): Promise<void> {
    await expect(this.row(name)).toHaveCount(1);
    await expect(this.row(name)).toContainText(method);
  }

  /** The autocomplete has nothing to offer for the typed text. */
  async expectNoSuggestions(): Promise<void> {
    await expect(this.suggestions).toHaveText(['No Records Found']);
  }

  async expectReadOnly(): Promise<void> {
    await expect(this.addButton).toHaveCount(0);
    await expect(this.root.locator('button:has(.bi-trash), button:has(.bi-pencil-fill)')).toHaveCount(0);
  }
}

/** Report-to tab of the employee profile. */
export class EmployeeReportToPage extends EmployeeProfilePage {
  readonly heading: Locator;
  readonly tabContent: Locator;
  readonly supervisors: ReportToCard;
  readonly subordinates: ReportToCard;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Report to', exact: true });
    this.tabContent = page.locator('.orangehrm-edit-employee-content');
    this.supervisors = new ReportToCard(this, 'Assigned Supervisors');
    this.subordinates = new ReportToCard(this, 'Assigned Subordinates');
  }

  @step('Open the Report-to tab of employee {0}')
  async openReportToFor(empNumber: number): Promise<this> {
    this.path = jobPaths.reportTo(empNumber);
    await this.open();
    await expect(this.heading).toBeVisible();
    await expect(this.supervisors.recordCount).toBeVisible();
    await expect(this.subordinates.recordCount).toBeVisible();
    return this;
  }

  async expectReadOnly(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await this.supervisors.expectReadOnly();
    await this.subordinates.expectReadOnly();
  }
}
