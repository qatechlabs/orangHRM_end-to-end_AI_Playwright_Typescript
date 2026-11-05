export type EnvName = 'demo' | 'qa' | 'staging';

export interface Credentials {
  username: string;
  password: string;
}

export interface EnvironmentConfig {
  name: EnvName;
  /** Human readable label shown in the Allure report. */
  label: string;
  baseURL: string;
  /** Path prefix of the OrangeHRM REST API, relative to baseURL. */
  apiPath: string;
  admin: Credentials;
  /** OrangeHRM version under test, shown in the report. */
  appVersion: string;
}

/**
 * One entry per target environment. Credentials can always be overridden through
 * ADMIN_USERNAME / ADMIN_PASSWORD so real secrets never live in the repo.
 */
export const environments: Record<
  EnvName,
  Omit<EnvironmentConfig, 'admin'> & { admin: Partial<Credentials> }
> = {
  demo: {
    name: 'demo',
    label: 'OrangeHRM Open Source Demo',
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    apiPath: '/web/index.php/api/v2',
    admin: { username: 'Admin', password: 'admin123' },
    appVersion: '5.x',
  },
  qa: {
    name: 'qa',
    label: 'QA',
    baseURL: 'http://localhost:8080',
    apiPath: '/web/index.php/api/v2',
    admin: {},
    appVersion: '5.x',
  },
  staging: {
    name: 'staging',
    label: 'Staging',
    baseURL: 'https://staging.example.com',
    apiPath: '/web/index.php/api/v2',
    admin: {},
    appVersion: '5.x',
  },
};
