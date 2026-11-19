import { defineConfig, devices } from '@playwright/test';

/**
 * Read-only smoke suite for a deployed environment. It never starts a local
 * server or touches a database: every request is a GET against BASE_URL.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/production.smoke.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.BASE_URL?.trim() || 'https://ant-jewelry.vercel.app',
    headless: true,
  },
});
