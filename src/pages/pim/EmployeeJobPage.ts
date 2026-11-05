import { expect, type Download, type Locator, type Page } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';
import { step } from '@utils/step';
import { scopedField } from './scopedField';
import { toastOf } from './jobRequests';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { jobPaths } from './jobPaths';
import { withDataLoad } from './profileHelpers';

export interface JobSelection {
  /** UI date, yyyy-dd-mm. */
  joinedDate?: string;
  jobTitle?: string;
  jobCategory?: string;
  subUnit?: string;
  location?: string;
  employmentStatus?: string;
}

export interface ContractInput {
  /** UI dates, yyyy-dd-mm. */
  startDate?: string;
  endDate?: string;
  file?: string;
}

export interface TerminationInput {
  /** UI date, yyyy-dd-mm. */
  date?: string;
  reason?: string;
  note?: string;
}

export type ContractFileAction = 'Keep Current' | 'Delete Current' | 'Replace Current';

/** Visible texts of the Job tab (verified on OrangeHRM 5.9; the section title typo is the app's). */
export const jobText = {
  terminationSection: 'Employee Termination / Activiation',
  contractEndBeforeStart: 'End date should be after Start date',
  attachmentSizeExceeded: 'Attachment Size Exceeded',
  contractHint: 'Accepts up to 1MB',
  noFile: 'No file selected',
  notDefined: 'Not Defined',
  pastEmployee: '(Past Employee)',
} as const;

/**
 * Job tab of the employee profile: job details form, employment contract (dates + file), and the
 * Termination / Activation section with its "Terminate Employment" dialog.
 */
export class EmployeeJobPage extends EmployeeProfilePage {
  readonly heading: Locator;
  /** Name block of the profile header; "(Past Employee)" is a sibling of the name. */
  readonly profileHeader: Locator;
  readonly tabContent: Locator;
  readonly form: Locator;
  readonly joinedDate: FormField;
  readonly jobTitle: FormField;
  readonly jobSpecification: FormField;
  readonly jobSpecificationFile: Locator;
  readonly jobSpecificationDownload: Locator;
  readonly jobCategory: FormField;
  readonly subUnit: FormField;
  readonly location: FormField;
  readonly employmentStatus: FormField;
  readonly contractSwitch: Locator;
  readonly contractCheckbox: Locator;
  readonly contractStart: FormField;
  readonly contractEnd: FormField;
  readonly contractDetails: FormField;
  readonly contractFileInput: Locator;
  readonly contractFileName: Locator;
  readonly contractHint: Locator;
  readonly saveButton: Locator;

