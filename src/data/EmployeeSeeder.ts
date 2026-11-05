import { expectStatus } from '@api/ApiClient';
import { EmployeesApi } from '@api/services/EmployeesApi';
import { MasterDataApi } from '@api/services/MasterDataApi';
import { UsersApi } from '@api/services/UsersApi';
import type { Employee, JobDetailsRequest, SystemUser, TerminationRequest } from '@api/types/pim';
import { dataFactory, type EmployeeData } from '@utils/dataFactory';
import { logger } from '@utils/logger';
import { pimData } from './pim';

const log = logger('employee-seeder');

export interface EmployeeSpec extends Partial<EmployeeData> {
  /** Path of an image to upload as the profile photo. */
  photo?: string;
  /** Job details applied right after creation (ids from MasterDataApi). */
  job?: JobDetailsRequest;
  /** Terminate after creation (`true` = today, reason "Other"/first reason). */
  terminated?: boolean | Partial<TerminationRequest>;
  /** Create an ESS login (`true` = generated credentials, enabled). */
  login?: true | { username?: string; password?: string; enabled?: boolean };
}

export interface SeededEmployee extends Employee {
  /** "First Last" (middle name omitted), as in the profile header. */
  fullName: string;
  login?: { username: string; password: string; user: SystemUser };
}

/**
 * Creates employees (and their login accounts) through the API and remembers everything it
 * created, plus anything a test registers with `track*`, so the fixture teardown removes it all.
 * Later PIM groups extend `EmployeeSpec` (supervisors, salary, ...) rather than writing new setup code.
 */
export class EmployeeSeeder {
  private readonly empNumbers = new Set<number>();
  private readonly userIds = new Set<number>();
  private readonly names = new Set<string>();
  private terminationReasonId?: number;

  constructor(
    readonly employeesApi: EmployeesApi,
    readonly usersApi: UsersApi,
    readonly masterData: MasterDataApi,
  ) {}

  /** Builds (but does not create) unique employee data. Middle name is empty unless given. */
  data(overrides: Partial<EmployeeData> = {}): EmployeeData {
    return dataFactory.employee({ middleName: '', ...overrides });
  }

  async create(spec: EmployeeSpec = {}): Promise<SeededEmployee> {
    const { photo, job, terminated, login, ...names } = spec;
    const data = this.data(names);
    const employee = await this.employeesApi.createOrFail({
      ...data,
      empPicture: photo ? EmployeesApi.pictureFromFile(photo) : null,
    });
    this.track(employee.empNumber);
    const seeded: SeededEmployee = { ...employee, fullName: `${employee.firstName} ${employee.lastName}` };

    if (job) expectStatus(await this.employeesApi.updateJobDetails(employee.empNumber, job), 200);
    if (terminated) {
      const t = await this.terminate(employee.empNumber, terminated === true ? {} : terminated);
      seeded.terminationId = t;
    }
    if (login) {
      const creds = { ...pimData.login(), ...(login === true ? {} : login) };
      const user = await this.usersApi.createEss(employee.empNumber, creds);
      this.trackUser(user.id);
      seeded.login = { username: creds.username, password: creds.password, user };
    }
    return seeded;
  }

  /** `count` employees; `spec` may depend on the index (e.g. a shared last name with distinct ids). */
  async createMany(
    count: number,
    spec: EmployeeSpec | ((i: number) => EmployeeSpec) = {},
  ): Promise<SeededEmployee[]> {
    const result: SeededEmployee[] = [];
    // Small batches: fast, but gentle with the shared demo.
    for (let i = 0; i < count; i += 5) {
      const batch = Array.from({ length: Math.min(5, count - i) }, (_, k) =>
        this.create(typeof spec === 'function' ? spec(i + k) : spec),
      );
      result.push(...(await Promise.all(batch)));
    }
    return result;
  }

  async terminate(empNumber: number, body: Partial<TerminationRequest> = {}): Promise<number> {
    const res = await this.employeesApi.terminate(empNumber, {
      date: body.date ?? new Date().toISOString().slice(0, 10),
      terminationReasonId: body.terminationReasonId ?? (await this.defaultTerminationReason()),
      note: body.note,
    });
    expectStatus(res, 200);
    return res.body.data.id;
  }

  /** Registers an employee created outside the seeder (e.g. through the UI) for cleanup. */
  track(empNumber: number): void {
    this.empNumbers.add(empNumber);
  }

  trackUser(userId: number): void {
    this.userIds.add(userId);
  }

  /**
   * Registers a unique name/id token: at teardown every current or past employee matching it is
   * deleted. Use it for records a UI test creates, so a failure before reading the empNumber
   * still leaves no data behind.
   */
  trackByName(uniqueToken: string): void {
    this.names.add(uniqueToken.trim());
  }

  async cleanup(): Promise<void> {
    if (this.userIds.size) {
      const res = await this.usersApi.delete([...this.userIds]);
      if (!res.ok) log.debug(`users cleanup -> ${res.status}`);
    }
    for (const token of this.names) {
      const res = await this.employeesApi.list({
        nameOrId: token,
        includeEmployees: 'currentAndPast',
        limit: 100,
      });
      if (res.ok) res.body.data.forEach((e) => this.empNumbers.add(e.empNumber));
    }
    const ids = [...this.empNumbers];
    if (!ids.length) return;
    const bulk = await this.employeesApi.delete(ids);
    if (bulk.ok) return;
    // Some were already deleted by the test itself: delete the rest one by one.
    for (const id of ids) {
      const res = await this.employeesApi.delete([id]);
      if (!res.ok && res.status !== 404) log.warn(`could not delete employee ${id}: ${res.status}`);
    }
  }

  private async defaultTerminationReason(): Promise<number> {
    if (this.terminationReasonId === undefined) {
      const reasons = await this.masterData.terminationReasons();
      this.terminationReasonId = (reasons.find((r) => r.name === 'Other') ?? reasons[0]).id;
    }
    return this.terminationReasonId;
  }
}
