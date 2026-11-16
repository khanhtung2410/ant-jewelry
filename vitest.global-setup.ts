import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './vitest.database';

export default function setup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };

  execSync('npx prisma db push --force-reset', {
    stdio: 'pipe',
    env,
  });
  execSync('npx prisma db seed', {
    stdio: 'pipe',
    env,
  });
}
