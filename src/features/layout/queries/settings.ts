/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Settings } from '@/features/shared/domain/domain';
import { prisma } from '@/features/shared/db/prisma';

function isMissingTableError(error: unknown): boolean {
  const e = error as {
    code?: string;
    sqlState?: string;
    cause?: { code?: string; sqlState?: string };
  } | null;
  const code = e?.code ?? e?.cause?.code;
  const sqlState = e?.sqlState ?? e?.cause?.sqlState;
  return code === 'P2021' || sqlState === '42P01';
}

/**
 * Returns storefront contact settings (phone, Facebook, Instagram, address).
 */
export async function getSettings(): Promise<Settings> {
  'use cache';
  try {
    const record = await prisma.orm.public.Setting.orderBy((s: any) => s.createdAt.asc()).first();

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
