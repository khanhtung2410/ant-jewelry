#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PENDING_PATTERN = /Following migrations? have not yet been applied:/i;

/**
 * Detects the banner printed by `prisma migrate status` when migrations exist
 * in the migration directory but have not reached the database. Empty or
 * unrelated output means "no pending migration"; a command failure is handled
 * by the CLI wrapper below, which fails closed.
 */
export function hasPendingMigrations(output) {
  if (typeof output !== 'string' || output.length === 0) return false;
  return PENDING_PATTERN.test(output);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['run', 'db:migrate:status:production'], {
    encoding: 'utf8',
    env: process.env,
  });

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

  // A pending banner wins even when Prisma exits non-zero for pending work.
  if (hasPendingMigrations(output)) {
    console.log('true');
    process.exit(0);
  }

  // A command that could not run or did not succeed is never reported as an
  // empty result: the workflow must stop instead of skipping the migration.
  if (result.error || result.status !== 0) {
    console.error(
      '[detect-pending-migrations] prisma migrate status failed; refusing to continue.',
    );
    process.exit(1);
  }

  console.log('false');
}
