#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PENDING_PATTERN = /Following migrations? have not yet been applied:/i;
const NO_PENDING_PATTERN =
  /Database schema is up to date|No pending migrations|No migration found in prisma\/migrations/i;

/**
 * Classifies `prisma migrate status` output for the deploy gate. The pending
 * banner wins first; only an explicit no-pending marker means "false". Empty,
 * truncated or unknown output is pending, so a Prisma wording change pauses for
 * approval instead of applying an unreviewed migration. A command failure is
 * still handled by the CLI wrapper below, which exits non-zero.
 */
export function hasPendingMigrations(output) {
  if (typeof output === 'string' && PENDING_PATTERN.test(output)) return true;
  if (typeof output === 'string' && NO_PENDING_PATTERN.test(output)) return false;
  return true;
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
  // The banner is checked separately from the fail-closed classifier so a
  // failed status command with empty or unknown output still stops the run.
  if (typeof output === 'string' && PENDING_PATTERN.test(output)) {
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

  console.log(hasPendingMigrations(output) ? 'true' : 'false');
}
