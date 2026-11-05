import { expect, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';
import { DataTable } from './DataTable';

/**
 * An "Assigned ..." record block of an employee profile tab (Emergency Contacts, Dependents,
 * Immigration, ...): heading with an Add button, a status line ("(n) Record(s) Found",
 * "No Records Found", "(n) Records Selected" + "Delete Selected") and a record table whose rows
 * carry a checkbox and icon-only trash / pencil buttons.
 *
 * The same tab has an Attachments block with identical controls below it, and the blocks are
 * siblings rather than nested containers, so everything is located relative to this block's heading.
 */
export class RecordSection {
  readonly header: Locator;
  readonly heading: Locator;
  readonly addButton: Locator;
  /** The line between the heading and the table (record count or selection bar). */
  readonly statusBar: Locator;
  readonly statusText: Locator;
  readonly deleteSelectedButton: Locator;
  readonly table: DataTable;
  readonly rows: Locator;

  constructor(
    readonly page: Page,
    readonly title: string,
  ) {
    const content = page.locator('.orangehrm-edit-employee-content');
    this.heading = content.getByRole('heading', { name: title, exact: true });
    // `has` needs a locator relative to the filtered element, hence page.getByRole.
    this.header = content
      .locator('.orangehrm-action-header')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
    this.addButton = this.header.getByRole('button', { name: 'Add' });
    // header -> its padding wrapper -> following siblings: [status line], table container.
    this.statusBar = this.header.locator(
      'xpath=../following-sibling::div[1][not(contains(concat(" ", normalize-space(@class), " "), " orangehrm-container "))]',
    );
    this.statusText = this.statusBar.locator('.oxd-text--span');
    this.deleteSelectedButton = this.statusBar.getByRole('button', { name: 'Delete Selected' });
    this.table = new DataTable(
      this.header.locator(
        'xpath=../following-sibling::div[contains(concat(" ", normalize-space(@class), " "), " orangehrm-container ")][1]',
      ),
    );
    this.rows = this.table.rows;
    instrumentAssertions(this, () => page);
  }

  /** Row containing all the given texts. */
  row(...texts: (string | RegExp)[]): Locator {
    return this.table.row(...texts);
  }

  async clickAdd(): Promise<void> {
    await this.addButton.click();
  }

  async clickEdit(row: Locator): Promise<void> {
    await this.table.clickAction(row, 'edit');
  }

  async clickDelete(row: Locator): Promise<void> {
    await this.table.clickAction(row, 'delete');
  }

  async selectRow(row: Locator): Promise<void> {
    await this.table.selectRow(row);
  }

  async selectAll(): Promise<void> {
    await this.table.toggleSelectAll();
  }

  async clickDeleteSelected(): Promise<void> {
    await this.deleteSelectedButton.click();
  }

  /** Text cells of a row, in column order (checkbox and actions columns are empty strings). */
  async rowTexts(row: Locator): Promise<string[]> {
    return (await row.locator('.oxd-table-cell').allInnerTexts()).map((t) => t.trim());
  }

  // ---- assertions ----

  async expectHeaders(labels: string[]): Promise<void> {
    await this.table.expectHeaders(labels);
  }

  /** Waits for the list refresh: the row count and the status line both match. */
  async expectRecords(n: number): Promise<void> {
    await expect(this.rows).toHaveCount(n);
    await expect(this.statusText).toHaveText(
      n === 0 ? 'No Records Found' : new RegExp(`^\\s*\\(${n}\\) Records? Found\\s*$`),
    );
  }

  async expectNoRecords(): Promise<void> {
    await this.expectRecords(0);
  }

  /** Cell texts of the row containing `key`, by column header ('' = empty cell). */
  async expectRow(key: string, cells: Record<string, string>): Promise<void> {
    const row = this.row(key);
    await expect(row).toHaveCount(1);
    for (const [header, text] of Object.entries(cells)) {
      await expect(await this.table.cell(row, header)).toHaveText(text);
    }
  }

  async expectSelected(n: number): Promise<void> {
    await expect(this.statusText).toHaveText(`(${n}) Records Selected`);
    await expect(this.deleteSelectedButton).toBeVisible();
  }
}
