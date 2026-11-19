import { imageConfigDefault } from 'next/dist/shared/lib/image-config';
import { ImageOptimizerCache } from 'next/dist/server/image-optimizer.js';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

// Next 16 injects `localPatterns: [{ pathname: '**', search: '' }]` into the
// runtime config during build. Model that default here so the test sees the
// same validation the production server performs.
const runtimeConfig = {
  images: {
    ...imageConfigDefault,
    localPatterns: [{ pathname: '**', search: '' }],
    ...nextConfig.images,
  },
} as Parameters<typeof ImageOptimizerCache.validateParams>[2];

describe('local image optimizer config', () => {
  it('accepts local image URLs that carry a query string', async () => {
    for (const url of ['/mock/products/ring-6.webp?v=2', '/uploads/products/p-1/cover.webp?v=2']) {
      const result = await ImageOptimizerCache.validateParams(
        { headers: { accept: 'image/webp' } } as Parameters<
          typeof ImageOptimizerCache.validateParams
        >[0],
        { url, w: '256', q: '75' },
        runtimeConfig,
        false,
      );

      expect('errorMessage' in result ? result.errorMessage : undefined, url).toBeUndefined();
    }
  });
});
