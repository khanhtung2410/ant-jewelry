#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

/**
 * Applies PostgreSQL migrations during a Vercel build.
 *
 * Only Production deployments may migrate: in this project the Preview,
 * Development and Production environments are all connected to the same
 * Prisma Postgres database, so letting Preview builds migrate would let an
 * unreviewed branch change the production schema.
 *
 * Local builds and Preview builds skip this step; run
 * `npm run db:migrate:production` explicitly instead.
 */
const vercelEnv = process.env.VERCEL_ENV;

if (!process.env.VERCEL) {
  console.log('[migrate] Not running on Vercel; skipping automatic migrations.');
  process.exit(0);
}

if (vercelEnv !== 'production') {
  console.log(`[migrate] Skipping migrations because VERCEL_ENV=${vercelEnv}.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('[migrate] DATABASE_URL is not set; cannot apply production migrations.');
  process.exit(1);
}

console.log('[migrate] Applying PostgreSQL migrations (prisma migrate deploy)...');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, ['run', 'db:migrate:production'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('[migrate] Failed to start the migration command:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
