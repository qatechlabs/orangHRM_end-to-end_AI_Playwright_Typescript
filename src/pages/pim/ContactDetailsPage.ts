import { expect, type Locator, type Page } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { withDataLoad } from './profileHelpers';
import { pimDetailPaths } from './pimDetailPaths';

export interface ContactDetailsForm {
  street1?: string;
  street2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  home?: string;
  mobile?: string;
  work?: string;
  workEmail?: string;
  otherEmail?: string;
}

/** Labels of the Contact Details fields, keyed like ContactDetailsForm. */
export const contactLabels = {
  street1: 'Street 1',
  street2: 'Street 2',
  city: 'City',
  province: 'State/Province',
  zip: 'Zip/Postal Code',
  country: 'Country',
  home: 'Home',
  mobile: 'Mobile',
  work: 'Work',
  workEmail: 'Work Email',
  otherEmail: 'Other Email',
} as const;

/** Contact Details tab: address, telephones, emails and one Save ("Successfully Updated"). */
export class ContactDetailsPage extends EmployeeProfilePage {
  readonly heading: Locator;
  readonly form: Locator;
  readonly saveButton: Locator;
  readonly street1: FormField;
  readonly street2: FormField;
  readonly city: FormField;
  readonly province: FormField;
  readonly zip: FormField;
  readonly country: FormField;
  readonly home: FormField;
  readonly mobile: FormField;
  readonly work: FormField;
  readonly workEmail: FormField;
  readonly otherEmail: FormField;

  constructor(page: Page) {
    super(page);
    this.heading = this.content.getByRole('heading', { name: 'Contact Details', exact: true });
    this.form = this.heading.locator('xpath=following-sibling::form[1]');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.street1 = this.field(contactLabels.street1);
    this.street2 = this.field(contactLabels.street2);
    this.city = this.field(contactLabels.city);
    this.province = this.field(contactLabels.province);
    this.zip = this.field(contactLabels.zip);
    this.country = this.field(contactLabels.country);
    this.home = this.field(contactLabels.home);
    this.mobile = this.field(contactLabels.mobile);
    this.work = this.field(contactLabels.work);
    this.workEmail = this.field(contactLabels.workEmail);
    this.otherEmail = this.field(contactLabels.otherEmail);
  }

  /** Field by its on-screen label (data-driven validation tests). */
  fieldByLabel(label: string): FormField {
    return this.field(label);
  }

  private async waitForData(empNumber: number, action: () => Promise<unknown>): Promise<void> {
    await withDataLoad(this.page, `/pim/employee/${empNumber}/contact-details`, action);
    await this.waitForReady();
    await expect(this.heading).toBeVisible();
  }

  @step('Open Contact Details of employee {0}')
  async load(empNumber: number): Promise<this> {
    this.path = pimDetailPaths.contactDetails(empNumber);
    await this.waitForData(empNumber, () => this.page.goto(this.path));
    return this;
  }

  @step('Open the Contact Details tab')
  async openFromTab(empNumber: number): Promise<void> {
    await this.waitForData(empNumber, () => this.tab('Contact Details').click());
  }

  @step('Reload Contact Details')
  async reload(empNumber: number): Promise<void> {
    await this.waitForData(empNumber, () => this.page.reload());
  }

  @step('Fill Contact Details {0}')
  async fillForm(data: ContactDetailsForm): Promise<void> {
    if (data.country !== undefined) await this.country.choose(data.country);
    for (const key of Object.keys(contactLabels) as (keyof ContactDetailsForm)[]) {
      const value = data[key];
      if (key === 'country' || value === undefined) continue;
      await this.field(contactLabels[key]).fill(value);
    }
    await this.blur();
  }

  /** Fills one field and blurs it so its validation (sync or async) runs. */
  @step('Enter {1} in {0}')
  async enter(label: string, value: string): Promise<void> {
    await this.fieldByLabel(label).fill(value);
    await this.blur();
  }

  /** Clicks the heading to blur the focused field. */
  async blur(): Promise<void> {
    await this.heading.click();
  }

  @step('Save Contact Details')
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  // ---- assertions ----

  async expectForm(data: ContactDetailsForm): Promise<void> {
    for (const key of Object.keys(contactLabels) as (keyof ContactDetailsForm)[]) {
      const value = data[key];
      if (value === undefined) continue;
      const field = this.field(contactLabels[key]);
      if (key === 'country') await expect(field.select).toHaveText(value);
      else await expect(field.input).toHaveValue(value);
    }
  }

  /** PIM-FR-011-AC5: a state/province drop-down (oxd-select) replaces the text input. */
  async expectStateDropdown(): Promise<void> {
    await expect(this.province.select).toBeVisible();
    await expect(this.province.input).toHaveCount(0);
  }
}
