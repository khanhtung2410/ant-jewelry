import { cacheTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import type { Category, Product, ProductType } from '@/features/shared/domain/domain';
import { visibilityStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}
import {
  getProductCardPage,
  getProductsByCategoryId,
  type ProductCardPage,
  type ProductSort,
} from './products';
import { CAROUSEL_PRODUCT_LIMIT } from '../lib/carousel-products';

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
    const records = await prisma.category.findMany({
      where: options.includeHidden ? {} : { status: visibilityStatus.VISIBLE },
      orderBy: { sortOrder: 'asc' },
    });

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
    const record = await prisma.category.findFirst({
      where: {
        slug,
        ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
      },
    });

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
    const record = await prisma.category.findFirst({
      where: {
        id: categoryId,
        ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
      },
    });

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
    const record = await prisma.category.findFirst({
      where: {
        type,
        ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
      },
    });

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
