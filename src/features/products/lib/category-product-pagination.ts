import type { ProductCardData } from '@/features/shared/domain/domain';

/**
 * Appends a fetched page to the cards already shown by a category listing.
 * Duplicate ids are ignored so a re-fetch or an overlapping page can never
 * render the same product twice.
 */
export function appendProductCardPage(
  current: ProductCardData[],
  next: ProductCardData[],
): ProductCardData[] {
  const seen = new Set(current.map((product) => product.product_id));
  const added = next.filter((product) => {
    if (seen.has(product.product_id)) {
      return false;
    }
    seen.add(product.product_id);
    return true;
  });

  return [...current, ...added];
}
