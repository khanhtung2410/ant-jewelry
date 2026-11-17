import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/features/shared/db/prisma';
import { BCRYPT_COST } from '@/features/shared/lib/password';
import { loginAction } from './actions';
import { LOGIN_FAILURE_WINDOW_MS, LOGIN_MAX_FAILED_ATTEMPTS } from './login-rate-limit';
import { AUTH_MESSAGES } from './messages';
import { setAdminSessionCookie } from './session';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/features/auth/session', () => ({
  setAdminSessionCookie: vi.fn(),
  clearAdminSessionCookie: vi.fn(),
}));

const headerState = vi.hoisted(() => ({ ip: '198.51.100.10' }));

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': headerState.ip }),
}));

const LOCKED_EMAIL = 'locked-login-test@antjewelry.local';
const PASSWORD = 'Locked@123';
const RATE_EMAIL = 'rate-limit-login-test@antjewelry.local';
const RATE_PASSWORD = 'RateLimit@123';
const UNKNOWN_EMAIL = 'missing-login-test@antjewelry.local';

function formDataFor(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

async function signIn(email: string, password: string) {
  return loginAction({}, formDataFor(email, password));
}

describe('loginAction', () => {
  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: LOCKED_EMAIL },
      update: {
        name: 'Locked test user',
        passwordHash: await bcrypt.hash(PASSWORD, BCRYPT_COST),
        role: 'EDITOR',
        locked: true,
      },
      create: {
        name: 'Locked test user',
        email: LOCKED_EMAIL,
        passwordHash: await bcrypt.hash(PASSWORD, BCRYPT_COST),
        role: 'EDITOR',
        locked: true,
      },
    });

    await prisma.user.upsert({
      where: { email: RATE_EMAIL },
      update: {
        name: 'Rate limit test user',
        passwordHash: await bcrypt.hash(RATE_PASSWORD, BCRYPT_COST),
        role: 'EDITOR',
        locked: false,
      },
      create: {
        name: 'Rate limit test user',
        email: RATE_EMAIL,
        passwordHash: await bcrypt.hash(RATE_PASSWORD, BCRYPT_COST),
        role: 'EDITOR',
        locked: false,
      },
    });
  });

  beforeEach(async () => {
    headerState.ip = '198.51.100.10';
    vi.mocked(setAdminSessionCookie).mockClear();
    vi.mocked(redirect).mockClear();
    await prisma.loginAttempt.deleteMany();
  });

  afterAll(async () => {
    await prisma.loginAttempt.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [LOCKED_EMAIL, RATE_EMAIL] } } });
  });

  it('rejects a locked account even with the correct password', async () => {
    const state = await signIn(LOCKED_EMAIL, PASSWORD);

    expect(state).toEqual({ error: AUTH_MESSAGES.INVALID_CREDENTIALS });
    expect(vi.mocked(setAdminSessionCookie)).not.toHaveBeenCalled();
  });

  it('returns the same message for an unknown email and a wrong password', async () => {
    const compareSpy = vi.spyOn(bcrypt, 'compare');

    const unknownEmailState = await signIn(UNKNOWN_EMAIL, 'Whatever@123');
    const wrongPasswordState = await signIn(RATE_EMAIL, 'WrongPassword@123');

    expect(unknownEmailState).toEqual({ error: AUTH_MESSAGES.INVALID_CREDENTIALS });
    expect(wrongPasswordState).toEqual(unknownEmailState);
    expect(compareSpy).toHaveBeenCalledTimes(2);

    compareSpy.mockRestore();
  });

  it(`blocks a temporary ban after ${LOGIN_MAX_FAILED_ATTEMPTS} failed attempts`, async () => {
    for (let attempt = 0; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt += 1) {
      const state = await signIn(RATE_EMAIL, 'WrongPassword@123');
      expect(state).toEqual({ error: AUTH_MESSAGES.INVALID_CREDENTIALS });
    }

    const blockedState = await signIn(RATE_EMAIL, RATE_PASSWORD);

    expect(blockedState).toEqual({ error: AUTH_MESSAGES.TOO_MANY_ATTEMPTS });
    expect(vi.mocked(setAdminSessionCookie)).not.toHaveBeenCalled();
  });

  it('allows sign-in again once the failure window has passed', async () => {
    for (let attempt = 0; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt += 1) {
      await signIn(RATE_EMAIL, 'WrongPassword@123');
    }

    await prisma.loginAttempt.updateMany({
      where: { email: RATE_EMAIL, ip: headerState.ip },
      data: { createdAt: new Date(Date.now() - LOGIN_FAILURE_WINDOW_MS - 1000) },
    });

    await signIn(RATE_EMAIL, RATE_PASSWORD);

    expect(vi.mocked(setAdminSessionCookie)).toHaveBeenCalledWith(
      expect.objectContaining({ email: RATE_EMAIL }),
    );
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin');
    expect(await prisma.loginAttempt.count({ where: { email: RATE_EMAIL } })).toBe(0);
  });

  it('clears failed attempts after a successful sign-in', async () => {
    for (let attempt = 0; attempt < LOGIN_MAX_FAILED_ATTEMPTS - 1; attempt += 1) {
      await signIn(RATE_EMAIL, 'WrongPassword@123');
    }
    expect(await prisma.loginAttempt.count({ where: { email: RATE_EMAIL } })).toBe(
      LOGIN_MAX_FAILED_ATTEMPTS - 1,
    );

    await signIn(RATE_EMAIL, RATE_PASSWORD);

    expect(vi.mocked(setAdminSessionCookie)).toHaveBeenCalledWith(
      expect.objectContaining({ email: RATE_EMAIL }),
    );
    expect(await prisma.loginAttempt.count({ where: { email: RATE_EMAIL } })).toBe(0);
  });

  it('tracks failures per email and IP combination', async () => {
    for (let attempt = 0; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt += 1) {
      await signIn(RATE_EMAIL, 'WrongPassword@123');
    }

    expect(await signIn(RATE_EMAIL, RATE_PASSWORD)).toEqual({
      error: AUTH_MESSAGES.TOO_MANY_ATTEMPTS,
    });

    headerState.ip = '198.51.100.99';
    await signIn(RATE_EMAIL, RATE_PASSWORD);

    expect(vi.mocked(setAdminSessionCookie)).toHaveBeenCalledWith(
      expect.objectContaining({ email: RATE_EMAIL }),
    );
  });
});
