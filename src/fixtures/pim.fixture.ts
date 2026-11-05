import { test as base } from './api.fixture';
import { EmployeesApi } from '@api/services/EmployeesApi';
import { UsersApi } from '@api/services/UsersApi';
import { MasterDataApi } from '@api/services/MasterDataApi';
import { EmployeeSeeder, type SeededEmployee } from '@data/EmployeeSeeder';
import { EmployeeListPage } from '@pages/pim/EmployeeListPage';
import { AddEmployeePage } from '@pages/pim/AddEmployeePage';
import { EmployeeProfilePage } from '@pages/pim/EmployeeProfilePage';
import { EmployeeJobPage } from '@pages/pim/EmployeeJobPage';
import { ChangeProfilePicturePage } from '@pages/pim/ChangeProfilePicturePage';

/**
 * PIM module fixtures.
 *  - pages: employeeListPage, addEmployeePage, employeeProfilePage, employeeJobPage, changeProfilePicturePage
 *  - services (Admin session): employeesApi, usersApi, masterDataApi
 *  - data: `employees` (EmployeeSeeder) creates employees/logins via API and deletes everything it
 *    created or was told to track at teardown; `createdEmployee` is one fresh current employee.
 * Later PIM groups add variants through EmployeeSpec (job, terminated, login, photo, ...).
 */
export interface PimFixtures {
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
  employeeProfilePage: EmployeeProfilePage;
  employeeJobPage: EmployeeJobPage;
  changeProfilePicturePage: ChangeProfilePicturePage;
  employeesApi: EmployeesApi;
  usersApi: UsersApi;
  masterDataApi: MasterDataApi;
  employees: EmployeeSeeder;
  createdEmployee: SeededEmployee;
}

export const test = base.extend<PimFixtures>({
  employeeListPage: async ({ page }, use) => use(new EmployeeListPage(page)),
  addEmployeePage: async ({ page }, use) => use(new AddEmployeePage(page)),
  employeeProfilePage: async ({ page }, use) => use(new EmployeeProfilePage(page)),
  employeeJobPage: async ({ page }, use) => use(new EmployeeJobPage(page)),
  changeProfilePicturePage: async ({ page }, use) => use(new ChangeProfilePicturePage(page)),

  employeesApi: async ({ api }, use) => use(new EmployeesApi(api)),
  usersApi: async ({ api }, use) => use(new UsersApi(api)),
  masterDataApi: async ({ api }, use) => use(new MasterDataApi(api)),

  employees: async ({ employeesApi, usersApi, masterDataApi }, use) => {
    const seeder = new EmployeeSeeder(employeesApi, usersApi, masterDataApi);
    await use(seeder);
    await seeder.cleanup();
  },

  createdEmployee: async ({ employees }, use) => {
    await use(await employees.create());
  },
});
