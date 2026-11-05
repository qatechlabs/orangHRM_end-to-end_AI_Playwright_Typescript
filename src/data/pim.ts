import * as path from 'node:path';
import { dataFactory, uniqueSuffix } from '@utils/dataFactory';

/** Upload fixtures in test-data/files (see its README). */
export const pimFiles = {
  validPhoto: path.resolve('test-data/files/photo-valid.png'),
  altPhoto: path.resolve('test-data/files/photo-alt.png'),
  largePhoto: path.resolve('test-data/files/photo-large.png'),
  notAnImage: path.resolve('test-data/files/not-an-image.pdf'),
  smallAttachment: path.resolve('test-data/files/attachment-small.txt'),
  largeAttachment: path.resolve('test-data/files/attachment-large.bin'),
};

/** Default image OrangeHRM shows when an employee has no photo. */
export const DEFAULT_PHOTO = /\/images\/default-photo\.png$/;

/** Exact on-screen texts of the PIM screens (verified on the live app). */
export const savedToast = { title: 'Success', message: 'Successfully Saved' };
export const deletedToast = { title: 'Success', message: 'Successfully Deleted' };

export const pimText = {
  required: 'Required',
  max30: 'Should not exceed 30 characters',
  max10: 'Should not exceed 10 characters',
  employeeIdExists: 'Employee Id already exists',
  fileTypeNotAllowed: 'File type not allowed',
  attachmentSizeExceeded: 'Attachment Size Exceeded',
  usernameExists: 'Username already exists',
  usernameMin: 'Should be at least 5 characters',
  usernameMax: 'Should not exceed 40 characters',
  passwordsDoNotMatch: 'Passwords do not match',
  saved: 'Successfully Saved',
  updated: 'Successfully Updated',
  deleted: 'Successfully Deleted',
  noRecords: 'No Records Found',
  accountDisabled: 'Account disabled',
  deleteDialogTitle: 'Are you Sure?',
  deleteDialogText: 'The selected record will be permanently deleted. Are you sure you want to continue?',
  photoHint: 'Accepts jpg, .png, .gif up to 1MB. Recommended dimensions: 200px X 200px',
} as const;

export const pimData = {
  /** A token unique to this test, safe to search for with nameOrId on the shared demo. */
  token(prefix = 'Pim'): string {
    return `${prefix}${uniqueSuffix()}`;
  },

  /** Employee Id: max 10 characters, unique per test. */
  employeeId(): string {
    return `E${uniqueSuffix()}`.slice(0, 10);
  },

  /** Letters only, exactly `length` long. */
  name(length: number): string {
    return dataFactory.text(length);
  },

  /** Login for "Create Login Details": username 5-40 chars, password satisfying the default policy. */
  login(prefix = 'auto.emp'): { username: string; password: string } {
    return {
      username: `${prefix}${uniqueSuffix()}`.toLowerCase().slice(0, 40),
      password: dataFactory.password(),
    };
  },
};

/**
 * Master-data entries a drop-down can select unambiguously by exact text: no leading/trailing
 * spaces and no duplicate names (the shared demo contains both).
 */
export function selectable<T>(items: T[], name: (item: T) => string): T[] {
  return items.filter(
    (i) => name(i) === name(i).trim() && items.filter((j) => name(j) === name(i)).length === 1,
  );
}

/** Case-insensitive order, as the list API sorts (MySQL *_ci collation). */
export function sortedCI(values: string[], order: 'ASC' | 'DESC' = 'ASC'): string[] {
  const sorted = [...values].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return order === 'ASC' ? sorted : sorted.reverse();
}
