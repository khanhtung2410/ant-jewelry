import type {
  Product,
  ProductColor,
  ProductImage,
  ProductStatus,
  ProductType,
} from '@/features/shared/domain/domain';
import { createVndPrice } from '@/features/shared/domain/domain';
import { prisma } from '@/features/shared/db/prisma';

export type ProductSort = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
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
  type?: ProductType;
  status?: ProductStatus;
  includeHidden?: boolean;
  sort?: ProductSort;
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

const productInclude = {
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
  name: true,
  slug: true,
  price: true,
  status: true,
  type: true,
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
  name: string;
  slug: string;
  brand?: string;
  type: string;
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
    name: record.name,
    slug: record.slug,
    brand: record.brand ?? '',
    type: record.type as ProductType,
    description: record.description ?? '',
    details,
    colors: record.colors.map((color) => mapColor(color as DbProductColor)),
    images: sharedImages,
    price: createVndPrice(record.price),
    status: record.status,
  };
}

function toWhere(query: GetProductsQuery) {
  return {
    ...(query.type ? { type: query.type } : {}),
    ...(query.status
      ? { status: query.status }
      : query.includeHidden
        ? {}
        : { status: 'VISIBLE' as const }),
  };
}

/**
 * Returns products for storefront pages. `type` is also the category filter
 * because ProductType and Category are one concept. Hidden products are
 * excluded unless `includeHidden` is set explicitly for an admin screen.
 */
export async function getProducts(query: GetProductsQuery = {}): Promise<Product[]> {
  'use cache';
  const records = await prisma.product.findMany({
    where: toWhere(query),
    include: productInclude,
  });

  const mapped = records.map((record) => mapProduct(record as unknown as DbProduct));
  return query.sort ? sortProducts(mapped, query.sort) : mapped;
}

export async function getProductBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<Product | null> {
  'use cache';
  const record = await prisma.product.findFirst({
    where: {
      slug,
      ...(options.includeHidden ? {} : { status: 'VISIBLE' }),
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
  const record = await prisma.product.findFirst({
    where: {
      id: productId,
      ...(options.includeHidden ? {} : { status: 'VISIBLE' }),
    },
    include: productInclude,
  });

  return record ? mapProduct(record as unknown as DbProduct) : null;
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
  'use cache';
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, type: true },
  });

  if (!current) {
    return [];
  }

  const records = await prisma.product.findMany({
    where: {
      type: current.type,
      id: { not: productId },
      status: 'VISIBLE',
    },
    include: productInclude,
    take: limit,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  return records.map((record) => mapProduct(record as unknown as DbProduct));
}

export async function getProductsByCategoryTypes(
  types: ProductType[],
  options: { includeHidden?: boolean } = {},
): Promise<Product[]> {
  'use cache';
  if (types.length === 0) {
    return [];
  }

  const records = await prisma.product.findMany({
    where: {
      type: { in: types },
      ...(options.includeHidden ? {} : { status: 'VISIBLE' }),
    },
    select: productCardSelect,
  });

  return records.map((record) => mapProduct(record as unknown as DbProduct));
}
