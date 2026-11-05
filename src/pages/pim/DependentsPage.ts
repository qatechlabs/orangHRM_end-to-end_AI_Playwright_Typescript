import { expect, type Page } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { typeDate } from './profileHelpers';
import { RecordTabPage } from './RecordTabPage';
import { pimDetailPaths } from './pimDetailPaths';

export interface DependentForm {
  name?: string;
  relationship?: 'Child' | 'Other';
  /** "Please Specify" (only shown for Relationship = Other). */
  specify?: string;
  /** UI format yyyy-dd-mm. */
  dateOfBirth?: string;
}

/** Dependents tab: "Assigned Dependents" list and the Add/Edit Dependent form. */
export class DependentsPage extends RecordTabPage {
  protected readonly resource = 'dependents';

  readonly name: FormField;
  readonly relationship: FormField;
  readonly pleaseSpecify: FormField;
  readonly dateOfBirth: FormField;

  constructor(page: Page) {
    super(page, 'Assigned Dependents', /^(Add|Edit) Dependent$/);
    this.name = this.field('Name');
    this.relationship = this.field('Relationship');
    this.pleaseSpecify = this.field('Please Specify');
    this.dateOfBirth = this.field('Date of Birth');
  }

  protected route(empNumber: number): string {
    return pimDetailPaths.dependents(empNumber);
  }

  @step('Fill the dependent form {0}')
  async fillForm(data: DependentForm): Promise<void> {
    if (data.name !== undefined) await this.name.fill(data.name);
    if (data.relationship !== undefined) await this.relationship.choose(data.relationship);
    if (data.specify !== undefined) await this.pleaseSpecify.fill(data.specify);
    if (data.dateOfBirth !== undefined) await typeDate(this.dateOfBirth, data.dateOfBirth, this.formTitle);
    await this.blurForm();
  }

  // ---- assertions ----

  async expectForm(data: Required<Omit<DependentForm, 'specify'>> & { specify?: string }): Promise<void> {
    await expect(this.name.input).toHaveValue(data.name);
    await expect(this.relationship.select).toHaveText(data.relationship);
    if (data.specify !== undefined) await expect(this.pleaseSpecify.input).toHaveValue(data.specify);
    await expect(this.dateOfBirth.input).toHaveValue(data.dateOfBirth);
  }
}
