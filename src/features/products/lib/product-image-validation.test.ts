import { describe, expect, it } from 'vitest';
import { detectProductImageType, MAX_PRODUCT_IMAGE_SIZE } from './product-image-validation';

describe('product image validation', () => {
  it('recognizes supported image signatures from bytes', () => {
    expect(detectProductImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toEqual({
      contentType: 'image/jpeg',
      extension: 'jpg',
    });

    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    png.set([0x49, 0x48, 0x44, 0x52], 12);
    expect(detectProductImageType(png)).toEqual({ contentType: 'image/png', extension: 'png' });

    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46]);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(detectProductImageType(webp)).toEqual({
      contentType: 'image/webp',
      extension: 'webp',
    });
  });

  it('rejects unsupported or truncated file signatures', () => {
    expect(detectProductImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
    expect(detectProductImageType(new TextEncoder().encode('<svg />'))).toBeNull();
  });

  it('sets the per-file size limit to 5 MiB', () => {
    expect(MAX_PRODUCT_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });
});
