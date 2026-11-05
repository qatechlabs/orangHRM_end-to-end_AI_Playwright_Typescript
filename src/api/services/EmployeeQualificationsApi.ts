import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import type { NamedItem } from '@api/types/pim';
import type {
  AttachmentScreen,
  Base64File,
  Education,
  EducationRequest,
  EmployeeAttachment,
  EmployeeLanguage,
  EmployeeLicense,
  EmployeeMembership,
  EmployeeSkill,
  LanguageRequest,
  LicenseRequest,
  MembershipRequest,
  SkillRequest,
  WorkExperience,
  WorkExperienceRequest,
} from '@api/types/pim-config';

type ListMeta = { empNumber: number; total: number };

const MIME: Record<string, string> = {
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/**
 * Qualifications (work experience, education, skills, languages, licenses), memberships and
 * attachments of `/pim/employees/{empNumber}`, plus the Admin master data their drop-downs offer.
 * Raw methods return the ApiResult for API specs; `*OrFail` helpers assert success for UI setup.
 */
export class EmployeeQualificationsApi {
  constructor(private readonly api: ApiClient) {}

  // ---- work experience ----

  workExperiences(empNumber: number): Promise<ApiResult<Envelope<WorkExperience[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/work-experiences`, { limit: 50, offset: 0 });
  }

  addWorkExperience(
    empNumber: number,
    body: WorkExperienceRequest,
  ): Promise<ApiResult<Envelope<WorkExperience>>> {
    return this.api.post(`/pim/employees/${empNumber}/work-experiences`, {
      fromDate: '',
      toDate: '',
      comment: '',
      ...body,
    });
  }

  // ---- education ----

  educations(empNumber: number): Promise<ApiResult<Envelope<Education[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/educations`, { limit: 50, offset: 0 });
  }

  addEducation(empNumber: number, body: EducationRequest): Promise<ApiResult<Envelope<Education>>> {
    return this.api.post(`/pim/employees/${empNumber}/educations`, {
      institute: '',
      major: '',
      year: null,
      score: '',
      startDate: '',
      endDate: '',
      ...body,
    });
  }

  // ---- skills (keyed by skill: a second POST of the same skill overwrites) ----

  skills(empNumber: number): Promise<ApiResult<Envelope<EmployeeSkill[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/skills`, { limit: 50, offset: 0 });
  }

  addSkill(empNumber: number, body: SkillRequest): Promise<ApiResult<Envelope<EmployeeSkill>>> {
    return this.api.post(`/pim/employees/${empNumber}/skills`, { comments: '', ...body });
  }

  // ---- languages ----

  languages(empNumber: number): Promise<ApiResult<Envelope<EmployeeLanguage[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/languages`, { limit: 50, offset: 0 });
  }

  addLanguage(empNumber: number, body: LanguageRequest): Promise<ApiResult<Envelope<EmployeeLanguage>>> {
    return this.api.post(`/pim/employees/${empNumber}/languages`, { comment: '', ...body });
  }

  // ---- licenses ----

  licenses(empNumber: number): Promise<ApiResult<Envelope<EmployeeLicense[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/licenses`, { limit: 50, offset: 0 });
  }

  addLicense(empNumber: number, body: LicenseRequest): Promise<ApiResult<Envelope<EmployeeLicense>>> {
    return this.api.post(`/pim/employees/${empNumber}/licenses`, body);
  }

  // ---- memberships ----

  memberships(empNumber: number): Promise<ApiResult<Envelope<EmployeeMembership[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/memberships`, { limit: 50, offset: 0 });
  }

  async membershipsOrFail(empNumber: number): Promise<EmployeeMembership[]> {
    const res = await this.memberships(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  addMembership(
    empNumber: number,
    body: MembershipRequest,
  ): Promise<ApiResult<Envelope<EmployeeMembership>>> {
    return this.api.post(`/pim/employees/${empNumber}/memberships`, body);
  }

  // ---- attachments ----

  attachments(
    empNumber: number,
    screen: AttachmentScreen = 'personal',
  ): Promise<ApiResult<Envelope<EmployeeAttachment[], ListMeta & { screen: string }>>> {
    return this.api.get(`/pim/employees/${empNumber}/screen/${screen}/attachments`, { limit: 50, offset: 0 });
  }

  async attachmentsOrFail(
    empNumber: number,
    screen: AttachmentScreen = 'personal',
  ): Promise<EmployeeAttachment[]> {
    const res = await this.attachments(empNumber, screen);
    expectStatus(res, 200);
    return res.body.data;
  }

  addAttachment(
    empNumber: number,
    file: Base64File,
    description = '',
    screen: AttachmentScreen = 'personal',
  ): Promise<ApiResult<Envelope<EmployeeAttachment>>> {
    return this.api.post(`/pim/employees/${empNumber}/screen/${screen}/attachments`, {
      attachment: file,
      description,
    });
  }

  async addAttachmentOrFail(
    empNumber: number,
    filePath: string,
    description = '',
    screen: AttachmentScreen = 'personal',
  ): Promise<EmployeeAttachment> {
    const res = await this.addAttachment(
      empNumber,
      EmployeeQualificationsApi.fileFromDisk(filePath),
      description,
      screen,
    );
    expectStatus(res, 200);
    return res.body.data;
  }

  deleteAttachments(
    empNumber: number,
    ids: number[],
    screen: AttachmentScreen = 'personal',
  ): Promise<ApiResult<Envelope<unknown[]>>> {
    return this.api.delete(`/pim/employees/${empNumber}/screen/${screen}/attachments`, { ids });
  }

  // ---- master data ----

  educationLevels(): Promise<NamedItem[]> {
    return this.data('/admin/educations');
  }

  skillTypes(): Promise<(NamedItem & { description: string | null })[]> {
    return this.data('/admin/skills');
  }

  languageTypes(): Promise<NamedItem[]> {
    return this.data('/admin/languages');
  }

  licenseTypes(): Promise<NamedItem[]> {
    return this.data('/admin/licenses');
  }

  membershipTypes(): Promise<NamedItem[]> {
    return this.data('/admin/memberships');
  }

  /** Base64 JSON body of a file on disk, as the UI uploads it. */
  static fileFromDisk(filePath: string): Base64File {
    const buffer = fs.readFileSync(filePath);
    return {
      name: path.basename(filePath),
      type: MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      size: buffer.length,
      base64: buffer.toString('base64'),
    };
  }

  private async data<T>(endpoint: string): Promise<T> {
    const res = await this.api.get<Envelope<T>>(endpoint, { limit: 0 });
    expectStatus(res, 200);
    return res.body.data;
  }
}
