import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { paths } from '@config/env';
import type { Credentials } from '@config/environments';
import { step } from '@utils/step';

export class LoginPage extends BasePage {
  readonly path = paths.login;

  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly requiredMessages: Locator;
  readonly forgotPasswordLink: Locator;
  readonly brandingLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorAlert = page.locator('.oxd-alert-content-text');
    this.requiredMessages = page.locator('.oxd-input-group__message');
    this.forgotPasswordLink = page.getByText('Forgot your password?');
    this.brandingLogo = page.locator('.orangehrm-login-branding img');
  }

  @step('Log in as {0}')
  async login(credentials: Credentials): Promise<void> {
    await this.username.fill(credentials.username);
    await this.password.fill(credentials.password);
    await this.loginButton.click();
  }

  @step('Log in and wait for the dashboard')
  async loginSuccessfully(credentials: Credentials): Promise<void> {
    await this.login(credentials);
    await expect(this.page).toHaveURL(/\/dashboard\/index/);
    // The URL changes on navigation commit, before the Vue shell has rendered. Callers that read
    // the sidebar or mutate browser state right after login need the dashboard fully drawn.
    await expect(this.topBar.moduleTitle).toHaveText('Dashboard');
    await expect(this.sidebar.items.first()).toBeVisible();
    await this.waitForReady();
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.errorAlert).toHaveText('Invalid credentials');
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/login/);
    await expect(this.loginButton).toBeVisible();
  }
}
