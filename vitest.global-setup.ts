import { execSync } from 'node:child_process';
import { existsSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { TEST_DATABASE_URL } from './vitest.database';

const prismaDirectory = path.resolve(process.cwd(), 'prisma');
const expectedTestDatabase = path.join(prismaDirectory, 'test.db');

/**
 * Resolve TEST_DATABASE_URL and make sure it points at exactly the dedicated
 * test database. A wrong value must never let global setup delete dev.db.
 */
function resolveTestDatabaseFile(): string {
  if (!existsSync(path.join(prismaDirectory, 'schema.prisma'))) {
    throw new Error(`Prisma schema not found in ${prismaDirectory}`);
  }
  if (!TEST_DATABASE_URL.startsWith('file:')) {
    throw new Error(`Test database must be a SQLite file URL, got: ${TEST_DATABASE_URL}`);
  }

  const resolved = path.resolve(process.cwd(), TEST_DATABASE_URL.slice('file:'.length));
  if (resolved !== expectedTestDatabase) {
    throw new Error(`Refusing to reset unexpected test database path: ${resolved}`);
  }
  return resolved;
}

export default function setup() {
  const testDatabaseFile = resolveTestDatabaseFile();

  // A plain `prisma db push` cannot recreate an existing SQLite file, while
  // --force-reset is blocked for AI agents. Delete only the verified test DB
  // so the push can create a clean database without that flag.
  if (existsSync(testDatabaseFile)) {
    if (!statSync(testDatabaseFile).isFile()) {
      throw new Error(`Refusing to delete non-file test database: ${testDatabaseFile}`);
    }
    unlinkSync(testDatabaseFile);
  }

  // Both the Prisma CLI and PrismaClient resolve relative file: URLs from the
  // project root, but an absolute URL removes any ambiguity for both commands.
  const databaseUrl = `file:${testDatabaseFile.replace(/\\/g, '/')}`;
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  execSync('npx prisma db push', { stdio: 'pipe', env });
  execSync('npx prisma db seed', { stdio: 'pipe', env });
}