  readonly terminationSection: Locator;
  readonly terminatedOn: Locator;
  readonly activateButton: Locator;
  readonly terminateButton: Locator;
  readonly terminationDialog: Locator;
  readonly terminationDialogTitle: Locator;
  readonly terminationDate: FormField;
  readonly terminationReason: FormField;
  readonly terminationNote: FormField;
  readonly terminationSave: Locator;
  readonly terminationCancel: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Job Details' });
    this.profileHeader = page.locator('.orangehrm-edit-employee-name');
    this.tabContent = page.locator('.orangehrm-edit-employee-content');
    this.form = this.tabContent.locator('form').first();
    this.joinedDate = scopedField(this.form, 'Joined Date');
    this.jobTitle = scopedField(this.form, 'Job Title');
    this.jobSpecification = scopedField(this.form, 'Job Specification');
    this.jobSpecificationFile = this.jobSpecification.root.locator('.input-container-filename');
    this.jobSpecificationDownload = this.jobSpecification.root.getByRole('button');
    this.jobCategory = scopedField(this.form, 'Job Category');
    this.subUnit = scopedField(this.form, 'Sub Unit');
    this.location = scopedField(this.form, 'Location');
    this.employmentStatus = scopedField(this.form, 'Employment Status');
    // The switch is a styled span; clicking the "Include Employment Contract Details" text does not toggle it.
    const contractRow = this.form
      .locator('.oxd-form-row')
      .filter({ hasText: 'Include Employment Contract Details' });
    this.contractSwitch = contractRow.locator('.oxd-switch-input');
    this.contractCheckbox = contractRow.locator('input[type="checkbox"]');
    this.contractStart = scopedField(this.form, 'Contract Start Date');
    this.contractEnd = scopedField(this.form, 'Contract End Date');
    this.contractDetails = scopedField(this.form, 'Contract Details');
    // "Contract Details" before a file is saved, "Upload Contract Details" after "Replace Current".
    this.contractFileInput = this.form.locator('input[type="file"]');
    this.contractFileName = this.contractDetails.root.locator('.orangehrm-file-name');
    this.contractHint = this.form.locator('.orangehrm-input-hint');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });

    this.terminationSection = this.tabContent
      .locator('.orangehrm-horizontal-padding')
      .filter({ has: page.getByRole('heading', { name: /Employee Termination/ }) });
    this.terminatedOn = this.tabContent.getByText(/Terminated on:/);
    this.activateButton = page.getByRole('button', { name: 'Activate Employment' });
    this.terminateButton = page.getByRole('button', { name: 'Terminate Employment' });
    this.terminationDialog = page.locator('.oxd-dialog-container-default');
    this.terminationDialogTitle = this.terminationDialog.locator('.oxd-text--card-title');
    this.terminationDate = scopedField(this.terminationDialog, 'Termination Date');
    this.terminationReason = scopedField(this.terminationDialog, 'Termination Reason');
    this.terminationNote = scopedField(this.terminationDialog, 'Note');
    this.terminationSave = this.terminationDialog.getByRole('button', { name: 'Save' });
    this.terminationCancel = this.terminationDialog.getByRole('button', { name: 'Cancel' });
  }

  @step('Open the Job tab of employee {0}')
  async openJobFor(empNumber: number): Promise<this> {
    this.path = jobPaths.jobDetails(empNumber);
    // The shell renders before job-details answers; wait for that GET so the form is filled.
    await withDataLoad(this.page, new RegExp(`/api/v2/pim/employees/${empNumber}/job-details`), () =>
      this.open(),
    );
    await this.waitForJobForm();
    return this;
  }

  /** The form fills its selects from job-details after the shell renders. */
  async waitForJobForm(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await this.waitForReady();
    await expect(this.form.locator('.oxd-form-loader')).toHaveCount(0);
  }

  @step('Select job details {0}')
  async fillJob(job: JobSelection): Promise<void> {
    if (job.jobTitle) await this.jobTitle.choose(job.jobTitle);
    if (job.jobCategory) await this.jobCategory.choose(job.jobCategory);
    if (job.subUnit) await this.subUnit.choose(job.subUnit);
    if (job.location) await this.location.choose(job.location);
    if (job.employmentStatus) await this.employmentStatus.choose(job.employmentStatus);
    if (job.joinedDate !== undefined) await this.joinedDate.setDate(job.joinedDate);
  }

  @step('Choose Job Title {0}')
  async chooseJobTitle(title: string): Promise<void> {
    await this.jobTitle.choose(title);
  }

  @step('Turn the employment contract switch {0}')
  async setContract(on: boolean): Promise<void> {
    if ((await this.contractCheckbox.isChecked()) !== on) await this.contractSwitch.click();
    if (on) await expect(this.contractStart.root).toBeVisible();
    else await expect(this.contractStart.root).toBeHidden();
  }

  @step('Fill contract details {0}')
  async fillContract(contract: ContractInput): Promise<void> {
    await this.setContract(true);
    if (contract.startDate !== undefined) await this.contractStart.setDate(contract.startDate);
    if (contract.endDate !== undefined) await this.contractEnd.setDate(contract.endDate);
    if (contract.file) await this.chooseContractFile(contract.file);
  }

  @step('Choose the contract file {0}')
  async chooseContractFile(file: string): Promise<void> {
    await this.contractFileInput.setInputFiles(file);
  }

  /** "Keep Current" / "Delete Current" / "Replace Current", shown once a contract file is saved. */
  contractFileOption(action: ContractFileAction): Locator {
    return this.contractDetails.root.page().locator('.oxd-radio-wrapper').filter({ hasText: action });
  }

  @step('Pick the contract file option {0}')
  async pickContractFileOption(action: ContractFileAction): Promise<void> {
    await this.contractFileOption(action).locator('label').click();
  }

  /** Clicks Save and returns the toast when one appears. Validation errors leave no toast. */
  @step('Save job details')
  async save(): Promise<{ title: string; message: string }> {
    const toast = await toastOf(this.toast, () => this.saveButton.click());
    await this.waitForJobForm();
    return toast;
  }

  /** Clicks Save when the form is expected to be rejected on the client. */
  @step('Click Save on the job form')
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  @step('Download the job specification')
  async downloadJobSpecification(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.jobSpecificationDownload.click(),
    ]);
    return download;
  }

  // ---- termination ----

  @step('Open the Terminate Employment dialog')
  async openTerminateDialog(): Promise<void> {
    await this.terminateButton.click();
    await expect(this.terminationDialog).toBeVisible();
  }

  @step('Fill the termination dialog {0}')
  async fillTermination(t: TerminationInput): Promise<void> {
    if (t.date !== undefined) await this.terminationDate.setDate(t.date);
    if (t.reason) await this.terminationReason.choose(t.reason);
    if (t.note !== undefined) await this.terminationNote.fillTextarea(t.note);
  }

  @step('Click Save in the termination dialog')
  async clickTerminationSave(): Promise<void> {
    await this.terminationSave.click();
  }

  /**
   * Fills the open dialog and saves. The page reloads by itself after the toast, so the toast is
   * captured first and the method returns once the reloaded page shows "Terminated on".
   */
  @step('Confirm termination {0}')
  async confirmTermination(t: TerminationInput): Promise<{ title: string; message: string }> {
    await this.fillTermination(t);
    const toast = await toastOf(this.toast, () => this.clickTerminationSave());
    await expect(this.terminatedOn).toBeVisible({ timeout: 20_000 });
    await this.settleAfterReload();
    return toast;
  }

  @step('Terminate employment {0}')
  async terminate(t: TerminationInput): Promise<{ title: string; message: string }> {
    await this.openTerminateDialog();
    return this.confirmTermination(t);
  }

  /** Click only (kept for callers that assert the toast themselves). */
  @step('Activate employment')
  async activateEmployment(): Promise<void> {
    await this.activateButton.click();
  }

  /** Activates and waits for the self-reload that brings "Terminate Employment" back. */
  @step('Activate employment and wait for the reload')
  async reactivate(): Promise<{ title: string; message: string }> {
    const toast = await toastOf(this.toast, () => this.activateEmployment());
    await expect(this.terminateButton).toBeVisible({ timeout: 20_000 });
    await this.settleAfterReload();
    return toast;
  }

  /**
   * The Job tab reloads itself after Terminate / Activate. Once the new state is visible, wait for
   * the reloaded document to finish loading and for the form data, so a following `page.goto` is
   * not aborted by the page's own navigation (net::ERR_ABORTED).
   */
  private async settleAfterReload(): Promise<void> {
    await this.page.waitForLoadState('load');
    await this.waitForJobForm();
    await this.page.waitForLoadState('load');
  }

  // ---- assertions ----

  async expectJob(job: JobSelection): Promise<void> {
    if (job.jobTitle) await expect(this.jobTitle.select).toHaveText(job.jobTitle);
    if (job.jobCategory) await expect(this.jobCategory.select).toHaveText(job.jobCategory);
    if (job.subUnit) await expect(this.subUnit.select).toHaveText(job.subUnit);
    if (job.location) await expect(this.location.select).toHaveText(job.location);
    if (job.employmentStatus) await expect(this.employmentStatus.select).toHaveText(job.employmentStatus);
    if (job.joinedDate) await expect(this.joinedDate.input).toHaveValue(job.joinedDate);
  }

  async expectJobSpecification(fileName: string): Promise<void> {
    await expect(this.jobSpecificationFile).toHaveText(fileName);
    await expect(this.jobSpecificationDownload).toBeVisible();
  }

  async expectNoJobSpecification(): Promise<void> {
    await expect(this.jobSpecificationFile).toHaveText(jobText.notDefined);
    await expect(this.jobSpecificationDownload).toHaveCount(0);
  }

  async expectContractFile(fileName: string): Promise<void> {
    await expect(this.contractFileName).toHaveText(fileName);
    for (const action of ['Keep Current', 'Delete Current', 'Replace Current'] as const) {
      await expect(this.contractFileOption(action)).toBeVisible();
    }
  }

  async expectNoContractFile(): Promise<void> {
    await expect(this.contractDetails.root).toContainText('Browse');
    await expect(this.contractDetails.root).toContainText(jobText.noFile);
    await expect(this.contractHint).toHaveText(jobText.contractHint);
    await expect(this.contractFileOption('Keep Current')).toHaveCount(0);
  }

  async expectTerminationDialog(): Promise<void> {
    await expect(this.terminationDialogTitle).toHaveText('Terminate Employment');
    await expect(this.terminationDate.root.locator('label')).toHaveClass(/oxd-input-field-required/);
    await expect(this.terminationReason.root.locator('label')).toHaveClass(/oxd-input-field-required/);
    await expect(this.terminationNote.root.locator('label')).not.toHaveClass(/oxd-input-field-required/);
    await expect(this.terminationNote.textarea).toBeVisible();
    await expect(this.terminationSave).toBeVisible();
    await expect(this.terminationCancel).toBeVisible();
  }

  async expectTerminated(uiDate: string): Promise<void> {
    await expect(this.terminatedOn).toHaveText(`Terminated on: ${uiDate}`);
    await expect(this.activateButton).toBeVisible();
    await expect(this.terminateButton).toHaveCount(0);
  }

  async expectPastEmployeeHeader(past: boolean): Promise<void> {
    await expect(this.headerName).not.toBeEmpty();
    if (past) await expect(this.profileHeader).toContainText(jobText.pastEmployee);
    else await expect(this.profileHeader).not.toContainText(jobText.pastEmployee);
  }

  async expectActive(): Promise<void> {
    await expect(this.terminateButton).toBeVisible();
    await expect(this.terminatedOn).toHaveCount(0);
    await expect(this.activateButton).toHaveCount(0);
  }

  /** Supervisor view: values visible, job fields disabled, no buttons at all in the tab content. */
  async expectReadOnly(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.joinedDate.input).toBeDisabled();
    for (const f of [this.jobTitle, this.jobCategory, this.subUnit, this.location, this.employmentStatus]) {
      await expect(f.select).toHaveClass(/oxd-select-text--disabled/);
    }
    // The contract switch itself stays clickable, but with no Save button nothing can be stored.
    await expect(this.tabContent.getByRole('button')).toHaveCount(0);
  }
}
