/**
 * Contracts of the employee profile sub-resources (Personal Details, Contact Details, Emergency
 * Contacts, Dependents, Immigration). Recorded on the live demo, see specs/pim-3-profile-details.plan.md.
 * All dates are ISO yyyy-mm-dd on the API (the UI shows yyyy-dd-mm).
 */

/** Gender as the API stores it: 1 = Male, 2 = Female. The UI sends it as the string "1"/"2". */
export const Gender = { Male: 1, Female: 2 } as const;

/**
 * `PUT /pim/employees/{empNumber}/personal-details`. The PUT replaces the record: an omitted
 * `employeeId` is stored as null, so always send the current one (as the UI does).
 */
export interface PersonalDetailsRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  employeeId?: string | null;
  otherId?: string;
  drivingLicenseNo?: string;
  drivingLicenseExpiredDate?: string | null;
  gender?: number | string | null;
  maritalStatus?: 'Single' | 'Married' | 'Other' | '' | null;
  birthday?: string | null;
  nationalityId?: number | null;
}

export interface PersonalDetails {
  empNumber: number;
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string | null;
  otherId: string;
  drivingLicenseNo: string;
  drivingLicenseExpiredDate: string | null;
  gender: number | null;
  maritalStatus: string | null;
  birthday: string | null;
  terminationId: number | null;
  nationality: { id: number | null; name: string | null };
}

export interface JobDetails {
  empNumber: number;
  joinedDate: string | null;
  jobTitle: { id: number | null; title: string | null; isDeleted: boolean | null };
  empStatus: { id: number | null; name: string | null };
  jobCategory: { id: number | null; name: string | null };
  subunit: { id: number | null; name: string | null; unitId: string | null };
  location: { id: number | null; name: string | null };
}

/** `PUT /pim/employee/{empNumber}/contact-details` (singular "employee"); partial bodies are accepted. */
export interface ContactDetails {
  street1: string | null;
  street2: string | null;
  city: string | null;
  province: string | null;
  zipCode: string | null;
  /** ISO 3166 alpha-2, e.g. "US". */
  countryCode: string | null;
  homeTelephone: string | null;
  workTelephone: string | null;
  mobile: string | null;
  workEmail: string | null;
  otherEmail: string | null;
}

export type ContactDetailsRequest = Partial<ContactDetails>;

export interface EmergencyContactRequest {
  name: string;
  relationship: string;
  homePhone?: string;
  officePhone?: string;
  mobilePhone?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  homePhone: string;
  officePhone: string;
  mobilePhone: string;
}

export type DependentRelationshipType = 'child' | 'other';

export interface DependentRequest {
  name: string;
  relationshipType: DependentRelationshipType;
  /** The "Please Specify" text, used when relationshipType is "other". */
  relationship?: string;
  dateOfBirth?: string | null;
}

export interface Dependent {
  id: string;
  name: string;
  relationshipType: DependentRelationshipType;
  relationship: string;
  dateOfBirth: string | null;
}

/** Immigration document type: 1 = Passport, 2 = Visa. */
export const DocumentType = { Passport: 1, Visa: 2 } as const;

export interface ImmigrationRequest {
  number: string;
  type: number;
  issuedDate?: string | null;
  expiryDate?: string | null;
  status?: string;
  reviewDate?: string | null;
  countryCode?: string | null;
  comment?: string;
}

export interface Immigration {
  id: string;
  number: string;
  type: number;
  issuedDate: string | null;
  expiryDate: string | null;
  status: string | null;
  reviewDate: string | null;
  country: { code: string | null; name: string | null };
  comment: string | null;
}

/** List meta of the record sub-resources. */
export interface RecordListMeta {
  empNumber: number;
  total: number;
}
