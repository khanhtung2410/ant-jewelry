/* eslint-disable @typescript-eslint/no-explicit-any */
import { cacheTag } from 'next/cache';
import type { Category, Product, ProductType } from '@/features/shared/domain/domain';
import { visibilityStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';
import {
  getProductCardPage,
  getProductsByCategoryId,
  type ProductCardPage,
  type ProductSort,
} from './products';
import { CAROUSEL_PRODUCT_LIMIT } from '../lib/carousel-products';

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
  try {
    let query = prisma.orm.public.Category as any;
    if (!options.includeHidden) {
      query = query.where({ status: visibilityStatus.VISIBLE });
    }
    const records = await query.orderBy((c: any) => c.sortOrder.asc()).all();
    return records.map(mapCategory);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getCategoryBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<Category | null> {
  'use cache';
  try {
    let query = (prisma.orm.public.Category as any).where({ slug });
    if (!options.includeHidden) {
      query = query.where({ status: visibilityStatus.VISIBLE });
    }
    const record = await query.first();
    return record ? mapCategory(record) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getCategoryById(
  categoryId: string,
  options: { includeHidden?: boolean } = {},
): Promise<Category | null> {
  'use cache';
  try {
    let query = (prisma.orm.public.Category as any).where({ id: categoryId });
    if (!options.includeHidden) {
      query = query.where({ status: visibilityStatus.VISIBLE });
    }
    const record = await query.first();
    return record ? mapCategory(record) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getCategoryByType(
  type: ProductType,
  options: { includeHidden?: boolean } = {},
): Promise<Category | null> {
  'use cache';
  try {
    let query = (prisma.orm.public.Category as any).where({ type });
    if (!options.includeHidden) {
      query = query.where({ status: visibilityStatus.VISIBLE });
    }
    const record = await query.first();
    return record ? mapCategory(record) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

/**
 * Category pages filter products by `categoryId`, so changing a category's
 * type keeps every product assigned to that category. Only the columns needed
 * by `ProductCard` are read, and sorting/pagination are handled by the
 * database (see `getProductCardPage`).
 */
export async function getProductsByCategorySlug(
  slug: string,
  query: { sort?: ProductSort; offset?: number; limit?: number } = {},
): Promise<ProductCardPage> {
  'use cache';
  cacheTag('products');
  try {
    const category = await getCategoryBySlug(slug);
    return category
      ? getProductCardPage({ categoryId: category.category_id, ...query })
      : { products: [], hasMore: false };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { products: [], hasMore: false };
    }
    throw error;
  }
}

export async function getStorefrontCategorySections(): Promise<
  { category: Category; products: Product[] }[]
> {
  'use cache';
  cacheTag('products');
  try {
    const categories = await getCategories();

    return Promise.all(
      categories.map(async (category) => ({
        category,
        products: await getProductsByCategoryId(category.category_id, {
          limit: CAROUSEL_PRODUCT_LIMIT,
        }),
      })),
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}
