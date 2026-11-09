import type { Category, Product, ProductType } from '@/types/domain';
import { categories } from '@/lib/mock/categories';
import { getProducts, type GetProductsQuery } from './products';

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

export function getCategoryByType(
  type: ProductType,
  options: { includeHidden?: boolean } = {},
): Category | null {
  const category = categories.find(
    (item) => item.type === type && (options.includeHidden || item.status === 'VISIBLE'),
  );

  return category ? structuredClone(category) : null;
}

/**
 * Category pages filter products by the category's ProductType, because
 * ProductType and Category are one concept.
 */
export function getProductsByCategorySlug(
  slug: string,
  query: Omit<GetProductsQuery, 'type'> = {},
): Product[] {
  const category = getCategoryBySlug(slug);

  return category ? getProducts({ ...query, type: category.type }) : [];
}
