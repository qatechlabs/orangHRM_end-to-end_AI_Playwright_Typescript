const web = '/web/index.php';

/** PIM routes. Employee-specific screens take the empNumber (not the Employee Id). */
export const pimPaths = {
  employeeList: `${web}/pim/viewEmployeeList`,
  addEmployee: `${web}/pim/addEmployee`,
  personalDetails: (empNumber: number) => `${web}/pim/viewPersonalDetails/empNumber/${empNumber}`,
  jobDetails: (empNumber: number) => `${web}/pim/viewJobDetails/empNumber/${empNumber}`,
  changePhoto: (empNumber: number) => `${web}/pim/viewPhotograph/empNumber/${empNumber}`,
  photo: (empNumber: number) => `${web}/pim/viewPhoto/empNumber/${empNumber}`,
};

/** Matches any employee profile tab URL and captures the empNumber. */
export const PROFILE_URL = /\/pim\/view\w+\/empNumber\/(\d+)/;
