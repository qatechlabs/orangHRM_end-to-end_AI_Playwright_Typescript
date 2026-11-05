import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import { UserRole, type SystemUser, type UserCreateRequest } from '@api/types/pim';

/** Admin > User Management (`/admin/users`): login accounts linked to employees. */
export class UsersApi {
  constructor(private readonly api: ApiClient) {}

  create(body: UserCreateRequest): Promise<ApiResult<Envelope<SystemUser>>> {
    return this.api.post('/admin/users', body);
  }

  async createOrFail(body: UserCreateRequest): Promise<SystemUser> {
    const res = await this.create(body);
    expectStatus(res, 200);
    return res.body.data;
  }

  /** ESS account for an employee, as created by "Create Login Details". */
  createEss(
    empNumber: number,
    credentials: { username: string; password: string; enabled?: boolean },
  ): Promise<SystemUser> {
    return this.createOrFail({
      username: credentials.username,
      password: credentials.password,
      status: credentials.enabled ?? true,
      userRoleId: UserRole.ESS,
      empNumber,
    });
  }

  delete(ids: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete('/admin/users', { ids });
  }

  /** The users filter matches the full username only (not a contains search). */
  async findByUsername(username: string): Promise<SystemUser | undefined> {
    const res = await this.api.get<Envelope<SystemUser[], { total: number }>>('/admin/users', { username });
    expectStatus(res, 200);
    return res.body.data.find((u) => u.userName === username);
  }
}
