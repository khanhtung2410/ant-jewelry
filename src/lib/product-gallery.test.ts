import { describe, expect, it } from 'vitest';
import { getProductBySlug } from '@/lib/queries';
import { getGalleryImages, getThumbnailWindowStart } from './product-gallery';

const aurora = getProductBySlug('aurora-band');

describe('getGalleryImages', () => {
  it('uses the colour gallery when the colour has its own images', () => {
    const images = getGalleryImages(aurora!, 'color-gold-18k');

    expect(images).toHaveLength(4);
    expect(images.map((image) => image.url)).toEqual([
      '/mock/products/aurora-band-gold-1.svg',
      '/mock/products/aurora-band-gold-2.svg',
      '/mock/products/aurora-band-gold-3.svg',
      '/mock/products/aurora-band-gold-4.svg',
    ]);
    expect(images.map((image) => image.isFront)).toEqual([true, false, false, false]);
  });

  it('falls back to the shared gallery when a colour has no images', () => {
    const images = getGalleryImages(aurora!, 'color-white-gold-18k');

    expect(images).toEqual(aurora!.images);
  });

  it('falls back to the shared gallery for an unknown or missing colour', () => {
    expect(getGalleryImages(aurora!, 'missing-colour')).toEqual(aurora!.images);
    expect(getGalleryImages(aurora!)).toEqual(aurora!.images);
  });
});

describe('getThumbnailWindowStart', () => {
  it('keeps the active image inside the three-slot window', () => {
    expect(getThumbnailWindowStart(0, 0, 4)).toBe(0);
    expect(getThumbnailWindowStart(2, 0, 4)).toBe(0);
    expect(getThumbnailWindowStart(3, 0, 4)).toBe(1);
  });

  it('moves the window back when the active image is before it', () => {
    expect(getThumbnailWindowStart(0, 2, 6)).toBe(0);
    expect(getThumbnailWindowStart(3, 5, 8)).toBe(3);
  });

  it('clamps short and empty galleries', () => {
    expect(getThumbnailWindowStart(0, 0, 2)).toBe(0);
    expect(getThumbnailWindowStart(1, 0, 1)).toBe(0);
    expect(getThumbnailWindowStart(4, 4, 0)).toBe(0);
  });
});
