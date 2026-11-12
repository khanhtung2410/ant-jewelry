import { execSync } from 'node:child_process';
import { E2E_DATABASE_URL } from './database';

const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };

execSync('npx prisma db push --force-reset --skip-generate', {
  stdio: 'inherit',
  env,
});
execSync('npx prisma db seed', { stdio: 'inherit', env });
execSync('npx playwright test', { stdio: 'inherit', env });
