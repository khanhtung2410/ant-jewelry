import type { Settings } from '@/features/shared/domain/domain';
import { prisma } from '@/features/shared/db/prisma';

/**
 * Returns storefront contact settings (phone, Facebook, Instagram, address).
 */
export async function getSettings(): Promise<Settings> {
  'use cache';
  const record = await prisma.setting.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!record) {
    return {
      siteName: 'AN JEWELRY',
      phone: '',
      facebookUrl: '',
      instagramUrl: '',
      address: '',
      email: '',
    };
  }

  return {
    siteName: record.siteName,
    phone: record.phone,
    facebookUrl: record.facebookUrl,
    instagramUrl: record.instagramUrl,
    address: record.address,
    email: record.email,
  };
}
