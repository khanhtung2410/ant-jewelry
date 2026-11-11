import 'server-only';

import { cookies } from 'next/headers';
import { connection } from 'next/server';
import {
  createSessionToken as createToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken as verifyToken,
  type AdminSession,
} from './session-token';

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
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
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function setAdminSessionCookie(session: Omit<AdminSession, 'exp'>): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
