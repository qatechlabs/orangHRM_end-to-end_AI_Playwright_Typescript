import { test, expect } from '@fixtures/index';
import { uniqueSuffix } from '@utils/dataFactory';

// Test cases: test-cases/json/pim.json (feature "Optional Fields"). Source: PIM-FR-024, PIM-FR-008-AC6, PIM-BR-12.
// The switches are GLOBAL on the shared demo: `optionalFieldsPage` pulls in `optionalFieldsGuard`,
// which reads the settings before the test and PUTs them back at teardown (even on failure).
// While they are on, every employee's Personal Details form carries the extra fields for everyone, so
// this spec is excluded from the parallel projects and runs in the `global-config` project (one worker,
// after everything else; see playwright.config.ts and scripts/run-tests.ts).

const saved = 'Successfully Saved';
const updated = 'Successfully Updated';

test.describe('Optional Fields', () => {
  test(
    '[PIM-UI-079] Toggling deprecated and SSN/SIN optional fields shows and hides them without losing data',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-024-AC1' },
        { type: 'requirement', description: 'PIM-FR-024-AC2' },
        { type: 'requirement', description: 'PIM-FR-008-AC6' },
        { type: 'requirement', description: 'PIM-BR-12' },
        { type: 'requirement', description: 'PIM-NFR-02' },
      ],
    },
    async ({ optionalFieldsPage, optionalPersonalDetailsPage, optionalFieldsGuard, createdEmployee }) => {
      const on = { pimShowDeprecatedFields: true, showSSN: true, showSIN: true };
      const off = { pimShowDeprecatedFields: false, showSSN: false, showSIN: false };
      const token = uniqueSuffix();
      const values = {
        nickname: `Nick${token}`,
        ssn: `SSN${token}`,
        sin: `SIN${token}`,
        militaryService: 'Army',
        smoker: true,
      };
      const details = optionalPersonalDetailsPage;

      await test.step('Turn on the deprecated fields and SSN/SIN, Save', async () => {
        const result = await optionalFieldsPage.apply(on);
        expect(result.toast.message).toBe(saved);
        expect(result.sent).toEqual({ ...optionalFieldsGuard.original, ...on });
      });

      await test.step('Personal Details shows the five fields; enter values and Save', async () => {
        await details.openDetailsFor(createdEmployee.empNumber);
        await details.expectOptionalFieldsVisible();
        await details.fillOptional(values);
        await details.save();
        await details.toast.expectSuccess(updated);
      });

      await test.step('Turn the switches off: the fields are hidden', async () => {
        const result = await optionalFieldsPage.apply(off);
        expect(result.toast.message).toBe(saved);
        await details.openDetailsFor(createdEmployee.empNumber);
        await details.expectOptionalFieldsHidden();
      });

      await test.step('Turn them on again: the saved values are back', async () => {
        const result = await optionalFieldsPage.apply(on);
        expect(result.toast.message).toBe(saved);
        await details.openDetailsFor(createdEmployee.empNumber);
        await details.expectOptionalFieldsVisible();
        await details.expectOptionalValues(values);
      });
    },
  );

  test(
    '[PIM-UI-080] Enabling US Tax Exemptions adds a Tax Exemptions tab to the profile',
    {
      tag: ['@P3', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-024-AC3' },
        {
          type: 'issue',
          description:
            'PIM-FR-024-AC3: the profile tabs are fixed when a session logs in. The Admin session that switches "Show US Tax Exemptions menu" on gets no Tax Exemptions tab until it logs in again (only sessions started after the change show it), and sessions started while it was on keep the tab after it is switched off',
        },
      ],
    },
    async ({ freshAdminSessions, optionalFieldsGuard, pimOptionalFieldsApi, createdEmployee }) => {
      test.fail(true, 'The Admin who enables the switch sees no Tax Exemptions tab until the next login');
      const empNumber = createdEmployee.empNumber;

      // Precondition: the switch is off when the Admin logs in (the guard restores the original).
      const off = await pimOptionalFieldsApi.updateOptionalFields({
        ...optionalFieldsGuard.original,
        showTaxExemptions: false,
      });
      expect(off.status).toBe(200);
      const admin = await freshAdminSessions.login();
      await admin.personalDetailsPage.openDetailsFor(empNumber);
      await admin.personalDetailsPage.expectNoTaxExemptionsTab();

      await test.step('Turn on "Show US Tax Exemptions menu", Save', async () => {
        const result = await admin.optionalFieldsPage.apply({ showTaxExemptions: true });
        expect(result.toast.message).toBe(saved);
        expect(result.sent.showTaxExemptions).toBe(true);
        expect((await pimOptionalFieldsApi.optionalFieldsOrFail()).showTaxExemptions).toBe(true);
      });

      await test.step('Open the employee profile: Tax Exemptions tab present', async () => {
        // BRD: the Admin who enabled it gets the tab; the app adds it only at the next login.
        await admin.personalDetailsPage.openDetailsFor(empNumber);
        await admin.personalDetailsPage.expectTaxExemptionsTab({ soft: true });

        const later = await freshAdminSessions.login();
        await later.personalDetailsPage.openDetailsFor(empNumber);
        await later.personalDetailsPage.expectTaxExemptionsTab();
        await later.personalDetailsPage.openTaxExemptionsTab();
        await later.personalDetailsPage.expectOnTaxExemptions(empNumber);
      });
    },
  );
});
