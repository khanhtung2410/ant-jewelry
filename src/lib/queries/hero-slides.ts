import type { HeroSlide } from '@/types/domain';
import { heroSlides } from '@/lib/mock/hero-slides';

/**
 * Returns visible hero slides ordered by `sortOrder`.
 */
export function getHeroSlides(): HeroSlide[] {
  return heroSlides
    .filter((slide) => slide.status === 'VISIBLE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((slide) => structuredClone(slide));
}
