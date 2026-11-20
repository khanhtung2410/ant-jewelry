import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  MAX_STORED_IMAGE_DIMENSION,
  STORED_IMAGE_BUDGET_BYTES,
  resizeToStoredWebp,
} from './product-image-processing';

describe('resizeToStoredWebp', () => {
  it('encodes a large PNG as a bounded WebP', async () => {
    const input = await sharp({
      create: { width: 2400, height: 1800, channels: 3, background: '#b8860b' },
    })
      .png()
      .toBuffer();

    const output = await resizeToStoredWebp(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBeLessThanOrEqual(MAX_STORED_IMAGE_DIMENSION);
    expect(metadata.height).toBeLessThanOrEqual(MAX_STORED_IMAGE_DIMENSION);
    expect(output.length).toBeLessThanOrEqual(STORED_IMAGE_BUDGET_BYTES);
  });
});
