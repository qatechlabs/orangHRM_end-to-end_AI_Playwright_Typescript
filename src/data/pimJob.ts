import * as fs from 'node:fs';
import { pimFiles } from './pim';
import { formatDate } from '@utils/dateUtils';

/** Upload files used by the Job tab (contract) and Admin job title specification. */
export const jobFiles = {
  contract: pimFiles.smallAttachment,
  /** Second small file, used to replace the saved contract. */
  contractReplacement: pimFiles.notAnImage,
  specification: pimFiles.smallAttachment,
};

/**
 * Writes a PDF-typed file of `bytes` bytes (the contract field accepts PDFs; the repository's
 * large `.bin` fixture is rejected for its type before its size is checked). Use a test output path.
 */
export function writePdfOfSize(filePath: string, bytes: number): string {
  const header = Buffer.from('%PDF-1.4\n');
  fs.writeFileSync(filePath, Buffer.concat([header, Buffer.alloc(bytes - header.length, 0x20)]));
  return filePath;
}

/** Stable OrangeHRM seed values (present before and after the demo resets). */
export const seedJob = {
  jobTitle: 'QA Engineer',
  jobCategory: 'Professionals',
  subUnit: 'Engineering',
  location: 'Texas R&D',
  employmentStatus: 'Full-Time Permanent',
  terminationReason: 'Resigned',
  currency: 'United States Dollar',
  payFrequency: 'Monthly',
} as const;

/** Date as the UI shows and accepts it (yyyy-dd-mm). */
export const uiDate = (date: Date): string => formatDate(date);

/** Date as the REST API uses it (yyyy-mm-dd). */
export const isoDate = (date: Date): string => formatDate(date, 'yyyy-mm-dd');

/**
 * The item named `preferred` when the drop-down can select it unambiguously, else the first
 * selectable one: the shared demo may lose or duplicate non-seed values.
 */
export function pickByName<T>(items: T[], name: (item: T) => string, preferred: string): T {
  const selectable = items.filter(
    (i) => name(i) === name(i).trim() && items.filter((j) => name(j) === name(i)).length === 1,
  );
  const item = selectable.find((i) => name(i) === preferred) ?? selectable[0];
  if (!item) throw new Error(`No selectable value (wanted "${preferred}")`);
  return item;
}

/** Sorted, trimmed copy for comparing drop-down options with master data. */
export const normalized = (names: string[]): string[] => names.map((n) => n.trim()).sort();
