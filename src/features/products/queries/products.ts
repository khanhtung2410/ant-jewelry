/* eslint-disable @typescript-eslint/no-explicit-any */
import { cacheTag } from 'next/cache';
import type {
  Product,
  ProductCardData,
  ProductColor,
  ProductImage,
  ProductStatus,
  ProductType,
} from '@/features/shared/domain/domain';
import { createVndPrice } from '@/features/shared/domain/domain';
import { visibilityStatus } from '@/constants/statuses';
import { prisma } from '@/features/shared/db/prisma';
import { MAX_PRODUCT_CARD_PAGE_SIZE, PRODUCT_CARD_PAGE_SIZE } from '../lib/product-card-page';

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

export const PRODUCT_SORTS = ['price_asc', 'price_desc', 'name_asc', 'name_desc'] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];
export const DEFAULT_PRODUCT_SORT: ProductSort = 'price_asc';

export function parseProductSort(value: string | string[] | undefined): ProductSort {
  if (typeof value !== 'string') {
    return DEFAULT_PRODUCT_SORT;
  }

  return PRODUCT_SORTS.includes(value as ProductSort)
    ? (value as ProductSort)
    : DEFAULT_PRODUCT_SORT;
}

export type GetProductsQuery = {
  category?: ProductType;
  visibleOnly?: boolean;
  sort?: ProductSort;
  limit?: number;
};

export type ProductCardPage = {
  products: ProductCardData[];
  hasMore: boolean;
};

export type GetProductCardPageQuery = {
  categoryId: string;
  sort?: ProductSort;
  offset?: number;
  limit?: number;
};

function mapImage(record: {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isFront: boolean;
  isHover: boolean;
  productColorId: string | null;
}): ProductImage {
  return {
    imageId: record.id,
    url: record.url,
    alt: record.alt,
    sortOrder: record.sortOrder,
    isFront: record.isFront,
    isHover: record.isHover,
    productColorId: record.productColorId ?? undefined,
  };
}

function mapColor(record: {
  id: string;
  name: string;
  hex: string;
  images?: {
    id: string;
    url: string;
    alt: string;
    sortOrder: number;
    isFront: boolean;
    isHover: boolean;
    productColorId: string | null;
  }[];
}): ProductColor {
  return {
    color_id: record.id,
    name: record.name,
    hex: record.hex,
    ...(record.images ? { images: record.images.map(mapImage) } : {}),
  };
}

function mapProduct(record: {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  description: string;
  details: unknown;
  status: ProductStatus;
  category: { type: string; status: 'VISIBLE' | 'HIDDEN' };
  colors: {
    id: string;
    name: string;
    hex: string;
    images?: {
      id: string;
      url: string;
      alt: string;
      sortOrder: number;
      isFront: boolean;
      isHover: boolean;
      productColorId: string | null;
    }[];
  }[];
  images: {
    id: string;
    url: string;
    alt: string;
    sortOrder: number;
    isFront: boolean;
    isHover: boolean;
    productColorId: string | null;
  }[];
}): Product {
  return {
    product_id: record.id,
    categoryId: record.categoryId,
    type: record.category.type as ProductType,
    name: record.name,
    slug: record.slug,
    brand: record.brand,
    price: createVndPrice(record.price),
    description: record.description,
    details: (record.details ?? {}) as Record<string, string>,
    status: record.status,
    colors: record.colors.map(mapColor),
    images: record.images.map(mapImage),
  };
}

function getVisibleCategoryWhere(visibleOnly: boolean) {
  return visibleOnly ? { status: visibilityStatus.VISIBLE } : {};
}

export function getProductOrderBy(sort: ProductSort): Array<Record<string, 'asc' | 'desc'>> {
  switch (sort) {
    case 'price_desc':
      return [{ price: 'desc' }, { name: 'asc' }];
    case 'name_asc':
      return [{ name: 'asc' }];
    case 'name_desc':
      return [{ name: 'desc' }];
    case 'price_asc':
    default:
      return [{ price: 'asc' }, { name: 'asc' }];
  }
}

export function getStorefrontProductOrderBy(): Array<Record<string, 'asc' | 'desc'>> {
  return getProductOrderBy(DEFAULT_PRODUCT_SORT);
}

export function sortProducts<T extends Pick<Product, 'name' | 'price'>>(
  products: T[],
  sort: ProductSort,
): T[] {
  const sorted = [...products];

  sorted.sort((left, right) => {
    switch (sort) {
      case 'price_desc':
        return right.price - left.price || left.name.localeCompare(right.name, 'vi');
      case 'name_asc':
        return left.name.localeCompare(right.name, 'vi');
      case 'name_desc':
        return right.name.localeCompare(left.name, 'vi');
      case 'price_asc':
      default:
        return left.price - right.price || left.name.localeCompare(right.name, 'vi');
    }
  });

  return sorted;
}

