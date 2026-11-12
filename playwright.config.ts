import { defineConfig, devices } from '@playwright/test';
import { E2E_DATABASE_URL } from './e2e/database';

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
