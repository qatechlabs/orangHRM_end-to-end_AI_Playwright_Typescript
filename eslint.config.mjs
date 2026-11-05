import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules', 'allure-*', 'playwright-report', 'test-results', 'blob-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'warn',
      // Page-object methods named expect*/assert* and expectStatus() count as assertions.
      'playwright/expect-expect': ['warn', { assertFunctionPatterns: ['^expect', '\\.expect[A-Z]\\w*$', '\\.assert'] }],
    },
  },
  {
    // Playwright fixtures that need no dependencies must use an empty destructuring pattern.
    files: ['src/fixtures/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    files: ['tests/setup/**/*.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
