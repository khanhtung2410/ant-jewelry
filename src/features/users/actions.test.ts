import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/features/shared/db/prisma';
import { BCRYPT_COST } from '@/features/shared/lib/password';
import type { CreateUserFormState, UserAccessFormState } from './actions';

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

const { saveUserAccess, createUser } = await import('./actions');

const EMAIL = 'session-version-test@antjewelry.local';
const OLD_PASSWORD = 'OldPass@123';
const NEW_PASSWORD = 'NewPass@123';
const DUPLICATE_EMAIL = 'duplicate-create-test@antjewelry.local';
const STALE_EMAIL = 'stale-access-test@antjewelry.local';
const CREATE_PASSWORD = 'CreatePass@123';
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

function emptyCreateState(): CreateUserFormState {
  return {
    values: { name: '', email: '', role: '' },
    fieldErrors: {},
    message: null,
  };
}

function createUserForm(email: string): FormData {
  const formData = new FormData();
  formData.set('name', 'Duplicate test user');
  formData.set('email', email);
  formData.set('password', CREATE_PASSWORD);
  formData.set('role', 'EDITOR');
  return formData;
}

describe('saveUserAccess session version', () => {
  let userId: string;

  beforeAll(async () => {
    oldPasswordHash = await bcrypt.hash(OLD_PASSWORD, BCRYPT_COST);
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

describe('saveUserAccess last-active-ADMIN invariant', () => {
  const emailA = 'last-admin-a@antjewelry.local';
  const emailB = 'last-admin-b@antjewelry.local';
  let adminA: string;

  async function makeAdmin(email: string): Promise<string> {
    const user = await prisma.user.create({
      data: {
        email,
        name: email,
        passwordHash: oldPasswordHash,
        role: 'ADMIN',
        locked: false,
      },
      select: { id: true },
    });
    return user.id;
  }

  // The guard counts every active ADMIN in the DB, including seed accounts.
  // Temporarily lock pre-existing ones so adminA is genuinely the last one.
  let otherActiveAdmins: string[] = [];

  beforeAll(async () => {
    const existing = await prisma.user.findMany({
      where: { role: 'ADMIN', locked: false },
      select: { id: true },
    });
    otherActiveAdmins = existing.map((user) => user.id);
    if (otherActiveAdmins.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: otherActiveAdmins } },
        data: { locked: true },
      });
    }
    adminA = await makeAdmin(emailA);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
    if (otherActiveAdmins.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: otherActiveAdmins } },
        data: { locked: false },
      });
    }
  });

  it('refuses to demote or lock the sole active ADMIN and leaves the row unchanged', async () => {
    for (const formData of [formDataFor(adminA, 'EDITOR'), formDataFor(adminA, 'ADMIN', true)]) {
      const state = await saveUserAccess(accessState(adminA, 'ADMIN'), formData);

      expect(state.fieldErrors.form?.[0]).toMatch(/at least one active admin/i);
      const stored = await prisma.user.findUnique({
        where: { id: adminA },
        select: { role: true, locked: true },
      });
      expect(stored).toEqual({ role: 'ADMIN', locked: false });
    }
  });

  it('allows demotion while another active ADMIN remains', async () => {
    await makeAdmin(emailB);

    await saveUserAccess(accessState(adminA, 'ADMIN'), formDataFor(adminA, 'EDITOR'));

    const stored = await prisma.user.findUnique({
      where: { id: adminA },
      select: { role: true },
    });
    expect(stored?.role).toBe('EDITOR');
  });
});

describe('createUser duplicate email', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: DUPLICATE_EMAIL } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: DUPLICATE_EMAIL } });
  });

  it('returns a friendly field error and leaves a single row', async () => {
    await createUser(emptyCreateState(), createUserForm(DUPLICATE_EMAIL));

    const state = await createUser(
      emptyCreateState(),
      createUserForm(`  ${DUPLICATE_EMAIL.toUpperCase()}  `),
    );

    expect(state.fieldErrors.email).toContain('This email address is already in use.');
    expect(await prisma.user.count({ where: { email: DUPLICATE_EMAIL } })).toBe(1);
  });
});

describe('saveUserAccess with a deleted user', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: STALE_EMAIL } });
  });

  it('returns a friendly form error instead of throwing', async () => {
    const hash = await bcrypt.hash('StalePass@123', BCRYPT_COST);
    const user = await prisma.user.create({
      data: {
        email: STALE_EMAIL,
        name: 'Stale user',
        passwordHash: hash,
        role: 'EDITOR',
        locked: false,
      },
      select: { id: true },
    });
    await prisma.user.delete({ where: { id: user.id } });

    const state = await saveUserAccess(
      accessState(user.id, 'EDITOR'),
      formDataFor(user.id, 'ADMIN'),
    );

    expect(state.fieldErrors.form?.[0]).toMatch(/no longer exists/i);
  });
});

describe('saveUserAccess serializable retry loop', () => {
  const userId = 'retry-loop-test-user';

  function conflictError(): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: 'test',
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries a P2034 conflict twice and succeeds on the third attempt', async () => {
    const transactionSpy = vi
      .spyOn(prisma, '$transaction')
      .mockRejectedValueOnce(conflictError())
      .mockRejectedValueOnce(conflictError())
      .mockResolvedValueOnce(undefined as never);

    await saveUserAccess(accessState(userId, 'EDITOR'), formDataFor(userId, 'ADMIN'));

    expect(transactionSpy).toHaveBeenCalledTimes(3);
    expect(transactionSpy).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('does not retry a non-retryable error', async () => {
    const transactionSpy = vi
      .spyOn(prisma, '$transaction')
      .mockRejectedValueOnce(new Error('permission denied'));

    await expect(
      saveUserAccess(accessState(userId, 'EDITOR'), formDataFor(userId, 'ADMIN')),
    ).rejects.toThrow('permission denied');

    expect(transactionSpy).toHaveBeenCalledTimes(1);
  });
});
