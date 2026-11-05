import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { PROFILE_URL, pimPaths } from './pimPaths';

export interface NewEmployeeForm {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  /**
   * Overwrites the pre-filled id when given. Always pass one on the shared demo: the suggested id
   * is not reserved, so a parallel save can take it first and this save then fails with 422.
   */
  employeeId?: string;
}

export interface SavedEmployee {
  empNumber: number;
  toast: { title: string; message: string };
}

export type NameField = 'First Name' | 'Middle Name' | 'Last Name';

export interface LoginForm {
  username?: string;
  password?: string;
  /** Defaults to `password`. */
  confirmPassword?: string;
  status?: 'Enabled' | 'Disabled';
}

/** PIM > Add Employee, including the photo picker and "Create Login Details". */
export class AddEmployeePage extends BasePage {
  readonly path = pimPaths.addEmployee;

  readonly heading: Locator;
  readonly fullNameLabel: Locator;
  readonly firstName: Locator;
  readonly middleName: Locator;
  readonly lastName: Locator;
  readonly employeeId: FormField;
  readonly photo: Locator;
  readonly photoInput: Locator;
  readonly photoAddButton: Locator;
  readonly photoHint: Locator;
  readonly photoError: Locator;
  readonly requiredHint: Locator;
  readonly createLoginSwitch: Locator;
  readonly createLoginCheckbox: Locator;
  readonly username: FormField;
  readonly statusGroup: FormField;
  readonly password: FormField;
  readonly confirmPassword: FormField;
  readonly passwordInputs: Locator;
  readonly strengthMeter: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    const form = page.locator('form');
    this.heading = page.getByRole('heading', { name: 'Add Employee' });
    this.fullNameLabel = form.locator('label').filter({ hasText: 'Employee Full Name' });
    this.firstName = page.getByPlaceholder('First Name');
    this.middleName = page.getByPlaceholder('Middle Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.employeeId = this.field('Employee Id');
    this.photo = form.getByAltText('profile picture');
    this.photoInput = form.locator('input[type="file"]');
    this.photoAddButton = form.locator('.employee-image-action');
    this.photoHint = form.getByText(/^Accepts jpg/);
    this.photoError = form.locator('.orangehrm-employee-image .oxd-input-field-error-message');
    this.requiredHint = form.getByText('* Required', { exact: true });
    this.createLoginSwitch = form.locator('.oxd-switch-input');
    this.createLoginCheckbox = form.locator('.oxd-switch-wrapper input[type="checkbox"]');
    this.username = this.field('Username');
    this.statusGroup = this.field('Status');
    this.password = this.field('Password');
    this.confirmPassword = this.field('Confirm Password');
    this.passwordInputs = form.locator('input[type="password"]');
    this.strengthMeter = page.locator('.orangehrm-password-chip');
    this.saveButton = this.button('Save');
    this.cancelButton = this.button('Cancel');
  }

  nameInput(input: NameField): Locator {
    return this.page.getByPlaceholder(input, { exact: true });
  }

  /** Validation message under one of the name inputs (each has its own nested input group). */
  nameError(input: NameField): Locator {
    return this.groupOf(this.nameInput(input)).locator('.oxd-input-field-error-message');
  }

  statusRadio(status: 'Enabled' | 'Disabled'): Locator {
    return this.page.locator('.oxd-radio-wrapper').filter({ hasText: status }).locator('input[type="radio"]');
  }

  @step('Open Add Employee')
  override async open(): Promise<this> {
    await super.open();
    await expect(this.firstName).toBeEditable();
    // The Employee Id is pre-filled asynchronously; wait for it so later fills are not overwritten.
    await expect(this.employeeId.input).not.toHaveValue('');
    return this;
  }

  @step('Fill the employee form {0}')
  async fillForm(data: NewEmployeeForm): Promise<void> {
    if (data.firstName !== undefined) await this.firstName.fill(data.firstName);
    if (data.middleName !== undefined) await this.middleName.fill(data.middleName);
    if (data.lastName !== undefined) await this.lastName.fill(data.lastName);
    if (data.employeeId !== undefined) await this.employeeId.fill(data.employeeId);
  }

