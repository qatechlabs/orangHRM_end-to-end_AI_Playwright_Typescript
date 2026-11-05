import { test as base } from './pim.fixture';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import { ApiClient, expectStatus } from '@api/ApiClient';
import { authFiles } from '@config/env';
import { AuthApi } from '@api/services/AuthApi';
import { PimOptionalFieldsApi } from '@api/services/PimOptionalFieldsApi';
import {
  CustomFieldType,
  type CustomField,
  type CustomFieldRequest,
  type CustomFieldValues,
  type OptionalFieldSettings,
} from '@api/types/pim-optional';
import { CustomFieldsPage, ProfileCustomFieldsPage } from '@pages/pim/CustomFieldsPage';
import { SaveCustomFieldPage } from '@pages/pim/SaveCustomFieldPage';
import { OptionalFieldsPage, OptionalPersonalDetailsPage } from '@pages/pim/OptionalFieldsPage';
import { uniqueSuffix } from '@utils/dataFactory';
import { logger } from '@utils/logger';

const log = logger('pim-optional');

/**
 * Custom field definitions are global (they show on every employee's profile), so this seeder
 * only ever deletes fields it created or was told to track by their unique name, and never a
 * field that already existed when the test started (e.g. the demo's `Blood Type`, `Test_Field`).
 * A field with stored values cannot be deleted, so tracked employees' values are cleared first.
 */
export class CustomFieldSeeder {
  private readonly ids = new Set<number>();
  private readonly names = new Set<string>();
  private readonly employeesWithValues = new Set<number>();
  private preexisting = new Set<number>();

  constructor(readonly api: PimOptionalFieldsApi) {}

  /** Remembers the fields that exist before the test, so they are never deleted. */
  async snapshot(): Promise<void> {
    this.preexisting = new Set((await this.api.customFieldsOrFail()).map((f) => f.id));
  }

  /** Unique field name, e.g. `AutoCF<suffix>`. */
  name(prefix = 'AutoCF'): string {
    return `${prefix}${uniqueSuffix()}`;
  }

  async create(overrides: Partial<CustomFieldRequest> = {}): Promise<CustomField> {
    const res = await this.api.createCustomField({
      fieldName: this.name(),
      screen: 'personal',
      fieldType: CustomFieldType.text,
      extraData: null,
      ...overrides,
    });
    expectStatus(res, 200);
    this.ids.add(res.body.data.id);
    return res.body.data;
  }

  /** Registers a field created through the UI; resolved to its id at teardown. */
  trackName(name: string): void {
    this.names.add(name);
  }

  /** Registers an employee that may hold values of our fields; they are cleared before deletion. */
  trackValues(empNumber: number): void {
    this.employeesWithValues.add(empNumber);
  }

  /** Id of a field we created (by unique name), via the API. */
  async idOf(name: string): Promise<number> {
    const field = (await this.api.customFieldsOrFail()).find((f) => f.fieldName === name);
    if (!field) throw new Error(`Custom field "${name}" not found`);
    if (!this.preexisting.has(field.id)) this.ids.add(field.id);
    return field.id;
  }

  /** Sets our fields' values of an employee to null so the definitions can be deleted. */
  async clearValues(empNumber: number, ids: number[] = [...this.ids]): Promise<void> {
    if (!ids.length) return;
    const body = Object.fromEntries(ids.map((id) => [`custom${id}`, null])) as CustomFieldValues;
    expectStatus(await this.api.updateEmployeeCustomFields(empNumber, body), 200);
  }

  async cleanup(): Promise<void> {
    const all = await this.api.listCustomFields();
    if (!all.ok) {
      log.warn(`could not list custom fields: ${all.status}`);
      return;
    }
    for (const f of all.body.data) if (this.names.has(f.fieldName)) this.ids.add(f.id);
    const existing = new Set(all.body.data.map((f) => f.id));
    const ids = [...this.ids].filter((id) => existing.has(id) && !this.preexisting.has(id));
    if (!ids.length) return;

    for (const empNumber of this.employeesWithValues) {
      const res = await this.api.updateEmployeeCustomFields(
        empNumber,
        Object.fromEntries(ids.map((id) => [`custom${id}`, null])) as CustomFieldValues,
      );
      if (!res.ok) log.debug(`clear values of ${empNumber} -> ${res.status}`);
    }
    if ((await this.api.deleteCustomFields(ids)).ok) return;
    for (const id of ids) {
      const res = await this.api.deleteCustomFields([id]);
      if (!res.ok && res.status !== 404) log.warn(`could not delete custom field ${id}: ${res.status}`);
    }
  }
}

/** Optional-field settings read at the start of the test; restored at teardown. */
export interface OptionalFieldsGuard {
  readonly original: OptionalFieldSettings;
  /** PUTs the original settings back (also done automatically at teardown). */
  restore(): Promise<void>;
}

