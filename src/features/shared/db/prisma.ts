import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveSqliteUrl(url: string): string {
  if (!url.startsWith('file:')) {
    return url;
  }

  const filePath = url.slice('file:'.length);
  // Keep already-absolute file URLs (e.g. file:/C:/... or file:///C:/...) intact.
  if (filePath.startsWith('/') || /^[A-Za-z]:[\\/]/.test(filePath)) {
    return url;
  }

  // Prisma traditionally resolves relative SQLite file URLs from the schema
  // directory (prisma/). Resolve relative paths against prisma/ for consistency
  // with existing env values like file:./dev.db -> prisma/dev.db.
  const resolvedPath = path.resolve(process.cwd(), 'prisma', filePath);
  return `file:${resolvedPath.replace(/\\/g, '/')}`;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (url.startsWith('file:') || url.startsWith('sqlite:')) {
    const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl(url) });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
