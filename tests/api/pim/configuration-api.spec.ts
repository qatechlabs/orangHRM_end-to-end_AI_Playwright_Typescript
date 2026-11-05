import { test, expect } from '@fixtures/index';
import { expectStatus } from '@api/ApiClient';
import type { ApiValidationError } from '@api/types/pim';
import type { ConfigListResource } from '@api/types/pim-config';
import type { PimConfigSeeder } from '@fixtures/pim-config.fixture';

// Test cases: test-cases/json/pim.json (feature "Configuration API"). Source: PIM-FR-027, PIM-FR-028, PIM-VAL-036.
// Endpoints: /web/index.php/api/v2/pim/reporting-methods and /pim/termination-reasons.
// A probe the server wrongly accepts creates a row: every returned id is registered for teardown.

const invalidKeys = (body: unknown) => (body as ApiValidationError).error?.data?.invalidParamKeys ?? [];

const resources: ConfigListResource[] = ['reporting-methods', 'termination-reasons'];

const variants: {
  label: string;
  name: (pimConfig: PimConfigSeeder, resource: ConfigListResource) => Promise<string>;
  /** App behaviour that contradicts the BRD, per resource (the test is marked test.fail()). */
  issue: Partial<Record<ConfigListResource, string>>;
}[] = [
  {
    label: 'blank name',
    name: async () => '',
    issue: {
      'reporting-methods':
        'PIM-FR-027-AC1: POST /pim/reporting-methods with {"name":""} returns 200 and creates a nameless method (termination-reasons returns 422)',
    },
  },
  {
    label: 'existing name',
    name: async (pimConfig, resource) =>
      (resource === 'reporting-methods'
        ? await pimConfig.reportingMethod()
        : await pimConfig.terminationReason()
      ).name,
    issue: {
      'reporting-methods':
        'PIM-FR-027-AC1: POST /pim/reporting-methods with an existing name returns 200 and creates a duplicate (termination-reasons returns 422)',
    },
  },
  {
    label: '101 characters',
    name: async (pimConfig) => pimConfig.name('AutoLong').padEnd(101, 'x'),
    issue: {},
  },
];

test.describe('Configuration API', () => {
  for (const resource of resources) {
    for (const v of variants) {
      const issue = v.issue[resource];

      test(
        `[PIM-API-018] Reporting methods and termination reasons reject blank, duplicate and 101-character names (${resource}, ${v.label})`,
        {
          tag: ['@P2', '@negative'],
          annotation: [
            { type: 'requirement', description: 'PIM-FR-027-AC1' },
            { type: 'requirement', description: 'PIM-FR-028-AC1' },
            { type: 'requirement', description: 'PIM-VAL-036' },
            ...(issue ? [{ type: 'issue', description: issue }] : []),
          ],
        },
        async ({ pimConfigApi, pimConfig }) => {
          test.fail(issue !== undefined, issue);
          const name = await v.name(pimConfig, resource);
          const before = await pimConfigApi.listItemsOrFail(resource);

          const res = await pimConfigApi.createItem(resource, { name });
          // Register anything the server created, before asserting.
          [(res.body as { data?: { id?: unknown } })?.data?.id]
            .filter((id): id is number => typeof id === 'number')
            .forEach((id) => pimConfig.trackItem(resource, id));

          const after = await pimConfigApi.listItemsOrFail(resource);
          expect(after.filter((i) => i.name === name)).toEqual(before.filter((i) => i.name === name));
          expectStatus(res, 422);
          expect(res.body).toMatchObject({ error: { status: '422', message: 'Invalid Parameter' } });
          expect(invalidKeys(res.body)).toEqual(['name']);
        },
      );
    }
  }
});
