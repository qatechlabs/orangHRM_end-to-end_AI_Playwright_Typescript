import { mergeTests, type Page } from '@playwright/test';
import { test as pimTest } from './pim.fixture';
import { test as pageTest } from './pages.fixture';
import { EmployeeJobApi } from '@api/services/EmployeeJobApi';
import { ReportingMethod, type JobTitleWithSpec, type PayGradeCurrency } from '@api/types/pim-job';
import type { SeededEmployee } from '@data/EmployeeSeeder';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { EmployeeJobPage } from '@pages/pim/EmployeeJobPage';
import { EmployeeSalaryPage } from '@pages/pim/EmployeeSalaryPage';
import { EmployeeReportToPage } from '@pages/pim/EmployeeReportToPage';
import { EmployeeProfilePage } from '@pages/pim/EmployeeProfilePage';
import { EmployeeListPage } from '@pages/pim/EmployeeListPage';
import { PimAccessPage } from '@pages/pim/PimAccessPage';
import { uniqueSuffix } from '@utils/dataFactory';
import { logger } from '@utils/logger';

const log = logger('pim-job');

/** An employee with an ESS login (Supervisor role = ESS with at least one subordinate). */
export type LoginEmployee = SeededEmployee & { login: NonNullable<SeededEmployee['login']> };

export interface SupervisorPair {
  supervisor: LoginEmployee;
  subordinate: SeededEmployee;
}

/** `Grade 1` of the OrangeHRM seed data (USD 50000-60000); it survives the demo resets. */
export interface PayGradeInfo {
  id: number;
  name: string;
  currency: { id: string; name: string };
  min: number;
  max: number;
}

/** Page objects bound to a fresh browser context signed in as a restricted (ESS / supervisor) user. */
export interface RestrictedSession {
  page: Page;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  profilePage: EmployeeProfilePage;
  jobPage: EmployeeJobPage;
  salaryPage: EmployeeSalaryPage;
  reportToPage: EmployeeReportToPage;
  listPage: EmployeeListPage;
  access: PimAccessPage;
}

export interface JobTitles {
  /** Creates an Admin job title with an inline specification file; deleted at teardown. */
  createWithSpecification(file: string): Promise<JobTitleWithSpec>;
}

export interface PimJobFixtures {
  employeeSalaryPage: EmployeeSalaryPage;
  employeeReportToPage: EmployeeReportToPage;
  employeeJobApi: EmployeeJobApi;
  jobTitles: JobTitles;
  payGrade: PayGradeInfo;
  /** Fresh employee terminated today via API (reason "Other"). */
  terminatedEmployee: SeededEmployee;
  /** ESS user with no subordinates. */
  essEmployee: LoginEmployee;
  /** Supervisor (ESS login) + subordinate, relation Direct, all created via API. */
  supervisorPair: SupervisorPair;
  /** Signs in as the given user in a new guest context; the Admin session is never touched. */
  signIn: (credentials: { username: string; password: string }) => Promise<RestrictedSession>;
}

export const test = mergeTests(pimTest, pageTest).extend<PimJobFixtures>({
  employeeSalaryPage: async ({ page }, use) => use(new EmployeeSalaryPage(page)),
  employeeReportToPage: async ({ page }, use) => use(new EmployeeReportToPage(page)),
  employeeJobApi: async ({ api }, use) => use(new EmployeeJobApi(api)),

  jobTitles: async ({ employeeJobApi }, use) => {
    const created: number[] = [];
    await use({
      async createWithSpecification(file) {
        const title = await employeeJobApi.createJobTitleOrFail({
          title: `AutoSpec ${uniqueSuffix()}`,
          description: 'Created by the PIM job automation; deleted in teardown',
          specification: EmployeeJobApi.attachmentFromFile(file),
        });
        created.push(title.id);
        return title;
      },
    });
    if (created.length) {
      const res = await employeeJobApi.deleteJobTitles(created);
      if (!res.ok) log.warn(`could not delete job titles ${created.join(',')}: ${res.status}`);
    }
  },

  payGrade: async ({ employeeJobApi }, use) => {
    const grade = (await employeeJobApi.payGrades()).find((g) => g.name === 'Grade 1');
    if (!grade) throw new Error('Seed pay grade "Grade 1" not found on this instance');
    const [range]: PayGradeCurrency[] = await employeeJobApi.payGradeCurrencies(grade.id);
    await use({
      id: grade.id,
      name: grade.name,
      currency: range.currencyType,
      min: Number(range.minSalary),
      max: Number(range.maxSalary),
    });
  },

  terminatedEmployee: async ({ employees }, use) => {
    await use(await employees.create({ terminated: true }));
  },

  essEmployee: async ({ employees }, use) => {
    await use((await employees.create({ login: true })) as LoginEmployee);
  },

  supervisorPair: async ({ employees, employeeJobApi }, use) => {
    const [supervisor, subordinate] = await Promise.all([
      employees.create({ firstName: 'Sup', login: true }),
      employees.create({ firstName: 'Sub' }),
    ]);
    await employeeJobApi.addSupervisorOrFail(subordinate.empNumber, {
      empNumber: supervisor.empNumber,
      reportingMethodId: ReportingMethod.Direct,
    });
    // Relations go away with the employees in the seeder's teardown.
    await use({ supervisor: supervisor as LoginEmployee, subordinate });
  },

  signIn: async ({ guestSessions }, use) => {
    await use(async (credentials) => {
      const { page, loginPage, dashboardPage } = await guestSessions.open();
      await loginPage.open();
      await loginPage.loginSuccessfully(credentials);
      return {
        page,
        loginPage,
        dashboardPage,
        profilePage: new EmployeeProfilePage(page),
        jobPage: new EmployeeJobPage(page),
        salaryPage: new EmployeeSalaryPage(page),
        reportToPage: new EmployeeReportToPage(page),
        listPage: new EmployeeListPage(page),
        access: new PimAccessPage(page),
      };
    });
  },
});
