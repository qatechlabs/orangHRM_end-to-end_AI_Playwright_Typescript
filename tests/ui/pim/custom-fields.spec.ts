import { test, expect } from '@fixtures/index';
import { customFieldText } from '@pages/pim/CustomFieldsPage';

// Test cases: test-cases/json/pim.json (feature "Custom Fields"). Source: PIM-FR-025, PIM-FR-009, PIM-VAL-033/034.
// Custom field definitions are GLOBAL on the shared demo (they show on every employee's profile):
// each test creates its own uniquely named field and deletes it in the test, and the `customFields`
// fixture deletes anything left over at teardown (never the demo's own fields). Because the fields show up
// on every employee's profile while they exist, this spec runs in the `global-config` project (one worker,
// after the parallel projects; see playwright.config.ts).
// PIM-UI-078 (cap of 10 fields) stays Manual: it would fill every global slot of the shared demo.

test.describe('Custom Fields', () => {
  test(
    '[PIM-UI-076] Drop Down custom field for Personal Details appears on profile, saves a value and disappears when deleted',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-025-AC1' },
        { type: 'requirement', description: 'PIM-FR-025-AC2' },
        { type: 'requirement', description: 'PIM-FR-009-AC1' },
        { type: 'requirement', description: 'PIM-FR-009-AC2' },
        { type: 'requirement', description: 'PIM-FR-009-AC3' },
        { type: 'requirement', description: 'PIM-E2E-09' },
        {
          type: 'issue',
          description:
            'PIM-FR-009-AC2: saving the Custom Fields form on Personal Details shows "Successfully Saved" instead of "Successfully Updated"',
        },
      ],
    },
    async ({
      customFieldsPage,
      saveCustomFieldPage,
      profileCustomFieldsPage,
      customFields,
      createdEmployee,
      pimOptionalFieldsApi,
    }) => {
      test.fail(true, 'Custom Fields save toast is "Successfully Saved", the BRD says "Successfully Updated"');
      const name = customFields.name();
      const empNumber = createdEmployee.empNumber;
      customFields.trackName(name);
      customFields.trackValues(empNumber);

      await test.step('Add form offers every screen and both types', async () => {
        await customFieldsPage.load();
        const remaining = await customFieldsPage.remainingCount();
        expect(remaining, 'precondition: fewer than 10 custom fields exist').toBeGreaterThan(0);
        await customFieldsPage.clickAdd();
        await saveCustomFieldPage.expectOnForm();
        const screens = await saveCustomFieldPage.screenOptions();
        expect(screens[0]).toBe(customFieldText.placeholder);
        expect(screens).toEqual(expect.arrayContaining([...customFieldText.brdScreens]));
        expect(await saveCustomFieldPage.typeOptions()).toEqual([
          customFieldText.placeholder,
          ...customFieldText.types,
        ]);
      });

      const remainingBefore = await test.step('Create the Drop Down field', async () => {
        await customFieldsPage.load();
        const before = await customFieldsPage.remainingCount();
        await customFieldsPage.clickAdd();
        await saveCustomFieldPage.fillForm({ screen: 'Personal Details', type: 'Drop Down' });
        await saveCustomFieldPage.expectSelectOptionsShown();
        await saveCustomFieldPage.fillForm({ name, options: 'Red,Green,Blue' });
        const toast = await saveCustomFieldPage.saveAndCapture();
        expect(toast.message).toBe(customFieldText.saved);
        await customFieldsPage.waitForList();
        await customFieldsPage.expectListed(name, 'Personal Details', 'Drop Down');
        await customFieldsPage.expectRemaining(before - 1);
        return before;
      });

      const fieldId = await customFields.idOf(name);

      await test.step('Personal Details shows the select with the options', async () => {
        await profileCustomFieldsPage.openCustomFieldsFor(empNumber);
        await profileCustomFieldsPage.expectCustomFieldShown(name);
        expect(await profileCustomFieldsPage.customOptions(name)).toEqual([
          customFieldText.placeholder,
          'Red',
          'Green',
          'Blue',
        ]);
      });

      await test.step('Choose Green, save the Custom Fields form, reload', async () => {
        await profileCustomFieldsPage.chooseCustomValue(name, 'Green');
        const [toast] = await Promise.all([
          profileCustomFieldsPage.toast.capture(),
          profileCustomFieldsPage.saveCustomFields(),
        ]);
        expect(toast.title).toBe('Success');
        // BRD PIM-FR-009-AC2; the app shows "Successfully Saved" (see issue annotation).
        expect.soft(toast.message).toBe(customFieldText.updated);
        await profileCustomFieldsPage.reloadCustomFields();
        await profileCustomFieldsPage.expectCustomSelect(name, 'Green');
        const stored = await pimOptionalFieldsApi.employeeCustomFields(empNumber, 'personal');
        expect(stored.status).toBe(200);
        expect(stored.body.data[`custom${fieldId}`]).toBe('Green');
      });

      await test.step('A field with a stored value cannot be deleted', async () => {
        await customFieldsPage.load();
        await customFieldsPage.clickDelete(name);
        await customFieldsPage.expectInUseRefused();
      });

      await test.step('Clear the value, delete the definition, reopen the profile', async () => {
        await customFields.clearValues(empNumber, [fieldId]);
        await customFieldsPage.load();
        const toast = await customFieldsPage.delete(name);
        expect(toast.message).toBe(customFieldText.deleted);
        await customFieldsPage.expectNotListed(name);
        await customFieldsPage.expectRemaining(remainingBefore);

        await profileCustomFieldsPage.openCustomFieldsFor(empNumber);
        await profileCustomFieldsPage.expectCustomFieldAbsent(name);
      });
    },
  );

  test(
    '[PIM-UI-077] Custom field requires a unique name and options for Drop Down type',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-025-AC4' },
        { type: 'requirement', description: 'PIM-VAL-033' },
        { type: 'requirement', description: 'PIM-VAL-034' },
      ],
    },
    async ({ customFieldsPage, saveCustomFieldPage, customFields, pimOptionalFieldsApi }) => {
      const existing = await customFields.create({ fieldName: customFields.name('AutoCFDup') });
      const form = saveCustomFieldPage;

      await test.step('Save the empty form', async () => {
        await customFieldsPage.load();
        await customFieldsPage.clickAdd();
        await form.expectOnForm();
        expect(await form.saveBlocked(), 'no POST is sent').toBe(0);
        await form.expectErrors([
          { field: form.fieldName, message: customFieldText.required },
          { field: form.screen, message: customFieldText.required },
          { field: form.type, message: customFieldText.required },
        ]);
      });

      await test.step('Drop Down without Select Options', async () => {
        await form.fillForm({ screen: 'Personal Details', type: 'Drop Down' });
        await form.expectSelectOptionsShown();
        expect(await form.saveBlocked(), 'no POST is sent').toBe(0);
        await form.selectOptions.expectError(customFieldText.required);
        await form.screen.expectNoError();
        await form.type.expectNoError();
      });

      await test.step('Existing field name', async () => {
        await form.fillForm({ name: existing.fieldName, options: 'A,B' });
        await form.fieldName.expectError(customFieldText.alreadyExists);
        await form.selectOptions.expectNoError();
        expect(await form.saveBlocked(), 'no POST is sent').toBe(0);
        await form.fieldName.expectError(customFieldText.alreadyExists);
        await form.expectOnForm();
      });

      const all = await pimOptionalFieldsApi.customFieldsOrFail();
      expect(all.filter((f) => f.fieldName === existing.fieldName)).toHaveLength(1);
    },
  );
});
