import { test as base } from './pim.fixture';
import { EmployeeDetailsApi } from '@api/services/EmployeeDetailsApi';
import { PersonalDetailsPage } from '@pages/pim/PersonalDetailsPage';
import { ContactDetailsPage } from '@pages/pim/ContactDetailsPage';
import { EmergencyContactsPage } from '@pages/pim/EmergencyContactsPage';
import { DependentsPage } from '@pages/pim/DependentsPage';
import { ImmigrationPage } from '@pages/pim/ImmigrationPage';

/**
 * Employee profile detail tabs (Personal, Contact, Emergency Contacts, Dependents, Immigration).
 * Builds on the PIM fixtures: tests create their employee with `employees` / `createdEmployee`
 * and the records they add go away with the employee at teardown.
 */
export interface PimDetailsFixtures {
  personalDetailsPage: PersonalDetailsPage;
  contactDetailsPage: ContactDetailsPage;
  emergencyContactsPage: EmergencyContactsPage;
  dependentsPage: DependentsPage;
  immigrationPage: ImmigrationPage;
  employeeDetailsApi: EmployeeDetailsApi;
}

export const test = base.extend<PimDetailsFixtures>({
  personalDetailsPage: async ({ page }, use) => use(new PersonalDetailsPage(page)),
  contactDetailsPage: async ({ page }, use) => use(new ContactDetailsPage(page)),
  emergencyContactsPage: async ({ page }, use) => use(new EmergencyContactsPage(page)),
  dependentsPage: async ({ page }, use) => use(new DependentsPage(page)),
  immigrationPage: async ({ page }, use) => use(new ImmigrationPage(page)),
  employeeDetailsApi: async ({ api }, use) => use(new EmployeeDetailsApi(api)),
});
