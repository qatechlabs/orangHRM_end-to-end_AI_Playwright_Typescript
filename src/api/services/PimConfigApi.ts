import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import type { JobTitle } from '@api/types/pim';
import type {
  Base64File,
  ConfigItem,
  ConfigListResource,
  CsvImportResult,
  DefinedReport,
  DefinedReportDetail,
  DefinedReportRequest,
  JobTitleRequest,
  ReportHeaders,
  ReportRow,
} from '@api/types/pim-config';

/**
 * PIM > Configuration and Reports: `/pim/reporting-methods`, `/pim/termination-reasons`,
 * `/pim/csv-import`, `/pim/reports/defined` (+ the run endpoints `/pim/reports` and
 * `/pim/reports/data`), plus Admin job titles used as deterministic report filters.
 */
export class PimConfigApi {
  constructor(private readonly api: ApiClient) {}

  // ---- reporting methods / termination reasons (same contract) ----

  listItems(resource: ConfigListResource): Promise<ApiResult<Envelope<ConfigItem[], { total: number }>>> {
    return this.api.get(`/pim/${resource}`, { limit: 0 });
  }

  async listItemsOrFail(resource: ConfigListResource): Promise<ConfigItem[]> {
    const res = await this.listItems(resource);
    expectStatus(res, 200);
    return res.body.data;
  }

  getItem(resource: ConfigListResource, id: number): Promise<ApiResult<Envelope<ConfigItem>>> {
    return this.api.get(`/pim/${resource}/${id}`);
  }

  /** Raw body so negative tests can send `{}` or any shape. */
  createItem(resource: ConfigListResource, body: unknown): Promise<ApiResult<Envelope<ConfigItem>>> {
    return this.api.post(`/pim/${resource}`, body);
  }

  updateItem(
    resource: ConfigListResource,
    id: number,
    name: string,
  ): Promise<ApiResult<Envelope<ConfigItem>>> {
    return this.api.put(`/pim/${resource}/${id}`, { name });
  }

  /** Reporting methods answer with numeric ids, termination reasons with string ids. */
  deleteItems(
    resource: ConfigListResource,
    ids: number[],
  ): Promise<ApiResult<Envelope<(number | string)[]>>> {
    return this.api.delete(`/pim/${resource}`, { ids });
  }

  // ---- data import ----

  importCsv(
    body: { attachment?: Base64File } | Record<string, unknown>,
  ): Promise<ApiResult<Envelope<unknown[], CsvImportResult>>> {
    return this.api.post('/pim/csv-import', body);
  }

  // ---- defined reports ----

  reports(
    query: { name?: string; reportId?: number } = {},
  ): Promise<ApiResult<Envelope<DefinedReport[], { total: number }>>> {
    return this.api.get('/pim/reports/defined', { limit: 0, ...query });
  }

  async reportsOrFail(query: { name?: string; reportId?: number } = {}): Promise<DefinedReport[]> {
    const res = await this.reports(query);
    expectStatus(res, 200);
    return res.body.data;
  }

  report(id: number): Promise<ApiResult<Envelope<DefinedReportDetail>>> {
    return this.api.get(`/pim/reports/defined/${id}`);
  }

  createReport(body: DefinedReportRequest): Promise<ApiResult<Envelope<DefinedReport>>> {
    return this.api.post('/pim/reports/defined', body);
  }

  deleteReports(ids: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete('/pim/reports/defined', { ids });
  }

  reportHeaders(reportId: number): Promise<ApiResult<Envelope<ReportHeaders>>> {
    return this.api.get('/pim/reports', { name: 'pim_defined', reportId });
  }

  reportData(reportId: number): Promise<ApiResult<Envelope<ReportRow[], { total: number }>>> {
    return this.api.get('/pim/reports/data', {
      limit: 50,
      offset: 0,
      reportId,
      name: 'pim_defined',
      _dateFormattingEnabled: true,
    });
  }

  // ---- usages (a Report-to relation uses a reporting method) ----

  /** Makes `supervisor` a supervisor of `subordinate` with the given reporting method. */
  addSupervisor(
    subordinate: number,
    supervisor: number,
    reportingMethodId: number,
  ): Promise<ApiResult<Envelope<unknown>>> {
    return this.api.post(`/pim/employees/${subordinate}/supervisors`, {
      empNumber: supervisor,
      reportingMethodId,
    });
  }

  deleteSupervisors(subordinate: number, supervisors: number[]): Promise<ApiResult<Envelope<unknown>>> {
    return this.api.delete(`/pim/employees/${subordinate}/supervisors`, { ids: supervisors });
  }

  // ---- Admin job titles ----

  createJobTitle(body: JobTitleRequest): Promise<ApiResult<Envelope<JobTitle>>> {
    return this.api.post('/admin/job-titles', { description: '', note: null, ...body });
  }

  deleteJobTitles(ids: number[]): Promise<ApiResult<Envelope<string[]>>> {
    return this.api.delete('/admin/job-titles', { ids });
  }
}
