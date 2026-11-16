import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */

import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import contractJson from '../../../prisma/contract.json' with { type: 'json' };
import type { Contract } from '../../../prisma/contract';

export type DbClient = ReturnType<typeof postgres<Contract>>;

declare global {
  var __antPrismaService: unknown;
}

function getServiceClient(): DbClient | null {
  try {
    const globalService = (globalThis as Record<string, unknown>).service as
      | { load?: () => { db?: { client?: unknown } } | Promise<{ db?: { client?: unknown } }> }
      | undefined;
    const loaded = globalService?.load?.();
    if (loaded && typeof (loaded as Promise<unknown>).then === 'function') {
      return null;
    }
    const client = (loaded as { db?: { client?: unknown } } | undefined)?.db?.client;
    return (client as DbClient | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function getDb(): Promise<DbClient> {
  try {
    const globalService = (globalThis as Record<string, unknown>).service as
      | { load?: () => { db?: { client?: unknown } } | Promise<{ db?: { client?: unknown } }> }
      | undefined;
    const loaded = globalService?.load ? await globalService.load() : null;
    const client = (loaded as { db?: { client?: unknown } } | null)?.db?.client;
    if (client) return client as DbClient;
  } catch {
    // fall through to local client
  }

  const contract = contractFromJson<Contract>(contractJson as Contract);
  const globalForDb = globalThis as unknown as { __antPrismaDb?: DbClient };
  if (!globalForDb.__antPrismaDb) {
    globalForDb.__antPrismaDb = postgres({ contract, url: process.env.DATABASE_URL });
  }
  return globalForDb.__antPrismaDb;
}

const contract = contractFromJson<Contract>(contractJson as Contract);
const globalForDb = globalThis as unknown as { __antPrismaDb?: DbClient };

export const db: DbClient =
  getServiceClient() ??
  globalForDb.__antPrismaDb ??
  postgres({ contract, url: process.env.DATABASE_URL });

if (!getServiceClient()) {
  globalForDb.__antPrismaDb = db;
}

export const prisma = db;
export default db;

export function isKnownError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (isKnownError(error, 'P2002')) return true;
  const e = error as {
    code?: string;
    sqlState?: string;
    cause?: { code?: string; sqlState?: string };
  } | null;
  const sqlState = e?.sqlState ?? e?.cause?.sqlState;
  const code = e?.code ?? e?.cause?.code;
  return sqlState === '23505' || code === '23505';
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  if (isKnownError(error, 'P2003')) return true;
  const e = error as {
    code?: string;
    sqlState?: string;
    cause?: { code?: string; sqlState?: string };
  } | null;
  const sqlState = e?.sqlState ?? e?.cause?.sqlState;
  const code = e?.code ?? e?.cause?.code;
  return sqlState === '23503' || code === '23503';
}

export function isMissingTableError(error: unknown): boolean {
  if (isKnownError(error, 'P2021')) return true;
  const e = error as {
    code?: string;
    sqlState?: string;
    cause?: { code?: string; sqlState?: string };
  } | null;
  const sqlState = e?.sqlState ?? e?.cause?.sqlState;
  const code = e?.code ?? e?.cause?.code;
  return sqlState === '42P01' || code === '42P01';
}
