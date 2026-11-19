import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionToken } from './session-token';

const prismaMock = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn() }));
const cookieState = vi.hoisted(() => ({ token: '', set: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'aj_admin_session' ? { value: cookieState.token } : undefined),
    set: cookieState.set,
  }),
}));
vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    user: { findUnique: prismaMock.findUnique, updateMany: prismaMock.updateMany },
  },
}));

const { getAdminSession, revokeAdminSession } = await import('./session');

const SECRET = 'test-secret';
const baseSession = {
  userId: 'user-1',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  name: 'Admin',
};

function storedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'ADMIN',
    locked: false,
    sessionVersion: 0,
    ...overrides,
  };
}

describe('getAdminSession', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
    prismaMock.findUnique.mockReset();
    cookieState.token = createSessionToken({ ...baseSession, sessionVersion: 0 }, SECRET);
  });

  it('returns the session when the stored version matches the token', async () => {
    prismaMock.findUnique.mockResolvedValue(storedUser());

    await expect(getAdminSession()).resolves.toMatchObject({
      userId: 'user-1',
      sessionVersion: 0,
    });
  });

  it('rejects an old token after the stored session version is bumped', async () => {
    prismaMock.findUnique.mockResolvedValue(storedUser({ sessionVersion: 1 }));

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('rejects a locked account even when the version matches', async () => {
    prismaMock.findUnique.mockResolvedValue(storedUser({ locked: true }));

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('rejects a token whose user no longer exists', async () => {
    prismaMock.findUnique.mockResolvedValue(null);

    await expect(getAdminSession()).resolves.toBeNull();
  });
});

describe('revokeAdminSession', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
    prismaMock.updateMany.mockReset();
    cookieState.set.mockClear();
    // Cookie token is for sessionVersion 0, but the account has moved to 1.
    cookieState.token = createSessionToken({ ...baseSession, sessionVersion: 0 }, SECRET);
  });

  it('does not bump the stored version when presented with a stale token', async () => {
    await revokeAdminSession();

    expect(prismaMock.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', sessionVersion: 0 },
      data: { sessionVersion: { increment: 1 } },
    });
    expect(cookieState.set).toHaveBeenCalled();
  });
});
