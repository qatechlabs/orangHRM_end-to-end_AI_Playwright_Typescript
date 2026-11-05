import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { step } from '@utils/step';
import { configPaths } from './configPaths';

/**
 * Output of a defined report (`displayPredefinedReport/<id>`). The grid is a `<revo-grid>`, not an
 * HTML table: group headers, column headers and rows are plain divs without ARIA roles.
 */
export class ReportOutputPage extends BasePage {
  path = '';

  readonly grid: Locator;
  readonly counter: Locator;
  readonly groupHeaders: Locator;
  readonly columnHeaders: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.grid = page.locator('.oxd-report-table');
    this.counter = page.locator('.oxd-report-table-header--pagination');
    this.groupHeaders = this.grid.locator('.group-rgRow .header-content');
    this.columnHeaders = this.grid.locator('.header-rgRow.actual-rgRow .header-content');
    this.rows = this.grid.locator('revogr-data .rgRow');
  }

  /** The report name is the page's h6 heading. */
  title(name: string): Locator {
    return this.page.getByRole('heading', { name, exact: true, level: 6 });
  }

  @step('Open the output of report {0}')
  async openFor(reportId: number): Promise<this> {
    this.path = configPaths.displayReport(reportId);
    await this.open();
    await this.waitForGrid();
    return this;
  }

  async waitForGrid(): Promise<void> {
    await expect(this.counter).toHaveText(/Records? Found/, { timeout: 20_000 });
  }

  /** Cell texts of every row, in column order. */
  async rowTexts(): Promise<string[][]> {
    const rows = await this.rows.all();
    return Promise.all(
      rows.map(async (r) => (await r.locator('.rgCell').allInnerTexts()).map((t) => t.trim())),
    );
  }

  // ---- assertions ----

  async expectReport(spec: {
    name: string;
    groups: string[];
    columns: string[];
    rows: string[][];
  }): Promise<void> {
    await expect(this.title(spec.name)).toBeVisible();
    await expect(this.groupHeaders).toHaveText(spec.groups);
    await expect(this.columnHeaders).toHaveText(spec.columns);
    const n = spec.rows.length;
    await expect(this.counter).toHaveText(n === 1 ? '(1) Record Found' : `(${n}) Records Found`);
    await expect(this.rows).toHaveCount(n);
    // Row order is the server's (by empNumber); compare as a set.
    const sorted = (rows: string[][]) => [...rows].sort((a, b) => a.join('|').localeCompare(b.join('|')));
    await expect.poll(async () => sorted(await this.rowTexts())).toEqual(sorted(spec.rows));
  }
}
