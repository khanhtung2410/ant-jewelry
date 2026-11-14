'use server';

import { z } from 'zod';
import type { ProductCardData } from '@/features/shared/domain/domain';
import {
  MAX_PRODUCT_CARD_PAGE_SIZE,
  PRODUCT_CARD_PAGE_SIZE,
} from '@/features/products/lib/product-card-page';
import { PRODUCT_SORTS } from '@/features/products/queries/products';
import { getProductsByCategorySlug } from '@/features/products/queries/categories';

const loadMoreCategoryProductsSchema = z.object({
  categorySlug: z.string().trim().min(1).max(200),
  sort: z.enum(PRODUCT_SORTS),
  offset: z.number().int().min(0).max(100_000),
  limit: z.number().int().min(1).max(MAX_PRODUCT_CARD_PAGE_SIZE).optional(),
});

export type LoadMoreCategoryProductsInput = z.input<typeof loadMoreCategoryProductsSchema>;

export interface LoadMoreCategoryProductsResult {
  products: ProductCardData[];
  hasMore: boolean;
}

const EMPTY_PAGE: LoadMoreCategoryProductsResult = { products: [], hasMore: false };

/**
 * Server-side pagination for the category "SEE MORE" button. The input comes
 * from the browser, so it is validated before it reaches the query layer.
 */
export async function loadMoreCategoryProducts(
  input: LoadMoreCategoryProductsInput,
): Promise<LoadMoreCategoryProductsResult> {
  const parsed = loadMoreCategoryProductsSchema.safeParse(input);
  if (!parsed.success) {
    return EMPTY_PAGE;
  }

  return getProductsByCategorySlug(parsed.data.categorySlug, {
    sort: parsed.data.sort,
    offset: parsed.data.offset,
    limit: parsed.data.limit ?? PRODUCT_CARD_PAGE_SIZE,
  });
}
