import type { Page } from '@playwright/test';
import { configPaths } from './configPaths';
import { PimConfigListPage } from './PimConfigListPage';

/** PIM > Configuration > Reporting Methods (list + Add/Edit Reporting Method). */
export class ReportingMethodsPage extends PimConfigListPage {
  constructor(page: Page) {
    super(page, {
      title: 'Reporting Methods',
      singular: 'Reporting Method',
      resource: 'reporting-methods',
      listPath: configPaths.reportingMethods,
      addPath: configPaths.addReportingMethod,
      editPath: configPaths.editReportingMethod,
      loadsNameList: true,
      inUseMessage: 'Reporting Method(s) in Use',
    });
  }
}
