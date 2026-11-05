import { expect, type Locator, type Page } from '@playwright/test';
import { instrumentAssertions } from '../../evidence/assertions';

/** Bottom-left notification shown after save/delete actions. */
export class Toast {
  readonly root: Locator;
  readonly title: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    this.root = page.locator('.oxd-toast');
    this.title = this.root.locator('.oxd-text--toast-title');
    this.message = this.root.locator('.oxd-text--toast-message');
    instrumentAssertions(this, () => page);
  }

  /**
   * Waits for the next toast and returns its texts. Use it when the page navigates right after the
   * toast appears (e.g. Add Employee redirects to the profile), so a later assertion would miss it.
   */
  async capture(): Promise<{ title: string; message: string }> {
    const toast = this.root.last();
    await toast.waitFor({ state: 'visible' });
    const [title, message] = await Promise.all([
      toast.locator('.oxd-text--toast-title').innerText(),
      toast.locator('.oxd-text--toast-message').innerText(),
    ]);
    return { title: title.trim(), message: message.trim() };
  }

  async expectSuccess(message: string | RegExp = /Successfully/): Promise<void> {
    // Toasts can stack; check the newest success toast and its own message.
    const toast = this.root.filter({ hasText: 'Success' }).last();
    await expect(toast).toBeVisible();
    await expect(toast.locator('.oxd-text--toast-message')).toHaveText(message);
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.root.filter({ hasText: /Error|Info|Warning/ }).first()).toBeVisible();
    await expect(this.message.first()).toHaveText(message);
  }

  async expectInfo(message: string | RegExp): Promise<void> {
    await expect(this.message.first()).toHaveText(message);
  }
}
