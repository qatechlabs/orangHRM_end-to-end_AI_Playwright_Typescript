import type { Locator, Page } from '@playwright/test';

export class TopBar {
  readonly breadcrumb: Locator;
  readonly moduleTitle: Locator;
  readonly userDropdown: Locator;
  readonly userName: Locator;

  constructor(private readonly page: Page) {
    this.breadcrumb = page.locator('.oxd-topbar-header-breadcrumb');
    this.moduleTitle = this.breadcrumb.locator('h6').first();
    this.userDropdown = page.locator('.oxd-userdropdown-tab');
    this.userName = page.locator('.oxd-userdropdown-name');
  }

  async openUserMenu(): Promise<void> {
    await this.userDropdown.click();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }
}
