import { createHash } from 'node:crypto';
import {
  InvalidProductImageStorageKeyError,
  StoredProductImageNotFoundError,
  readStoredProductImage,
} from '@/features/products/server/product-image-storage';

const CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;

  try {
    const { bytes, contentType } = await readStoredProductImage(segments.join('/'));
    // Content-addressed ETag lets the CDN answer repeat hits without invoking a
    // Function or re-reading the image blob from the database.
    const etag = `"${createHash('sha256').update(bytes).digest('hex')}"`;
    const headers = {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': CACHE_CONTROL,
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    };

    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(Buffer.from(bytes), { headers });
  } catch (error) {
    if (
      error instanceof StoredProductImageNotFoundError ||
      error instanceof InvalidProductImageStorageKeyError
    ) {
      return new Response('Not found', { status: 404 });
    }
    throw error;
  }
}
