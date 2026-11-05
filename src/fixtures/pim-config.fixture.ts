import { test as base } from './pim.fixture';
import type { APIRequestContext } from '@playwright/test';
import { ApiClient, expectStatus } from '@api/ApiClient';
import { AuthApi } from '@api/services/AuthApi';
import { EmployeeQualificationsApi } from '@api/services/EmployeeQualificationsApi';
import { PimConfigApi } from '@api/services/PimConfigApi';
import { EmployeesApi } from '@api/services/EmployeesApi';
import type { JobTitle } from '@api/types/pim';
import type {
  ConfigItem,
  ConfigListResource,
  DefinedReport,
  DefinedReportRequest,
} from '@api/types/pim-config';
import type { EmployeeSeeder } from '@data/EmployeeSeeder';
import { AttachmentsSection } from '@pages/components/AttachmentsSection';
import { QualificationsPage } from '@pages/pim/QualificationsPage';
import { MembershipsPage } from '@pages/pim/MembershipsPage';
import { DataImportPage } from '@pages/pim/DataImportPage';
import { ReportingMethodsPage } from '@pages/pim/ReportingMethodsPage';
import { TerminationReasonsPage } from '@pages/pim/TerminationReasonsPage';
import { ReportsPage } from '@pages/pim/ReportsPage';
import { DefineReportPage } from '@pages/pim/DefineReportPage';
import { ReportOutputPage } from '@pages/pim/ReportOutputPage';
import { uniqueSuffix } from '@utils/dataFactory';
import { logger } from '@utils/logger';

const log = logger('pim-config');

/**
 * Creates PIM configuration data (reporting methods, termination reasons, defined reports, Admin
 * job titles, usages of them) through the API and removes everything it created or was told to
 * track at teardown, in dependency order, even when the test failed half-way:
 * relations / terminations -> reports -> reasons / methods -> job titles -> imported employees.
 */
export class PimConfigSeeder {
  private readonly items: Record<ConfigListResource, Set<number>> = {
    'reporting-methods': new Set(),
    'termination-reasons': new Set(),
  };
  /** Name tokens of config entries created through the UI (resolved to ids at teardown). */
  private readonly itemNames: Record<ConfigListResource, Set<string>> = {
    'reporting-methods': new Set(),
    'termination-reasons': new Set(),
  };
  private readonly reports = new Set<number>();
  private readonly reportNames = new Set<string>();
  private readonly jobTitleIds = new Set<number>();
  private readonly supervisorLinks: { subordinate: number; supervisor: number }[] = [];
  private readonly terminated = new Set<number>();

  constructor(
    readonly api: PimConfigApi,
    readonly employeesApi: EmployeesApi,
    private readonly employees: EmployeeSeeder,
  ) {}

  /** Unique name, e.g. `AutoRM<suffix>`. */
  name(prefix: string): string {
    return `${prefix}${uniqueSuffix()}`;
  }

  async reportingMethod(name = this.name('AutoRM')): Promise<ConfigItem> {
    return this.createItem('reporting-methods', name);
  }

  async terminationReason(name = this.name('AutoTR')): Promise<ConfigItem> {
    return this.createItem('termination-reasons', name);
  }

  private async createItem(resource: ConfigListResource, name: string): Promise<ConfigItem> {
    const res = await this.api.createItem(resource, { name });
    expectStatus(res, 200);
    this.items[resource].add(res.body.data.id);
    return res.body.data;
  }

  /** Registers an id returned by a (possibly unexpectedly successful) create for deletion. */
  trackItem(resource: ConfigListResource, id: number): void {
    this.items[resource].add(id);
  }

  /** Registers an exact name created through the UI; resolved to its id at teardown. */
  trackItemName(resource: ConfigListResource, name: string): void {
    this.itemNames[resource].add(name);
  }

  /** Makes `supervisor` report `subordinate` with the given method (puts the method "in use"). */
  async useReportingMethod(
    subordinate: number,
    supervisor: number,
    reportingMethodId: number,
  ): Promise<void> {
    expectStatus(await this.api.addSupervisor(subordinate, supervisor, reportingMethodId), 200);
    this.supervisorLinks.push({ subordinate, supervisor });
  }

  /** Removes the supervisor relations created by `useReportingMethod` for `subordinate`. */
  async releaseReportingMethod(subordinate: number): Promise<void> {
    for (const link of this.supervisorLinks.filter((l) => l.subordinate === subordinate)) {
      expectStatus(await this.api.deleteSupervisors(link.subordinate, [link.supervisor]), 200);
    }
    this.supervisorLinks.splice(
      0,
      this.supervisorLinks.length,
      ...this.supervisorLinks.filter((l) => l.subordinate !== subordinate),
    );
  }

  /** Terminates the employee with the reason (puts the reason "in use"). */
  async useTerminationReason(empNumber: number, terminationReasonId: number): Promise<void> {
    await this.employees.terminate(empNumber, { terminationReasonId, note: 'auto' });
    this.terminated.add(empNumber);
  }

  async releaseTerminationReason(empNumber: number): Promise<void> {
    expectStatus(await this.employeesApi.activate(empNumber), 200);
    this.terminated.delete(empNumber);
  }

  async jobTitle(title = this.name('AutoJT ')): Promise<JobTitle> {
    const res = await this.api.createJobTitle({
      title,
      description: 'PIM report automation; deleted in teardown',
    });
    expectStatus(res, 200);
    this.jobTitleIds.add(res.body.data.id);
    return res.body.data;
  }

