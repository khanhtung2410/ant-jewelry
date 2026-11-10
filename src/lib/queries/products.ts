import type { Product, ProductStatus, ProductType } from '@/types/domain';
import { products } from '@/lib/mock/products';

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

/**
 * Returns products for storefront pages. `type` is also the category filter
 * because ProductType and Category are one concept. Hidden products are
 * excluded unless `includeHidden` is set explicitly for an admin screen.
 */
export function getProducts(query: GetProductsQuery = {}): Product[] {
  const { type, status, includeHidden = false, sort } = query;

  const result = products.filter((product) => {
    if (type && product.type !== type) {
      return false;
    }

    if (status) {
      return product.status === status;
    }

    return includeHidden || product.status === 'VISIBLE';
  });

  const sorted = sort ? sortProducts(result, sort) : result;

  return sorted.map((product) => structuredClone(product));
}

export function getProductBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Product | null {
  const product = products.find(
    (item) => item.slug === slug && (options.includeHidden || item.status === 'VISIBLE'),
  );

  return product ? structuredClone(product) : null;
}

export function getProductById(
  productId: string,
  options: { includeHidden?: boolean } = {},
): Product | null {
  const product = products.find(
    (item) => item.product_id === productId && (options.includeHidden || item.status === 'VISIBLE'),
  );

  return product ? structuredClone(product) : null;
}

export function getRelatedProducts(productId: string, limit = 4): Product[] {
  const current = products.find((product) => product.product_id === productId);

  if (!current) {
    return [];
  }

  return products
    .filter(
      (product) =>
        product.type === current.type &&
        product.product_id !== productId &&
        product.status === 'VISIBLE',
    )
    .slice(0, limit)
    .map((product) => structuredClone(product));
}
