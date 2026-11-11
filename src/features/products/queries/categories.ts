import type { Category, Product, ProductType } from '@/features/shared/domain/domain';
import { prisma } from '@/features/shared/db/prisma';
import { getProducts, getProductsByCategoryTypes, type GetProductsQuery } from './products';

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
    where: options.includeHidden ? {} : { status: 'VISIBLE' },
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
      ...(options.includeHidden ? {} : { status: 'VISIBLE' }),
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
      ...(options.includeHidden ? {} : { status: 'VISIBLE' }),
    },
  });

  return record ? mapCategory(record) : null;
}

/**
 * Category pages filter products by the category's ProductType, because
 * ProductType and Category are one concept.
 */
export async function getProductsByCategorySlug(
  slug: string,
  query: Omit<GetProductsQuery, 'type'> = {},
): Promise<Product[]> {
  'use cache';
  const category = await getCategoryBySlug(slug);
  return category ? getProducts({ ...query, type: category.type }) : [];
}

export async function getStorefrontCategorySections(): Promise<
  { category: Category; products: Product[] }[]
> {
  'use cache';
  const categories = await getCategories();
  const products = await getProductsByCategoryTypes(categories.map((category) => category.type));
  const productsByType = new Map<ProductType, Product[]>();

  for (const product of products) {
    const list = productsByType.get(product.type) ?? [];
    list.push(product);
    productsByType.set(product.type, list);
  }

  return categories.map((category) => ({
    category,
    products: productsByType.get(category.type) ?? [],
  }));
}
