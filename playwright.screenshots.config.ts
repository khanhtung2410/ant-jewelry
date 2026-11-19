import { defineConfig, devices } from '@playwright/test';

/**
 * Generates the desktop 1920px screenshots used in UI PRs and the R6.3
 * Figma-vs-production table. Read-only like the production smoke suite.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/ui-screenshots.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
    baseURL: process.env.BASE_URL?.trim() || 'https://ant-jewelry.vercel.app',
    headless: true,
  },
});
