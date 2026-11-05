import { expect, type Locator } from '@playwright/test';

/**
 * oxd-autocomplete (Employee Name, Supervisor Name, ...). The suggestion request only fires on
 * real key events, so text is typed with pressSequentially. The first option is a transient
 * "Searching...." entry; callers pick by text, which waits for the real option.
 */
export class AutocompleteField {
  readonly listbox: Locator;
  readonly options: Locator;

  constructor(readonly input: Locator) {
    this.listbox = input.page().getByRole('listbox');
    this.options = this.listbox.getByRole('option');
  }

  async type(text: string): Promise<void> {
    await this.input.clear();
    await this.input.pressSequentially(text, { delay: 30 });
  }

  /** Types `text` and clicks the suggestion containing `pick` (defaults to `text`). */
  async select(text: string, pick: string | RegExp = text): Promise<void> {
    await this.type(text);
    await this.options.filter({ hasText: pick }).first().click();
    await expect(this.listbox).toBeHidden();
  }

  /** Free text without picking a suggestion (Employee List searches it as nameOrId). */
  async fillFreeText(text: string): Promise<void> {
    await this.type(text);
  }

  async value(): Promise<string> {
    return this.input.inputValue();
  }
}
