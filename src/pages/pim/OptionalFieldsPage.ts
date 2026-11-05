import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { OptionalFieldSettings } from '@api/types/pim-optional';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { PersonalDetailsPage } from './PersonalDetailsPage';
import { withDataLoad } from './profileHelpers';
import { scopedField } from './scopedField';

export const optionalFieldPaths = {
  configure: '/web/index.php/pim/configurePim',
  taxExemptions: (empNumber: number) => `/web/index.php/pim/viewUsTaxExemptions/empNumber/${empNumber}`,
};

/** On-screen label of each switch, keyed like the API settings. */
export const optionalSwitchLabels: Record<keyof OptionalFieldSettings, string> = {
  pimShowDeprecatedFields: 'Show Nick Name, Smoker and Military Service in Personal Details',
  showSSN: 'Show SSN field in Personal Details',
  showSIN: 'Show SIN field in Personal Details',
  showTaxExemptions: 'Show US Tax Exemptions menu',
};

/**
 * PIM > Configuration > Optional Fields (`/pim/configurePim`): four switches and one Save
 * ("Successfully Saved"). The settings are global: tests use the `optionalFieldsGuard` fixture.
 */
export class OptionalFieldsPage extends BasePage {
  readonly path = optionalFieldPaths.configure;

  readonly content: Locator;
  readonly form: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.content = page.locator('.oxd-layout-context');
    this.form = this.content.locator('form');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
  }

  private row(key: keyof OptionalFieldSettings): Locator {
    return this.form
      .locator('.orangehrm-optional-field-row')
      .filter({ has: this.page.getByText(optionalSwitchLabels[key], { exact: true }) });
  }

  /** Checkbox behind a switch (state). */
  switchInput(key: keyof OptionalFieldSettings): Locator {
    return this.row(key).locator('.oxd-switch-wrapper input[type="checkbox"]');
  }

  /** Visible switch (click target). */
  switchToggle(key: keyof OptionalFieldSettings): Locator {
    return this.row(key).locator('.oxd-switch-input');
  }

  @step('Open Optional Fields')
  async load(): Promise<this> {
    await withDataLoad(this.page, '/api/v2/pim/optional-field', () => this.page.goto(this.path));
    await this.waitForReady();
    await expect(this.switchToggle('pimShowDeprecatedFields')).toBeVisible();
    return this;
  }

  /** Sets the given switches (others untouched); does not save. */
  @step('Set optional field switches {0}')
  async setSwitches(settings: Partial<OptionalFieldSettings>): Promise<void> {
    for (const [key, on] of Object.entries(settings) as [keyof OptionalFieldSettings, boolean][]) {
      if ((await this.switchInput(key).isChecked()) !== on) await this.switchToggle(key).click();
      if (on) await expect(this.switchInput(key)).toBeChecked();
      else await expect(this.switchInput(key)).not.toBeChecked();
    }
  }

  /** Clicks Save and returns the toast with the PUT body that was sent. */
  @step('Save Optional Fields')
  async save(): Promise<{ toast: { title: string; message: string }; sent: OptionalFieldSettings }> {
    const [request, toast] = await Promise.all([
      this.page.waitForRequest(
        (r) => r.method() === 'PUT' && r.url().includes('/api/v2/pim/optional-field'),
      ),
      this.toast.capture(),
      this.saveButton.click(),
    ]);
    return { toast, sent: request.postDataJSON() as OptionalFieldSettings };
  }

  @step('Set optional fields {0} and save')
  async apply(
    settings: Partial<OptionalFieldSettings>,
  ): Promise<{ toast: { title: string; message: string }; sent: OptionalFieldSettings }> {
    await this.load();
    await this.setSwitches(settings);
    return this.save();
  }

  // ---- assertions ----

  async expectSwitches(settings: Partial<OptionalFieldSettings>): Promise<void> {
    for (const [key, on] of Object.entries(settings) as [keyof OptionalFieldSettings, boolean][]) {
      if (on) await expect(this.switchInput(key)).toBeChecked();
      else await expect(this.switchInput(key)).not.toBeChecked();
    }
  }
}

