import * as path from 'node:path';
import { test, expect } from '@fixtures/index';
import { DEFAULT_PHOTO, pimData, pimFiles, pimText, savedToast } from '@data/pim';
import { uniqueSuffix } from '@utils/dataFactory';
import { pimPaths } from '@pages/pim/pimPaths';

// Test cases: test-cases/json/pim.json (feature "Profile Photo"). Source: PIM-FR-006, PIM-VAL-005, PIM-BR-11.

test.describe('Profile Photo', () => {
  test(
    '[PIM-UI-024] Valid profile photo is previewed on Add Employee and shown on the profile after save',
    {
      tag: ['@P2', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-006-AC1' },
        { type: 'requirement', description: 'PIM-FR-006-AC2' },
        { type: 'requirement', description: 'PIM-E2E-08' },
      ],
    },
    async ({ addEmployeePage, employeeProfilePage, employeesApi, employees }) => {
      const lastName = `Photo${uniqueSuffix()}`;
      employees.trackByName(lastName);
      await addEmployeePage.open();
      await addEmployeePage.expectPhotoIsPlaceholder();

      await addEmployeePage.uploadPhoto(pimFiles.validPhoto);
      await addEmployeePage.expectPhotoPreview();
      await expect(addEmployeePage.photoError).toHaveCount(0);

      const { empNumber, toast } = await addEmployeePage.addEmployee({
        firstName: 'Photo',
        lastName,
        employeeId: pimData.employeeId(),
      });
      employees.track(empNumber);
      expect(toast).toEqual(savedToast);
      await employeeProfilePage.waitForPersonalDetails();
      await expect(employeeProfilePage.headerPhoto).toHaveAttribute(
        'src',
        new RegExp(`${pimPaths.photo(empNumber)}$`),
      );
      expect(await employeeProfilePage.headerPhotoWidth()).toBe(200);
      const picture = await employeesApi.getPicture(empNumber);
      expect(picture.body.data).toMatchObject({
        filename: path.basename(pimFiles.validPhoto),
        fileType: 'image/png',
      });
    },
  );

  const invalidPhotos = [
    { label: 'disallowed type', file: pimFiles.notAnImage, message: pimText.fileTypeNotAllowed },
    { label: 'over 1 MB', file: pimFiles.largePhoto, message: pimText.attachmentSizeExceeded },
  ];
  for (const v of invalidPhotos) {
    test(
      `[PIM-UI-025] Photo with a disallowed type or over 1 MB is rejected and save is blocked (${v.label})`,
      {
        tag: ['@P2', '@negative'],
        annotation: [
          { type: 'requirement', description: 'PIM-FR-006-AC3' },
          { type: 'requirement', description: 'PIM-VAL-005' },
          { type: 'requirement', description: 'PIM-BR-11' },
        ],
      },
      async ({ addEmployeePage, employeesApi, employees }) => {
        const lastName = `BadPhoto${uniqueSuffix()}`;
        employees.trackByName(lastName);
        await addEmployeePage.open();
        await addEmployeePage.fillForm({ firstName: 'Photo', lastName });

        await addEmployeePage.uploadPhoto(v.file);
        await expect(addEmployeePage.photoError).toHaveText(v.message);

        await addEmployeePage.save();
        await addEmployeePage.expectNotSaved();
        await expect(addEmployeePage.photoError).toHaveText(v.message);
        expect(
          (await employeesApi.listOrFail({ nameOrId: lastName, includeEmployees: 'currentAndPast' })).total,
        ).toBe(0);
      },
    );
  }

  test(
    '[PIM-UI-026] Profile photo can be replaced and deleted from Change Profile Picture',
    {
      tag: ['@P3', '@positive'],
      annotation: [
        { type: 'requirement', description: 'PIM-FR-006-AC4' },
        {
          type: 'issue',
          description:
            'PIM-FR-006-AC4: Change Profile Picture has no control to delete the photo (only "+" and Save); replacing works',
        },
      ],
    },
    async ({ employeeProfilePage, changeProfilePicturePage, employeesApi, employees }) => {
      test.fail();
      const employee = await employees.create({ photo: pimFiles.validPhoto });

      await employeeProfilePage.openFor(employee.empNumber);
      await employeeProfilePage.clickPhoto();
      await changeProfilePicturePage.expectLoaded(employee.empNumber);
      await expect(changeProfilePicturePage.addButton).toBeVisible();

      await changeProfilePicturePage.replacePhoto(pimFiles.altPhoto);
      await changeProfilePicturePage.toast.expectSuccess(pimText.updated);
      const replaced = await employeesApi.getPicture(employee.empNumber);
      expect(replaced.body.data).toMatchObject({ filename: path.basename(pimFiles.altPhoto), width: '120' });
      await employeeProfilePage.openFor(employee.empNumber);
      expect(await employeeProfilePage.headerPhotoWidth()).toBe(120);

      // BRD: the photo can also be deleted here, restoring the default placeholder.
      await employeeProfilePage.clickPhoto();
      await changeProfilePicturePage.expectLoaded(employee.empNumber);
      await expect(changeProfilePicturePage.deletePhotoButton).toBeVisible();
      await changeProfilePicturePage.deletePhotoButton.click();
      await changeProfilePicturePage.dialog.confirm();
      await expect(employeeProfilePage.headerPhoto).toHaveAttribute('src', DEFAULT_PHOTO);
    },
  );
});
