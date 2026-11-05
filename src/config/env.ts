import 'dotenv/config';
import { environments, type EnvName, type EnvironmentConfig } from './environments';

function resolveEnv(): EnvironmentConfig {
  const name = (process.env.TEST_ENV ?? 'demo') as EnvName;
  const base = environments[name];
  if (!base) {
    throw new Error(`Unknown TEST_ENV "${name}". Expected one of: ${Object.keys(environments).join(', ')}`);
  }
  const username = process.env.ADMIN_USERNAME || base.admin.username;
  const password = process.env.ADMIN_PASSWORD || base.admin.password;
  if (!username || !password) {
    throw new Error(`Admin credentials missing for "${name}". Set ADMIN_USERNAME and ADMIN_PASSWORD.`);
  }
  return {
    ...base,
    baseURL: (process.env.BASE_URL || base.baseURL).replace(/\/$/, ''),
    admin: { username, password },
  };
}

export const env = resolveEnv();

export const paths = {
  web: '/web/index.php',
  login: '/web/index.php/auth/login',
  dashboard: '/web/index.php/dashboard/index',
};

export const authFiles = {
  admin: '.auth/admin.json',
};
