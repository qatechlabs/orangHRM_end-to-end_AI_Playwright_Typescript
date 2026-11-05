import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { step } from '@utils/step';
import { pimPaths } from './pimPaths';

/** /pim/viewPhotograph/empNumber/<n>, opened by clicking the photo in the profile header. */
export class ChangeProfilePicturePage extends BasePage {
  path = '';

  readonly heading: Locator;
  readonly preview: Locator;
  readonly photoInput: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;
  /** BRD PIM-FR-006-AC4: a control to delete the current photo. */
  readonly deletePhotoButton: Locator;

  constructor(page: Page) {
    super(page);
    const form = page.locator('form');
    this.heading = page.getByRole('heading', { name: 'Change Profile Picture' });
    // The header image has the same class; scope to the form.
    this.preview = form.locator('.employee-image');
    this.photoInput = form.locator('input[type="file"]');
    this.addButton = form.locator('.employee-image-action');
    this.saveButton = form.getByRole('button', { name: 'Save' });
    this.deletePhotoButton = this.page
      .locator('.oxd-layout-context')
      .getByRole('button', { name: /Delete|Remove/ });
  }

  @step('Open Change Profile Picture of employee {0}')
  async openFor(empNumber: number): Promise<this> {
    this.path = pimPaths.changePhoto(empNumber);
    return this.open();
  }

  @step('Replace the photo with {0}')
  async replacePhoto(filePath: string): Promise<void> {
    await this.photoInput.setInputFiles(filePath);
    await expect(this.preview).toHaveAttribute('src', /^data:image\//);
    await this.saveButton.click();
  }

  async expectLoaded(empNumber: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/pim/viewPhotograph/empNumber/${empNumber}$`));
    await expect(this.heading).toBeVisible();
  }
}
