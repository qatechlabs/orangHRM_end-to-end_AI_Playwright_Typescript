import { test, expect } from '@fixtures/index';
import { expectStatus } from '@api/ApiClient';

// Test cases: test-cases/json/pim.json (feature "Configuration API", PIM-API-019). Source: PIM-FR-024, PIM-BR-12.
// Endpoint: /web/index.php/api/v2/pim/optional-field.
// Optional fields are GLOBAL on the shared demo: toggling them changes the Personal Details form of every
// employee for everyone, so this spec lives in the `global-config` Playwright project, which runs after the
// parallel projects with a single worker (see playwright.config.ts). `optionalFieldsGuard` reads the
// settings before the test and PUTs them back at teardown, even if an assertion fails half-way.

test.describe('Optional Fields API', () => {
  test(
    '[PIM-API-019] Optional field settings can be read and updated, and restored afterwards',
    {
      tag: ['@P3', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-024-AC1' },
        { type: 'requirement', description: 'PIM-BR-12' },
      ],
    },
    async ({ pimOptionalFieldsApi, optionalFieldsGuard }) => {
      const read = await pimOptionalFieldsApi.getOptionalFields();
      expectStatus(read, 200);
      const original = read.body.data;
      expect(Object.keys(original).sort()).toEqual([
        'pimShowDeprecatedFields',
        'showSIN',
        'showSSN',
        'showTaxExemptions',
      ]);
      for (const value of Object.values(original)) expect(typeof value).toBe('boolean');
      expect(original).toEqual(optionalFieldsGuard.original);

      const toggled = { ...original, showSSN: !original.showSSN };
      const updated = await pimOptionalFieldsApi.updateOptionalFields(toggled);
      expectStatus(updated, 200);
      expect(updated.body.data).toEqual(toggled);
      expect(await pimOptionalFieldsApi.optionalFieldsOrFail()).toEqual(toggled);

      const restored = await pimOptionalFieldsApi.updateOptionalFields(original);
      expectStatus(restored, 200);
      expect(restored.body.data).toEqual(original);
      expect(await pimOptionalFieldsApi.optionalFieldsOrFail()).toEqual(original);
    },
  );
});
