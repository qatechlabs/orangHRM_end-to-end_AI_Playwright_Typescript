import { expect, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';

/** The oxd list table used on every OrangeHRM list screen. */
export class DataTable {
  readonly root: Locator;
  readonly headers: Locator;
  readonly rows: Locator;
  readonly recordCount: Locator;
  readonly selectAll: Locator;

  constructor(scope: Locator | Page) {
    const page = 'page' in scope ? scope.page() : scope;
    this.root = scope.locator('.oxd-table').first();
    this.headers = this.root.locator('.oxd-table-header .oxd-table-th');
    this.rows = this.root.locator('.oxd-table-body .oxd-table-card');
    this.recordCount = page
      .locator('.orangehrm-horizontal-padding .oxd-text--span')
      .filter({ hasText: /Record/ });
    this.selectAll = this.root.locator('.oxd-table-header .oxd-checkbox-input');
    instrumentAssertions(this, () => page);
  }

  async headerTexts(): Promise<string[]> {
    return (await this.headers.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** Row containing all given texts. */
  row(...texts: (string | RegExp)[]): Locator {
    return texts.reduce<Locator>((loc, t) => loc.filter({ hasText: t }), this.rows);
  }

  async columnIndex(header: string): Promise<number> {
    const headers = await this.root.locator('.oxd-table-header .oxd-table-th').allInnerTexts();
    const idx = headers.findIndex((h) => h.trim() === header);
    if (idx < 0) throw new Error(`Column "${header}" not found. Columns: ${headers.join(' | ')}`);
    return idx;
  }

  async cell(row: Locator, header: string): Promise<Locator> {
    return row.locator('.oxd-table-cell').nth(await this.columnIndex(header));
  }

  async columnValues(header: string): Promise<string[]> {
    const idx = await this.columnIndex(header);
    return (await this.rows.locator(`.oxd-table-cell:nth-child(${idx + 1})`).allInnerTexts()).map((t) =>
      t.trim(),
    );
  }

  /** Parses "(12) Records Found" / "No Records Found". */
  async count(): Promise<number> {
    const text = (await this.recordCount.first().innerText()).trim();
    return /No Records/i.test(text) ? 0 : Number(text.match(/\((\d+)\)/)?.[1] ?? NaN);
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.root.locator('.oxd-table-loader')).toHaveCount(0);
  }

  async clickAction(row: Locator, icon: 'delete' | 'edit' | 'view'): Promise<void> {
    const cls = { delete: 'bi-trash', edit: 'bi-pencil-fill', view: 'bi-eye-fill' }[icon];
    await row.locator(`button:has(i.${cls})`).click();
  }

  async selectRow(row: Locator): Promise<void> {
    await row.locator('.oxd-checkbox-input').click();
  }

  /** Header cell by its visible label (the sort menu items live inside every header cell). */
  headerCell(header: string): Locator {
    return this.root
      .locator('.oxd-table-header-cell')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(header)}\\s*(Ascending|$)`) });
  }

  /** Opens the sort menu of a column and returns its items. */
  async openSortMenu(header: string): Promise<Locator> {
    const cell = this.headerCell(header);
    await cell.locator('.oxd-table-header-sort').click();
    return cell.locator('.oxd-table-header-sort-dropdown li');
  }

  async sortBy(header: string, order: 'Ascending' | 'Descending'): Promise<void> {
    const items = await this.openSortMenu(header);
    await items.filter({ hasText: order }).click();
  }

  rowCheckbox(row: Locator): Locator {
    return row.locator('input[type="checkbox"]');
  }

  async toggleSelectAll(): Promise<void> {
    await this.root.locator('.oxd-table-header .oxd-checkbox-input').click();
  }

  /** Header labels in order; sortable headers also contain their (hidden) sort menu text. */
  async expectHeaders(labels: string[]): Promise<void> {
    await expect(this.headers).toHaveText(
      labels.map((l) => new RegExp(`^\\s*${escapeRegex(l)}\\s*(Ascending\\s*Descending)?\\s*$`)),
    );
  }

  async expectRecordCount(n: number): Promise<void> {
    await expect.poll(() => this.count()).toBe(n);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
