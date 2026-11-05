import type { Page } from '@playwright/test';
import { configPaths } from './configPaths';
import { PimConfigListPage } from './PimConfigListPage';

/** PIM > Configuration > Termination Reasons (list + Add/Edit Termination Reason). */
export class TerminationReasonsPage extends PimConfigListPage {
  constructor(page: Page) {
    super(page, {
      title: 'Termination Reasons',
      singular: 'Termination Reason',
      resource: 'termination-reasons',
      listPath: configPaths.terminationReasons,
      addPath: configPaths.addTerminationReason,
      editPath: configPaths.editTerminationReason,
      loadsNameList: false,
      inUseMessage: 'Termination Reason(s) in Use',
    });
  }
}
