import { Prisma } from '@prisma/client';
import type { HeroSlide } from '@/features/shared/domain/domain';
import { visibilityStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

/**
 * Returns visible hero slides ordered by `sortOrder`.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  'use cache';
  try {
    const records = await prisma.heroSlide.findMany({
      where: { status: visibilityStatus.VISIBLE },
      orderBy: { sortOrder: 'asc' },
    });

    return records.map((record) => ({
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
