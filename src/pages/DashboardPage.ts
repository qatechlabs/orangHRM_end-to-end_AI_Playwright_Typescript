import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { paths } from '@config/env';

export class DashboardPage extends BasePage {
  readonly path = paths.dashboard;
  readonly widgets: Locator;

  constructor(page: Page) {
    super(page);
    this.widgets = page.locator('.orangehrm-dashboard-widget');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard\/index/);
    await expect(this.topBar.moduleTitle).toHaveText('Dashboard');
  }
}
