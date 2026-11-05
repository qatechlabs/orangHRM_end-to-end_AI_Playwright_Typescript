import { expect, type Locator, type Page } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { typeDate } from './profileHelpers';
import { RecordTabPage } from './RecordTabPage';
import { pimDetailPaths } from './pimDetailPaths';

export interface ImmigrationForm {
  document?: 'Passport' | 'Visa';
  number?: string;
  /** UI format yyyy-dd-mm. */
  issuedDate?: string;
  expiryDate?: string;
  eligibleStatus?: string;
  issuedBy?: string;
  reviewDate?: string;
  comments?: string;
}

/** Immigration tab: "Assigned Immigration Records" list and the Add/Edit Immigration form. */
export class ImmigrationPage extends RecordTabPage {
  protected readonly resource = 'immigrations';

  readonly passport: Locator;
  readonly visa: Locator;
  readonly number: FormField;
  readonly issuedDate: FormField;
  readonly expiryDate: FormField;
  readonly eligibleStatus: FormField;
  readonly issuedBy: FormField;
  readonly reviewDate: FormField;
  readonly comments: FormField;

  constructor(page: Page) {
    super(page, 'Assigned Immigration Records', /^(Add|Edit) Immigration$/);
    this.passport = this.form.getByRole('radio', { name: 'Passport' });
    this.visa = this.form.getByRole('radio', { name: 'Visa' });
    this.number = this.field('Number');
    this.issuedDate = this.field('Issued Date');
    this.expiryDate = this.field('Expiry Date');
    this.eligibleStatus = this.field('Eligible Status');
    this.issuedBy = this.field('Issued By');
    this.reviewDate = this.field('Eligible Review Date');
    this.comments = this.field('Comments');
  }

  protected route(empNumber: number): string {
    return pimDetailPaths.immigration(empNumber);
  }

  /** The radio inputs are visually hidden; their labels take the click. */
  private documentLabel(name: 'Passport' | 'Visa'): Locator {
    return this.form.locator('.oxd-radio-wrapper label').filter({ hasText: name });
  }

  @step('Fill the immigration form {0}')
  async fillForm(data: ImmigrationForm): Promise<void> {
    if (data.document !== undefined) await this.documentLabel(data.document).click();
    if (data.number !== undefined) await this.number.fill(data.number);
    if (data.issuedDate !== undefined) await typeDate(this.issuedDate, data.issuedDate, this.formTitle);
    if (data.expiryDate !== undefined) await typeDate(this.expiryDate, data.expiryDate, this.formTitle);
    if (data.eligibleStatus !== undefined) await this.eligibleStatus.fill(data.eligibleStatus);
    if (data.issuedBy !== undefined) await this.issuedBy.choose(data.issuedBy);
    if (data.reviewDate !== undefined) await typeDate(this.reviewDate, data.reviewDate, this.formTitle);
    if (data.comments !== undefined) await this.comments.fillTextarea(data.comments);
    await this.blurForm();
  }

  // ---- assertions ----

  async expectDocument(name: 'Passport' | 'Visa'): Promise<void> {
    await expect(name === 'Passport' ? this.passport : this.visa).toBeChecked();
    await expect(name === 'Passport' ? this.visa : this.passport).not.toBeChecked();
  }

  async expectForm(
    data: Required<Pick<ImmigrationForm, 'document' | 'number' | 'issuedDate' | 'expiryDate' | 'issuedBy'>>,
  ): Promise<void> {
    await this.expectDocument(data.document);
    await expect(this.number.input).toHaveValue(data.number);
    await expect(this.issuedDate.input).toHaveValue(data.issuedDate);
    await expect(this.expiryDate.input).toHaveValue(data.expiryDate);
    await expect(this.issuedBy.select).toHaveText(data.issuedBy);
  }
}