export async function getProducts(query: GetProductsQuery = {}): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  const sort = query.sort ?? 'price_asc';
  const visibleOnly = query.visibleOnly ?? !query.category;

  try {
    let q = prisma.orm.public.Product as any;
    const where: Record<string, unknown> = {
      ...(query.category
        ? { category: { type: query.category, ...getVisibleCategoryWhere(true) } }
        : {}),
      ...(visibleOnly ? { status: visibilityStatus.VISIBLE } : {}),
      ...(!query.category && visibleOnly ? { category: getVisibleCategoryWhere(true) } : {}),
    };
    // apply where if not empty
    if (Object.keys(where).length > 0) q = q.where(where);

    q = q
      .include('category')
      .include('colors', (colors: any) =>
        colors
          .orderBy((c: any) => c.createdAt.asc())
          .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc())),
      )
      .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc()));

    const order = getProductOrderBy(sort);
    q = q.orderBy(
      order.map((o) => (p: any) => {
        const [key, dir] = Object.entries(o)[0] as [string, 'asc' | 'desc'];
        return p[key][dir]();
      }),
    );

    if (typeof query.limit === 'number') q = q.limit(query.limit);

    const records = await q.all();
    return records.map(mapProduct);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getProductCardPage(query: GetProductCardPageQuery): Promise<ProductCardPage> {
  'use cache';
  cacheTag('products');
  const sort = query.sort ?? DEFAULT_PRODUCT_SORT;
  const limit = Math.min(
    Math.max(query.limit ?? PRODUCT_CARD_PAGE_SIZE, 1),
    MAX_PRODUCT_CARD_PAGE_SIZE,
  );
  const offset = Math.max(query.offset ?? 0, 0);

  try {
    let q = (prisma.orm.public.Product as any)
      .where({
        categoryId: query.categoryId,
        status: visibilityStatus.VISIBLE,
        category: { status: visibilityStatus.VISIBLE },
      })
      .include('category')
      .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc()));

    const order = getProductOrderBy(sort);
    q = q.orderBy(
      order.map((o) => (p: any) => {
        const [key, dir] = Object.entries(o)[0] as [string, 'asc' | 'desc'];
        return p[key][dir]();
      }),
    );

    // fetch limit+1 to detect hasMore; offset via skip-like behavior not guaranteed in ORM - fallback to all+slice if needed
    let records: any[];
    try {
      records = (await q.limit(limit + 1).offset)
        ? await q
            .offset(offset)
            .limit(limit + 1)
            .all()
        : await q.all();
    } catch {
      records = await q.all();
    }
    if (!Array.isArray(records)) records = [];
    if (records.length > limit + 1 || (offset > 0 && records.length > limit)) {
      // already sliced by db
    } else if (offset > 0) {
      records = records.slice(offset, offset + limit + 1);
    }

    const hasMore = records.length > limit;
    const page = records.slice(0, limit);

    return {
      hasMore,
      products: page.map((record: any) => ({
        product_id: record.id,
        name: record.name,
        slug: record.slug,
        brand: record.brand,
        price: createVndPrice(record.price),
        colors: (record.colors ?? []).map(mapColor),
        images: record.images.map(mapImage),
      })),
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { products: [], hasMore: false };
    }
    throw error;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  'use cache';
  cacheTag('products');
  try {
    const record = await (prisma.orm.public.Product as any)
      .where({
        slug,
        status: visibilityStatus.VISIBLE,
        category: { status: visibilityStatus.VISIBLE },
      })
      .include('category')
      .include('colors', (colors: any) =>
        colors
          .orderBy((c: any) => c.createdAt.asc())
          .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc())),
      )
      .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc()))
      .first();

    return record ? mapProduct(record) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getProductById(
  productId: string,
  options: { includeHidden?: boolean } = {},
): Promise<Product | null> {
  'use cache';
  cacheTag('products');
  try {
    const visibleOnly = !options.includeHidden;
    let q = (prisma.orm.public.Product as any).where({ id: productId });
    if (visibleOnly) {
      q = q.where({
        status: visibilityStatus.VISIBLE,
        category: { status: visibilityStatus.VISIBLE },
      });
    }
    const record = await q
      .include('category')
      .include('colors', (colors: any) =>
        colors
          .orderBy((c: any) => c.createdAt.asc())
          .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc())),
      )
      .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc()))
      .first();

    return record ? mapProduct(record) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getProductsByCategoryId(
  categoryId: string,
  options: { includeHidden?: boolean; limit?: number } = {},
): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  try {
    const visibleOnly = !options.includeHidden;
    let q = (prisma.orm.public.Product as any).where({ categoryId });
    if (visibleOnly) {
      q = q.where({
        status: visibilityStatus.VISIBLE,
        category: { status: visibilityStatus.VISIBLE },
      });
    }
    q = q
      .include('category')
      .include('colors', (colors: any) =>
        colors
          .orderBy((c: any) => c.createdAt.asc())
          .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc())),
      )
      .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc()))
      .orderBy([(p: any) => p.price.asc(), (p: any) => p.name.asc()]);
    if (typeof options.limit === 'number') q = q.limit(options.limit);
    const records = await q.all();
    return records.map(mapProduct);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getRelatedProducts(
  productId: string,
  options: { limit?: number } = {},
): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  try {
    const product = await getProductById(productId);
    if (!product) {
      return [];
    }

    let q = (prisma.orm.public.Product as any)
      .where({
        categoryId: product.categoryId,
        status: visibilityStatus.VISIBLE,
        category: { status: visibilityStatus.VISIBLE },
      })
      .where((p: any) => p.id.neq(productId))
      .include('category')
      .include('colors', (colors: any) =>
        colors
          .orderBy((c: any) => c.createdAt.asc())
          .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc())),
      )
      .include('images', (images: any) => images.orderBy((i: any) => i.sortOrder.asc()))
      .orderBy([(p: any) => p.price.asc(), (p: any) => p.name.asc()]);

    if (typeof options.limit === 'number') q = q.limit(options.limit);
    const records = await q.all();
    return records.map(mapProduct);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}
