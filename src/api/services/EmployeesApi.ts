import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import type {
  EmpPicture,
  Employee,
  EmployeeCreateRequest,
  EmployeeDetailed,
  EmployeeListQuery,
  JobDetailsRequest,
  PictureResponse,
  Termination,
  TerminationRequest,
} from '@api/types/pim';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

/**
 * PIM employees: `/pim/employees` and its sub-resources.
 * Raw methods return the ApiResult (status + body) for API specs; `*OrFail` helpers assert success
 * and return the data, for fast UI test setup.
 */
export class EmployeesApi {
  constructor(private readonly api: ApiClient) {}

  create(body: EmployeeCreateRequest): Promise<ApiResult<Envelope<Employee>>> {
    return this.api.post('/pim/employees', { middleName: '', ...body });
  }

  async createOrFail(body: EmployeeCreateRequest): Promise<Employee> {
    const res = await this.create(body);
    expectStatus(res, 200);
    return res.body.data;
  }

  get(empNumber: number): Promise<ApiResult<Envelope<Employee>>> {
    return this.api.get(`/pim/employees/${empNumber}`);
  }

  /** The employee linked to the session user. */
  myself(): Promise<ApiResult<Envelope<Employee>>> {
    return this.api.get('/pim/myself');
  }

  list(query: EmployeeListQuery = {}): Promise<ApiResult<Envelope<EmployeeDetailed[], { total: number }>>> {
    return this.api.get('/pim/employees', { limit: 50, offset: 0, ...query });
  }

  async listOrFail(query: EmployeeListQuery = {}): Promise<{ total: number; items: EmployeeDetailed[] }> {
    const res = await this.list(query);
    expectStatus(res, 200);
    return { total: res.body.meta.total, items: res.body.data };
  }

  delete(empNumbers: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete('/pim/employees', { ids: empNumbers });
  }

  updateJobDetails(empNumber: number, body: JobDetailsRequest): Promise<ApiResult<Envelope<unknown>>> {
    return this.api.put(`/pim/employees/${empNumber}/job-details`, body);
  }

  terminate(empNumber: number, body: TerminationRequest): Promise<ApiResult<Envelope<Termination>>> {
    const { note, ...rest } = body;
    return this.api.post(`/pim/employees/${empNumber}/terminations`, note ? { ...rest, note } : rest);
  }

  /** Re-activates a terminated employee. */
  activate(empNumber: number): Promise<ApiResult<Envelope<unknown>>> {
    return this.api.delete(`/pim/employees/${empNumber}/terminations`);
  }

  updatePicture(empNumber: number, picture: EmpPicture): Promise<ApiResult<Envelope<PictureResponse>>> {
    return this.api.put(`/pim/employees/${empNumber}/picture`, { empPicture: picture });
  }

  getPicture(empNumber: number): Promise<ApiResult<Envelope<PictureResponse>>> {
    return this.api.get(`/pim/employees/${empNumber}/picture`);
  }

  /** `GET /core/validation/unique` as used by the Add Employee form for Employee Id. */
  async isEmployeeIdUnique(employeeId: string): Promise<boolean> {
    const res = await this.api.get<Envelope<{ valid: boolean }>>('/core/validation/unique', {
      value: employeeId,
      entityName: 'Employee',
      attributeName: 'employeeId',
    });
    expectStatus(res, 200);
    return res.body.data.valid;
  }

  /** Builds the JSON photo payload the UI sends, from a file on disk. */
  static pictureFromFile(filePath: string): EmpPicture {
    const buffer = fs.readFileSync(filePath);
    return {
      name: path.basename(filePath),
      type: MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      size: buffer.length,
      base64: buffer.toString('base64'),
    };
  }
}
