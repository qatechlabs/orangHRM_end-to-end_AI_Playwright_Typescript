import type { Page } from '@playwright/test';
import { AttachmentsSection } from '@pages/components/AttachmentsSection';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { configPaths } from './configPaths';
import { typeDate } from './profileHelpers';
import { RecordTabPage } from './RecordTabPage';
import { scopedField } from './scopedField';

export interface MembershipForm {
  membership?: string;
  paidBy?: 'Company' | 'Individual';
  amount?: string;
  currency?: string;
  /** UI format yyyy-dd-mm. */
  commenceDate?: string;
  renewalDate?: string;
}

/** Memberships tab: "Assigned Memberships" list, the Add/Edit Membership form and Attachments. */
export class MembershipsPage extends RecordTabPage {
  protected readonly resource = 'memberships';

  readonly membership: FormField;
  readonly paidBy: FormField;
  readonly amount: FormField;
  readonly currency: FormField;
  readonly commenceDate: FormField;
  readonly renewalDate: FormField;
  readonly attachments: AttachmentsSection;

  constructor(page: Page) {
    super(page, 'Assigned Memberships', /^(Add|Edit) Membership$/);
    this.membership = scopedField(this.form, 'Membership');
    this.paidBy = scopedField(this.form, 'Subscription Paid By');
    this.amount = scopedField(this.form, 'Subscription Amount');
    this.currency = scopedField(this.form, 'Currency');
    this.commenceDate = scopedField(this.form, 'Subscription Commence Date');
    this.renewalDate = scopedField(this.form, 'Subscription Renewal Date');
    this.attachments = new AttachmentsSection(page);
  }

  protected route(empNumber: number): string {
    return configPaths.memberships(empNumber);
  }

  @step('Fill the membership form {0}')
  async fillForm(data: MembershipForm): Promise<void> {
    if (data.membership !== undefined) await this.membership.choose(data.membership);
    if (data.paidBy !== undefined) await this.paidBy.choose(data.paidBy);
    if (data.amount !== undefined) await this.amount.fill(data.amount);
    if (data.currency !== undefined) await this.currency.choose(data.currency);
    if (data.commenceDate !== undefined) await typeDate(this.commenceDate, data.commenceDate, this.formTitle);
    if (data.renewalDate !== undefined) await typeDate(this.renewalDate, data.renewalDate, this.formTitle);
    await this.blurForm();
  }
}
