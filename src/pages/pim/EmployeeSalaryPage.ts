import { expect, type Locator, type Page } from '@playwright/test';
import type { DataTable } from '@pages/components/DataTable';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { scopedField } from './scopedField';
import { toastOf } from './jobRequests';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { jobPaths } from './jobPaths';

export interface SalaryInput {
  component?: string;
  payGrade?: string;
  payFrequency?: string;
  currency?: string;
  amount?: string;
  comments?: string;
  deposit?: DepositInput;
}

export interface DepositInput {
  accountNumber?: string;
  accountType?: 'Savings' | 'Checking' | 'Other';
  routingNumber?: string;
  amount?: string;
}

/** Texts of the Salary tab (verified on OrangeHRM 5.9). */
export const salaryText = {
  outOfRange: 'Should be within Min/Max values',
  notANumber: 'Should be a number',
  max100: 'Should not exceed 100 characters',
  max250: 'Should not exceed 250 characters',
  tooLarge: 'Should be less than 1,000,000,000',
  /** Option texts, in UI order; note the trailing period the app shows. */
  payFrequencies: [
    'Bi Weekly',
    'Hourly',
    'Monthly',
    'Monthly on first pay of month.',
    'Semi Monthly',
    'Weekly',
  ],
  accountTypes: ['Savings', 'Checking', 'Other'],
  columns: ['Salary Component', 'Amount', 'Currency', 'Pay Frequency', 'Direct Deposit Amount', 'Actions'],
} as const;

