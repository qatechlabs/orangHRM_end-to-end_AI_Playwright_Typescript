import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import type { NamedItem } from '@api/types/pim';
import type {
  FileAttachment,
  EmploymentContract,
  EmploymentContractRequest,
  JobDetails,
  JobTitleCreateRequest,
  JobTitleWithSpec,
  PayGrade,
  PayGradeCurrency,
  ReportToRequest,
  SalaryComponent,
  SalaryComponentRequest,
  SubordinateRelation,
  SupervisorRelation,
} from '@api/types/pim-job';

type ListMeta = { empNumber: number; total: number };

const MIME: Record<string, string> = {
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.doc': 'application/msword',
};

/**
 * Job, Salary and Report-to sub-resources of `/pim/employees/{empNumber}` plus the Admin master
 * data these screens use (job categories, locations, pay grades, job titles with a specification).
 * Terminations live in EmployeesApi. Raw methods return the ApiResult for API specs; `*OrFail`
 * helpers assert success, for fast UI test setup.
 */
export class EmployeeJobApi {
  constructor(private readonly api: ApiClient) {}

  // ---- job details / contract ----

  jobDetails(empNumber: number): Promise<ApiResult<Envelope<JobDetails>>> {
    return this.api.get(`/pim/employees/${empNumber}/job-details`);
  }

  async jobDetailsOrFail(empNumber: number): Promise<JobDetails> {
    const res = await this.jobDetails(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  contract(empNumber: number): Promise<ApiResult<Envelope<EmploymentContract>>> {
    return this.api.get(`/pim/employees/${empNumber}/employment-contract`);
  }

  async contractOrFail(empNumber: number): Promise<EmploymentContract> {
    const res = await this.contract(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  updateContract(
    empNumber: number,
    body: EmploymentContractRequest,
  ): Promise<ApiResult<Envelope<EmploymentContract>>> {
    return this.api.put(`/pim/employees/${empNumber}/employment-contract`, body);
  }

  /**
   * Fast setup: stores a contract with a file, as the UI would. `startDate` / `endDate` are API
   * dates (yyyy-mm-dd). The server rejects `currentContractAttachment` (400) when the employee has
   * no contract file yet, so it is sent only when there is one to replace.
   */
  async saveContractWithFileOrFail(
    empNumber: number,
    contract: { startDate: string; endDate: string; file: string },
  ): Promise<EmploymentContract> {
    const existing = await this.contractOrFail(empNumber);
    const res = await this.updateContract(empNumber, {
      startDate: contract.startDate,
      endDate: contract.endDate,
      contractAttachment: EmployeeJobApi.attachmentFromFile(contract.file),
      ...(existing.contractAttachment?.filename ? { currentContractAttachment: 'replaceCurrent' } : {}),
    });
    expectStatus(res, 200);
    return res.body.data;
  }

  // ---- salary ----

  salaries(empNumber: number): Promise<ApiResult<Envelope<SalaryComponent[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/salary-components`, { limit: 50, offset: 0 });
  }

  async salariesOrFail(empNumber: number): Promise<SalaryComponent[]> {
    const res = await this.salaries(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  addSalary(empNumber: number, body: SalaryComponentRequest): Promise<ApiResult<Envelope<SalaryComponent>>> {
    return this.api.post(`/pim/employees/${empNumber}/salary-components`, body);
  }

  async addSalaryOrFail(empNumber: number, body: SalaryComponentRequest): Promise<SalaryComponent> {
    const res = await this.addSalary(empNumber, body);
    expectStatus(res, 200);
    return res.body.data;
  }

  deleteSalaries(empNumber: number, ids: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete(`/pim/employees/${empNumber}/salary-components`, { ids });
  }

  // ---- report-to ----

  supervisors(empNumber: number): Promise<ApiResult<Envelope<SupervisorRelation[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/supervisors`, { limit: 50, offset: 0 });
  }

  async supervisorsOrFail(empNumber: number): Promise<SupervisorRelation[]> {
    const res = await this.supervisors(empNumber);
    expectStatus(res, 200);
    return res.body.data;
  }

  /** Makes `body.empNumber` a supervisor of `empNumber`. */
  addSupervisor(empNumber: number, body: ReportToRequest): Promise<ApiResult<Envelope<SupervisorRelation>>> {
    return this.api.post(`/pim/employees/${empNumber}/supervisors`, body);
  }

  async addSupervisorOrFail(empNumber: number, body: ReportToRequest): Promise<SupervisorRelation> {
    const res = await this.addSupervisor(empNumber, body);
    expectStatus(res, 200);
    return res.body.data;
  }

  /** Removes every relation (all reporting methods) to the given supervisors. */
  deleteSupervisors(empNumber: number, supervisorEmpNumbers: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete(`/pim/employees/${empNumber}/supervisors`, { ids: supervisorEmpNumbers });
  }

  subordinates(empNumber: number): Promise<ApiResult<Envelope<SubordinateRelation[], ListMeta>>> {
    return this.api.get(`/pim/employees/${empNumber}/subordinates`, { limit: 50, offset: 0 });
  }

  addSubordinate(empNumber: number, body: ReportToRequest): Promise<ApiResult<Envelope<SubordinateRelation>>> {
    return this.api.post(`/pim/employees/${empNumber}/subordinates`, body);
  }

  deleteSubordinates(empNumber: number, subordinateEmpNumbers: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete(`/pim/employees/${empNumber}/subordinates`, { ids: subordinateEmpNumbers });
  }

  // ---- master data ----

  async jobCategories(): Promise<NamedItem[]> {
    return this.data<NamedItem[]>('/admin/job-categories');
  }

  async locations(): Promise<NamedItem[]> {
    return this.data<NamedItem[]>('/admin/locations');
  }

  async reportingMethods(): Promise<NamedItem[]> {
    return this.data<NamedItem[]>('/pim/reporting-methods');
  }

  async payGrades(): Promise<PayGrade[]> {
    return this.data<PayGrade[]>('/admin/pay-grades');
  }

  async payGradeCurrencies(payGradeId: number): Promise<PayGradeCurrency[]> {
    return this.data<PayGradeCurrency[]>(`/admin/pay-grades/${payGradeId}/currencies`);
  }

  /** Admin > Job > Job Titles. The specification file is sent inline as base64 JSON. */
  createJobTitle(body: JobTitleCreateRequest): Promise<ApiResult<Envelope<JobTitleWithSpec>>> {
    return this.api.post('/admin/job-titles', { description: '', note: null, ...body });
  }

  async createJobTitleOrFail(body: JobTitleCreateRequest): Promise<JobTitleWithSpec> {
    const res = await this.createJobTitle(body);
    expectStatus(res, 200);
    return res.body.data;
  }

  deleteJobTitles(ids: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete('/admin/job-titles', { ids });
  }

  /** Base64 JSON attachment, as the UI sends contract / specification files. */
  static attachmentFromFile(filePath: string): FileAttachment {
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
