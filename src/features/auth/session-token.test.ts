import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
  type AdminSession,
} from './session-token';

const SECRET = 'test-secret';

function signPayload(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function session(overrides: Partial<Omit<AdminSession, 'exp'>> = {}): Omit<AdminSession, 'exp'> {
  return {
    userId: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    name: 'Admin',
    sessionVersion: 3,
    ...overrides,
  };
}

describe('session token version', () => {
  it('round-trips the session version', () => {
    const token = createSessionToken(session(), SECRET);
    const verified = verifySessionToken(token, SECRET);

    expect(verified).toMatchObject({
      userId: 'user-1',
      sessionVersion: 3,
      exp: expect.any(Number),
    });
  });

  it('rejects a signed token that has no session version', () => {
    const legacy = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      name: 'Admin',
    };
    const token = signPayload({ ...legacy, exp: Math.floor(Date.now() / 1000) + 60 });

    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it('rejects a signed token with a negative session version', () => {
    const token = signPayload({
      ...session({ sessionVersion: -1 }),
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it('rejects a token whose version was edited after signing', () => {
    const token = createSessionToken(session({ sessionVersion: 1 }), SECRET);
    const [encoded, signature] = token.split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    const tampered = Buffer.from(
      JSON.stringify({ ...payload, sessionVersion: 999 }),
      'utf8',
    ).toString('base64url');

    expect(verifySessionToken(`${tampered}.${signature}`, SECRET)).toBeNull();
  });

  it('sets the configured maximum age', () => {
    const before = Math.floor(Date.now() / 1000);
    const verified = verifySessionToken(createSessionToken(session(), SECRET), SECRET);

    expect(verified?.exp).toBeGreaterThanOrEqual(before + SESSION_MAX_AGE_SECONDS - 1);
  });
});
