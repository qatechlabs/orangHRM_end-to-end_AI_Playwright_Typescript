import { test as setup } from '@playwright/test';
import { env, authFiles } from '@config/env';
import { LoginPage } from '@pages/LoginPage';

/**
 * Logs in once per run and saves the session. UI and API projects depend on this project and
 * reuse `.auth/admin.json`, so individual tests never log in through the UI.
 */
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.loginSuccessfully(env.admin);
  await page.context().storageState({ path: authFiles.admin });
});
