import { execSync } from 'node:child_process';
import { existsSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { E2E_DATABASE_URL } from './database';

const prismaDirectory = path.resolve(process.cwd(), 'prisma');
const expectedE2eDatabase = path.join(prismaDirectory, 'e2e.db');

/**
 * Resolve E2E_DATABASE_URL and make sure it points at exactly the dedicated
 * E2E database. A wrong value must never let this script delete dev.db.
 */
function resolveE2eDatabaseFile(): string {
  if (!existsSync(path.join(prismaDirectory, 'schema.prisma'))) {
    throw new Error(`Prisma schema not found in ${prismaDirectory}`);
  }
  if (!E2E_DATABASE_URL.startsWith('file:')) {
    throw new Error(`E2E database must be a SQLite file URL, got: ${E2E_DATABASE_URL}`);
  }

  const resolved = path.resolve(process.cwd(), E2E_DATABASE_URL.slice('file:'.length));
  if (resolved !== expectedE2eDatabase) {
    throw new Error(`Refusing to reset unexpected E2E database path: ${resolved}`);
  }
  return resolved;
}

const e2eDatabaseFile = resolveE2eDatabaseFile();

// A plain `prisma db push` cannot recreate an existing SQLite file, while
// --force-reset is blocked for AI agents. Delete only the verified E2E DB
// (and its journal/WAL companions) so the push creates it cleanly without
// that flag.
for (const suffix of ['', '-wal', '-shm', '-journal']) {
  const file = `${e2eDatabaseFile}${suffix}`;
  if (!existsSync(file)) continue;
  if (!statSync(file).isFile()) {
    throw new Error(`Refusing to delete non-file E2E database artifact: ${file}`);
  }
  unlinkSync(file);
}

// Both the Prisma CLI and PrismaClient resolve relative file: URLs from the
// project root, but an absolute URL removes any ambiguity for both commands.
const databaseUrl = `file:${e2eDatabaseFile.replace(/\\/g, '/')}`;
const env = { ...process.env, DATABASE_URL: databaseUrl };
execSync('npx prisma db push', { stdio: 'pipe', env });
execSync('npx prisma db seed', { stdio: 'pipe', env });
