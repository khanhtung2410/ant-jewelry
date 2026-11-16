import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './vitest.database';

export default function setup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };

  // Prisma 8 migration: legacy SQLite push/seed flow may not be compatible with
  // the current Postgres contract/config. Best-effort setup for environments
  // that still provide a compatible DATABASE_URL.
  try {
    execSync('npx prisma db migrate', {
      stdio: 'pipe',
      env,
    });
  } catch {
    // ignore - tests may run against pre-provisioned DB or need manual setup
  }

  try {
    execSync('npx tsx prisma/seed.ts', {
      stdio: 'pipe',
      env,
    });
  } catch {
    // ignore
  }
}
