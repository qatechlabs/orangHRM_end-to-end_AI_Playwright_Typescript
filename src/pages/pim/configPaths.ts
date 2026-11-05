const web = '/web/index.php';

/** Routes of the Qualifications / Memberships tabs, PIM > Configuration screens and PIM > Reports. */
export const configPaths = {
  qualifications: (empNumber: number) => `${web}/pim/viewQualifications/empNumber/${empNumber}`,
  memberships: (empNumber: number) => `${web}/pim/viewMemberships/empNumber/${empNumber}`,
  attachment: (empNumber: number, attachId: number) =>
    `${web}/pim/viewAttachment/empNumber/${empNumber}/attachId/${attachId}`,

  dataImport: `${web}/pim/pimCsvImport`,
  sampleCsv: `${web}/pim/sampleCsvDownload`,

  reportingMethods: `${web}/pim/viewReportingMethods`,
  addReportingMethod: `${web}/pim/saveReportingMethod`,
  editReportingMethod: (id: number) => `${web}/pim/saveReportingMethod/${id}`,
  terminationReasons: `${web}/pim/viewTerminationReasons`,
  addTerminationReason: `${web}/pim/saveTerminationReasons`,
  editTerminationReason: (id: number) => `${web}/pim/saveTerminationReasons/${id}`,

  reports: `${web}/pim/viewDefinedPredefinedReports`,
  defineReport: `${web}/pim/definePredefinedReport`,
  editReport: (id: number) => `${web}/pim/definePredefinedReport/${id}`,
  displayReport: (id: number) => `${web}/pim/displayPredefinedReport/${id}`,
};
