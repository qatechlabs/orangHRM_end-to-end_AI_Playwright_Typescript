import { expect, type APIRequestContext } from '@playwright/test';
import { paths } from '@config/env';
import type { Credentials } from '@config/environments';

/**
 * Logs in over HTTP, without a browser: OrangeHRM renders a CSRF token into the login page
 * (`:token="&quot;...&quot;"` on <auth-login>) and expects it back on POST /auth/validate.
 * The resulting session cookie lives in the request context.
 */
export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async csrfToken(): Promise<string> {
    const html = await (await this.request.get(paths.login)).text();
    const token =
      html.match(/:token="&quot;([^&]+)&quot;"/)?.[1] ?? html.match(/name="_token"\s+value="([^"]+)"/)?.[1];
    if (!token) throw new Error('Could not find the CSRF token on the login page');
    return token;
  }

  async login(credentials: Credentials): Promise<void> {
    const token = await this.csrfToken();
    const res = await this.request.post(`${paths.web}/auth/validate`, {
      form: { _token: token, username: credentials.username, password: credentials.password },
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status(), 'auth/validate should redirect').toBe(302);
    expect(res.headers()['location'] ?? '', 'Login failed, redirected back to the login page').not.toMatch(
      /auth\/login/,
    );
  }

  async logout(): Promise<void> {
    await this.request.get(`${paths.web}/auth/logout`);
  }
}
