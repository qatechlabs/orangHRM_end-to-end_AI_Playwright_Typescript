import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { env } from '@config/env';
import { logger } from '@utils/logger';

const log = logger('api');

export interface ApiResult<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
  headers: Record<string, string>;
  durationMs: number;
  raw: APIResponse;
}

/** OrangeHRM v2 envelope: { data, meta, rels } on success, { error: { status, message } } on failure. */
export interface Envelope<D = unknown, M = Record<string, unknown>> {
  data: D;
  meta: M;
  rels: unknown[];
}

export interface ApiErrorBody {
  error: { status: string; message: string };
}

type Query = Record<string, string | number | boolean | (string | number)[] | undefined>;

/**
 * Thin typed wrapper over Playwright's APIRequestContext for the OrangeHRM REST API (/api/v2).
 * Authentication is the OrangeHRM session cookie, so pass a context built from a logged-in
 * storage state (the `api` fixture does this). Every call is a test step with request and
 * response attached to Allure.
 */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly basePath = env.apiPath,
  ) {}

  get<T>(endpoint: string, query?: Query) {
    return this.send<T>('GET', endpoint, { query });
  }
  post<T>(endpoint: string, data?: unknown) {
    return this.send<T>('POST', endpoint, { data });
  }
  put<T>(endpoint: string, data?: unknown) {
    return this.send<T>('PUT', endpoint, { data });
  }
  patch<T>(endpoint: string, data?: unknown) {
    return this.send<T>('PATCH', endpoint, { data });
  }
  delete<T>(endpoint: string, data?: unknown) {
    return this.send<T>('DELETE', endpoint, { data });
  }

  private async send<T>(
    method: string,
    endpoint: string,
    opts: { data?: unknown; query?: Query },
  ): Promise<ApiResult<T>> {
    const url = `${this.basePath}${endpoint.startsWith('/') ? '' : '/'}${endpoint}${toQueryString(opts.query)}`;
    return test.step(`${method} ${url}`, async () => {
      const started = Date.now();
      const raw = await this.request.fetch(url, {
        method,
        data: opts.data,
        headers: { Accept: 'application/json' },
        failOnStatusCode: false,
      });
      const durationMs = Date.now() - started;
      const text = await raw.text();
      let body: unknown = text;
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        /* non-JSON response, keep text */
      }
      log.debug(`${method} ${url} -> ${raw.status()} (${durationMs}ms)`);
      // Attached to the test (Allure and the evidence/Word report both pick it up).
      await test.info().attach(`api: ${method} ${url} -> ${raw.status()}`, {
        body: JSON.stringify(
          { request: { method, url, body: opts.data }, response: { status: raw.status(), durationMs, body } },
          null,
          2,
        ),
        contentType: 'application/json',
      });
      return { status: raw.status(), ok: raw.ok(), body: body as T, headers: raw.headers(), durationMs, raw };
    });
  }
}

export function expectStatus(result: ApiResult, status: number): void {
  expect(result.status, `Unexpected status. Body: ${JSON.stringify(result.body).slice(0, 500)}`).toBe(status);
}

function toQueryString(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(`${key}[]`, String(v)));
    else params.append(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}
