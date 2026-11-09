import type { Category } from '@/types/domain';
import { categories } from '@/lib/mock/categories';

/**
 * Returns categories ordered by `sortOrder`. Hidden categories are excluded
 * unless `includeHidden` is set explicitly for an admin screen.
 */
export function getCategories(options: { includeHidden?: boolean } = {}): Category[] {
  return categories
    .filter((category) => options.includeHidden || category.status === 'VISIBLE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => structuredClone(category));
}

export function getCategoryBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Category | null {
  const category = categories.find(
    (item) => item.slug === slug && (options.includeHidden || item.status === 'VISIBLE'),
  );

  return category ? structuredClone(category) : null;
}
