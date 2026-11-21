import { afterAll, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';
import { prisma } from '@/features/shared/db/prisma';
import type { CreateUserFormState } from '@/features/users/actions';
import { loginAction } from './actions';
import { setAdminSessionCookie } from './session';

const PADDED_EMAIL = '  MiXeD.CaSe.Email@aNtJeWeLrY.lOcAl  ';
const NORMALIZED_EMAIL = 'mixed.case.email@antjewelry.local';
const PASSWORD = 'FlowPass@123';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '198.51.100.44' }),
}));
vi.mock('@/features/auth/session', () => ({
  setAdminSessionCookie: vi.fn(),
  clearAdminSessionCookie: vi.fn(),
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-test',
    email: 'admin@antjewelry.local',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { createUser } = await import('@/features/users/actions');

function createForm(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set('name', 'Email Flow Test');
  formData.set('email', email);
  formData.set('password', password);
  formData.set('role', 'EDITOR');
  return formData;
}

function loginForm(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

function emptyCreateState(): CreateUserFormState {
  return { values: { name: '', email: '', role: '' }, fieldErrors: {}, message: null };
}

describe('email normalization across create and login', () => {
  afterAll(async () => {
    await prisma.productImageBlob.deleteMany();
    await prisma.loginAttempt.deleteMany({ where: { email: NORMALIZED_EMAIL } });
    await prisma.user.deleteMany({ where: { email: NORMALIZED_EMAIL } });
  });

  it('stores the normalized email at creation and finds it on login with the same padded input', async () => {
    await createUser(emptyCreateState(), createForm(PADDED_EMAIL, PASSWORD));

    const stored = await prisma.user.findUnique({ where: { email: NORMALIZED_EMAIL } });
    expect(stored, 'createUser persisted a normalized email').toBeTruthy();
    expect(await prisma.user.count({ where: { email: PADDED_EMAIL } })).toBe(0);

    vi.mocked(redirect).mockClear();
    await loginAction({}, loginForm(PADDED_EMAIL, PASSWORD));
    expect(vi.mocked(setAdminSessionCookie)).toHaveBeenCalledWith(
      expect.objectContaining({ email: NORMALIZED_EMAIL }),
    );
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin');
  });

  it('keys a failed login by the normalized email written at creation', async () => {
    await loginAction({}, loginForm(PADDED_EMAIL, 'WrongPassword@123'));

    expect(await prisma.loginAttempt.count({ where: { email: NORMALIZED_EMAIL } })).toBe(1);
    expect(await prisma.loginAttempt.count({ where: { email: PADDED_EMAIL } })).toBe(0);
  });
});
