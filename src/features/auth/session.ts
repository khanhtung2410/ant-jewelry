import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { prisma } from '@/features/shared/db/prisma';
import { getSessionCookieOptions, readValidatedSession } from './cookie';
import {
  createSessionToken as createToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken as verifyToken,
  type AdminSession,
} from './session-token';

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, getSessionCookieOptions };
export type { AdminSession };

export function getSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return secret;
}

export function createSessionToken(session: Omit<AdminSession, 'exp'>): string {
  return createToken(session, getAuthSecret());
}

export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  return verifyToken(token, process.env.AUTH_SECRET);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  await connection();
  const cookieStore = await cookies();
  const session = readValidatedSession(cookieStore);
  if (!session) return null;

  const user = await (prisma.orm.public.User as any).where({ id: session.userId }).first();

  if (!user || user.locked || user.sessionVersion !== session.sessionVersion) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    sessionVersion: user.sessionVersion,
    exp: session.exp,
  };
}

export async function setAdminSessionCookie(session: Omit<AdminSession, 'exp'>): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(SESSION_MAX_AGE_SECONDS));
}

/**
 * Bumps the user's session version before clearing the cookie. Clearing only
 * the browser cookie would leave an already copied token valid until expiry.
 */
export async function revokeAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = readValidatedSession(cookieStore);

  if (session) {
    try {
      const user = await (prisma.orm.public.User as any).where({ id: session.userId }).first();
      if (user) {
        await (prisma.orm.public.User as any)
          .where({ id: session.userId })
          .update({ sessionVersion: (user.sessionVersion ?? 0) + 1 });
      }
    } catch (error) {
      console.error('Admin logout could not revoke the session:', error);
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', getSessionCookieOptions(0));
}
