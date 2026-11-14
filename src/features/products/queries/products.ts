import { cacheTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
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

export const PRODUCT_SORTS = ['price_asc', 'price_desc', 'name_asc', 'name_desc'] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];
export const DEFAULT_PRODUCT_SORT: ProductSort = 'price_asc';

export function parseProductSort(value: string | string[] | undefined): ProductSort {
  if (typeof value !== 'string') {
    return DEFAULT_PRODUCT_SORT;
  }

  switch (value) {
    case 'price_asc':
    case 'price_desc':
    case 'name_asc':
    case 'name_desc':
      return value;
    default:
      return DEFAULT_PRODUCT_SORT;
  }
}

export interface GetProductsQuery {
  categoryId?: string;
  status?: ProductStatus;
  includeHidden?: boolean;
  sort?: ProductSort;
}

export interface GetProductCardPageQuery {
  categoryId: string;
  sort?: ProductSort;
  offset?: number;
  limit?: number;
}

export interface ProductCardPage {
  products: ProductCardData[];
  hasMore: boolean;
}

function compareProducts(sort: ProductSort | undefined): (a: Product, b: Product) => number {
  const compareById = (a: Product, b: Product) => a.product_id.localeCompare(b.product_id);

  switch (sort) {
    case 'price_asc':
      return (a, b) => a.price - b.price || compareById(a, b);
    case 'price_desc':
      return (a, b) => b.price - a.price || compareById(a, b);
    case 'name_asc':
      return (a, b) => a.name.localeCompare(b.name, 'vi') || compareById(a, b);
    case 'name_desc':
      return (a, b) => b.name.localeCompare(a.name, 'vi') || compareById(a, b);
    default:
      return () => 0;
  }
}

export function sortProducts(products: Product[], sort: ProductSort): Product[] {
  return [...products].sort(compareProducts(sort));
}

/**
 * Database ordering for product lists. `id` is always the secondary key, so
 * pagination never repeats or skips products that share the same price or name.
 */
