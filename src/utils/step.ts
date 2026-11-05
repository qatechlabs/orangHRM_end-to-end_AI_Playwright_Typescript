import { test } from '@playwright/test';

/**
 * Wraps a page-object method in `test.step` so every call shows up as a named step
 * in the Playwright trace, the HTML report and Allure.
 *
 *   @step('Login as {0}')  -> "{n}" is replaced by the n-th argument.
 *   @step()               -> defaults to "ClassName.method".
 */
export function step(title?: string) {
  return function decorator<This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    return function replacement(this: This, ...args: Args): Promise<Return> {
      const name = title
        ? title.replace(/\{(\d+)\}/g, (_, i) => formatArg(args[Number(i)]))
        : `${(this as object).constructor.name}.${String(context.name)}`;
      return test.step(name, () => target.call(this, ...args), { box: true });
    };
  };
}

const SECRET_KEYS = /pass(word)?|token|secret/i;

function formatArg(arg: unknown): string {
  if (arg === undefined) return '';
  if (typeof arg === 'string') return arg;
  try {
    // Never print credentials into traces or reports.
    return JSON.stringify(arg, (key, value) => (key && SECRET_KEYS.test(key) ? '***' : value));
  } catch {
    return String(arg);
  }
}
