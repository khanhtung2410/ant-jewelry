import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionCookieOptions } from './cookie';
import { SESSION_MAX_AGE_SECONDS } from './session-token';

const cookieState = vi.hoisted(() => ({ set: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: cookieState.set,
  }),
}));

const { revokeAdminSession } = await import('./session');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSessionCookieOptions', () => {
  it('sets hardened attributes with the default lifetime', () => {
    vi.stubEnv('NODE_ENV', 'test');

    expect(getSessionCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  });

  it('marks the cookie secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(getSessionCookieOptions().secure).toBe(true);
  });

  it('applies an explicit maxAge', () => {
    vi.stubEnv('NODE_ENV', 'test');

    expect(getSessionCookieOptions(0).maxAge).toBe(0);
  });
});

describe('revokeAdminSession cookie', () => {
  beforeEach(() => {
    cookieState.set.mockClear();
    vi.stubEnv('NODE_ENV', 'test');
  });

  it('clears the session cookie with maxAge 0', async () => {
    await revokeAdminSession();

    expect(cookieState.set).toHaveBeenCalledWith('aj_admin_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 0,
    });
  });
});
