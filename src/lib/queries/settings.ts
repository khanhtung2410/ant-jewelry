import type { Settings } from '@/types/domain';
import { prisma } from '@/lib/prisma';

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
