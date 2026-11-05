import { test, expect } from '@fixtures/index';
import { expectStatus } from '@api/ApiClient';
import { pimData, pimText, selectable } from '@data/pim';

// Test cases: test-cases/json/pim.json (feature "Qualifications"). Source: PIM-FR-022, PIM-VAL-028..030.
// UI dates are yyyy-dd-mm; the values below have day = month so both orders read the same.

const TO_AFTER_FROM = 'To date should be after from date';

test.describe('Qualifications', () => {
  test(
    '[PIM-UI-068] Work experience is added with mandatory fields and To date must be after From date',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-022-AC1' },
        { type: 'requirement', description: 'PIM-FR-022-AC6' },
        { type: 'requirement', description: 'PIM-VAL-028' },
        {
          type: 'issue',
          description: `PIM-VAL-028 wording: the app shows "${TO_AFTER_FROM}" (lower-case "from"), the BRD writes "To date should be after From date"`,
        },
      ],
    },
    async ({ qualificationsPage: page, qualificationsApi, createdEmployee }) => {
      const block = page.workExperience;
      const company = `Acme${pimData.token('')}`;
      await page.load(createdEmployee.empNumber);
      await block.records.expectHeaders(['', 'Company', 'Job Title', 'From', 'To', 'Comment', 'Actions']);

      await page.clickAdd(block);
      await page.save(block);
      await block.expectRequired(['Company', 'Job Title'], ['Company', 'Job Title', 'From', 'To']);

      await page.fillWorkExperience({ company, jobTitle: 'Tester', from: '2024-01-01', to: '2023-01-01' });
      await page.save(block);
      await block.field('To').expectError(TO_AFTER_FROM);
      await block.expectFormTitle('Add Work Experience');
      await expect(page.toast.root).toHaveCount(0);

      await page.fillWorkExperience({ from: '2023-01-01', to: '2024-01-01', comment: 'cmt' });
      await block.field('To').expectNoError();
      expect(await page.saveWithToast(block)).toEqual({ title: 'Success', message: pimText.saved });
      await block.expectFormClosed();
      await page.expectRow(block, company, {
        'Job Title': 'Tester',
        From: '2023-01-01',
        To: '2024-01-01',
        Comment: 'cmt',
      });

      await page.editRow(block, block.row(company), block.field('Company').input);
      await block.expectFormTitle('Edit Work Experience');
      await expect(block.field('Job Title').input).toHaveValue('Tester');
      await page.fillWorkExperience({ jobTitle: 'Lead' });
      expect(await page.saveWithToast(block)).toEqual({ title: 'Success', message: pimText.updated });
      await page.expectRow(block, company, { 'Job Title': 'Lead' });

      await page.deleteRow(block, block.row(company));
      await page.toast.expectSuccess(pimText.deleted);
      await block.records.expectNoRecords();
      const left = await qualificationsApi.workExperiences(createdEmployee.empNumber);
      expectStatus(left, 200);
      expect(left.body.data).toEqual([]);
    },
  );

  test(
    '[PIM-UI-069] Education and License records are added from master data with optional fields',
    {
      tag: ['@P3', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-022-AC2' },
        { type: 'requirement', description: 'PIM-FR-022-AC5' },
        { type: 'requirement', description: 'PIM-FR-022-AC6' },
      ],
    },
    async ({ qualificationsPage: page, qualificationsApi, createdEmployee }) => {
      const levels = selectable(await qualificationsApi.educationLevels(), (l) => l.name);
      const licenses = selectable(await qualificationsApi.licenseTypes(), (l) => l.name);
      expect(levels.length, 'Admin > Education needs two levels').toBeGreaterThanOrEqual(2);
      expect(licenses.length, 'Admin > Licenses needs a type').toBeGreaterThanOrEqual(1);
      const [minimal, full] = levels;
      const license = licenses[0];
      const licenseNo = `L${pimData.token('')}`;
      await page.load(createdEmployee.empNumber);

      // Education with only the mandatory Level.
      await page.clickAdd(page.education);
      await page.save(page.education);
      await page.education.expectRequired(['Level'], ['Level', 'Institute', 'Year', 'GPA/Score']);
      expect(await page.selectOptions(page.education, 'Level')).toEqual(
        expect.arrayContaining(levels.map((l) => l.name)),
      );
      await page.fillEducation({ level: minimal.name });
      expect(await page.saveWithToast(page.education)).toEqual({ title: 'Success', message: pimText.saved });
      await page.expectRow(page.education, minimal.name, { Year: '', 'GPA/Score': '' });

      // Education with every optional field.
      await page.clickAdd(page.education);
      await page.fillEducation({
        level: full.name,
        institute: 'MIT',
        major: 'CS',
        year: '2015',
        score: '3.8',
        startDate: '2011-01-01',
        endDate: '2015-01-01',
      });
      expect(await page.saveWithToast(page.education)).toEqual({ title: 'Success', message: pimText.saved });
      await page.expectRow(page.education, full.name, { Year: '2015', 'GPA/Score': '3.8' });
      await page.education.records.expectRecords(2);

      // License with type and number.
      await page.clickAdd(page.license);
      await page.save(page.license);
      await page.license.expectRequired(['License Type'], ['License Type', 'License Number']);
      await page.fillLicense({ type: license.name, number: licenseNo });
      expect(await page.saveWithToast(page.license)).toEqual({ title: 'Success', message: pimText.saved });
      await page.expectRow(page.license, license.name, { 'Issued Date': '', 'Expiry Date': '' });

      const educations = await qualificationsApi.educations(createdEmployee.empNumber);
      expect(educations.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            education: expect.objectContaining({ id: minimal.id }),
            institute: null,
            year: null,
          }),
          expect.objectContaining({
            education: expect.objectContaining({ id: full.id }),
            institute: 'MIT',
            major: 'CS',
            year: 2015,
            score: '3.8',
            startDate: '2011-01-01',
            endDate: '2015-01-01',
          }),
        ]),
      );
      const licenseRows = await qualificationsApi.licenses(createdEmployee.empNumber);
      expect(licenseRows.body.data).toEqual([
        expect.objectContaining({ licenseNo, license: expect.objectContaining({ id: license.id }) }),
      ]);
    },
  );

  test(
    '[PIM-UI-070] A skill cannot be added twice and Years of Experience must be numeric',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-022-AC3' },
        { type: 'requirement', description: 'PIM-VAL-029' },
      ],
    },
    async ({ qualificationsPage: page, qualificationsApi, createdEmployee }) => {
      const block = page.skills;
      const skill = selectable(await qualificationsApi.skillTypes(), (s) => s.name)[0];
      await page.load(createdEmployee.empNumber);

      await page.clickAdd(block);
      await page.save(block);
      await block.expectRequired(['Skill'], ['Skill', 'Years of Experience']);

      await page.fillSkill({ skill: skill.name, years: 'abc' });
      await page.save(block);
      await block.field('Years of Experience').expectError('Should be a number');
      await block.expectFormTitle('Add Skill');

      await page.fillSkill({ years: '5' });
      await block.field('Years of Experience').expectNoError();
      expect(await page.saveWithToast(block)).toEqual({ title: 'Success', message: pimText.saved });
      await page.expectRow(block, skill.name, { 'Years of Experience': '5' });

      // The assigned skill is no longer offered.
      await page.clickAdd(block);
      const offered = await page.selectOptions(block, 'Skill');
      expect(offered.length).toBeGreaterThan(0);
      expect(offered).not.toContain(skill.name);
      await block.records.expectRecords(1);
    },
  );

  test(
    '[PIM-UI-070] A skill cannot be added twice and Years of Experience must be numeric (duplicate sent to the server)',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-022-AC3' },
        {
          type: 'issue',
          description:
            'PIM-FR-022-AC3 is enforced only by the UI drop-down: POST /pim/employees/{n}/skills with an already assigned skill returns 200 and overwrites Years of Experience instead of rejecting it',
        },
      ],
    },
    async ({ qualificationsApi, createdEmployee }) => {
      test.fail();
      const skill = selectable(await qualificationsApi.skillTypes(), (s) => s.name)[0];
      expectStatus(
        await qualificationsApi.addSkill(createdEmployee.empNumber, {
          skillId: skill.id,
          yearsOfExperience: 5,
        }),
        200,
      );

      const duplicate = await qualificationsApi.addSkill(createdEmployee.empNumber, {
        skillId: skill.id,
        yearsOfExperience: 7,
      });
      const skills = await qualificationsApi.skills(createdEmployee.empNumber);
      expect(skills.body.data).toEqual([expect.objectContaining({ yearsOfExperience: 5 })]);
      expect(duplicate.status, 'a second assignment of the same skill must be rejected').toBe(422);
    },
  );

  test(
    '[PIM-UI-071] Language requires Language, Fluency and Competency',
    {
      tag: ['@P2', '@negative'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-022-AC4' },
        { type: 'requirement', description: 'PIM-VAL-030' },
      ],
    },
    async ({ qualificationsPage: page, qualificationsApi, createdEmployee }) => {
      const block = page.languages;
      const language = selectable(await qualificationsApi.languageTypes(), (l) => l.name)[0];
      await page.load(createdEmployee.empNumber);

      await page.clickAdd(block);
      await page.save(block);
      await block.expectRequired(
        ['Language', 'Fluency', 'Competency'],
        ['Language', 'Fluency', 'Competency', 'Comments'],
      );
      // Fluency and Competency offer their values once a Language is chosen.
      await page.fillLanguage({ language: language.name });
      expect(await page.selectOptions(block, 'Fluency')).toEqual(['Writing', 'Speaking', 'Reading']);
      expect(await page.selectOptions(block, 'Competency')).toEqual([
        'Poor',
        'Basic',
        'Good',
        'Mother Tongue',
      ]);
      expect((await qualificationsApi.languages(createdEmployee.empNumber)).body.data).toEqual([]);

      await page.fillLanguage({
        fluency: 'Speaking',
        competency: 'Good',
        comments: 'lang cmt',
      });
      expect(await page.saveWithToast(block)).toEqual({ title: 'Success', message: pimText.saved });
      await page.expectRow(block, language.name, {
        Fluency: 'Speaking',
        Competency: 'Good',
        Comments: 'lang cmt',
      });
    },
  );
});