export interface OptionalPersonalValues {
  nickname: string;
  ssn: string;
  sin: string;
  militaryService: string;
  smoker: boolean;
}

/**
 * Personal Details with the optional fields switched on: Nickname, SSN Number, SIN Number,
 * Military Service and the Smoker checkbox (labelled "Yes"). They belong to the main form and
 * are saved with its Save ("Successfully Updated").
 */
export class OptionalPersonalDetailsPage extends PersonalDetailsPage {
  readonly nickname: FormField;
  readonly ssn: FormField;
  readonly sin: FormField;
  readonly militaryService: FormField;
  readonly smoker: FormField;
  readonly smokerCheckbox: Locator;
  readonly taxExemptionsTab: Locator;
  readonly taxExemptionsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.nickname = scopedField(this.form, 'Nickname');
    this.ssn = scopedField(this.form, 'SSN Number');
    this.sin = scopedField(this.form, 'SIN Number');
    this.militaryService = scopedField(this.form, 'Military Service');
    this.smoker = scopedField(this.form, 'Smoker');
    this.smokerCheckbox = this.smoker.root.locator('input[type="checkbox"]');
    this.taxExemptionsTab = this.tabs.filter({ hasText: /^\s*Tax Exemptions\s*$/ });
    this.taxExemptionsHeading = this.content.getByRole('heading', { name: 'Tax Exemptions', exact: true });
  }

  /** The five optional controls, for visibility checks. */
  optionalFields(): FormField[] {
    return [this.nickname, this.ssn, this.sin, this.militaryService, this.smoker];
  }

  /** Opens Personal Details and waits for the personal-details data to be loaded into the form. */
  @step('Open Personal Details of employee {0} (optional fields)')
  async openDetailsFor(empNumber: number): Promise<void> {
    await withDataLoad(this.page, `/api/v2/pim/employees/${empNumber}/personal-details`, () =>
      this.openFor(empNumber),
    );
  }

  @step('Fill the optional fields {0}')
  async fillOptional(values: OptionalPersonalValues): Promise<void> {
    await this.nickname.fill(values.nickname);
    await this.ssn.fill(values.ssn);
    await this.sin.fill(values.sin);
    await this.militaryService.fill(values.militaryService);
    await this.smoker.check(values.smoker);
    await this.heading.click();
  }

  @step('Open the Tax Exemptions tab')
  async openTaxExemptionsTab(): Promise<void> {
    await this.taxExemptionsTab.click();
    await this.waitForReady();
  }

  // ---- assertions ----

  async expectOptionalFieldsVisible(): Promise<void> {
    for (const f of this.optionalFields()) await expect(f.root).toBeVisible();
  }

  async expectOptionalFieldsHidden(): Promise<void> {
    await expect(this.firstName).not.toHaveValue('');
    for (const f of this.optionalFields()) await expect(f.root).toHaveCount(0);
  }

  async expectOptionalValues(values: OptionalPersonalValues): Promise<void> {
    await expect(this.nickname.input).toHaveValue(values.nickname);
    await expect(this.ssn.input).toHaveValue(values.ssn);
    await expect(this.sin.input).toHaveValue(values.sin);
    await expect(this.militaryService.input).toHaveValue(values.militaryService);
    if (values.smoker) await expect(this.smokerCheckbox).toBeChecked();
    else await expect(this.smokerCheckbox).not.toBeChecked();
  }

  /** `soft` keeps the test going (BRD checks the app is known to contradict). */
  async expectTaxExemptionsTab(options: { soft?: boolean } = {}): Promise<void> {
    await expect(this.tabs.first()).toBeVisible();
    await (options.soft ? expect.soft : expect)(this.taxExemptionsTab).toBeVisible();
  }

  async expectNoTaxExemptionsTab(): Promise<void> {
    await expect(this.tab('Personal Details')).toBeVisible();
    await expect(this.taxExemptionsTab).toHaveCount(0);
  }

  async expectOnTaxExemptions(empNumber: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${optionalFieldPaths.taxExemptions(empNumber)}$`));
    await expect(this.taxExemptionsHeading).toBeVisible();
    await expect(this.taxExemptionsTab).toHaveClass(/--active/);
  }
}
