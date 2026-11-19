import sharp from 'sharp';

export const MAX_STORED_IMAGE_DIMENSION = 1600;
export const STORED_IMAGE_BUDGET_BYTES = 380 * 1024;

/**
 * Single resize/encode path used by uploads and the one-off legacy migration.
 * Normal photos keep 1600px/q82; unusually noisy images are stepped down until
 * they fit the per-image budget (protects mobile LCP on 4G).
 */
export async function resizeToStoredWebp(image) {
  const targets = [
    { dimension: 1600, quality: 82 },
    { dimension: 1280, quality: 78 },
    { dimension: 1024, quality: 75 },
    { dimension: 800, quality: 70 },
    { dimension: 640, quality: 65 },
  ];
  let last = Buffer.alloc(0);
  for (const { dimension, quality } of targets) {
    // Bound decoded pixels: a tiny compressed file can declare a huge IHDR and
    // exhaust Function memory before resize. 16MP is well above our 1600px target.
    last = await sharp(image, { limitInputPixels: 16_000_000 })
      .rotate()
      .resize({
        width: dimension,
        height: dimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
    if (last.length <= STORED_IMAGE_BUDGET_BYTES) return last;
  }
  return last;
}
