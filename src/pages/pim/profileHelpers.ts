import type { Locator, Page, Response } from '@playwright/test';
import type { FormField } from '@pages/components/FormField';

/**
 * Types a date (UI format yyyy-dd-mm) and moves focus to a neutral element. Without the blur the
 * date picker stays open and swallows the next click on Save.
 */
export async function typeDate(field: FormField, value: string, neutral: Locator): Promise<void> {
  await field.fill(value);
  await neutral.click();
}

/** Blurs a field so its (possibly asynchronous) validation runs. */
export async function blur(field: FormField, neutral: Locator): Promise<void> {
  await field.input.focus();
  await neutral.click();
}

/**
 * Runs `action` (usually a navigation) and waits for the GET that loads the tab's data, so the
 * test never types into a form that is about to be overwritten by the late response.
 */
export async function withDataLoad(
  page: Page,
  urlPart: string | RegExp,
  action: () => Promise<unknown>,
): Promise<Response> {
  const matches = (url: string) => (typeof urlPart === 'string' ? url.includes(urlPart) : urlPart.test(url));
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'GET' && matches(r.url()) && r.status() === 200),
    action(),
  ]);
  return response;
}

/** Counts requests matching a method and URL part from now on (to prove that nothing was sent). */
export function watchRequests(
  page: Page,
  method: string,
  urlPart: string,
): { count: () => number; stop: () => void } {
  let count = 0;
  const listener = (req: { method(): string; url(): string }) => {
    if (req.method() === method && req.url().includes(urlPart)) count++;
  };
  page.on('request', listener);
  return { count: () => count, stop: () => page.off('request', listener) };
}
