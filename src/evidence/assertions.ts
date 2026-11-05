import { test, type Expect, type Locator, type Page } from '@playwright/test';
import { captureEvidence, describeSubject, maskSecrets } from './capture';

const INSTRUMENTED = Symbol('evidence-instrumented');
const MAX_ARGS = 160;

/** `expectHeaderName` -> `header name`. */
function humanize(method: string): string {
  return method
    .replace(/^expect/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim();
}

function formatArgs(args: unknown[]): string {
  if (!args.length) return '';
  const text = args
    .map((a) => {
      if (a === undefined) return 'undefined';
      if (a instanceof RegExp) return String(a);
      if (typeof a === 'object' && a !== null && typeof (a as Locator).page === 'function')
        return describeSubject(a as Locator);
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(', ');
  return maskSecrets(text.length > MAX_ARGS ? `${text.slice(0, MAX_ARGS)}…` : text);
}

/**
 * Wraps every `expect*` method of a page object or component so that each call
 *  - shows up in the report as a named step, e.g. `Verify header name "Jane Auto1x2"`, and
 *  - attaches an evidence screenshot of the page when it passes (or `FAILED: ...` when it throws).
 * Call it once from the constructor; subclasses are covered because the most-derived method is
 * resolved at construction time and replaced on the instance.
 */
export function instrumentAssertions(target: object, page: () => Page): void {
  const names = new Set<string>();
  for (
    let proto = Object.getPrototypeOf(target);
    proto && proto !== Object.prototype;
    proto = Object.getPrototypeOf(proto)
  ) {
    for (const name of Object.getOwnPropertyNames(proto)) if (/^expect[A-Z]/.test(name)) names.add(name);
  }
  for (const name of names) {
    const original = (target as Record<string, unknown>)[name];
    if (typeof original !== 'function' || (original as { [INSTRUMENTED]?: boolean })[INSTRUMENTED]) continue;
    const label = humanize(name);
    const wrapped = function (this: object, ...args: unknown[]) {
      const caption = `Verify ${label}${args.length ? ` ${formatArgs(args)}` : ''}`;
      return test.step(
        caption,
        async () => {
          try {
            const result = await (original as (...a: unknown[]) => Promise<unknown>).apply(this, args);
            await captureEvidence(caption, page());
            return result;
          } catch (error) {
            await captureEvidence(`FAILED: ${caption}`, page(), { force: true, status: 'failed' });
            throw error;
          }
        },
        { box: true },
      );
    };
    (wrapped as { [INSTRUMENTED]?: boolean })[INSTRUMENTED] = true;
    Object.defineProperty(target, name, {
      value: wrapped,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

function isUiSubject(value: unknown): value is Page | Locator {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Page & Locator>;
  return typeof v.screenshot === 'function' && (typeof v.page === 'function' || typeof v.goto === 'function');
}

type AnyFn = (...args: unknown[]) => unknown;

function wrapMatchers(
  matchers: object,
  subjectText: string,
  subject: Page | Locator,
  negated = false,
): object {
  return new Proxy(matchers, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'not' && value && typeof value === 'object')
        return wrapMatchers(value, subjectText, subject, true);
      if (typeof value !== 'function' || typeof prop !== 'string') return value;
      return (...args: unknown[]) => {
        const caption = `Verify ${subjectText} ${negated ? 'not.' : ''}${prop}(${formatArgs(args)})`;
        const result = (value as AnyFn).apply(target, args);
        if (!result || typeof (result as Promise<unknown>).then !== 'function') return result;
        return (result as Promise<unknown>).then(
          async (resolved) => {
            await captureEvidence(caption, subject);
            return resolved;
          },
          async (error) => {
            await captureEvidence(`FAILED: ${caption}`, subject, { force: true, status: 'failed' });
            throw error;
          },
        );
      };
    },
  });
}

/**
 * `expect` with evidence: every web-first assertion on a Page or Locator made in a spec
 * (`expect(locator).toHaveText(...)`, `expect.soft(...)`, `.not`) attaches a screenshot once it
 * passes or fails. Assertions on plain values are untouched.
 */
export function withEvidence(baseExpect: Expect): Expect {
  const wrapFn = (fn: AnyFn): AnyFn =>
    new Proxy(fn, {
      apply(target, thisArg, args: unknown[]) {
        const matchers = Reflect.apply(target, thisArg, args);
        const subject = args[0];
        if (!isUiSubject(subject) || !matchers || typeof matchers !== 'object') return matchers;
        const message = typeof args[1] === 'string' ? `${args[1]}: ` : '';
        return wrapMatchers(matchers, `${message}${describeSubject(subject)}`, subject);
      },
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (prop === 'soft' && typeof value === 'function') return wrapFn(value as AnyFn);
        if (prop === 'configure' && typeof value === 'function')
          return (...args: unknown[]) => wrapFn((value as AnyFn).apply(target, args) as AnyFn);
        return value;
      },
    }) as AnyFn;
  return wrapFn(baseExpect as unknown as AnyFn) as unknown as Expect;
}
