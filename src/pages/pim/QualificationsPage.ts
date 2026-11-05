import { expect, type Locator, type Page } from '@playwright/test';
import { AttachmentsSection } from '@pages/components/AttachmentsSection';
import type { FormField } from '@pages/components/FormField';
import { RecordSection } from '@pages/components/RecordSection';
import { pimText } from '@data/pim';
import { step } from '@utils/step';
import { configPaths } from './configPaths';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { typeDate } from './profileHelpers';
import { scopedField } from './scopedField';

/**
 * Texts of an oxd-select's options without the `-- Select --` placeholder. The drop-down renders a
 * transient "No Records Found" / placeholder-only list first, so wait for a second option.
 */
export async function readSelectOptions(field: FormField): Promise<string[]> {
  await field.select.click();
  const dropdown = field.root.page().locator('.oxd-select-dropdown');
  const options = dropdown.getByRole('option');
  await expect(options.nth(1)).toBeVisible();
  const texts = (await options.allInnerTexts()).map((t) => t.trim());
  // Escape hides the list but leaves the select "open", so the next click would only close it.
  await field.select.click();
  await expect(dropdown).toBeHidden();
  return texts.filter((t) => t !== '-- Select --');
}

/** UI dates are yyyy-dd-mm. */
export interface WorkExperienceForm {
  company?: string;
  jobTitle?: string;
  from?: string;
  to?: string;
  comment?: string;
}

export interface EducationForm {
  level?: string;
  institute?: string;
  major?: string;
  year?: string;
  score?: string;
  startDate?: string;
  endDate?: string;
}

export interface SkillForm {
  skill?: string;
  years?: string;
  comments?: string;
}

export interface LanguageForm {
  language?: string;
  fluency?: string;
  competency?: string;
  comments?: string;
}

export interface LicenseForm {
  type?: string;
  number?: string;
  issuedDate?: string;
  expiryDate?: string;
}

/**
 * One block of the Qualifications tab: its "Assigned" record list and the inline Add/Edit form that
 * opens above the lists (only one form is open at a time).
 */
export class QualificationBlock {
  readonly records: RecordSection;
  readonly formTitle: Locator;
  readonly form: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    readonly page: Page,
    readonly sectionTitle: string,
    readonly formName: string,
  ) {
    this.records = new RecordSection(page, sectionTitle);
    this.formTitle = page
      .locator('.orangehrm-edit-employee-content')
      .getByRole('heading', { name: new RegExp(`^(Add|Edit) ${formName}$`) });
    this.form = this.formTitle.locator('xpath=following-sibling::form[1]');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
  }

  field(label: string): FormField {
    return scopedField(this.form, label);
  }

  row(...texts: (string | RegExp)[]): Locator {
    return this.records.row(...texts);
  }

  /** Clicks the form title: blurs the current field and closes an open date picker. */
  async blur(): Promise<void> {
    await this.formTitle.click();
  }

  async expectFormTitle(title: string): Promise<void> {
    await expect(this.formTitle).toHaveText(title);
  }

  async expectFormClosed(): Promise<void> {
    await expect(this.formTitle).toBeHidden();
  }

  /** Exactly the given fields show "Required" (others show no message). */
  async expectRequired(labels: string[], all: string[]): Promise<void> {
    for (const label of all) {
      const error = this.field(label).error;
      if (labels.includes(label)) await expect(error).toHaveText(pimText.required);
      else await expect(error).toHaveCount(0);
    }
  }
}

/** Qualifications tab: Work Experience, Education, Skills, Languages, License and Attachments. */
export class QualificationsPage extends EmployeeProfilePage {
  readonly heading: Locator;
  readonly workExperience: QualificationBlock;
  readonly education: QualificationBlock;
  readonly skills: QualificationBlock;
  readonly languages: QualificationBlock;
  readonly license: QualificationBlock;
  readonly attachments: AttachmentsSection;

  constructor(page: Page) {
    super(page);
    this.heading = this.content.getByRole('heading', { name: 'Qualifications', exact: true });
    this.workExperience = new QualificationBlock(page, 'Work Experience', 'Work Experience');
    this.education = new QualificationBlock(page, 'Education', 'Education');
    this.skills = new QualificationBlock(page, 'Skills', 'Skill');
    this.languages = new QualificationBlock(page, 'Languages', 'Language');
    this.license = new QualificationBlock(page, 'License', 'License');
    this.attachments = new AttachmentsSection(page);
  }

  private get blocks(): QualificationBlock[] {
    return [this.workExperience, this.education, this.skills, this.languages, this.license];
  }

  @step('Open the Qualifications tab of employee {0}')
  async load(empNumber: number): Promise<this> {
    this.path = configPaths.qualifications(empNumber);
    await this.open();
    await expect(this.heading).toBeVisible();
    // Every list shows its status line once its GET has answered.
    for (const block of this.blocks) await expect(block.records.statusText).toBeVisible();
    return this;
  }

