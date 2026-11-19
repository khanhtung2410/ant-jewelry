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
    baseURL,
    headless: true,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Mobile pass: rerun the storefront flows and the axe checks on a real
      // mobile device profile. Admin-only flows stay on desktop.
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
      grep: /@storefront|@a11y/,
    },
  ],
  webServer: {
    // Reset the dedicated E2E database, then exercise the production build so
    // `npm run test:e2e` never touches prisma/dev.db and always tests `next start`.
    // `e2e/reset-database.ts` deletes only the verified prisma/e2e.db (and its
    // companions) then runs plain `prisma db push` + seed. Prisma 7 blocks
    // --force-reset for AI agents, so this mirrors vitest.global-setup.ts.
    command:
      'npx tsx e2e/reset-database.ts && npm run build && npm run start -- --hostname 127.0.0.1 --port 3100',

    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      // A clean clone has no .env; E2E must not depend on a developer secret.
      AUTH_SECRET: 'e2e-only-auth-secret-not-for-production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
