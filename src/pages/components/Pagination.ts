import { expect, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';

/** oxd pagination below list tables. */
export class Pagination {
  readonly root: Locator;
  readonly next: Locator;
  readonly previous: Locator;
  readonly selected: Locator;

  constructor(scope: Page | Locator) {
    this.root = scope.getByRole('navigation', { name: 'Pagination Navigation' });
    this.next = this.root.locator('button:has(.bi-chevron-right)');
    this.previous = this.root.locator('button:has(.bi-chevron-left)');
    this.selected = this.root.locator('.oxd-pagination-page-item--page-selected');
    instrumentAssertions(this, () => this.root.page());
  }

  page(n: number): Locator {
    return this.root.getByRole('button', { name: String(n), exact: true });
  }

  async expectSelected(n: number): Promise<void> {
    await expect(this.selected).toHaveText(String(n));
  }
}
