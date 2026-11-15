import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getProductRevalidationPaths } from './product-image-cleanup';

const PRODUCTS_CACHE_TAG = 'products';

type RevalidateProductPagesOptions = {
  /**
   * Route Handlers cannot call `updateTag`, so they must expire the tag
   * immediately instead of serving stale data while it revalidates.
   */
  immediate?: boolean;
};

export function revalidateProductPages({
  immediate = false,
}: RevalidateProductPagesOptions = {}): void {
  revalidateTag(PRODUCTS_CACHE_TAG, immediate ? { expire: 0 } : 'max');
  for (const [path, type] of getProductRevalidationPaths()) {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  }
}
