import { pimPaths } from './pimPaths';

const web = '/web/index.php';

/** Routes of the Job / Salary / Report-to tabs and the PIM pages checked by the access-control specs. */
export const jobPaths = {
  jobDetails: pimPaths.jobDetails,
  salaryList: (empNumber: number) => `${web}/pim/viewSalaryList/empNumber/${empNumber}`,
  reportTo: (empNumber: number) => `${web}/pim/viewReportToDetails/empNumber/${empNumber}`,
  personalDetails: pimPaths.personalDetails,
  employeeList: pimPaths.employeeList,
  addEmployee: pimPaths.addEmployee,
  /** PIM module entry of the side menu (redirects by role). */
  pimModule: `${web}/pim/viewPimModule`,
  /** PIM > Configuration > Optional Fields (OrangeHRM 5.x route; `/pim/viewOptionalFields` does not exist). */
  configurePim: `${web}/pim/configurePim`,
  /** Route named in the BRD/test case; it does not exist in OrangeHRM 5.9 (HTTP 404). */
  legacyOptionalFields: `${web}/pim/viewOptionalFields`,
  reports: `${web}/pim/viewDefinedPredefinedReports`,
};