  /** Re-reads the tab from the server (lists refresh 1-2 s after a toast). */
  async reload(): Promise<void> {
    await this.page.reload();
    for (const block of this.blocks) await expect(block.records.statusText).toBeVisible();
  }

  @step('Click Add in {0}')
  async clickAdd(block: QualificationBlock): Promise<void> {
    await block.records.clickAdd();
    await expect(block.formTitle).toHaveText(`Add ${block.formName}`);
  }

  @step('Click Save')
  async save(block: QualificationBlock): Promise<void> {
    await block.saveButton.click();
  }

  /** Saves and returns the toast texts. */
  @step('Save and read the toast')
  async saveWithToast(block: QualificationBlock): Promise<{ title: string; message: string }> {
    const [toast] = await Promise.all([this.toast.capture(), block.saveButton.click()]);
    return toast;
  }

  /** Opens the edit form of a row and waits for its pre-fill (`ready` is a pre-filled control). */
  @step('Edit a row')
  async editRow(block: QualificationBlock, row: Locator, ready: Locator): Promise<void> {
    await block.records.clickEdit(row);
    await expect(block.formTitle).toHaveText(`Edit ${block.formName}`);
    await expect(ready).not.toHaveValue('');
  }

  @step('Delete a row and confirm')
  async deleteRow(block: QualificationBlock, row: Locator): Promise<void> {
    await block.records.clickDelete(row);
    await expect(this.dialog.root.locator('.oxd-text--card-body')).toHaveText(pimText.deleteDialogText);
    await this.dialog.confirm('Yes, Delete');
  }

  // ---- form filling ----

  @step('Fill the work experience form {0}')
  async fillWorkExperience(data: WorkExperienceForm): Promise<void> {
    const b = this.workExperience;
    if (data.company !== undefined) await b.field('Company').fill(data.company);
    if (data.jobTitle !== undefined) await b.field('Job Title').fill(data.jobTitle);
    if (data.from !== undefined) await typeDate(b.field('From'), data.from, b.formTitle);
    if (data.to !== undefined) await typeDate(b.field('To'), data.to, b.formTitle);
    if (data.comment !== undefined) await b.field('Comment').fillTextarea(data.comment);
    await b.blur();
  }

  @step('Fill the education form {0}')
  async fillEducation(data: EducationForm): Promise<void> {
    const b = this.education;
    if (data.level !== undefined) await b.field('Level').choose(data.level);
    if (data.institute !== undefined) await b.field('Institute').fill(data.institute);
    if (data.major !== undefined) await b.field('Major/Specialization').fill(data.major);
    if (data.year !== undefined) await b.field('Year').fill(data.year);
    if (data.score !== undefined) await b.field('GPA/Score').fill(data.score);
    if (data.startDate !== undefined) await typeDate(b.field('Start Date'), data.startDate, b.formTitle);
    if (data.endDate !== undefined) await typeDate(b.field('End Date'), data.endDate, b.formTitle);
    await b.blur();
  }

  @step('Fill the skill form {0}')
  async fillSkill(data: SkillForm): Promise<void> {
    const b = this.skills;
    if (data.skill !== undefined) await b.field('Skill').choose(data.skill);
    if (data.years !== undefined) await b.field('Years of Experience').fill(data.years);
    if (data.comments !== undefined) await b.field('Comments').fillTextarea(data.comments);
    await b.blur();
  }

  @step('Fill the language form {0}')
  async fillLanguage(data: LanguageForm): Promise<void> {
    const b = this.languages;
    if (data.language !== undefined) await b.field('Language').choose(data.language);
    if (data.fluency !== undefined) await b.field('Fluency').choose(data.fluency);
    if (data.competency !== undefined) await b.field('Competency').choose(data.competency);
    if (data.comments !== undefined) await b.field('Comments').fillTextarea(data.comments);
    await b.blur();
  }

  @step('Fill the license form {0}')
  async fillLicense(data: LicenseForm): Promise<void> {
    const b = this.license;
    if (data.type !== undefined) await b.field('License Type').choose(data.type);
    if (data.number !== undefined) await b.field('License Number').fill(data.number);
    if (data.issuedDate !== undefined) await typeDate(b.field('Issued Date'), data.issuedDate, b.formTitle);
    if (data.expiryDate !== undefined) await typeDate(b.field('Expiry Date'), data.expiryDate, b.formTitle);
    await b.blur();
  }

  /** Options of a select in the open form, without the `-- Select --` placeholder. */
  async selectOptions(block: QualificationBlock, label: string): Promise<string[]> {
    return readSelectOptions(block.field(label));
  }

  // ---- assertions ----

  /** Cell texts of the only row containing `key`, by column header. */
  async expectRow(block: QualificationBlock, key: string, cells: Record<string, string>): Promise<void> {
    await block.records.expectRow(key, cells);
  }
}
