import { expect, type Locator, type Page } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { typeDate } from './profileHelpers';

export type GenderOption = 'Male' | 'Female';
export type MaritalStatus = 'Single' | 'Married' | 'Other';

export interface PersonalDetailsForm {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  employeeId?: string;
  otherId?: string;
  licenseNumber?: string;
  /** UI format yyyy-dd-mm. */
  licenseExpiry?: string;
  nationality?: string;
  maritalStatus?: MaritalStatus;
  /** UI format yyyy-dd-mm. */
  dateOfBirth?: string;
  gender?: GenderOption;
}

/**
 * Personal Details tab: the main form (names, ids, license, nationality, marital status, birth
 * date, gender) with its own Save ("Successfully Updated"). Custom Fields and Attachments below
 * it are separate forms and are not saved by `save()`.
 */
export class PersonalDetailsPage extends EmployeeProfilePage {
  readonly heading: Locator;
  readonly form: Locator;
  readonly saveButton: Locator;
  readonly otherId: FormField;
  readonly licenseNumber: FormField;
  readonly licenseExpiry: FormField;
  readonly nationality: FormField;
  readonly maritalStatus: FormField;
  readonly dateOfBirth: FormField;
  readonly gender: FormField;

  constructor(page: Page) {
    super(page);
    this.heading = this.content.getByRole('heading', { name: 'Personal Details', exact: true });
    this.form = this.heading.locator('xpath=following-sibling::form[1]');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.otherId = this.field('Other Id');
    this.licenseNumber = this.field("Driver's License Number");
    this.licenseExpiry = this.field('License Expiry Date');
    this.nationality = this.field('Nationality');
    this.maritalStatus = this.field('Marital Status');
    this.dateOfBirth = this.field('Date of Birth');
    this.gender = this.field('Gender');
  }

  genderRadio(name: GenderOption): Locator {
    return this.form.getByRole('radio', { name, exact: true });
  }

  /** Field by its on-screen label (data-driven validation tests). */
  fieldByLabel(label: string): FormField {
    return label === 'Employee Id' ? this.employeeId : this.field(label);
  }

  @step('Reload Personal Details')
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPersonalDetails();
  }

  @step('Fill Personal Details {0}')
  async fillForm(data: PersonalDetailsForm): Promise<void> {
    if (data.firstName !== undefined) await this.firstName.fill(data.firstName);
    if (data.middleName !== undefined) await this.middleName.fill(data.middleName);
    if (data.lastName !== undefined) await this.lastName.fill(data.lastName);
    if (data.employeeId !== undefined) await this.employeeId.fill(data.employeeId);
    if (data.otherId !== undefined) await this.otherId.fill(data.otherId);
    if (data.licenseNumber !== undefined) await this.licenseNumber.fill(data.licenseNumber);
    if (data.licenseExpiry !== undefined)
      await typeDate(this.licenseExpiry, data.licenseExpiry, this.heading);
    if (data.nationality !== undefined) await this.nationality.choose(data.nationality);
    if (data.maritalStatus !== undefined) await this.maritalStatus.choose(data.maritalStatus);
    if (data.dateOfBirth !== undefined) await typeDate(this.dateOfBirth, data.dateOfBirth, this.heading);
    if (data.gender !== undefined) {
      // The radio input is visually hidden; its label takes the click.
      await this.form.locator('.oxd-radio-wrapper label').filter({ hasText: data.gender }).click();
    }
    await this.heading.click();
  }

  @step('Save Personal Details')
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  // ---- assertions ----

  async expectForm(data: PersonalDetailsForm): Promise<void> {
    await this.expectPersonalDetails({
      firstName: data.firstName ?? (await this.firstName.inputValue()),
      middleName: data.middleName,
      lastName: data.lastName ?? (await this.lastName.inputValue()),
      employeeId: data.employeeId,
    });
    if (data.otherId !== undefined) await expect(this.otherId.input).toHaveValue(data.otherId);
    if (data.licenseNumber !== undefined)
      await expect(this.licenseNumber.input).toHaveValue(data.licenseNumber);
    if (data.licenseExpiry !== undefined)
      await expect(this.licenseExpiry.input).toHaveValue(data.licenseExpiry);
    if (data.nationality !== undefined) await expect(this.nationality.select).toHaveText(data.nationality);
    if (data.maritalStatus !== undefined)
      await expect(this.maritalStatus.select).toHaveText(data.maritalStatus);
    if (data.dateOfBirth !== undefined) await expect(this.dateOfBirth.input).toHaveValue(data.dateOfBirth);
    if (data.gender !== undefined) await expect(this.genderRadio(data.gender)).toBeChecked();
  }

  /** Male and Female radios, none selected (fresh employee). */
  async expectGenderOptions(): Promise<void> {
    await expect(this.genderRadio('Male')).toBeAttached();
    await expect(this.genderRadio('Female')).toBeAttached();
    await expect(this.gender.root.locator('.oxd-radio-wrapper')).toHaveText(['Male', 'Female']);
  }
}
