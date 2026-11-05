import { expect, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';

/**
 * Wraps one `.oxd-input-group` (label + control + validation message) located by its label text.
 * Knows how to drive every oxd control type so page objects never deal with raw selectors.
 */
export class FormField {
  readonly root: Locator;
  readonly input: Locator;
  readonly textarea: Locator;
  readonly select: Locator;
  readonly error: Locator;

  constructor(scope: Locator | Page, label: string | RegExp) {
    // `has:` is evaluated relative to each candidate group, so the label locator must be built from
    // the page (never from a scoped Locator, which would drag the outer selector chain into the query).
    const page = 'page' in scope && typeof scope.page === 'function' ? scope.page() : (scope as Page);
    const labelLocator =
      typeof label === 'string'
        ? page.locator('label').filter({ hasText: new RegExp(`^\\s*${escapeRegex(label)}\\s*\\*?\\s*$`) })
        : page.locator('label').filter({ hasText: label });
    this.root = scope.locator('.oxd-input-group').filter({ has: labelLocator }).first();
    this.input = this.root.locator('input').first();
    this.textarea = this.root.locator('textarea');
    this.select = this.root.locator('.oxd-select-text');
    this.error = this.root.locator('.oxd-input-group__message, .oxd-input-field-error-message');
    instrumentAssertions(this, () => page);
  }

  async fill(value: string): Promise<void> {
    // oxd inputs keep stale values on fill(); clear explicitly first.
    await this.input.click();
    await this.input.press('ControlOrMeta+a');
    await this.input.press('Backspace');
    if (value) await this.input.fill(value);
  }

  async fillTextarea(value: string): Promise<void> {
    await this.textarea.fill(value);
  }

  /** Picks an option of an oxd-select dropdown by visible text. */
  async choose(option: string | RegExp): Promise<void> {
    await this.select.click();
    const dropdown = this.root.page().locator('.oxd-select-dropdown');
    await dropdown.getByRole('option', { name: option, exact: typeof option === 'string' }).click();
    await expect(dropdown).toBeHidden();
  }

  /** Types into an oxd-autocomplete and picks the first suggestion that matches. */
  async autocomplete(text: string, pick: string | RegExp = text): Promise<void> {
    await this.input.fill(text);
    const dropdown = this.root.page().locator('.oxd-autocomplete-dropdown');
    await expect(dropdown.getByText('Searching....')).toBeHidden({ timeout: 15_000 });
    await dropdown.getByRole('option').filter({ hasText: pick }).first().click();
  }

  /** Date inputs accept typed values in the configured format (default yyyy-mm-dd). */
  async setDate(value: string): Promise<void> {
    await this.fill(value);
    await this.input.press('Tab');
  }

  async check(checked = true): Promise<void> {
    const box = this.root.locator('input[type="checkbox"]');
    if ((await box.isChecked()) !== checked) await this.root.locator('.oxd-checkbox-input').click();
  }

  /** Texts of an oxd-select's options (opens and closes the drop-down). */
  async options(): Promise<string[]> {
    await this.select.click();
    const dropdown = this.root.page().locator('.oxd-select-dropdown');
    await expect(dropdown.getByRole('option').first()).toBeVisible();
    const texts = (await dropdown.getByRole('option').allInnerTexts()).map((t) => t.trim());
    await this.select.press('Escape');
    await expect(dropdown).toBeHidden();
    return texts;
  }

  async value(): Promise<string> {
    return this.input.inputValue();
  }

  async selectedOption(): Promise<string> {
    return (await this.select.innerText()).trim();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.error).toHaveText(message);
  }

  async expectNoError(): Promise<void> {
    await expect(this.error).toHaveCount(0);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
