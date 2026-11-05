import { ApiClient, expectStatus, type Envelope } from '@api/ApiClient';
import type { JobTitle, NamedItem, Subunit } from '@api/types/pim';

/**
 * Read-only Admin master data that PIM screens offer in their drop-downs. Tests resolve ids by
 * name (or pick existing values) at runtime instead of hard-coding ids of the shared demo.
 */
export class MasterDataApi {
  constructor(private readonly api: ApiClient) {}

  async jobTitles(): Promise<JobTitle[]> {
    return this.data<JobTitle[]>('/admin/job-titles');
  }

  async employmentStatuses(): Promise<NamedItem[]> {
    return this.data<NamedItem[]>('/admin/employment-statuses');
  }

  async subunits(): Promise<Subunit[]> {
    // The org-structure endpoint rejects paging parameters.
    return this.data<Subunit[]>('/admin/subunits', {});
  }

  async terminationReasons(): Promise<NamedItem[]> {
    return this.data<NamedItem[]>('/pim/termination-reasons');
  }

  private async data<T>(endpoint: string, query: Record<string, number> = { limit: 0 }): Promise<T> {
    const res = await this.api.get<Envelope<T>>(endpoint, query);
    expectStatus(res, 200);
    return res.body.data;
  }
}
