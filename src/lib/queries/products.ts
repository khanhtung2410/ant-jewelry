import type { Product, ProductStatus, ProductType } from '@/types/domain';
import { products } from '@/lib/mock/products';

export type ProductSort = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

export interface GetProductsQuery {
  type?: ProductType;
  status?: ProductStatus;
  includeHidden?: boolean;
  sort?: ProductSort;
}

function compareProducts(sort: ProductSort | undefined): (a: Product, b: Product) => number {
  switch (sort) {
    case 'price_asc':
      return (a, b) => a.price - b.price;
    case 'price_desc':
      return (a, b) => b.price - a.price;
    case 'name_asc':
      return (a, b) => a.name.localeCompare(b.name, 'vi');
    case 'name_desc':
      return (a, b) => b.name.localeCompare(a.name, 'vi');
    default:
      return () => 0;
  }
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

  return result.sort(compareProducts(sort)).map((product) => structuredClone(product));
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
