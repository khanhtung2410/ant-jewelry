import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Role } from '@/features/shared/domain/domain';

export const SESSION_COOKIE_NAME = 'aj_admin_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  userId: string;
  email: string;
  role: Role;
  name: string | null;
  exp: number;
}

type SessionPayload = Omit<AdminSession, 'exp'> & { exp: number };

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function createSessionToken(session: Omit<AdminSession, 'exp'>, secret: string): string {
  const payload: SessionPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined | null,
  secret: string | undefined,
): AdminSession | null {
  if (!token || !secret) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  let expectedSignature: string;
  try {
    expectedSignature = sign(encodedPayload, secret);
  } catch {
    return null;
  }

  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.role !== 'ADMIN' && payload.role !== 'EDITOR') ||
      (payload.name !== null && typeof payload.name !== 'string') ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
