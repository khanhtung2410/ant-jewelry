import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/features/shared/db/prisma';
import type { UserAccessFormState } from './actions';

vi.mock('@/features/auth/session', () => ({
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
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

const { saveUserAccess } = await import('./actions');

const EMAIL = 'session-version-test@antjewelry.local';
const OLD_PASSWORD = 'OldPass@123';
const NEW_PASSWORD = 'NewPass@123';
let oldPasswordHash: string;

function accessState(userId: string, role: 'ADMIN' | 'EDITOR', locked = false) {
  const state: UserAccessFormState = {
    values: { userId, role, locked },
    fieldErrors: {},
    message: null,
  };
  return state;
}

function formDataFor(userId: string, role: string, locked = false): FormData {
  const formData = new FormData();
  formData.set('userId', userId);
  formData.set('role', role);
  if (locked) formData.set('locked', 'on');
  return formData;
}

describe('saveUserAccess session version', () => {
  let userId: string;

  beforeAll(async () => {
    oldPasswordHash = await bcrypt.hash(OLD_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        email: EMAIL,
        name: 'Session version test',
        passwordHash: oldPasswordHash,
        role: 'EDITOR',
        locked: false,
      },
      select: { id: true },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'EDITOR',
        locked: false,
        sessionVersion: 0,
        passwordHash: oldPasswordHash,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
  });

  it('bumps the version when the role changes', async () => {
    await saveUserAccess(accessState(userId, 'EDITOR'), formDataFor(userId, 'ADMIN'));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, sessionVersion: true },
    });
    expect(user).toEqual({ role: 'ADMIN', sessionVersion: 1 });
  });

  it('does not bump the version when access is unchanged', async () => {
    await saveUserAccess(accessState(userId, 'EDITOR'), formDataFor(userId, 'EDITOR'));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    expect(user?.sessionVersion).toBe(0);
  });

  it('bumps the version when the account is locked', async () => {
    await saveUserAccess(accessState(userId, 'EDITOR'), formDataFor(userId, 'EDITOR', true));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locked: true, sessionVersion: true },
    });
    expect(user).toEqual({ locked: true, sessionVersion: 1 });
  });

  it('bumps the version and replaces the password when one is provided', async () => {
    const formData = formDataFor(userId, 'EDITOR');
    formData.set('password', NEW_PASSWORD);

    await saveUserAccess(accessState(userId, 'EDITOR'), formData);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, sessionVersion: true },
    });
    expect(user?.sessionVersion).toBe(1);
    await expect(bcrypt.compare(OLD_PASSWORD, user!.passwordHash)).resolves.toBe(false);
    await expect(bcrypt.compare(NEW_PASSWORD, user!.passwordHash)).resolves.toBe(true);
  });

  it('rejects a short password without changing access or the version', async () => {
    const formData = formDataFor(userId, 'ADMIN');
    formData.set('password', 'short');

    const state = await saveUserAccess(accessState(userId, 'EDITOR'), formData);

    expect(state.fieldErrors.password?.[0]).toMatch(/at least 8/i);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, passwordHash: true, sessionVersion: true },
    });
    expect(user?.role).toBe('EDITOR');
    expect(user?.sessionVersion).toBe(0);
    await expect(bcrypt.compare(OLD_PASSWORD, user!.passwordHash)).resolves.toBe(true);
  });

  it('runs the active-admin check and update in a serializable transaction', async () => {
    const transactionSpy = vi.spyOn(prisma, '$transaction');
    try {
      await saveUserAccess(accessState(userId, 'EDITOR'), formDataFor(userId, 'ADMIN'));

      expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      });
    } finally {
      transactionSpy.mockRestore();
    }
  });
});
