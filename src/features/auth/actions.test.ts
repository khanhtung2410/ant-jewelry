import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/features/shared/db/prisma';
import { loginAction } from './actions';
import { setAdminSessionCookie } from './session';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/features/auth/session', () => ({
  setAdminSessionCookie: vi.fn(),
  clearAdminSessionCookie: vi.fn(),
}));

const EMAIL = 'locked-login-test@antjewelry.local';
const PASSWORD = 'Locked@123';

describe('loginAction account lock', () => {
  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: EMAIL },
      update: {
        name: 'Locked test user',
        passwordHash: await bcrypt.hash(PASSWORD, 10),
        role: 'EDITOR',
        locked: true,
      },
      create: {
        name: 'Locked test user',
        email: EMAIL,
        passwordHash: await bcrypt.hash(PASSWORD, 10),
        role: 'EDITOR',
        locked: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
  });

  it('rejects a locked account even with the correct password', async () => {
    const formData = new FormData();
    formData.set('email', EMAIL);
    formData.set('password', PASSWORD);

    const state = await loginAction({}, formData);

    expect(state).toEqual({ error: 'Invalid email or password.' });
    expect(vi.mocked(setAdminSessionCookie)).not.toHaveBeenCalled();
  });
});
