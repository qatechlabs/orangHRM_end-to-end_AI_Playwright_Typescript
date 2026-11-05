import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { step } from '@utils/step';

export interface VisitResult {
  status: number | null;
  url: string;
}

/**
 * Direct navigation to PIM URLs as a restricted user (ESS / supervisor): records the HTTP status
 * of the document and exposes the denial / empty-state texts OrangeHRM renders in its layout.
 */
export class PimAccessPage extends BasePage {
  path = '';

  readonly credentialRequired: Locator;
  readonly noRecords: Locator;
  readonly tabs: Locator;
  readonly tables: Locator;

  constructor(page: Page) {
    super(page);
    this.credentialRequired = page.getByText('Credential Required');
    this.noRecords = page.locator('.oxd-layout-context').getByText('No Records Found');
    this.tabs = page.locator('.orangehrm-tabs-item');
    this.tables = page.locator('.oxd-table');
  }

  /**
   * Navigates and resolves with the main document status. Chromium rejects `goto` with
   * ERR_HTTP_RESPONSE_CODE_FAILURE for an error status with an empty body (the 404 routes), so
   * the status is read from the navigation response instead.
   */
  @step('Open {0} directly')
  async visit(path: string): Promise<VisitResult> {
    const document = this.page.waitForResponse(
      (r) => r.request().isNavigationRequest() && new URL(r.url()).pathname === path,
    );
    try {
      await this.page.goto(path, { waitUntil: 'load' });
    } catch (error) {
      if (!String(error).includes('ERR_HTTP_RESPONSE_CODE_FAILURE')) throw error;
    }
    const response = await document;
    return { status: response.status(), url: this.page.url() };
  }

  async expectDenied(): Promise<void> {
    await expect(this.credentialRequired).toBeVisible();
    await expect(this.tables).toHaveCount(0);
  }

  /** Another employee's profile for an ESS user: the layout loads with no data and no tabs. */
  async expectNoEmployeeData(): Promise<void> {
    await expect(this.noRecords).toBeVisible();
    await expect(this.tabs).toHaveCount(0);
  }

  tabNames(): Locator {
    return this.tabs;
  }
}
