import { test, expect } from '@fixtures/index';
import { pimText, selectable } from '@data/pim';

// Test cases: test-cases/json/pim.json (feature "Memberships"). Source: PIM-FR-023.
// UI dates are yyyy-dd-mm; the values below have day = month so both orders read the same.

test.describe('Memberships', () => {
  test(
    '[PIM-UI-072] Membership is saved with subscription details and renewal date must follow commence date',
    {
      tag: ['@P3', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-023-AC1' },
        { type: 'requirement', description: 'PIM-FR-023-AC2' },
        { type: 'requirement', description: 'PIM-FR-023-AC3' },
      ],
    },
    async ({ membershipsPage: page, qualificationsApi, createdEmployee }) => {
      const memberships = selectable(await qualificationsApi.membershipTypes(), (m) => m.name);
      expect(memberships.length, 'Admin > Memberships needs an entry').toBeGreaterThan(0);
      const membership = memberships[0];
      await page.load(createdEmployee.empNumber);
      await page.records.expectHeaders([
        '',
        'Membership',
        'Subscription Paid By',
        'Subscription Amount',
        'Currency',
        'Subscription Commence Date',
        'Subscription Renewal Date',
        'Actions',
      ]);

      await page.clickAdd();
      await page.save();
      await page.membership.expectError(pimText.required);
      await page.paidBy.expectNoError();
      await page.amount.expectNoError();

      await page.fillForm({
        membership: membership.name,
        paidBy: 'Company',
        amount: '100',
        currency: 'United States Dollar',
        commenceDate: '2025-01-01',
        renewalDate: '2024-01-01',
      });
      await page.save();
      await page.renewalDate.expectError('Renewal date should be after the commencing date');
      await page.expectFormTitle('Add Membership');
      expect(await qualificationsApi.membershipsOrFail(createdEmployee.empNumber)).toEqual([]);

      await page.fillForm({ renewalDate: '2026-01-01' });
      await page.renewalDate.expectNoError();
      const [toast] = await Promise.all([page.toast.capture(), page.save()]);
      expect(toast).toEqual({ title: 'Success', message: pimText.saved });
      await page.expectFormClosed();
      await page.records.expectRecords(1);
      await page.records.expectRow(membership.name, {
        'Subscription Paid By': 'Company',
        'Subscription Amount': '100.00',
        Currency: 'United States Dollar',
        'Subscription Commence Date': '2025-01-01',
        'Subscription Renewal Date': '2026-01-01',
      });

      expect(await qualificationsApi.membershipsOrFail(createdEmployee.empNumber)).toEqual([
        expect.objectContaining({
          membership: expect.objectContaining({ id: membership.id }),
          subscriptionPaidBy: 'Company',
          subscriptionCommenceDate: '2025-01-01',
          subscriptionRenewalDate: '2026-01-01',
          currencyType: expect.objectContaining({ id: 'USD' }),
        }),
      ]);
    },
  );
});