/** A separate Admin login in its own browser context (the shared Admin session is untouched). */
export interface AdminSession {
  page: Page;
  optionalFieldsPage: OptionalFieldsPage;
  personalDetailsPage: OptionalPersonalDetailsPage;
}

/**
 * PIM > Configuration > Optional Fields and Custom Fields. Both are global settings on the shared
 * demo; every fixture here restores what the test changed, even when it fails:
 *  - `optionalFieldsGuard` snapshots `GET /pim/optional-field` and PUTs it back at teardown
 *    (`optionalFieldsPage` depends on it, so a UI test cannot forget it);
 *  - `customFields` creates/tracks custom fields and deletes them (after clearing values) at teardown.
 */
export interface PimOptionalFixtures {
  pimOptionalFieldsApi: PimOptionalFieldsApi;
  optionalFieldsGuard: OptionalFieldsGuard;
  customFields: CustomFieldSeeder;
  /**
   * Fresh Admin logins. OrangeHRM fixes a session's profile tabs at login, so "Show US Tax
   * Exemptions menu" can only be observed in sessions started after the change. Depends on
   * `optionalFieldsGuard`, so the settings are restored too.
   */
  freshAdminSessions: { login(): Promise<AdminSession> };
  optionalFieldsPage: OptionalFieldsPage;
  optionalPersonalDetailsPage: OptionalPersonalDetailsPage;
  customFieldsPage: CustomFieldsPage;
  saveCustomFieldPage: SaveCustomFieldPage;
  profileCustomFieldsPage: ProfileCustomFieldsPage;
}

export const test = base.extend<PimOptionalFixtures>({
  pimOptionalFieldsApi: async ({ api }, use) => use(new PimOptionalFieldsApi(api)),

  optionalFieldsGuard: async ({ pimOptionalFieldsApi, playwright, env }, use) => {
    const original = await pimOptionalFieldsApi.optionalFieldsOrFail();
    const restore = async () => {
      expectStatus(await pimOptionalFieldsApi.updateOptionalFields({ ...original }), 200);
    };
    await use({ original: { ...original }, restore });

    // Teardown must not depend on the test's page/request context: after a test timeout those may
    // be disposed or still busy with an in-flight Save. Use a fresh Admin context and try twice
    // (a UI Save that was in flight when the test timed out can land after the first PUT).
    const ctx = await playwright.request.newContext({ baseURL: env.baseURL, storageState: authFiles.admin });
    try {
      const fresh = new PimOptionalFieldsApi(new ApiClient(ctx));
      const matches = (s: OptionalFieldSettings) =>
        (Object.keys(original) as (keyof OptionalFieldSettings)[]).every((k) => s[k] === original[k]);
      let lastError: unknown;
      let restored = false;
      for (let attempt = 1; attempt <= 2 && !restored; attempt++) {
        try {
          expectStatus(await fresh.updateOptionalFields({ ...original }), 200);
          restored = matches(await fresh.optionalFieldsOrFail());
        } catch (error) {
          lastError = error;
        }
      }
      if (!restored && lastError) throw lastError;
      expect(await fresh.optionalFieldsOrFail(), 'optional fields restored').toEqual(original);
    } finally {
      await ctx.dispose();
    }
  },

  customFields: async ({ pimOptionalFieldsApi }, use) => {
    const seeder = new CustomFieldSeeder(pimOptionalFieldsApi);
    await seeder.snapshot();
    await use(seeder);
    await seeder.cleanup();
  },

  freshAdminSessions: async ({ browser, env, optionalFieldsGuard }, use) => {
    void optionalFieldsGuard;
    const contexts: BrowserContext[] = [];
    await use({
      async login() {
        const context = await browser.newContext({
          baseURL: env.baseURL,
          storageState: { cookies: [], origins: [] },
          viewport: { width: 1440, height: 900 },
        });
        contexts.push(context);
        // The context's request shares its cookie jar with the context's pages.
        await new AuthApi(context.request).login(env.admin);
        const page = await context.newPage();
        return {
          page,
          optionalFieldsPage: new OptionalFieldsPage(page),
          personalDetailsPage: new OptionalPersonalDetailsPage(page),
        };
      },
    });
    await Promise.all(contexts.map((c) => c.close()));
  },

  optionalFieldsPage: async ({ page, optionalFieldsGuard }, use) => {
    void optionalFieldsGuard;
    await use(new OptionalFieldsPage(page));
  },
  optionalPersonalDetailsPage: async ({ page }, use) => use(new OptionalPersonalDetailsPage(page)),
  customFieldsPage: async ({ page, customFields }, use) => {
    void customFields;
    await use(new CustomFieldsPage(page));
  },
  saveCustomFieldPage: async ({ page, customFields }, use) => {
    void customFields;
    await use(new SaveCustomFieldPage(page));
  },
  profileCustomFieldsPage: async ({ page }, use) => use(new ProfileCustomFieldsPage(page)),
});