/** Salary tab: "Assigned Salary Components" list and its inline Add / Edit form. */
export class EmployeeSalaryPage extends EmployeeProfilePage {
  readonly heading: Locator;
  readonly tabContent: Locator;
  readonly addButton: Locator;
  readonly formTitle: Locator;
  readonly form: Locator;
  readonly salaryComponent: FormField;
  readonly payGrade: FormField;
  readonly payFrequency: FormField;
  readonly currency: FormField;
  readonly amount: FormField;
  readonly amountHint: Locator;
  readonly comments: FormField;
  readonly depositSwitch: Locator;
  readonly depositCheckbox: Locator;
  readonly depositRow: Locator;
  readonly accountNumber: FormField;
  readonly accountType: FormField;
  readonly routingNumber: FormField;
  readonly depositAmount: FormField;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly components: DataTable;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Assigned Salary Components' });
    this.tabContent = page.locator('.orangehrm-edit-employee-content');
    this.addButton = this.tabContent
      .locator('.orangehrm-action-header')
      .filter({ has: this.heading })
      .getByRole('button', { name: 'Add' });
    this.formTitle = page.getByRole('heading', { name: /^(Add|Edit) Salary Component$/ });
    this.form = this.tabContent.locator('form').first();
    this.salaryComponent = scopedField(this.form, 'Salary Component');
    this.payGrade = scopedField(this.form, 'Pay Grade');
    this.payFrequency = scopedField(this.form, 'Pay Frequency');
    this.currency = scopedField(this.form, 'Currency');
    // The first "Amount" group is the salary amount; the deposit one lives in the row after the switch.
    this.amount = scopedField(this.form, 'Amount');
    // "Min: x - Max: y" sits next to the Amount group (in its grid cell), not inside it.
    this.amountHint = this.form.locator('.orangehrm-input-hint');
    this.comments = scopedField(this.form, 'Comments');
    const depositHeader = this.form.locator('.directdeposit-form-header');
    this.depositSwitch = depositHeader.locator('.oxd-switch-input');
    this.depositCheckbox = depositHeader.locator('input[type="checkbox"]');
    this.depositRow = this.form.locator('.directdeposit-form-header + .oxd-form-row');
    this.accountNumber = scopedField(this.depositRow, 'Account Number');
    this.accountType = scopedField(this.depositRow, 'Account Type');
    this.routingNumber = scopedField(this.depositRow, 'Routing Number');
    this.depositAmount = scopedField(this.depositRow, 'Amount');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
    // The salary table is the first table of the tab (Attachments follows).
    this.components = this.table(this.tabContent);
  }

  @step('Open the Salary tab of employee {0}')
  async openSalaryFor(empNumber: number): Promise<this> {
    this.path = jobPaths.salaryList(empNumber);
    await this.open();
    await expect(this.heading).toBeVisible();
    await this.components.waitForLoaded();
    return this;
  }

  @step('Click Add in Assigned Salary Components')
  async clickAdd(): Promise<void> {
    await this.addButton.click();
    await expect(this.formTitle).toHaveText('Add Salary Component');
  }

  @step('Turn Include Direct Deposit Details {0}')
  async setDirectDeposit(on: boolean): Promise<void> {
    if ((await this.depositCheckbox.isChecked()) !== on) await this.depositSwitch.click();
    if (on) await expect(this.accountNumber.root).toBeVisible();
    else await expect(this.accountNumber.root).toBeHidden();
  }

  @step('Fill the salary form {0}')
  async fillForm(data: SalaryInput): Promise<void> {
    if (data.component !== undefined) await this.salaryComponent.fill(data.component);
    if (data.payGrade) await this.payGrade.choose(data.payGrade);
    if (data.payFrequency) await this.payFrequency.choose(data.payFrequency);
    if (data.currency) await this.currency.choose(data.currency);
    if (data.amount !== undefined) await this.amount.fill(data.amount);
    if (data.comments !== undefined) await this.comments.fillTextarea(data.comments);
    if (data.deposit) await this.fillDeposit(data.deposit);
    await this.blur();
  }

  @step('Fill direct deposit {0}')
  async fillDeposit(d: DepositInput): Promise<void> {
    await this.setDirectDeposit(true);
    if (d.accountNumber !== undefined) await this.accountNumber.fill(d.accountNumber);
    if (d.accountType) await this.accountType.choose(d.accountType);
    if (d.routingNumber !== undefined) await this.routingNumber.fill(d.routingNumber);
    if (d.amount !== undefined) await this.depositAmount.fill(d.amount);
  }

  /** Moves focus to a neutral element so validation on blur runs before Save. */
  async blur(): Promise<void> {
    await this.formTitle.click();
  }

  @step('Click Save on the salary form')
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /** Saves, returns the toast and waits for the form to close and the list to refresh. */
  @step('Save the salary component')
  async save(): Promise<{ title: string; message: string }> {
    const toast = await toastOf(this.toast, () => this.clickSave());
    await expect(this.formTitle).toBeHidden();
    await this.components.waitForLoaded();
    return toast;
  }

  @step('Add salary component {0}')
  async add(data: SalaryInput): Promise<{ title: string; message: string }> {
    await this.clickAdd();
    await this.fillForm(data);
    return this.save();
  }

  row(component: string): Locator {
    return this.components.row(component);
  }

  @step('Edit salary component {0}')
  async edit(component: string, data: SalaryInput): Promise<{ title: string; message: string }> {
    await this.components.clickAction(this.row(component), 'edit');
    await expect(this.formTitle).toHaveText('Edit Salary Component');
    await expect(this.salaryComponent.input).toHaveValue(component);
    await this.fillForm(data);
    return this.save();
  }

  @step('Delete salary component {0}')
  async delete(component: string): Promise<{ title: string; message: string }> {
    await this.components.clickAction(this.row(component), 'delete');
    await expect(this.dialog.root).toBeVisible();
    const toast = await toastOf(this.toast, () => this.dialog.confirm());
    return toast;
  }

  // ---- assertions ----

  async expectRow(
    component: string,
    cells: { amount: string; currency: string; payFrequency: string; depositAmount?: string },
  ): Promise<void> {
    const row = this.row(component);
    await expect(row).toHaveCount(1);
    await expect(await this.components.cell(row, 'Amount')).toHaveText(cells.amount);
    await expect(await this.components.cell(row, 'Currency')).toHaveText(cells.currency);
    await expect(await this.components.cell(row, 'Pay Frequency')).toHaveText(cells.payFrequency);
    await expect(await this.components.cell(row, 'Direct Deposit Amount')).toHaveText(
      cells.depositAmount ?? '',
    );
  }

  async expectNoRow(component: string): Promise<void> {
    await expect(this.row(component)).toHaveCount(0);
  }

  /** Validation message of each field; `null` = the field shows none. */
  async expectErrors(errors: [FormField, string | null][]): Promise<void> {
    for (const [field, message] of errors) {
      if (message === null) await field.expectNoError();
      else await field.expectError(message);
    }
  }

  /** Hint under Amount once a pay grade and its currency are chosen. */
  async expectAmountRange(min: number, max: number): Promise<void> {
    await expect(this.amountHint).toHaveText(`Min: ${min} - Max: ${max}`);
  }

  async expectFormOpen(): Promise<void> {
    await expect(this.formTitle).toBeVisible();
  }
}
