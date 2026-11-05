import { expect, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';

export type MenuItem =
  | 'Admin'
  | 'PIM'
  | 'Leave'
  | 'Time'
  | 'Recruitment'
  | 'My Info'
  | 'Performance'
  | 'Dashboard'
  | 'Directory'
  | 'Maintenance'
  | 'Claim'
  | 'Buzz';

export class Sidebar {
  readonly root: Locator;
  readonly search: Locator;
  readonly items: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('aside.oxd-sidepanel');
    this.search = this.root.getByPlaceholder('Search');
    this.items = this.root.locator('.oxd-main-menu-item');
    instrumentAssertions(this, () => page);
  }

  item(name: MenuItem): Locator {
    return this.items.filter({ has: this.page.locator('span', { hasText: new RegExp(`^${name}$`) }) });
  }

  async navigateTo(name: MenuItem): Promise<void> {
    await this.item(name).click();
    await expect(this.page.locator('.oxd-topbar-header-breadcrumb')).toContainText(
      name === 'My Info' ? 'PIM' : name,
    );
  }

  /** Snapshot of the visible menu labels. Waits for the menu to render first: `allInnerTexts` does not retry. */
  async menuNames(): Promise<string[]> {
    await expect(this.items.first()).toBeVisible();
    return (await this.items.allInnerTexts()).map((t) => t.trim());
  }

  /** Retrying assertion on the exact ordered list of menu labels. */
  async expectMenuNames(names: MenuItem[]): Promise<void> {
    await expect(this.items).toHaveText(names);
  }
}
