/**
 * Contracts of the Job / Salary / Report-to endpoints of an employee profile and the Admin data
 * they rely on (pay grades, job titles with a specification). Recorded on the live demo, see
 * specs/pim-4-job-salary-reportto.plan.md "Observed API calls".
 */
import type { EmpPicture, NamedItem } from './pim';

/** Base64 JSON attachment (same shape as the profile photo). */
export type FileAttachment = EmpPicture;

export interface JobDetails {
  empNumber: number;
  joinedDate: string | null;
  jobTitle: { id: number | null; title: string | null; isDeleted: boolean | null };
  jobSpecificationAttachment: { id: number | null; filename: string | null };
  empStatus: { id: number | null; name: string | null };
  jobCategory: { id: number | null; name: string | null };
  subunit: { id: number | null; name: string | null; unitId: string | null };
  location: { id: number | null; name: string | null };
  employeeTerminationRecord: { id: number | null; date: string | null };
}

export interface EmploymentContractRequest {
  /** yyyy-mm-dd */
  startDate: string | null;
  endDate: string | null;
  contractAttachment?: FileAttachment;
  currentContractAttachment?: 'keepCurrent' | 'replaceCurrent' | 'deleteCurrent';
}

export interface EmploymentContract {
  startDate: string | null;
  endDate: string | null;
  contractAttachment: {
    id: number | null;
    filename: string | null;
    size: number | null;
    fileType: string | null;
  };
}

export type DirectDepositAccountType = 'SAVINGS' | 'CHECKING' | 'OTHER';

export interface SalaryComponentRequest {
  salaryComponent: string;
  /** Sent as a string by the UI. */
  salaryAmount: string;
  currencyId: string;
  payGradeId?: number | null;
  payFrequencyId?: string | null;
  comment?: string | null;
  addDirectDeposit: boolean;
  directDepositAccount?: string;
  directDepositAccountType?: DirectDepositAccountType;
  directDepositRoutingNumber?: string;
  directDepositAmount?: string;
}

export interface SalaryComponent {
  id: number;
  amount: string;
  salaryName: string;
  comment: string | null;
  payPeriod: { id: string | null; name: string | null };
  payGrade: { id: number | null; name: string | null };
  currencyType: { id: string; name: string };
  directDebit: {
    id: number | null;
    routingNumber: string | null;
    account: string | null;
    amount: string | null;
    accountType: string | null;
  };
}

export interface PayGrade {
  id: number;
  name: string;
  currencies: { id: string; name: string }[];
}

export interface PayGradeCurrency {
  minSalary: number | null;
  maxSalary: number | null;
  currencyType: { id: string; name: string };
}

/** Body of POST supervisors / subordinates: `empNumber` is the OTHER employee. */
export interface ReportToRequest {
  empNumber: number;
  reportingMethodId: number;
}

export interface ReportToPerson {
  empNumber: number;
  firstName: string;
  lastName: string;
  middleName: string;
  terminationId: number | null;
}

export interface SupervisorRelation {
  supervisor: ReportToPerson;
  reportingMethod: NamedItem;
}

export interface SubordinateRelation {
  subordinate: ReportToPerson;
  reportingMethod: NamedItem;
}

export interface JobTitleCreateRequest {
  title: string;
  description?: string;
  note?: string | null;
  specification?: FileAttachment;
}

export interface JobTitleWithSpec {
  id: number;
  title: string;
  description: string | null;
  note: string | null;
  jobSpecification: { id: number | null; filename: string | null; fileType: string | null; fileSize: number | null };
}

/** Reporting methods of the OrangeHRM seed data (other values on the demo are user junk). */
export const ReportingMethod = { Direct: 1, Indirect: 2 } as const;
