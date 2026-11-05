const web = '/web/index.php';

/** Profile tab routes of group B (Personal Details is `pimPaths.personalDetails`). */
export const pimDetailPaths = {
  contactDetails: (empNumber: number) => `${web}/pim/contactDetails/empNumber/${empNumber}`,
  emergencyContacts: (empNumber: number) => `${web}/pim/viewEmergencyContacts/empNumber/${empNumber}`,
  dependents: (empNumber: number) => `${web}/pim/viewDependents/empNumber/${empNumber}`,
  immigration: (empNumber: number) => `${web}/pim/viewImmigration/empNumber/${empNumber}`,
};
