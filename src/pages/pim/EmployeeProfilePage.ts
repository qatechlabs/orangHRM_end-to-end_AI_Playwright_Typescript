import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { PROFILE_URL, pimPaths } from './pimPaths';
import { withDataLoad } from './profileHelpers';

export type ProfileTab =
  | 'Personal Details'
  | 'Contact Details'
  | 'Emergency Contacts'
  | 'Dependents'
  | 'Immigration'
  | 'Job'
  | 'Salary'
  | 'Report-to'
  | 'Qualifications'
  | 'Memberships';

/**
 * Employee profile shell (header with name + photo, tab navigation) and the Personal Details tab
 * that opens first. Tab-specific page objects for later groups can extend this class and override
 * `path` via `forEmployee`.
 */
export class EmployeeProfilePage extends BasePage {
  path = '';

  readonly content: Locator;
  readonly headerName: Locator;
  readonly headerPhoto: Locator;
  readonly tabs: Locator;
  readonly firstName: Locator;
  readonly middleName: Locator;
  readonly lastName: Locator;
  readonly employeeId: FormField;

  constructor(page: Page) {
    super(page);
    this.content = page.locator('.oxd-layout-context');
    this.headerName = page.locator('.orangehrm-edit-employee-name h6');
    // The top bar avatar shares the alt text; scope to the page content.
    this.headerPhoto = this.content.getByAltText('profile picture').first();
    this.tabs = page.locator('.orangehrm-tabs-item');
    this.firstName = this.content.getByPlaceholder('First Name');
    this.middleName = this.content.getByPlaceholder('Middle Name');
    this.lastName = this.content.getByPlaceholder('Last Name');
    this.employeeId = this.field('Employee Id');
  }

  tab(name: ProfileTab): Locator {
    return this.tabs.filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });
  }

  /** empNumber from the current profile URL. */
  empNumber(): number {
    const match = this.page.url().match(PROFILE_URL);
    if (!match) throw new Error(`Not on an employee profile: ${this.page.url()}`);
    return Number(match[1]);
  }

  @step('Open Personal Details of employee {0}')
  async openFor(empNumber: number): Promise<this> {
    this.path = pimPaths.personalDetails(empNumber);
    // The shell (header, tabs) renders before the employee data returns; on a slow demo the header
    // stays empty until `personal-details` answers, so wait for that response first.
    await withDataLoad(this.page, new RegExp(`/api/v2/pim/employees/${empNumber}/personal-details`), () =>
      this.open(),
    );
    await this.waitForPersonalDetails();
    return this;
  }

  @step('Open the {0} tab')
  async openTab(name: ProfileTab): Promise<void> {
    await this.tab(name).click();
    await this.waitForReady();
  }

  @step('Click the profile photo')
  async clickPhoto(): Promise<void> {
    await this.headerPhoto.click();
  }

  /** The Personal Details form fills its inputs after the page shell renders. */
  async waitForPersonalDetails(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
    await this.waitForReady();
    await expect(this.headerName).not.toBeEmpty();
    await expect(this.firstName).not.toHaveValue('');
  }

  /** Natural width of the header photo once loaded (0 = broken image). */
  async headerPhotoWidth(): Promise<number> {
    await expect(this.headerPhoto).toBeVisible();
    return this.headerPhoto.evaluate((img: HTMLImageElement) =>
      img.complete ? img.naturalWidth : new Promise<number>((r) => (img.onload = () => r(img.naturalWidth))),
    );
  }

  // ---- assertions ----

  async expectOpenFor(empNumber: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/pim/viewPersonalDetails/empNumber/${empNumber}$`));
  }

  async expectHeaderName(name: string): Promise<void> {
    await expect(this.headerName).toHaveText(name);
  }

  async expectPersonalDetails(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    employeeId?: string;
  }): Promise<void> {
    await expect(this.firstName).toHaveValue(data.firstName);
    if (data.middleName !== undefined) await expect(this.middleName).toHaveValue(data.middleName);
    await expect(this.lastName).toHaveValue(data.lastName);
    if (data.employeeId !== undefined) await expect(this.employeeId.input).toHaveValue(data.employeeId);
  }

  async expectTabSelected(name: ProfileTab): Promise<void> {
    await expect(this.tab(name)).toHaveClass(/--active/);
  }
}
