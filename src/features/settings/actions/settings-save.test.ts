import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/features/shared/db/prisma';
import type { SettingsFormState } from '@/features/settings/actions';

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'admin-1',
    email: 'admin@antjewelry.local',
    name: 'Admin',
    role: 'ADMIN',
    sessionVersion: 0,
    exp: 9_999_999_999,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { saveSettings } = await import('@/features/settings/actions');

const emptyState: SettingsFormState = {
  values: {
    siteName: '',
    phone: '',
    facebookUrl: '',
    instagramUrl: '',
    address: '',
    email: '',
  },
  fieldErrors: {},
  message: null,
};

describe('saveSettings with the real database (G14)', () => {
  let original: {
    id: string;
    siteName: string;
    phone: string;
    facebookUrl: string;
    instagramUrl: string;
    address: string;
    email: string;
  };

  beforeAll(async () => {
    const row = await prisma.setting.findFirstOrThrow();
    original = {
      id: row.id,
      siteName: row.siteName,
      phone: row.phone,
      facebookUrl: row.facebookUrl,
      instagramUrl: row.instagramUrl,
      address: row.address,
      email: row.email,
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.setting.deleteMany({});
    await prisma.setting.create({
      data: {
        id: original.id,
        siteName: original.siteName,
        phone: original.phone,
        facebookUrl: original.facebookUrl,
        instagramUrl: original.instagramUrl,
        address: original.address,
        email: original.email,
      },
    });
  });

  function formDataFor(
    overrides: Partial<Record<keyof SettingsFormState['values'], string>> = {},
  ): FormData {
    const formData = new FormData();
    formData.set('siteName', overrides.siteName ?? 'ANT JEWELRY');
    formData.set('phone', overrides.phone ?? '+84 123 456 789');
    formData.set('facebookUrl', overrides.facebookUrl ?? 'https://facebook.com/ant');
    formData.set('instagramUrl', overrides.instagramUrl ?? 'https://instagram.com/ant');
    formData.set('address', overrides.address ?? '123 Main Street');
    formData.set('email', overrides.email ?? 'contact@antjewelry.local');
    return formData;
  }

  it('updates the singleton settings row with a new phone and social links and revalidates the layout', async () => {
    await expect(saveSettings(emptyState, formDataFor())).rejects.toThrow('NEXT_REDIRECT');

    const rows = await prisma.setting.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: original.id,
      phone: '+84 123 456 789',
      facebookUrl: 'https://facebook.com/ant',
      instagramUrl: 'https://instagram.com/ant',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/settings');
  });

  it('creates a single settings row when none exists', async () => {
    await prisma.setting.deleteMany({});

    await expect(saveSettings(emptyState, formDataFor({ phone: '0909 123 456' }))).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    const rows = await prisma.setting.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].phone).toBe('0909 123 456');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
