/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HeroSlide } from '@/features/shared/domain/domain';
import { visibilityStatus } from '@/constants/statuses';
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
 * Returns visible hero slides ordered by `sortOrder`.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  'use cache';
  try {
    const records = await prisma.orm.public.HeroSlide.where({ status: visibilityStatus.VISIBLE })
      .orderBy((slide: any) => slide.sortOrder.asc())
      .all();

    return records.map((record: any) => ({
      slide_id: record.id,
      imageUrl: record.imageUrl,
      alt: record.alt,
      title: record.title,
      subtitle: record.subtitle,
      linkUrl: record.linkUrl,
      sortOrder: record.sortOrder,
      status: record.status,
    }));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}
