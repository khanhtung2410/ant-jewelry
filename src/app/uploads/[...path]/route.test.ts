import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readStoredProductImage: vi.fn(),
}));

vi.mock('@/features/products/server/product-image-storage', () => ({
  readStoredProductImage: mocks.readStoredProductImage,
  InvalidProductImageStorageKeyError: class InvalidProductImageStorageKeyError extends Error {},
  StoredProductImageNotFoundError: class StoredProductImageNotFoundError extends Error {},
}));

const { GET } = await import('./route');

const bytes = new Uint8Array([1, 2, 3, 4]);
const context = { params: Promise.resolve({ path: ['products', 'p-1', 'cover.webp'] }) };

describe('GET /uploads/[...path]', () => {
  it('adds an immutable CDN cache header and a content ETag', async () => {
    mocks.readStoredProductImage.mockResolvedValueOnce({ bytes, contentType: 'image/webp' });

    const response = await GET(new Request('http://localhost/uploads/test'), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=31536000');
    expect(response.headers.get('etag')).toMatch(/^"[0-9a-f]{64}"$/);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it('returns 304 when If-None-Match matches the ETag', async () => {
    mocks.readStoredProductImage.mockResolvedValue({ bytes, contentType: 'image/webp' });
    const first = await GET(new Request('http://localhost/uploads/test'), context);
    const etag = first.headers.get('etag');

    const second = await GET(
      new Request('http://localhost/uploads/test', { headers: { 'if-none-match': etag ?? '' } }),
      context,
    );

    expect(second.status).toBe(304);
    expect(second.headers.get('etag')).toBe(etag);
  });
});
