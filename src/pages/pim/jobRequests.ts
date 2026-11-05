import { expect, type Page, type Request } from '@playwright/test';
import type { Toast } from '@pages/components/Toast';

/**
 * Records API requests matching `method` and `urlPart` from now on, so a test can assert that a
 * client-side validation sent nothing (`expect(calls).toEqual([])`).
 */
export function recordApiCalls(page: Page, method: string, urlPart: string | RegExp): string[] {
  const calls: string[] = [];
  const matches = (r: Request) =>
    r.method() === method &&
    r.url().includes('/api/v2/') &&
    (typeof urlPart === 'string' ? r.url().includes(urlPart) : urlPart.test(r.url()));
  page.on('request', (r) => {
    if (matches(r)) calls.push(`${r.method()} ${new URL(r.url()).pathname}`);
  });
  return calls;
}

/**
 * Runs `action` once earlier toasts are gone and returns the toast it raises. `Toast.capture()`
 * reads the newest visible toast, so a leftover toast from the previous save would be read instead.
 */
export async function toastOf(toast: Toast, action: () => Promise<unknown>): Promise<{ title: string; message: string }> {
  await expect(toast.root).toHaveCount(0, { timeout: 20_000 });
  const [captured] = await Promise.all([toast.capture(), action()]);
  return captured;
}
