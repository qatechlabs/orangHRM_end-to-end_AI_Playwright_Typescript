/**
 * Request / response contracts of the OrangeHRM 5.x PIM and Admin REST endpoints used by the suite.
 * Shapes were recorded against the live demo (see specs/pim-*.plan.md, "Observed API calls").
 */

/** Photo as sent by the Add Employee form: JSON with the file content in base64 (not multipart). */
export interface EmpPicture {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export interface EmployeeCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  employeeId?: string;
  empPicture?: EmpPicture | null;
}

export interface Employee {
  empNumber: number;
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string | null;
  terminationId: number | null;
}

/** `model=detailed` list item. */
export interface EmployeeDetailed extends Employee {
  jobTitle: { id: number | null; title: string | null; isDeleted: boolean | null };
  subunit: { id: number | null; name: string | null };
  empStatus: { id: number | null; name: string | null };
  supervisors: { empNumber: number; firstName: string; lastName: string }[];
}

export type IncludeEmployees = 'onlyCurrent' | 'onlyPast' | 'currentAndPast';
export type SortOrder = 'ASC' | 'DESC';

export interface EmployeeListQuery {
  limit?: number;
  offset?: number;
  model?: 'default' | 'detailed';
  nameOrId?: string;
  employeeId?: string;
  empNumber?: number;
  empStatusId?: number;
  jobTitleId?: number;
  subunitId?: number;
  includeEmployees?: IncludeEmployees;
  sortField?: 'employee.firstName' | 'employee.lastName' | 'employee.employeeId' | string;
  sortOrder?: SortOrder;
}

export interface JobDetailsRequest {
  joinedDate?: string | null;
  jobTitleId?: number | null;
  empStatusId?: number | null;
  subunitId?: number | null;
  jobCategoryId?: number | null;
  locationId?: number | null;
}

export interface TerminationRequest {
  /** yyyy-mm-dd */
  date: string;
  terminationReasonId: number;
  /** Omit when empty: the API rejects `note: ""` with 422. */
  note?: string;
}

export interface Termination {
  id: number;
  note: string | null;
  date: string;
  terminationReason: { id: number; name: string };
}

export interface PictureResponse {
  empNumber: number;
  filename: string;
  fileType: string;
  size: string;
  width: string;
  height: string;
}

/** Admin > User Management. userRoleId 1 = Admin, 2 = ESS. */
export const UserRole = { Admin: 1, ESS: 2 } as const;

export interface UserCreateRequest {
  username: string;
  password: string;
  status: boolean;
  userRoleId: number;
  empNumber: number;
}

export interface SystemUser {
  id: number;
  userName: string;
  deleted: boolean;
  status: boolean;
  employee: Employee;
  userRole: { id: number; name: string; displayName: string };
}

/** Admin master data (job titles, employment statuses, termination reasons). */
export interface NamedItem {
  id: number;
  name: string;
}

export interface JobTitle {
  id: number;
  title: string;
  description?: string;
}

export interface Subunit {
  id: number;
  name: string;
  unitId: string;
  level: number;
  left: number;
  right: number;
}

/** 422 body: `{ error: { status: "422", message: "Invalid Parameter", data: { invalidParamKeys: [...] } } }`. */
export interface ApiValidationError {
  error: { status: string; message: string; data?: { invalidParamKeys?: string[] } };
}