  async report(body: DefinedReportRequest): Promise<DefinedReport> {
    const res = await this.api.createReport(body);
    expectStatus(res, 200);
    this.reports.add(res.body.data.id);
    return res.body.data;
  }

  trackReport(id: number): void {
    this.reports.add(id);
  }

  /** Registers a report name created through the UI; resolved to its id at teardown. */
  trackReportName(name: string): void {
    this.reportNames.add(name);
  }

  /** Imported employees: every current or past employee matching the token is deleted at teardown. */
  trackImported(token: string): void {
    this.employees.trackByName(token);
  }

  async cleanup(): Promise<void> {
    for (const link of this.supervisorLinks) {
      const res = await this.api.deleteSupervisors(link.subordinate, [link.supervisor]);
      if (!res.ok) log.debug(`supervisor link ${JSON.stringify(link)} -> ${res.status}`);
    }
    for (const empNumber of this.terminated) {
      const res = await this.employeesApi.activate(empNumber);
      if (!res.ok) log.debug(`activate ${empNumber} -> ${res.status}`);
    }

    if (this.reportNames.size) {
      const all = await this.api.reports();
      if (all.ok)
        all.body.data.filter((r) => this.reportNames.has(r.name)).forEach((r) => this.reports.add(r.id));
    }
    if (this.reports.size)
      await this.deleteEach([...this.reports], (ids) => this.api.deleteReports(ids), 'reports');

    for (const resource of Object.keys(this.items) as ConfigListResource[]) {
      if (this.itemNames[resource].size) {
        const all = await this.api.listItems(resource);
        if (all.ok) {
          all.body.data
            .filter((i) => this.itemNames[resource].has(i.name))
            .forEach((i) => this.items[resource].add(i.id));
        }
      }
      const ids = [...this.items[resource]];
      if (ids.length) await this.deleteEach(ids, (chunk) => this.api.deleteItems(resource, chunk), resource);
    }

    if (this.jobTitleIds.size) {
      await this.deleteEach([...this.jobTitleIds], (ids) => this.api.deleteJobTitles(ids), 'job titles');
    }
  }

  /** Bulk delete; when it fails (e.g. one id already gone) fall back to one by one. */
  private async deleteEach(
    ids: number[],
    del: (ids: number[]) => Promise<{ ok: boolean; status: number }>,
    what: string,
  ): Promise<void> {
    if ((await del(ids)).ok) return;
    for (const id of ids) {
      const res = await del([id]);
      if (!res.ok && res.status !== 404) log.warn(`could not delete ${what} ${id}: ${res.status}`);
    }
  }
}

/**
 * Qualifications, Memberships, Attachments, Data Import, Configuration lists and Reports.
 * Builds on the PIM fixtures: employees come from `employees` / `createdEmployee`.
 */
export interface PimConfigFixtures {
  qualificationsPage: QualificationsPage;
  membershipsPage: MembershipsPage;
  /** Attachments block of whichever profile tab is open. */
  profileAttachments: AttachmentsSection;
  dataImportPage: DataImportPage;
  reportingMethodsPage: ReportingMethodsPage;
  terminationReasonsPage: TerminationReasonsPage;
  pimReportsPage: ReportsPage;
  defineReportPage: DefineReportPage;
  reportOutputPage: ReportOutputPage;
  qualificationsApi: EmployeeQualificationsApi;
  pimConfigApi: PimConfigApi;
  pimConfig: PimConfigSeeder;
  /** Logs another user in over HTTP in a fresh request context (the Admin session is untouched). */
  apiSessions: { login(credentials: { username: string; password: string }): Promise<ApiClient> };
}

export const test = base.extend<PimConfigFixtures>({
  qualificationsPage: async ({ page }, use) => use(new QualificationsPage(page)),
  membershipsPage: async ({ page }, use) => use(new MembershipsPage(page)),
  profileAttachments: async ({ page }, use) => use(new AttachmentsSection(page)),
  dataImportPage: async ({ page }, use) => use(new DataImportPage(page)),
  reportingMethodsPage: async ({ page }, use) => use(new ReportingMethodsPage(page)),
  terminationReasonsPage: async ({ page }, use) => use(new TerminationReasonsPage(page)),
  pimReportsPage: async ({ page }, use) => use(new ReportsPage(page)),
  defineReportPage: async ({ page }, use) => use(new DefineReportPage(page)),
  reportOutputPage: async ({ page }, use) => use(new ReportOutputPage(page)),

  qualificationsApi: async ({ api }, use) => use(new EmployeeQualificationsApi(api)),
  pimConfigApi: async ({ api }, use) => use(new PimConfigApi(api)),

  // Depends on `employees`, so it is torn down first: usages and entries go before the employees.
  pimConfig: async ({ pimConfigApi, employeesApi, employees }, use) => {
    const seeder = new PimConfigSeeder(pimConfigApi, employeesApi, employees);
    await use(seeder);
    await seeder.cleanup();
  },

  apiSessions: async ({ playwright, env }, use) => {
    const contexts: APIRequestContext[] = [];
    await use({
      async login(credentials) {
        const ctx = await playwright.request.newContext({
          baseURL: env.baseURL,
          storageState: { cookies: [], origins: [] },
        });
        contexts.push(ctx);
        await new AuthApi(ctx).login(credentials);
        return new ApiClient(ctx);
      },
    });
    await Promise.all(contexts.map((c) => c.dispose()));
  },
});
