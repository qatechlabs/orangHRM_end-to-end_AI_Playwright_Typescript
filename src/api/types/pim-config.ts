/**
 * Contracts of the Qualifications / Memberships / Attachments sub-resources of an employee and of the
 * PIM configuration endpoints (reporting methods, termination reasons, CSV import, defined reports).
 * Recorded on the live demo, see specs/pim-5-qualifications-config.plan.md and
 * specs/pim-6-import-config-reports.plan.md ("Observed API calls").
 */
import type { EmpPicture, NamedItem } from './pim';

/** Base64 JSON file, as the UI sends attachments and CSV imports (not multipart). */
export type Base64File = EmpPicture;

// ---- qualifications ----

export interface WorkExperienceRequest {
  company: string;
  jobTitle: string;
  /** yyyy-mm-dd or '' */
  fromDate?: string;
  toDate?: string;
  comment?: string;
}

export interface WorkExperience extends Required<WorkExperienceRequest> {
  id: number;
}

export interface EducationRequest {
  educationId: number;
  institute?: string;
  major?: string;
  year?: number | null;
  score?: string;
  startDate?: string;
  endDate?: string;
}

export interface Education {
  id: number;
  institute: string | null;
  major: string | null;
  year: number | null;
  score: string | null;
  startDate: string | null;
  endDate: string | null;
  education: NamedItem;
}

export interface SkillRequest {
  skillId: number;
  yearsOfExperience?: number | null;
  comments?: string;
}

/** Skills are keyed by the skill: the list item has no own id. */
export interface EmployeeSkill {
  yearsOfExperience: number | null;
  comments: string | null;
  skill: { id: number; name: string; description: string | null };
}

export interface LanguageRequest {
  languageId: number;
  fluencyId: number;
  competencyId: number;
  comment?: string;
}

export interface EmployeeLanguage {
  language: NamedItem;
  fluency: NamedItem;
  competency: NamedItem;
  comment: string | null;
}

export interface LicenseRequest {
  licenseId: number;
  licenseNo?: string;
  issuedDate?: string;
  expiryDate?: string;
}

export interface EmployeeLicense {
  licenseNo: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  license: NamedItem;
}

export interface MembershipRequest {
  membershipId: number;
  subscriptionPaidBy?: 'Company' | 'Individual' | null;
  subscriptionFee?: string;
  currencyTypeId?: string | null;
  subscriptionCommenceDate?: string | null;
  subscriptionRenewalDate?: string | null;
}

export interface EmployeeMembership {
  id: number;
  subscriptionFee: string | null;
  subscriptionCommenceDate: string | null;
  subscriptionRenewalDate: string | null;
  subscriptionPaidBy: string | null;
  membership: NamedItem;
  currencyType: { id: string; name: string } | null;
}

// ---- attachments ----

/** Screen key of an attachment list: `personal` for Personal Details, `qualifications`, ... */
export type AttachmentScreen =
  | 'personal'
  | 'contact'
  | 'emergency'
  | 'dependents'
  | 'immigration'
  | 'job'
  | 'salary'
  | 'report-to'
  | 'qualifications'
  | 'membership';

export interface AttachmentRequest {
  attachment: Base64File;
  description: string;
}

export interface EmployeeAttachment {
  id: number;
  description: string | null;
  filename: string;
  size: number;
  fileType: string;
  attachedBy: number;
  attachedByName: string;
  attachedTime: string;
  /** yyyy-mm-dd */
  attachedDate: string;
}

// ---- configuration lists ----

/** Reporting method / termination reason. */
export type ConfigItem = NamedItem;

export type ConfigListResource = 'reporting-methods' | 'termination-reasons';

// ---- data import ----

export interface CsvImportResult {
  total: number;
  success: number;
  failed: number;
  /** 1-based file line numbers (the header is line 1). */
  failedRows: number[];
}

// ---- reports ----

/** `operator` / `x` / `y` of one selection criterion; `y` is the literal string "undefined" in the UI. */
export interface ReportCriterion {
  operator: string;
  x?: string;
  y?: string;
}

export interface DefinedReportRequest {
  name: string;
  include: 'onlyCurrent' | 'onlyPast' | 'currentAndPast';
  /** Keyed by criterion id (14 = Job Title). */
  criteria: Record<string, ReportCriterion>;
  /** Keyed by display field group id (1 = Personal, 6 = Job). */
  fieldGroup: Record<string, { fields: number[]; includeHeader: boolean }>;
}

export interface DefinedReport {
  id: number;
  name: string;
}

export interface DefinedReportDetail extends DefinedReport {
  include: string;
  criteria: Record<string, { x: unknown; y: unknown; operator: string }>;
  fieldGroup: Record<string, { fields: number[]; includeHeader: boolean }>;
}

export interface ReportHeaderColumn {
  name: string;
  prop: string;
  size: number;
}

export interface ReportHeaders {
  headers: { name: string; children: ReportHeaderColumn[] }[];
  filters: unknown[];
}

export type ReportRow = Record<string, unknown> & { empNumber: number };

/** Ids of the report definition model used by the UI (verified on 5.9). */
export const ReportIds = {
  criteria: { jobTitle: 14 },
  groups: { personal: 1, job: 6 },
  fields: { employeeId: 9, employeeLastName: 10, jobTitle: 77 },
} as const;

/** Admin > Job Titles (used as a deterministic report filter). */
export interface JobTitleRequest {
  title: string;
  description?: string;
  note?: string | null;
}
