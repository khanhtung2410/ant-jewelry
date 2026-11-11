import type { HeroSlide } from '@/types/domain';
import { prisma } from '@/lib/prisma';

/**
 * Returns visible hero slides ordered by `sortOrder`.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  'use cache';
  const records = await prisma.heroSlide.findMany({
    where: { status: 'VISIBLE' },
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
}