  @step('Upload profile photo {0}')
  async uploadPhoto(filePath: string): Promise<void> {
    await this.photoInput.setInputFiles(filePath);
  }

  @step('Turn Create Login Details {0}')
  async setCreateLogin(on: boolean): Promise<void> {
    if ((await this.createLoginCheckbox.isChecked()) !== on) await this.createLoginSwitch.click();
  }

  @step('Fill login details {0}')
  async fillLogin(login: LoginForm): Promise<void> {
    await this.setCreateLogin(true);
    if (login.username !== undefined) await this.username.fill(login.username);
    if (login.status)
      await this.page
        .locator('.oxd-radio-wrapper')
        .filter({ hasText: login.status })
        .locator('label')
        .click();
    if (login.password !== undefined) await this.password.fill(login.password);
    const confirm = login.confirmPassword ?? login.password;
    if (confirm !== undefined) await this.confirmPassword.fill(confirm);
  }

  /** Types a username and waits for the server-side uniqueness check the form runs on it. */
  @step('Enter username {0} and wait for the uniqueness check')
  async fillUsernameChecked(username: string): Promise<void> {
    await this.setCreateLogin(true);
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/core/validation/unique') && r.url().includes('entityName=User'),
      ),
      this.username.fill(username),
    ]);
  }

  /** Types an Employee Id and waits for the server-side uniqueness check. */
  @step('Enter Employee Id {0} and wait for the uniqueness check')
  async fillEmployeeIdChecked(employeeId: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/core/validation/unique') && r.url().includes('entityName=Employee'),
      ),
      this.employeeId.fill(employeeId),
    ]);
  }

  @step('Click Save')
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Saves and waits for the new employee's profile. Returns the empNumber and the toast shown
   * before the redirect (the redirect removes it, so it is captured here).
   */
  @step('Save and open the new profile')
  async saveAndOpenProfile(): Promise<SavedEmployee> {
    await this.save();
    const toast = await this.toast.capture();
    await this.page.waitForURL(PROFILE_URL);
    return { empNumber: Number(this.page.url().match(PROFILE_URL)![1]), toast };
  }

  @step('Add employee {0}')
  async addEmployee(data: NewEmployeeForm, login?: LoginForm): Promise<SavedEmployee> {
    await this.fillForm(data);
    if (login) await this.fillLogin(login);
    return this.saveAndOpenProfile();
  }

  @step('Click Cancel')
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  private groupOf(control: Locator): Locator {
    // The innermost .oxd-input-group containing the control is the last match in DOM order.
    return this.page.locator('.oxd-input-group').filter({ has: control }).last();
  }

  // ---- assertions ----

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pim\/addEmployee/);
    await expect(this.heading).toBeVisible();
  }

  /** Save was blocked: still on Add Employee. */
  async expectNotSaved(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pim\/addEmployee/);
    await expect(this.saveButton).toBeVisible();
  }

  async expectLoginFieldsHidden(): Promise<void> {
    await expect(this.username.root).toBeHidden();
    await expect(this.statusGroup.root).toBeHidden();
    await expect(this.passwordInputs).toHaveCount(0);
  }

  async expectLoginFieldsVisible(): Promise<void> {
    await expect(this.username.input).toBeVisible();
    await expect(this.statusGroup.root).toBeVisible();
    await expect(this.password.input).toHaveAttribute('type', 'password');
    await expect(this.confirmPassword.input).toHaveAttribute('type', 'password');
  }

  async expectPhotoIsPlaceholder(): Promise<void> {
    await expect(this.photo).toHaveAttribute('src', /\/images\/default-photo\.png$/);
  }

  async expectPhotoPreview(): Promise<void> {
    await expect(this.photo).toHaveAttribute('src', /^data:image\//);
  }
}
