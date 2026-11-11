import { execSync } from 'node:child_process';

export default function setup() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }

  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
  execSync('npx prisma db seed', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
}
