import { test, expect } from '@fixtures/index';
import { seedJob } from '@data/pimJob';
import { pimText } from '@data/pim';
import { uniqueSuffix } from '@utils/dataFactory';
import { salaryText } from '@pages/pim/EmployeeSalaryPage';
import { recordApiCalls } from '@pages/pim/jobRequests';

// Test cases: test-cases/json/pim.json (feature "Salary"). Source: PIM-FR-019, PIM-FR-020, PIM-BR-09, PIM-VAL-022..025.
// PIM-UI-060 uses the seed pay grade "Grade 1" (USD 50000-60000) instead of creating one: it survives demo resets.

const saved = { title: 'Success', message: pimText.saved };

test.describe('Salary', () => {
  test(
    '[PIM-UI-059] Salary component without pay grade is saved and listed in Assigned Salary Components',
    {
      tag: ['@P1', '@smoke', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-019-AC3' },
        { type: 'requirement', description: 'PIM-FR-019-AC4' },
        { type: 'requirement', description: 'PIM-E2E-04' },
      ],
    },
    async ({ employeeSalaryPage, employeeJobApi, createdEmployee }) => {
      const component = `Base${uniqueSuffix()}`;
      await employeeSalaryPage.openSalaryFor(createdEmployee.empNumber);
      await employeeSalaryPage.components.expectHeaders(['', ...salaryText.columns]);
      await employeeSalaryPage.clickAdd();
      expect(await employeeSalaryPage.payFrequency.options()).toEqual(['-- Select --', ...salaryText.payFrequencies]);

      expect(
        await employeeSalaryPage.add({
          component,
          payFrequency: seedJob.payFrequency,
          currency: seedJob.currency,
          amount: '3000',
        }),
      ).toEqual(saved);
      await employeeSalaryPage.expectRow(component, {
        amount: '3000',
        currency: seedJob.currency,
        payFrequency: seedJob.payFrequency,
        depositAmount: '',
      });
      const [stored] = await employeeJobApi.salariesOrFail(createdEmployee.empNumber);
      expect(stored.payGrade.id).toBeNull();

      expect(await employeeSalaryPage.edit(component, { amount: '3500' })).toEqual({
        title: 'Success',
        message: pimText.updated,
      });
      await employeeSalaryPage.expectRow(component, {
        amount: '3500',
        currency: seedJob.currency,
        payFrequency: seedJob.payFrequency,
      });

      expect(await employeeSalaryPage.delete(component)).toEqual({ title: 'Success', message: pimText.deleted });
      await employeeSalaryPage.expectNoRow(component);
      expect(await employeeJobApi.salariesOrFail(createdEmployee.empNumber)).toEqual([]);
    },
  );

  // Case data (USD 1000-5000: 999 / 5001 / 1000 / 5000) mapped onto Grade 1 (USD 50000-60000).
  const pim060 = {
    title: '[PIM-UI-060] Amount outside the pay grade range is rejected and a value inside it is accepted',
    annotation: [
      { type: 'requirement', description: 'PIM-FR-019-AC1' },
      { type: 'requirement', description: 'PIM-FR-019-AC2' },
      { type: 'requirement', description: 'PIM-BR-09' },
      { type: 'requirement', description: 'PIM-VAL-023' },
      { type: 'requirement', description: 'PIM-E2E-12' },
    ],
  };
  type Range = { min: number; max: number };
  const rejected = [
    { label: 'below minimum', amount: (g: Range) => g.min - 1 },
    { label: 'above maximum', amount: (g: Range) => g.max + 1 },
  ];
  const accepted = [
    { label: 'minimum', amount: (g: Range) => g.min },
    { label: 'maximum', amount: (g: Range) => g.max },
  ];

  for (const v of rejected) {
    test(
      `${pim060.title} (${v.label})`,
      { tag: ['@P1', '@negative'], annotation: pim060.annotation },
      async ({ page, employeeSalaryPage, employeeJobApi, createdEmployee, payGrade }) => {
        const amount = String(v.amount(payGrade));
        await employeeSalaryPage.openSalaryFor(createdEmployee.empNumber);
        await employeeSalaryPage.clickAdd();
        await employeeSalaryPage.fillForm({ component: `Range${uniqueSuffix()}`, payGrade: payGrade.name });
        // The currency list is restricted to the grade's currencies.
        expect(await employeeSalaryPage.currency.options()).toEqual(['-- Select --', payGrade.currency.name]);
        await employeeSalaryPage.fillForm({ currency: payGrade.currency.name, payFrequency: seedJob.payFrequency, amount });
        await employeeSalaryPage.expectAmountRange(payGrade.min, payGrade.max);

        const posts = recordApiCalls(page, 'POST', '/salary-components');
        await employeeSalaryPage.clickSave();
        await employeeSalaryPage.amount.expectError(salaryText.outOfRange);
        await employeeSalaryPage.expectFormOpen();
        await expect(employeeSalaryPage.toast.root).toHaveCount(0);
        expect(posts).toEqual([]);
        expect(await employeeJobApi.salariesOrFail(createdEmployee.empNumber)).toEqual([]);
      },
    );
  }

  for (const v of accepted) {
    test(
      `${pim060.title} (${v.label})`,
      { tag: ['@P1', '@edge'], annotation: pim060.annotation },
      async ({ employeeSalaryPage, employeeJobApi, createdEmployee, payGrade }) => {
        const component = `Range${uniqueSuffix()}`;
        const amount = String(v.amount(payGrade));
        await employeeSalaryPage.openSalaryFor(createdEmployee.empNumber);
        await employeeSalaryPage.clickAdd();
        await employeeSalaryPage.fillForm({ component, payGrade: payGrade.name });
        expect(await employeeSalaryPage.currency.options()).toEqual(['-- Select --', payGrade.currency.name]);
        await employeeSalaryPage.fillForm({ currency: payGrade.currency.name, payFrequency: seedJob.payFrequency, amount });
        await employeeSalaryPage.expectAmountRange(payGrade.min, payGrade.max);
        await employeeSalaryPage.amount.expectNoError();

        expect(await employeeSalaryPage.save()).toEqual(saved);
        await employeeSalaryPage.expectRow(component, {
          amount,
          currency: payGrade.currency.name,
          payFrequency: seedJob.payFrequency,
        });
        const [stored] = await employeeJobApi.salariesOrFail(createdEmployee.empNumber);
        expect({ grade: stored.payGrade.name, amount: Number(stored.amount) }).toEqual({
          grade: payGrade.name,
          amount: Number(amount),
        });
      },
    );
  }

  test(
    '[PIM-UI-061] Salary component requires component name, currency and a numeric amount',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-VAL-022' },
        { type: 'requirement', description: 'PIM-VAL-023' },
        { type: 'requirement', description: 'PIM-VAL-024' },
      ],
    },
    async ({ page, employeeSalaryPage, employeeJobApi, createdEmployee }) => {
      const s = employeeSalaryPage;
      await s.openSalaryFor(createdEmployee.empNumber);
      const posts = recordApiCalls(page, 'POST', '/salary-components');
      await s.clickAdd();
      await s.clickSave();
      await s.expectErrors([
        [s.salaryComponent, pimText.required],
        [s.currency, pimText.required],
        [s.amount, pimText.required],
        [s.payGrade, null],
        [s.payFrequency, null],
        [s.comments, null],
      ]);

      await s.fillForm({ amount: 'abc', component: 'x'.repeat(101) });
      await s.expectErrors([
        [s.amount, salaryText.notANumber],
        [s.salaryComponent, salaryText.max100],
      ]);
      // 100 characters is the accepted boundary.
      await s.fillForm({ component: 'x'.repeat(100) });
      await s.salaryComponent.expectNoError();

      await s.clickSave();
      await s.expectFormOpen();
      expect(posts).toEqual([]);
      expect(await employeeJobApi.salariesOrFail(createdEmployee.empNumber)).toEqual([]);
    },
  );

  test(
    '[PIM-UI-062] Direct deposit fields become mandatory and numeric when the toggle is on',
    {
      tag: ['@P3', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-020-AC1' },
        { type: 'requirement', description: 'PIM-FR-020-AC2' },
        { type: 'requirement', description: 'PIM-VAL-025' },
      ],
    },
    async ({ page, employeeSalaryPage, employeeJobApi, createdEmployee }) => {
      const s = employeeSalaryPage;
      const component = `DD${uniqueSuffix()}`;
      await s.openSalaryFor(createdEmployee.empNumber);
      const posts = recordApiCalls(page, 'POST', '/salary-components');
      await s.clickAdd();
      await s.setDirectDeposit(true);
      expect(await s.accountType.options()).toEqual(['-- Select --', ...salaryText.accountTypes]);

      await s.fillForm({ component, payFrequency: seedJob.payFrequency, currency: seedJob.currency, amount: '3000' });
      await s.clickSave();
      await s.expectErrors([
        [s.accountNumber, pimText.required],
        [s.accountType, pimText.required],
        [s.routingNumber, pimText.required],
        [s.depositAmount, pimText.required],
        [s.amount, null],
      ]);
      expect(posts).toEqual([]);

      await s.fillForm({ deposit: { routingNumber: 'abc', amount: 'xyz' } });
      await s.expectErrors([
        [s.routingNumber, salaryText.notANumber],
        [s.depositAmount, salaryText.notANumber],
      ]);

      await s.fillForm({
        deposit: { accountNumber: 'ACC123', accountType: 'Savings', routingNumber: '123456789', amount: '500' },
      });
      expect(await s.save()).toEqual(saved);
      await s.expectRow(component, {
        amount: '3000',
        currency: seedJob.currency,
        payFrequency: seedJob.payFrequency,
        depositAmount: '500.00',
      });
      const [stored] = await employeeJobApi.salariesOrFail(createdEmployee.empNumber);
      expect({
        account: stored.directDebit.account,
        // The API returns the routing number as a JSON number.
        routing: String(stored.directDebit.routingNumber),
        amount: Number(stored.directDebit.amount),
      }).toEqual({ account: 'ACC123', routing: '123456789', amount: 500 });
    },
  );
});
