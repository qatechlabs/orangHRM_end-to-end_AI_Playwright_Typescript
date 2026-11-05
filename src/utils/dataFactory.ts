import { faker } from '@faker-js/faker';

/**
 * Test data builders. Every value that must be unique on the shared demo is suffixed with
 * a run/worker token so parallel workers and parallel CI shards never collide.
 */
const runToken = (process.env.RUN_ID ?? Date.now().toString(36)).slice(-5);

export function uniqueSuffix(): string {
  const worker = process.env.TEST_PARALLEL_INDEX ?? '0';
  return `${runToken}${worker}${faker.string.alphanumeric({ length: 3, casing: 'lower' })}`;
}

export interface EmployeeData {
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
}

export const dataFactory = {
  employee(overrides: Partial<EmployeeData> = {}): EmployeeData {
    const suffix = uniqueSuffix();
    return {
      firstName: `${faker.person.firstName()}`.replace(/[^A-Za-z]/g, ''),
      middleName: faker.person.middleName().replace(/[^A-Za-z]/g, ''),
      lastName: `Auto${suffix}`,
      // OrangeHRM Employee Id max length is 10
      employeeId: `E${suffix}`.slice(0, 10),
      ...overrides,
    };
  },

  username(prefix = 'auto'): string {
    return `${prefix}.${uniqueSuffix()}`.toLowerCase();
  },

  /** Satisfies OrangeHRM's default password policy (>= 7 chars, a number, upper and lower case). */
  password(): string {
    return `Qa${faker.string.alphanumeric(6)}#${faker.number.int({ min: 10, max: 99 })}`;
  },

  text(length: number): string {
    return faker.string.alpha({ length });
  },
};
