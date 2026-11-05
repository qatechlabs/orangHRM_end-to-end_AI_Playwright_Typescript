import { formatDate } from '@utils/dateUtils';

/** Exact on-screen texts of the profile detail tabs (verified on the live app, plan pim-3). */
export const detailText = {
  updated: 'Successfully Updated',
  saved: 'Successfully Saved',
  deleted: 'Successfully Deleted',
  required: 'Required',
  invalidDate: 'Should be a valid date in yyyy-dd-mm format',
  max30: 'Should not exceed 30 characters',
  max100: 'Should not exceed 100 characters',
  maxChars: (n: number) => `Should not exceed ${n} characters`,
  employeeIdExists: 'Employee Id already exists',
  phoneChars: 'Allows numbers and only + - / ( )',
  emailFormat: 'Expected format: admin@example.com',
  emailExists: 'Already exists',
  emailsSame: 'Work Email and Other Email cannot be the same',
  phoneRequired: 'At least one phone number is required',
  expiryBeforeIssued: 'Expiry date should be after issued date',
} as const;

export const maritalStatuses = ['-- Select --', 'Single', 'Married', 'Other'];

/** A date `years` from today, in the UI format (yyyy-dd-mm) and the API format (yyyy-mm-dd). */
export function yearsFromToday(years: number): { ui: string; iso: string } {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return { ui: formatDate(d), iso: formatDate(d, 'yyyy-mm-dd') };
}

/** Letters-only text of exactly `length` characters starting with `prefix`. */
export function textOfLength(length: number, prefix = ''): string {
  return (prefix + 'x'.repeat(length)).slice(0, length);
}

/** An email address of exactly `length` characters. */
export function emailOfLength(length: number): string {
  const domain = '@example.com';
  return `${'a'.repeat(length - domain.length)}${domain}`;
}
