import { describe, expect, it } from 'vitest';
import { getProductBySlug } from '@/features/shared/queries';
import { getGalleryImages, getThumbnailWindowStart } from './product-gallery';

describe('getGalleryImages', () => {
  it('uses the colour gallery when the colour has its own images', async () => {
    const aurora = await getProductBySlug('aurora-band');
    expect(aurora).not.toBeNull();
    const gold = aurora!.colors.find((color) => color.hex.toUpperCase() === '#D4AF37');
    expect(gold?.images?.length).toBeGreaterThan(0);

    const images = getGalleryImages(aurora!, gold!.colorId);
    expect(images).toEqual(gold!.images);
  });

  it('falls back to the shared gallery when a colour has no images', async () => {
    const aurora = await getProductBySlug('aurora-band');
    expect(aurora).not.toBeNull();
    const withoutImages = aurora!.colors.find((color) => !color.images?.length);
    expect(withoutImages).toBeDefined();

    const images = getGalleryImages(aurora!, withoutImages!.colorId);
    expect(images).toEqual(aurora!.images);
  });

  it('falls back to the shared gallery for an unknown or missing colour', async () => {
    const aurora = await getProductBySlug('aurora-band');
    expect(aurora).not.toBeNull();

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
