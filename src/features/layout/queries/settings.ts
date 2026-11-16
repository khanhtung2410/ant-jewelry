import { Prisma } from '@prisma/client';
import type { Settings } from '@/features/shared/domain/domain';
import { prisma } from '@/features/shared/db/prisma';

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

/**
 * Returns storefront contact settings (phone, Facebook, Instagram, address).
 */
export async function getSettings(): Promise<Settings> {
  'use cache';
  try {
    const record = await prisma.setting.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!record) {
      return {
        siteName: 'ANT JEWELRY',
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
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        siteName: 'ANT JEWELRY',
        phone: '',
        facebookUrl: '',
        instagramUrl: '',
        address: '',
        email: '',
      };
    }
    throw error;
  }
}
