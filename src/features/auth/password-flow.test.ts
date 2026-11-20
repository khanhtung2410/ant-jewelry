import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';
import { prisma } from '@/features/shared/db/prisma';
import type { CreateUserFormState, UserAccessFormState } from '@/features/users/actions';

const WHITESPACE_MESSAGE = 'Password must not start or end with whitespace.';
const EMAIL = 'password-flow-test@antjewelry.local';
const SPACED_EMAIL = 'password-flow-spaced-test@antjewelry.local';
const PASSWORD = 'Plain@12345';
const UPDATED_PASSWORD = 'Updated@12345';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '198.51.100.77' }),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-test',
    email: 'admin@antjewelry.local',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
  setAdminSessionCookie: vi.fn(),
  clearAdminSessionCookie: vi.fn(),
}));

const { loginAction } = await import('./actions');
const { createUser, saveUserAccess } = await import('@/features/users/actions');

function createForm(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set('name', 'Password Flow Test');
  formData.set('email', email);
  formData.set('password', password);
  formData.set('role', 'EDITOR');
  return formData;
}

function emptyCreateState(): CreateUserFormState {
  return {
    values: { name: '', email: '', role: '' },
    fieldErrors: {},
    message: null,
  };
}

function emptyAccessState(userId: string): UserAccessFormState {
  return {
    values: { userId, role: 'EDITOR', locked: false },
    fieldErrors: {},
    message: null,
  };
}

function loginForm(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

describe('password whitespace consistency across create, update and login', () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [EMAIL, SPACED_EMAIL] } } });
  });

  it('logs in with the exact password entered at creation', async () => {
    await createUser(emptyCreateState(), createForm(EMAIL, PASSWORD));
    await loginAction({}, loginForm(EMAIL, PASSWORD));

    expect(redirect).toHaveBeenCalled();
  });

  it('logs in with the exact password entered at update', async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true } });
    expect(user).toBeTruthy();

    await saveUserAccess(
      emptyAccessState(user!.id),
      (() => {
        const formData = new FormData();
        formData.set('userId', user!.id);
        formData.set('role', 'EDITOR');
        formData.set('password', UPDATED_PASSWORD);
        return formData;
      })(),
    );
    vi.mocked(redirect).mockClear();

    await loginAction({}, loginForm(EMAIL, UPDATED_PASSWORD));

    expect(redirect).toHaveBeenCalled();
  });

  it('rejects a create password with surrounding whitespace', async () => {
    const state = await createUser(emptyCreateState(), createForm(SPACED_EMAIL, `  ${PASSWORD}  `));

    expect(state?.fieldErrors.password).toContain(WHITESPACE_MESSAGE);
    expect(await prisma.user.findUnique({ where: { email: SPACED_EMAIL } })).toBeNull();
  });

  it('rejects an update password with surrounding whitespace', async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true } });
    expect(user).toBeTruthy();

    const formData = new FormData();
    formData.set('userId', user!.id);
    formData.set('role', 'EDITOR');
    formData.set('password', `  ${UPDATED_PASSWORD}  `);
    const state = await saveUserAccess(emptyAccessState(user!.id), formData);

    expect(state?.fieldErrors.password).toContain(WHITESPACE_MESSAGE);
  });

  it('rejects a login password with surrounding whitespace using the same clear message', async () => {
    const state = await loginAction({}, loginForm(EMAIL, `  ${UPDATED_PASSWORD}  `));

    expect(state).toEqual({ error: WHITESPACE_MESSAGE });
    expect(redirect).not.toHaveBeenCalled();
  });
});
