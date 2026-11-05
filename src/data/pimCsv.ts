import * as fs from 'node:fs';
import * as path from 'node:path';
import { uniqueSuffix } from '@utils/dataFactory';

/** Header of the sample `importData.csv` served by PIM > Configuration > Data Import (22 columns). */
export const PIM_CSV_HEADER = [
  'first_name',
  'middle_name',
  'last_name',
  'employee_id',
  'other_id',
  "driver's_license_no",
  'license_expiry_date',
  'gender',
  'marital_status',
  'nationality',
  'date_of_birth',
  'address_street_1',
  'address_street_2',
  'city',
  'state/province',
  'zip/postal_code',
  'country',
  'home_telephone',
  'mobile',
  'work_telephone',
  'work_email',
  'other_email',
] as const;

type Column = (typeof PIM_CSV_HEADER)[number];
type CsvRow = Partial<Record<Column, string>>;

export interface ImportedName {
  firstName: string;
  lastName: string;
}

export interface PimCsvFile {
  path: string;
  /** Token every name in the file starts with: search/delete the imported employees by it. */
  token: string;
  /** Rows that must be imported. */
  valid: ImportedName[];
  /** First name of the row without last_name (must be rejected). */
  invalidFirstName: string;
  /** 1-based file line of the invalid row (header = line 1). */
  failedRow: number;
}

function line(row: CsvRow): string {
  return PIM_CSV_HEADER.map((c) => row[c] ?? '').join(',');
}

/**
 * Writes a unique 4-row import file into `dir`: 3 valid rows and, last, one row without last_name.
 * Every first/last name starts with the same `uniqueSuffix()` token, so parallel runs never collide.
 */
export function writePimCsv(dir: string): PimCsvFile {
  const token = uniqueSuffix();
  const valid: ImportedName[] = ['One', 'Two', 'Three'].map((n, i) => ({
    firstName: `${token}Imp${'ABC'[i]}`,
    lastName: `${token}${n}`,
  }));
  const invalidFirstName = `${token}ImpD`;
  const rows: CsvRow[] = [
    {
      first_name: valid[0].firstName,
      last_name: valid[0].lastName,
      gender: 'Male',
      date_of_birth: '1990-05-12',
      address_street_1: '1 Main St',
      city: 'Austin',
      'state/province': 'TX',
      'zip/postal_code': '73301',
      country: 'United States',
    },
    { first_name: valid[1].firstName, last_name: valid[1].lastName, gender: 'Female' },
    { first_name: valid[2].firstName, last_name: valid[2].lastName },
    { first_name: invalidFirstName },
  ];
  const content = [PIM_CSV_HEADER.join(','), ...rows.map(line)].join('\n') + '\n';
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `pim-import-${token}.csv`);
  fs.writeFileSync(file, content);
  return { path: file, token, valid, invalidFirstName, failedRow: rows.length + 1 };
}

/**
 * A CSV just over 1 MB, for the size check. Its filler rows have no names, so even if the client-side
 * check were missing nothing could be imported.
 */
export function writeLargePimCsv(dir: string, bytes = 1_100_000): string {
  const token = uniqueSuffix();
  const header = PIM_CSV_HEADER.join(',') + '\n';
  const row = line({ other_id: 'filler', city: 'x'.repeat(40) }) + '\n';
  const content = header + row.repeat(Math.ceil((bytes - header.length) / row.length));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `pim-import-large-${token}.csv`);
  fs.writeFileSync(file, content);
  return file;
}

/** A small non-CSV import candidate (`employees.xlsx`, the type named in the test case). */
export function writeNonCsv(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'employees.xlsx');
  // Zip magic number + filler: the browser derives the MIME type from the extension.
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(256, 0x20)]));
  return file;
}
