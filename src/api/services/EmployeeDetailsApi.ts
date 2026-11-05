import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import type { NamedItem } from '@api/types/pim';
import type {
  ContactDetails,
  ContactDetailsRequest,
  Dependent,
  DependentRequest,
  EmergencyContact,
  EmergencyContactRequest,
  Immigration,
  ImmigrationRequest,
  JobDetails,
  PersonalDetails,
  PersonalDetailsRequest,
  RecordListMeta,
} from '@api/types/pim-details';

/**
 * One record collection of an employee profile tab, e.g. `/pim/employees/{n}/emergency-contacts`:
 * list (GET), get/update by id, create (POST) and bulk delete (`DELETE` with `{ ids }`).
 */
export class EmployeeRecords<Req, Res extends { id: string }> {
  constructor(
    private readonly api: ApiClient,
    readonly resource: string,
  ) {}

  private path(empNumber: number, id?: string): string {
    return `/pim/employees/${empNumber}/${this.resource}${id === undefined ? '' : `/${id}`}`;
  }

  list(empNumber: number): Promise<ApiResult<Envelope<Res[], RecordListMeta>>> {
    return this.api.get(this.path(empNumber), { limit: 50, offset: 0 });
  }

  async listOrFail(empNumber: number): Promise<{ total: number; items: Res[] }> {
    const res = await this.list(empNumber);
    expectStatus(res, 200);
    return { total: res.body.meta.total, items: res.body.data };
  }

  get(empNumber: number, id: string): Promise<ApiResult<Envelope<Res>>> {
    return this.api.get(this.path(empNumber, id));
  }

  create(empNumber: number, body: Req): Promise<ApiResult<Envelope<Res>>> {
    return this.api.post(this.path(empNumber), body);
  }

  async createOrFail(empNumber: number, body: Req): Promise<Res> {
    const res = await this.create(empNumber, body);
    expectStatus(res, 200);
    return res.body.data;
  }

  update(empNumber: number, id: string, body: Req): Promise<ApiResult<Envelope<Res>>> {
    return this.api.put(this.path(empNumber, id), body);
  }

  delete(empNumber: number, ids: string[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete(this.path(empNumber), { ids });
  }
}

/**
 * Employee profile details: personal, job (read), contact details and the record collections
 * (emergency contacts, dependents, immigration). Records disappear with their employee, so tests
 * clean up by deleting the employee (the `employees` fixture does).
 */
export class EmployeeDetailsApi {
  readonly emergencyContacts: EmployeeRecords<EmergencyContactRequest, EmergencyContact>;
  readonly dependents: EmployeeRecords<DependentRequest, Dependent>;
  readonly immigrations: EmployeeRecords<ImmigrationRequest, Immigration>;

  constructor(private readonly api: ApiClient) {
    this.emergencyContacts = new EmployeeRecords(api, 'emergency-contacts');
    this.dependents = new EmployeeRecords(api, 'dependents');
    this.immigrations = new EmployeeRecords(api, 'immigrations');
  }

  getPersonalDetails(empNumber: number): Promise<ApiResult<Envelope<PersonalDetails>>> {
    return this.api.get(`/pim/employees/${empNumber}/personal-details`);
  }

  async personalDetailsOrFail(empNumber: number): Promise<PersonalDetails> {
    const res = await this.getPersonalDetails(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  updatePersonalDetails(
    empNumber: number,
    body: PersonalDetailsRequest,
  ): Promise<ApiResult<Envelope<PersonalDetails>>> {
    return this.api.put(`/pim/employees/${empNumber}/personal-details`, body);
  }

  getJobDetails(empNumber: number): Promise<ApiResult<Envelope<JobDetails>>> {
    return this.api.get(`/pim/employees/${empNumber}/job-details`);
  }

  async jobDetailsOrFail(empNumber: number): Promise<JobDetails> {
    const res = await this.getJobDetails(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  getContactDetails(empNumber: number): Promise<ApiResult<Envelope<ContactDetails>>> {
    return this.api.get(`/pim/employee/${empNumber}/contact-details`);
  }

  async contactDetailsOrFail(empNumber: number): Promise<ContactDetails> {
    const res = await this.getContactDetails(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  updateContactDetails(
    empNumber: number,
    body: ContactDetailsRequest,
  ): Promise<ApiResult<Envelope<ContactDetails>>> {
    return this.api.put(`/pim/employee/${empNumber}/contact-details`, body);
  }

  async updateContactDetailsOrFail(empNumber: number, body: ContactDetailsRequest): Promise<ContactDetails> {
    const res = await this.updateContactDetails(empNumber, body);
    expectStatus(res, 200);
    return res.body.data;
  }

  /** Nationalities master data (Personal Details drop-down). */
  async nationalities(): Promise<NamedItem[]> {
    const res = await this.api.get<Envelope<NamedItem[]>>('/admin/nationalities', { limit: 0 });
    expectStatus(res, 200);
    return res.body.data;
  }
}
