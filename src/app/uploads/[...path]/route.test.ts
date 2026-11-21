import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const bytes = new Uint8Array([1, 2, 3, 4]);
const hash = createHash('sha256').update(bytes).digest('hex');
const etag = `"${hash}"`;

const mocks = vi.hoisted(() => ({
  readStoredProductImage: vi.fn(),
  getStoredProductImageMeta: vi.fn(),
  InvalidProductImageStorageKeyError: class InvalidProductImageStorageKeyError extends Error {},
  StoredProductImageNotFoundError: class StoredProductImageNotFoundError extends Error {},
}));

vi.mock(import('@/features/products/server/product-image-storage'), async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/products/server/product-image-storage')>();
  return {
    ...actual,
    readStoredProductImage: mocks.readStoredProductImage,
    getStoredProductImageMeta: mocks.getStoredProductImageMeta,
    InvalidProductImageStorageKeyError: mocks.InvalidProductImageStorageKeyError,
    StoredProductImageNotFoundError: mocks.StoredProductImageNotFoundError,
  };
});

const { GET } = await import('./route');

const context = { params: Promise.resolve({ path: ['products', 'p-1', 'cover.webp'] }) };

describe('GET /uploads/[...path]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds an immutable CDN cache header and a content ETag', async () => {
    mocks.getStoredProductImageMeta.mockResolvedValueOnce(null);
    mocks.readStoredProductImage.mockResolvedValueOnce({ bytes, contentType: 'image/webp' });

    const response = await GET(new Request('http://localhost/uploads/test'), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=31536000');
    expect(response.headers.get('etag')).toBe(etag);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it('returns 304 from stored metadata without reading the blob', async () => {
    mocks.getStoredProductImageMeta.mockResolvedValue({ contentType: 'image/webp', etag: hash });
    mocks.readStoredProductImage.mockClear();

    const response = await GET(
      new Request('http://localhost/uploads/test', { headers: { 'if-none-match': etag } }),
      context,
    );

    expect(response.status).toBe(304);
    expect(response.headers.get('etag')).toBe(etag);
    expect(mocks.readStoredProductImage).not.toHaveBeenCalled();
  });

  it('falls back to a binary content type for a 304 on a row with an empty content type', async () => {
    mocks.getStoredProductImageMeta.mockResolvedValueOnce({ contentType: '', etag: hash });

    const response = await GET(
      new Request('http://localhost/uploads/test', { headers: { 'if-none-match': etag } }),
      context,
    );

    expect(response.status).toBe(304);
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
  });

  it('accepts weak, comma-separated and wildcard If-None-Match values', async () => {
    mocks.getStoredProductImageMeta.mockResolvedValue({ contentType: 'image/webp', etag: hash });

    for (const header of ['*', `W/${etag}`, `"other", ${etag}`, `W/"other", W/${etag}`]) {
      const response = await GET(
        new Request('http://localhost/uploads/test', { headers: { 'if-none-match': header } }),
        context,
      );
      expect(response.status).toBe(304);
    }
  });

  it('returns 404 when the stored image is not found', async () => {
    mocks.getStoredProductImageMeta.mockResolvedValueOnce(null);
    mocks.readStoredProductImage.mockRejectedValueOnce(
      new mocks.StoredProductImageNotFoundError('missing blob'),
    );

    const response = await GET(new Request('http://localhost/uploads/test'), context);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });

  it('returns 404 when the storage key is invalid', async () => {
    mocks.getStoredProductImageMeta.mockRejectedValueOnce(
      new mocks.InvalidProductImageStorageKeyError('bad key'),
    );

    const response = await GET(new Request('http://localhost/uploads/test'), context);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
    expect(mocks.readStoredProductImage).not.toHaveBeenCalled();
  });
});
