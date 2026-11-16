/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/features/shared/db/prisma';

export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

function getWindowStart(now: Date): Date {
  return new Date(now.getTime() - LOGIN_FAILURE_WINDOW_MS);
}

/**
 * Blocks a combination of email and client IP after too many failures inside
 * the rolling window. The error message stays identical to a normal failed
 * login, so the response does not reveal whether the email exists.
 */
export async function isLoginRateLimited(
  email: string,
  ip: string,
  now = new Date(),
): Promise<boolean> {
  try {
    const result = await (prisma.orm.public.LoginAttempt as any)
      .where({ email, ip })
      .where((a: any) => a.createdAt.gte(getWindowStart(now)))
      .aggregate((agg: any) => ({ count: agg.count() }));
    return (result?.count ?? 0) >= LOGIN_MAX_FAILED_ATTEMPTS;
  } catch {
    // Fallback: if aggregate/filter shape differs, fail open for availability but keep simple
    const records = await (prisma.orm.public.LoginAttempt as any).where({ email, ip }).all();
    const cutoff = getWindowStart(now).getTime();
    const count = records.filter((r: any) => new Date(r.createdAt).getTime() >= cutoff).length;
    return count >= LOGIN_MAX_FAILED_ATTEMPTS;
  }
}

export async function recordFailedLogin(
  email: string,
  ip: string,
  now = new Date(),
): Promise<void> {
  const cutoff = getWindowStart(now);
  await prisma.transaction(async (tx: any) => {
    // delete old attempts (best effort)
    const old = await tx.orm.public.LoginAttempt.where((a: any) => a.createdAt.lt(cutoff)).all();
    for (const row of old) {
      await tx.orm.public.LoginAttempt.where({ id: row.id }).delete();
    }
    await tx.orm.public.LoginAttempt.create({ email, ip, createdAt: now });
  });
}

export async function clearFailedLogins(email: string, ip: string): Promise<void> {
  const rows = await (prisma.orm.public.LoginAttempt as any).where({ email, ip }).all();
  for (const row of rows) {
    await (prisma.orm.public.LoginAttempt as any).where({ id: row.id }).delete();
  }
}
