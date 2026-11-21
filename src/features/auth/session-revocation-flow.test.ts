import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/features/shared/db/prisma';
import { BCRYPT_COST } from '@/features/shared/lib/password';
import type { UserAccessFormState } from '@/features/users/actions';

// Only the framework request inputs are faked. Session tokens, cookie option
// validation, Prisma and saveUserAccess itself all run for real.
const cookieState = vi.hoisted(() => ({ token: '' as string, set: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'aj_admin_session' ? { value: cookieState.token } : undefined),
    set: cookieState.set,
  }),
}));
vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { getAdminSession } = await import('./session');
const { readValidatedSession } = await import('./cookie');
const { createSessionToken } = await import('./session-token');
const { saveUserAccess } = await import('@/features/users/actions');

const SECRET = 'revocation-flow-secret';
const ADMIN_EMAIL = 'revocation-flow-admin@antjewelry.local';
const EDITOR_EMAIL = 'revocation-flow-editor@antjewelry.local';
const PASSWORD = 'Revocation@123';
const NEW_PASSWORD = 'FreshPass@123';

const originalSecret = process.env.AUTH_SECRET;
let adminId: string;
let editorId: string;
let adminToken: string;
let oldEditorToken: string;

function accessState(
  userId: string,
  role: 'ADMIN' | 'EDITOR',
  locked = false,
): UserAccessFormState {
  return {
    values: { userId, role, locked },
    fieldErrors: {},
    message: null,
  };
}

function accessForm(
  userId: string,
  role: 'ADMIN' | 'EDITOR',
  locked = false,
  password?: string,
): FormData {
  const formData = new FormData();
  formData.set('userId', userId);
  formData.set('role', role);
  if (locked) formData.set('locked', 'on');
  if (password) formData.set('password', password);
  return formData;
}

function cookieStoreWith(token: string) {
  return {
    get: (name: string) => (name === 'aj_admin_session' ? { value: token } : undefined),
  };
}

describe('ADMIN access changes revoke an issued session', () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = SECRET;
    const hash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: 'Revocation admin',
        passwordHash: hash,
        role: 'ADMIN',
        locked: false,
      },
      select: { id: true },
    });
    const editor = await prisma.user.create({
      data: {
        email: EDITOR_EMAIL,
        name: 'Revocation editor',
        passwordHash: hash,
        role: 'EDITOR',
        locked: false,
      },
      select: { id: true },
    });
    adminId = admin.id;
    editorId = editor.id;
    adminToken = createSessionToken(
      {
        userId: admin.id,
        email: ADMIN_EMAIL,
        role: 'ADMIN',
        name: 'Revocation admin',
        sessionVersion: 0,
      },
      SECRET,
    );
    oldEditorToken = createSessionToken(
      {
        userId: editor.id,
        email: EDITOR_EMAIL,
        role: 'EDITOR',
        name: 'Revocation editor',
        sessionVersion: 0,
      },
      SECRET,
    );
  });

  beforeEach(async () => {
    await prisma.user.update({
      where: { id: editorId },
      data: { role: 'EDITOR', locked: false, sessionVersion: 0 },
    });
    cookieState.set.mockClear();
    vi.mocked(redirect).mockClear();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, EDITOR_EMAIL] } } });
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  it('invalidates an issued session when the role changes', async () => {
    cookieState.token = oldEditorToken;
    // The token itself is still signed and valid; revocation is a DB check.
    expect(readValidatedSession(cookieStoreWith(oldEditorToken), SECRET)).toMatchObject({
      userId: editorId,
      sessionVersion: 0,
    });
    await expect(getAdminSession()).resolves.toMatchObject({ userId: editorId, role: 'EDITOR' });

    cookieState.token = adminToken;
    await expect(getAdminSession()).resolves.toMatchObject({ userId: adminId, role: 'ADMIN' });
    await saveUserAccess(accessState(editorId, 'EDITOR'), accessForm(editorId, 'ADMIN'));

    expect(
      await prisma.user.findUnique({
        where: { id: editorId },
        select: { role: true, sessionVersion: true },
      }),
    ).toEqual({ role: 'ADMIN', sessionVersion: 1 });

    cookieState.token = oldEditorToken;
    await expect(getAdminSession()).resolves.toBeNull();

    const freshToken = createSessionToken(
      {
        userId: editorId,
        email: EDITOR_EMAIL,
        role: 'ADMIN',
        name: 'Revocation editor',
        sessionVersion: 1,
      },
      SECRET,
    );
    cookieState.token = freshToken;
    await expect(getAdminSession()).resolves.toMatchObject({
      userId: editorId,
      role: 'ADMIN',
      sessionVersion: 1,
    });
  });

  it('invalidates an issued session when the password changes', async () => {
    cookieState.token = oldEditorToken;
    await expect(getAdminSession()).resolves.toMatchObject({ sessionVersion: 0 });

    cookieState.token = adminToken;
    await saveUserAccess(
      accessState(editorId, 'EDITOR'),
      accessForm(editorId, 'EDITOR', false, NEW_PASSWORD),
    );

    const stored = await prisma.user.findUnique({
      where: { id: editorId },
      select: { passwordHash: true, sessionVersion: true },
    });
    expect(stored?.sessionVersion).toBe(1);
    await expect(bcrypt.compare(PASSWORD, stored!.passwordHash)).resolves.toBe(false);
    await expect(bcrypt.compare(NEW_PASSWORD, stored!.passwordHash)).resolves.toBe(true);

    cookieState.token = oldEditorToken;
    await expect(getAdminSession()).resolves.toBeNull();

    const freshToken = createSessionToken(
      {
        userId: editorId,
        email: EDITOR_EMAIL,
        role: 'EDITOR',
        name: 'Revocation editor',
        sessionVersion: 1,
      },
      SECRET,
    );
    cookieState.token = freshToken;
    await expect(getAdminSession()).resolves.toMatchObject({
      userId: editorId,
      sessionVersion: 1,
    });
  });

  it('invalidates an issued session when the account is locked', async () => {
    cookieState.token = oldEditorToken;
    await expect(getAdminSession()).resolves.toMatchObject({ sessionVersion: 0 });

    cookieState.token = adminToken;
    await saveUserAccess(accessState(editorId, 'EDITOR'), accessForm(editorId, 'EDITOR', true));

    expect(
      await prisma.user.findUnique({
        where: { id: editorId },
        select: { locked: true, sessionVersion: true },
      }),
    ).toEqual({ locked: true, sessionVersion: 1 });

    cookieState.token = oldEditorToken;
    await expect(getAdminSession()).resolves.toBeNull();

    // A correctly versioned token still cannot resurrect a locked account.
    const freshToken = createSessionToken(
      {
        userId: editorId,
        email: EDITOR_EMAIL,
        role: 'EDITOR',
        name: 'Revocation editor',
        sessionVersion: 1,
      },
      SECRET,
    );
    cookieState.token = freshToken;
    await expect(getAdminSession()).resolves.toBeNull();
  });
});
