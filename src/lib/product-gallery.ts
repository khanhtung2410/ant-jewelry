import type { Product, ProductImage } from '@/types/domain';

export const GALLERY_THUMBNAIL_COUNT = 3;

/**
 * Returns the gallery for a colour. Colours without their own photos share the
 * product-level gallery, which keeps every swatch usable.
 */
export function getGalleryImages(product: Product, colorId?: string): ProductImage[] {
  const color = colorId ? product.colors.find((item) => item.colorId === colorId) : undefined;

  return color?.images?.length ? color.images : product.images;
}

/**
 * Keeps the active image inside the visible thumbnail window while clamping
 * the window to the start and end of the gallery.
 */
export function getThumbnailWindowStart(
  activeIndex: number,
  currentStart: number,
  total: number,
  size = GALLERY_THUMBNAIL_COUNT,
): number {
  if (total <= 0 || size <= 0) {
    return 0;
  }

  const maxStart = Math.max(0, total - size);
  const safeActive = Math.min(Math.max(activeIndex, 0), total - 1);
  let start = Math.min(Math.max(currentStart, 0), maxStart);

  if (safeActive < start) {
    start = safeActive;
  } else if (safeActive >= start + size) {
    start = safeActive - size + 1;
  }

  return Math.min(Math.max(start, 0), maxStart);
}
