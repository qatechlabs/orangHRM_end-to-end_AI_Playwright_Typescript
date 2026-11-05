import * as fs from 'node:fs';
import * as path from 'node:path';
import { test, expect } from '@fixtures/index';
import { pimFiles, pimText } from '@data/pim';
import type { AttachmentsSection } from '@pages/components/AttachmentsSection';
import type { FormField } from '@pages/components/FormField';

// Test cases: test-cases/json/pim.json (feature "Attachments"). Source: PIM-FR-010, PIM-VAL-031/032, PIM-BR-11.
// Exercised on the Personal Details tab (screen "personal"); every profile tab hosts the same block.

/** API date (yyyy-mm-dd) as the UI shows it (yyyy-dd-mm). */
const uiDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${y}-${d}-${m}`;
};

test.describe('Attachments', () => {
  test(
    '[PIM-UI-073] Attachment is uploaded with comment, listed with metadata, downloaded identical and deleted',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-010-AC1' },
        { type: 'requirement', description: 'PIM-FR-010-AC2' },
        { type: 'requirement', description: 'PIM-FR-010-AC4' },
        { type: 'requirement', description: 'PIM-E2E-08' },
      ],
    },
    async ({ employeeProfilePage, profileAttachments: attachments, qualificationsApi, createdEmployee }) => {
      const file = pimFiles.smallAttachment;
      const fileName = path.basename(file);
      const bytes = fs.readFileSync(file);
      await employeeProfilePage.openFor(createdEmployee.empNumber);
      await attachments.records.expectNoRecords();

      await attachments.clickAdd();
      await attachments.expectAddForm();
      await attachments.chooseFile(file);
      await attachments.expectChosenFile(fileName);
      await attachments.fillComment('auto attachment');
      const [toast] = await Promise.all([employeeProfilePage.toast.capture(), attachments.clickSave()]);
      expect(toast).toEqual({ title: 'Success', message: pimText.saved });
      await attachments.expectFormClosed();

      const [saved] = await qualificationsApi.attachmentsOrFail(createdEmployee.empNumber);
      expect(saved).toMatchObject({
        filename: fileName,
        description: 'auto attachment',
        size: bytes.length,
        fileType: 'text/plain',
      });
      await attachments.records.expectRecords(1);
      await attachments.records.expectHeaders([
        '',
        'File Name',
        'Description',
        'Size',
        'Type',
        'Date Added',
        'Added By',
        'Actions',
      ]);
      await attachments.records.expectRow(fileName, {
        Description: 'auto attachment',
        Size: `${bytes.length}.00 B`,
        Type: 'text/plain',
        'Date Added': uiDate(saved.attachedDate),
        'Added By': saved.attachedByName,
      });
      expect(saved.attachedByName.trim()).not.toBe('');

      const download = await attachments.download(attachments.row(fileName));
      expect(download.suggestedFilename()).toBe(fileName);
      expect(download.url()).toContain(
        `/pim/viewAttachment/empNumber/${createdEmployee.empNumber}/attachId/${saved.id}`,
      );
      expect(fs.readFileSync(await download.path()).equals(bytes)).toBe(true);

      await attachments.deleteRow(attachments.row(fileName));
      await employeeProfilePage.toast.expectSuccess(pimText.deleted);
      await attachments.records.expectNoRecords();
      expect(await qualificationsApi.attachmentsOrFail(createdEmployee.empNumber)).toEqual([]);
    },
  );

  type Attachments = AttachmentsSection;
  const noop = async () => {};
  const invalid: {
    label: string;
    message: string;
    field: (a: Attachments) => FormField;
    /** Steps before Save, including the messages that show before it. */
    prepare: (a: Attachments) => Promise<void>;
    /** Extra checks once the rejection is confirmed. */
    after: (a: Attachments) => Promise<void>;
  }[] = [
    {
      label: 'no file',
      message: pimText.required,
      field: (a) => a.selectFile,
      prepare: noop,
      after: noop,
    },
    {
      label: 'file over 1 MB',
      message: pimText.attachmentSizeExceeded,
      field: (a) => a.selectFile,
      prepare: async (a) => {
        await a.chooseFile(pimFiles.largeAttachment);
        await a.expectChosenFile(path.basename(pimFiles.largeAttachment));
        // The size check runs as soon as the file is chosen.
        await a.selectFile.expectError(pimText.attachmentSizeExceeded);
      },
      after: noop,
    },
    {
      label: 'comment of 201 characters',
      message: 'Should not exceed 200 characters',
      field: (a) => a.comment,
      prepare: async (a) => {
        await a.chooseFile(pimFiles.smallAttachment);
        await a.fillComment('x'.repeat(201));
        await a.comment.expectError('Should not exceed 200 characters');
      },
      after: async (a) => {
        // The limit is 200: one character less clears the message.
        await a.fillComment('x'.repeat(200));
        await a.comment.expectNoError();
      },
    },
  ];
  for (const v of invalid) {
    test(
      `[PIM-UI-074] Attachment over 1 MB, missing file or comment over 200 characters is rejected (${v.label})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-010-AC3' },
          { type: 'requirement', description: 'PIM-VAL-031' },
          { type: 'requirement', description: 'PIM-VAL-032' },
          { type: 'requirement', description: 'PIM-BR-11' },
        ],
      },
      async ({
        employeeProfilePage,
        profileAttachments: attachments,
        qualificationsApi,
        createdEmployee,
      }) => {
        await employeeProfilePage.openFor(createdEmployee.empNumber);
        await attachments.records.expectNoRecords();

        await attachments.clickAdd();
        await v.prepare(attachments);
        await attachments.clickSave();
        await v.field(attachments).expectError(v.message);
        await expect(attachments.formTitle).toHaveText('Add Attachment');
        await expect(employeeProfilePage.toast.root).toHaveCount(0);
        expect(await qualificationsApi.attachmentsOrFail(createdEmployee.empNumber)).toEqual([]);
        await v.after(attachments);
      },
    );
  }

  test(
    '[PIM-UI-075] Multiple attachments can be bulk-deleted',
    {
      tag: ['@P3', '@positive'],
      annotation: { type: 'requirement', description: 'PIM-FR-010-AC5' },
    },
    async ({ employeeProfilePage, profileAttachments: attachments, qualificationsApi, createdEmployee }) => {
      await qualificationsApi.addAttachmentOrFail(
        createdEmployee.empNumber,
        pimFiles.smallAttachment,
        'first',
      );
      await qualificationsApi.addAttachmentOrFail(createdEmployee.empNumber, pimFiles.validPhoto);
      await employeeProfilePage.openFor(createdEmployee.empNumber);
      await attachments.records.expectRecords(2);

      await attachments.deleteAllSelected(2);
      await employeeProfilePage.toast.expectSuccess(pimText.deleted);
      await attachments.records.expectNoRecords();
      expect(await qualificationsApi.attachmentsOrFail(createdEmployee.empNumber)).toEqual([]);
    },
  );
});
