import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { configPaths } from './configPaths';
import { withDataLoad } from './profileHelpers';
import { readSelectOptions } from './QualificationsPage';
import { scopedField } from './scopedField';

export const SELECTION_CRITERIA = [
  'Employee Name',
  'Pay Grade',
  'Education',
  'Employment Status',
  'Service Period',
  'Joined Date',
  'Job Title',
  'Language',
  'Skill',
  'Age Group',
  'Sub Unit',
  'Gender',
  'Location',
];

export const DISPLAY_FIELD_GROUPS = [
  'Personal',
  'Contact Details',
  'Emergency Contacts',
  'Dependents',
  'Immigration',
  'Job',
  'Salary',
  'Subordinates',
  'Supervisors',
  'Work Experience',
  'Education',
  'Skills',
  'Languages',
  'License',
  'Memberships',
  'Custom Fields',
];

export interface ReportDefinition {
  name: string;
  /** Criterion name -> option to pick in its value select (select-type criteria only). */
  criteria?: Record<string, string>;
  /** Display field group -> fields, in order. */
  displayFields?: Record<string, string[]>;
  /** Groups whose "Include Header" switch is turned on. */
  includeHeader?: string[];
}

/** PIM > Reports > Add / Edit Report (`definePredefinedReport[/<id>]`). */
export class DefineReportPage extends BasePage {
  path = configPaths.defineReport;

  readonly content: Locator;
  readonly title: Locator;
  readonly form: Locator;
  readonly reportName: FormField;
  readonly reportNameInput: Locator;
  readonly selectionCriteria: FormField;
  readonly include: FormField;
  readonly addCriterionButton: Locator;
  readonly displayFieldGroup: FormField;
  readonly displayField: FormField;
  readonly addDisplayFieldButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.content = page.locator('.oxd-layout-context');
    this.title = this.content.getByRole('heading', { name: /^(Add|Edit) Report$/ });
    this.form = this.content.locator('form');
    this.reportName = scopedField(this.form, 'Report Name');
    this.reportNameInput = this.form.getByPlaceholder('Type here ...');
    this.selectionCriteria = scopedField(this.form, 'Selection Criteria');
    this.include = scopedField(this.form, 'Include');
    // The green "+" buttons have no accessible name: criteria first, display fields last.
    this.addCriterionButton = this.form.locator('button:has(i.bi-plus)').first();
    this.displayFieldGroup = scopedField(this.form, 'Select Display Field Group');
    this.displayField = scopedField(this.form, 'Select Display Field');
    this.addDisplayFieldButton = this.form.locator('button:has(i.bi-plus)').last();
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
  }

  /** Value control of an added criterion (its label is the criterion name). */
  criterion(name: string): FormField {
    return scopedField(this.form, name);
  }

  /** Name cell of an added display field group block. */
  private groupBlock(group: string): Locator {
    return this.form
      .locator('.orangehrm-report-field')
      .filter({ has: this.page.locator('p.orangehrm-report-field-name').getByText(group, { exact: true }) });
  }

  /** Chips of the fields selected in a group. */
  groupFields(group: string): Locator {
    return this.groupBlock(group).locator('xpath=following-sibling::div[1]').locator('.oxd-chip');
  }

  groupHeaderSwitch(group: string): Locator {
    return this.groupBlock(group)
      .locator('xpath=following-sibling::div[2]')
      .locator('input[type="checkbox"]');
  }

  @step('Open Add Report')
  async openNew(): Promise<void> {
    this.path = configPaths.defineReport;
    await this.waitForNameList(() => this.page.goto(this.path));
  }

  /** The form loads every report name (`?limit=0`) for its "Already exists" check. */
  async waitForNameList(action: () => Promise<unknown>): Promise<void> {
    await withDataLoad(this.page, /\/api\/v2\/pim\/reports\/defined\?limit=0/, action);
    await expect(this.title).toBeVisible();
    await this.waitForReady();
  }

  @step('Type the report name {0}')
  async fillName(name: string): Promise<void> {
    await this.reportName.fill(name);
    await this.title.click();
  }

  @step('Add the criterion {0} = {1}')
  async addCriterion(name: string, value: string): Promise<void> {
    await this.selectionCriteria.choose(name);
    await this.addCriterionButton.click();
    await this.criterion(name).choose(value);
  }

  @step('Add display field {0} > {1}')
  async addDisplayField(group: string, field: string): Promise<void> {
    await this.displayFieldGroup.choose(group);
    await this.displayField.choose(field);
    await this.addDisplayFieldButton.click();
    await expect(this.groupFields(group).filter({ hasText: field })).toHaveCount(1);
  }

  @step('Turn Include Header on for {0}')
  async includeHeader(group: string): Promise<void> {
    const box = this.groupHeaderSwitch(group);
    if (!(await box.isChecked())) {
      await this.groupBlock(group)
        .locator('xpath=following-sibling::div[2]')
        .locator('.oxd-switch-input')
        .click();
    }
    await expect(box).toBeChecked();
  }

  @step('Define the report {0}')
  async define(def: ReportDefinition): Promise<void> {
    await this.fillName(def.name);
    for (const [name, value] of Object.entries(def.criteria ?? {})) await this.addCriterion(name, value);
    for (const [group, fields] of Object.entries(def.displayFields ?? {})) {
      for (const field of fields) await this.addDisplayField(group, field);
    }
    for (const group of def.includeHeader ?? []) await this.includeHeader(group);
  }

  @step('Click Save')
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /** Saves; the app opens the report output (`displayPredefinedReport/<id>`). Returns the toast and id. */
  @step('Save the report')
  async save(): Promise<{ toast: { title: string; message: string }; id: number }> {
    const [toast] = await Promise.all([this.toast.capture(), this.clickSave()]);
    await expect(this.page).toHaveURL(/\/pim\/displayPredefinedReport\/\d+$/, { timeout: 20_000 });
    const id = Number(this.page.url().match(/displayPredefinedReport\/(\d+)$/)?.[1]);
    return { toast, id };
  }

  /** Options of a select, without the `-- Select --` placeholder. */
  async optionsOf(field: FormField): Promise<string[]> {
    return readSelectOptions(field);
  }

  // ---- assertions ----

  async expectTitle(title: 'Add Report' | 'Edit Report'): Promise<void> {
    await expect(this.title).toHaveText(title);
  }

  async expectNameError(message: string): Promise<void> {
    await this.reportName.expectError(message);
  }

  async expectNoNameError(): Promise<void> {
    await this.reportName.expectNoError();
  }

  async expectStillOnForm(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.page).toHaveURL(/\/pim\/definePredefinedReport(\/\d+)?$/);
  }

  /** The form shows the given definition (edit pre-fill). */
  async expectDefinition(def: ReportDefinition): Promise<void> {
    await expect(this.reportNameInput).toHaveValue(def.name);
    for (const [name, value] of Object.entries(def.criteria ?? {})) {
      await expect(this.criterion(name).select).toHaveText(value);
    }
    for (const [group, fields] of Object.entries(def.displayFields ?? {})) {
      await expect(this.groupFields(group)).toHaveText(fields);
    }
    for (const group of def.includeHeader ?? []) await expect(this.groupHeaderSwitch(group)).toBeChecked();
  }
}
