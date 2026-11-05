import { expect, type Locator, type Page } from '@playwright/test';

export class ConfirmDialog {
  readonly root: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page.locator('.orangehrm-dialog-popup');
    this.confirmButton = this.root.getByRole('button', { name: /Yes, (Delete|Confirm)/ });
    this.cancelButton = this.root.getByRole('button', { name: /No, Cancel|Cancel/ });
  }

  async confirm(name: string | RegExp = /Yes, (Delete|Confirm)/): Promise<void> {
    await this.root.getByRole('button', { name }).click();
    await expect(this.root).toBeHidden();
  }

  async cancel(): Promise<void> {
    await this.root.getByRole('button', { name: /No, Cancel|Cancel/ }).click();
    await expect(this.root).toBeHidden();
  }
}
