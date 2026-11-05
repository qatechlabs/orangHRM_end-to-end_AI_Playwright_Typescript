import { expect, type Locator, type Page } from '@playwright/test';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FormField } from './components/FormField';
import { DataTable } from './components/DataTable';
import { step } from '@utils/step';
import { instrumentAssertions } from '../evidence/assertions';

/**
 * Parent of every page object. Holds the shared OrangeHRM shell (sidebar, top bar, toasts,
 * dialogs) and the helpers that understand the oxd-* Vue component library.
 *
 * Rules for subclasses:
 *  - expose locators as readonly fields and user intents as async methods decorated with @step
 *  - never assert inside action methods; put assertions in `expect*` methods
 *  - no hard waits; rely on web-first assertions and `waitForReady()`
 */
export abstract class BasePage {
  /** Path relative to baseURL, used by `open()`. */
  abstract readonly path: string;

  readonly sidebar: Sidebar;
  readonly topBar: TopBar;
  readonly toast: Toast;
  readonly dialog: ConfirmDialog;
  readonly loader: Locator;

  constructor(readonly page: Page) {
    this.sidebar = new Sidebar(page);
    this.topBar = new TopBar(page);
    this.toast = new Toast(page);
    this.dialog = new ConfirmDialog(page);
    this.loader = page.locator('.oxd-form-loader, .oxd-loading-spinner');
    // Every expect* method becomes a named step with an evidence screenshot (see src/evidence).
    instrumentAssertions(this, () => this.page);
  }

  @step()
  async open(): Promise<this> {
    await this.page.goto(this.path);
    await this.waitForReady();
    return this;
  }

  /** Waits until OrangeHRM's spinners/overlays are gone. */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.loader).toHaveCount(0, { timeout: 20_000 });
  }

  /** A labelled form control (input, select, autocomplete, date, textarea). */
  field(label: string | RegExp, scope: Locator | Page = this.page): FormField {
    return new FormField(scope, label);
  }

  table(scope: Locator | Page = this.page): DataTable {
    return new DataTable(scope);
  }

  button(name: string | RegExp, scope: Locator | Page = this.page): Locator {
    return scope.getByRole('button', { name, exact: typeof name === 'string' });
  }

  async expectUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}
