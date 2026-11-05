import { expect, type Page } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { RecordTabPage } from './RecordTabPage';
import { pimDetailPaths } from './pimDetailPaths';

export interface EmergencyContactForm {
  name?: string;
  relationship?: string;
  homeTelephone?: string;
  mobile?: string;
  workTelephone?: string;
}

/** Emergency Contacts tab: "Assigned Emergency Contacts" list and the Save/Edit Emergency Contact form. */
export class EmergencyContactsPage extends RecordTabPage {
  protected readonly resource = 'emergency-contacts';

  readonly name: FormField;
  readonly relationship: FormField;
  readonly homeTelephone: FormField;
  readonly mobile: FormField;
  readonly workTelephone: FormField;

  constructor(page: Page) {
    super(page, 'Assigned Emergency Contacts', /^(Save|Edit) Emergency Contact$/);
    this.name = this.field('Name');
    this.relationship = this.field('Relationship');
    this.homeTelephone = this.field('Home Telephone');
    this.mobile = this.field('Mobile');
    this.workTelephone = this.field('Work Telephone');
  }

  protected route(empNumber: number): string {
    return pimDetailPaths.emergencyContacts(empNumber);
  }

  @step('Fill the emergency contact form {0}')
  async fillForm(data: EmergencyContactForm): Promise<void> {
    if (data.name !== undefined) await this.name.fill(data.name);
    if (data.relationship !== undefined) await this.relationship.fill(data.relationship);
    if (data.homeTelephone !== undefined) await this.homeTelephone.fill(data.homeTelephone);
    if (data.mobile !== undefined) await this.mobile.fill(data.mobile);
    if (data.workTelephone !== undefined) await this.workTelephone.fill(data.workTelephone);
    await this.blurForm();
  }

  @step('Add emergency contact {0}')
  async add(data: EmergencyContactForm): Promise<void> {
    await this.clickAdd();
    await this.fillForm(data);
    await this.save();
  }

  // ---- assertions ----

  async expectForm(data: Required<EmergencyContactForm>): Promise<void> {
    await expect(this.name.input).toHaveValue(data.name);
    await expect(this.relationship.input).toHaveValue(data.relationship);
    await expect(this.homeTelephone.input).toHaveValue(data.homeTelephone);
    await expect(this.mobile.input).toHaveValue(data.mobile);
    await expect(this.workTelephone.input).toHaveValue(data.workTelephone);
  }
}