export function getProductOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }, { id: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { id: 'asc' }];
    case 'name_asc':
      return [{ name: 'asc' }, { id: 'asc' }];
    case 'name_desc':
      return [{ name: 'desc' }, { id: 'asc' }];
  }
}

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  colors: {
    include: {
      images: {
        orderBy: { sortOrder: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

const productCardSelect = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
  price: true,
  status: true,
  category: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  colors: {
    select: {
      id: true,
      name: true,
      hex: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  images: {
    select: {
      id: true,
      url: true,
      alt: true,
      isFront: true,
      isHover: true,
      sortOrder: true,
      productColorId: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

type DbProductImage = {
  id: string;
  url: string;
  alt: string;
  isFront: boolean;
  isHover?: boolean;
  sortOrder: number;
  productColorId?: string | null;
};

type DbProductColor = {
  id: string;
  name: string;
  hex: string;
  images?: DbProductImage[];
};

type DbProduct = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  brand?: string;
  category: { id: string; name: string; type: string };
  description?: string;
  details?: unknown;
  price: number;
  status: ProductStatus;
  colors: DbProductColor[];
  images: DbProductImage[];
};

function mapImage(image: DbProductImage): ProductImage {
  return {
    imageId: image.id,
    url: image.url,
    alt: image.alt,
    isFront: image.isFront,
    isHover: image.isHover ?? false,
    sortOrder: image.sortOrder,
  };
}

function mapColor(color: DbProductColor): ProductColor {
  const images = (color.images ?? []).map(mapImage);
  return {
    colorId: color.id,
    name: color.name,
    hex: color.hex,
    ...(images.length > 0 ? { images } : {}),
  };
}

function mapProduct(record: DbProduct): Product {
  const sharedImages = record.images.filter((image) => image.productColorId == null).map(mapImage);
  const details =
    record.details && typeof record.details === 'object' && !Array.isArray(record.details)
      ? (record.details as Record<string, string>)
      : {};

  return {
    product_id: record.id,
    categoryId: record.categoryId,
    name: record.name,
    slug: record.slug,
    brand: record.brand ?? '',
    type: record.category.type as ProductType,
    description: record.description ?? '',
    details,
    colors: record.colors.map((color) => mapColor(color as DbProductColor)),
    images: sharedImages,
    price: createVndPrice(record.price),
    status: record.status,
  };
}

type DbProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  colors: DbProductColor[];
  images: DbProductImage[];
};

function mapProductCard(record: DbProductCard): ProductCardData {
  return {
    product_id: record.id,
    name: record.name,
    slug: record.slug,
    price: createVndPrice(record.price),
    colors: record.colors.map((color) => mapColor(color as DbProductColor)),
    images: record.images
      .filter((image) => image.productColorId == null)
      .map((image) => mapImage(image)),
  };
}

/**
 * Products inherit the visibility of their category: hiding a category removes
 * its products from every storefront query without changing the product rows.
 * Admin screens opt out with `includeHidden`.
 */
function visibleCategoryWhere(includeHidden?: boolean) {
  return includeHidden ? {} : { category: { status: visibilityStatus.VISIBLE } };
}

function toWhere(query: GetProductsQuery) {
  return {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.status
      ? { status: query.status }
      : query.includeHidden
        ? {}
        : { status: visibilityStatus.VISIBLE }),
    ...visibleCategoryWhere(query.includeHidden),
  };
}

/**
 * Returns products for storefront pages. Products link to their category by
 * `categoryId`; the product type is derived from that category.
 * Hidden products are excluded unless `includeHidden` is set explicitly for an
 * admin screen.
 */
export async function getProducts(query: GetProductsQuery = {}): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  const records = await prisma.product.findMany({
    where: toWhere(query),
    include: productInclude,
  });

  const mapped = records.map((record) => mapProduct(record as unknown as DbProduct));
  return query.sort ? sortProducts(mapped, query.sort) : mapped;
}

/**
 * Returns one product-card page for a category. Sorting and pagination run in
 * the database, and only the columns needed by `ProductCard` are selected and
 * mapped, so descriptions and details never leave the server.
 */
export async function getProductCardPage(query: GetProductCardPageQuery): Promise<ProductCardPage> {
  'use cache';
  cacheTag('products');
  const limit = Math.min(
    Math.max(query.limit ?? PRODUCT_CARD_PAGE_SIZE, 1),
    MAX_PRODUCT_CARD_PAGE_SIZE,
  );
  const offset = Math.max(query.offset ?? 0, 0);

  const records = await prisma.product.findMany({
    where: {
      categoryId: query.categoryId,
      status: visibilityStatus.VISIBLE,
      category: { status: visibilityStatus.VISIBLE },
    },
    select: productCardSelect,
    orderBy: getProductOrderBy(query.sort ?? DEFAULT_PRODUCT_SORT),
    skip: offset,
    take: limit + 1,
  });

  return {
    products: records
      .slice(0, limit)
      .map((record) => mapProductCard(record as unknown as DbProductCard)),
    hasMore: records.length > limit,
  };
}

export async function getProductBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<Product | null> {
  'use cache';
  cacheTag('products');
  const record = await prisma.product.findFirst({
    where: {
      slug,
      ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
      ...visibleCategoryWhere(options.includeHidden),
    },
    include: productInclude,
  });

  return record ? mapProduct(record as unknown as DbProduct) : null;
}

export async function getProductById(
  productId: string,
  options: { includeHidden?: boolean } = {},
): Promise<Product | null> {
  'use cache';
  cacheTag('products');
  const record = await prisma.product.findFirst({
    where: {
      id: productId,
      ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
      ...visibleCategoryWhere(options.includeHidden),
    },
    include: productInclude,
  });

  return record ? mapProduct(record as unknown as DbProduct) : null;
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true },
  });

  if (!current) {
    return [];
  }

  const records = await prisma.product.findMany({
    where: {
      categoryId: current.categoryId,
      id: { not: productId },
      status: visibilityStatus.VISIBLE,
      category: { status: visibilityStatus.VISIBLE },
    },
    include: productInclude,
    take: limit,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  return records.map((record) => mapProduct(record as unknown as DbProduct));
}

export async function getProductsByCategoryIds(
  categoryIds: string[],
  options: { includeHidden?: boolean } = {},
): Promise<Product[]> {
  'use cache';
  cacheTag('products');
  if (categoryIds.length === 0) {
    return [];
  }

  const records = await prisma.product.findMany({
    where: {
      categoryId: { in: categoryIds },
      ...(options.includeHidden ? {} : { status: visibilityStatus.VISIBLE }),
      ...visibleCategoryWhere(options.includeHidden),
    },
    select: productCardSelect,
  });

  return records.map((record) => mapProduct(record as unknown as DbProduct));
}
