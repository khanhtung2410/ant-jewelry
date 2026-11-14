import { cacheTag } from 'next/cache';
import type { Category, Product, ProductType } from '@/features/shared/domain/domain';
import { visibilityStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';
import { getProducts, getProductsByCategoryIds, type GetProductsQuery } from './products';

function mapCategory(record: {
  id: string;
  type: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: 'VISIBLE' | 'HIDDEN';
}): Category {
  return {
    category_id: record.id,
    type: record.type as ProductType,
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    status: record.status,
  };
}

/**
 * Returns categories ordered by `sortOrder`. Hidden categories are excluded
 * unless `includeHidden` is set explicitly for an admin screen.
 */
export async function getCategories(
  options: { includeHidden?: boolean } = {},
): Promise<Category[]> {
  'use cache';
  const records = await prisma.category.findMany({
    where: options.includeHidden ? {} : { status: visibilityStatus.VISIBLE },
    orderBy: { sortOrder: 'asc' },
  });

  return records.map(mapCategory);
}

export async function getCategoryBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<Category | null> {
  'use cache';
  const record = await prisma.category.findFirst({
    where: {
      slug,
      ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
    },
  });

  return record ? mapCategory(record) : null;
}

export async function getCategoryById(
  categoryId: string,
  options: { includeHidden?: boolean } = {},
): Promise<Category | null> {
  'use cache';
  const record = await prisma.category.findFirst({
    where: {
      id: categoryId,
      ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
    },
  });

  return record ? mapCategory(record) : null;
}

export async function getCategoryByType(
  type: ProductType,
  options: { includeHidden?: boolean } = {},
): Promise<Category | null> {
  'use cache';
  const record = await prisma.category.findFirst({
    where: {
      type,
      ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
    },
  });

  return record ? mapCategory(record) : null;
}

/**
 * Category pages filter products by `categoryId`, so changing a category's
 * type keeps every product assigned to that category.
 */
export async function getProductsByCategorySlug(
  slug: string,
  query: Omit<GetProductsQuery, 'categoryId'> = {},
): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  const category = await getCategoryBySlug(slug);
  return category ? getProducts({ ...query, categoryId: category.category_id }) : [];
}

export async function getStorefrontCategorySections(): Promise<
  { category: Category; products: Product[] }[]
> {
  'use cache';
  cacheTag('products');
  const categories = await getCategories();
  const products = await getProductsByCategoryIds(
    categories.map((category) => category.category_id),
  );
  const productsByCategoryId = new Map<string, Product[]>();

  for (const product of products) {
    const list = productsByCategoryId.get(product.categoryId) ?? [];
    list.push(product);
    productsByCategoryId.set(product.categoryId, list);
  }

  return categories.map((category) => ({
    category,
    products: productsByCategoryId.get(category.category_id) ?? [],
  }));
}
