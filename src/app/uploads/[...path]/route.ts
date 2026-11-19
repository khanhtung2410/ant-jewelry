import {
  InvalidProductImageStorageKeyError,
  StoredProductImageNotFoundError,
  getStoredProductImageMeta,
  imageEtag,
  readStoredProductImage,
} from '@/features/products/server/product-image-storage';

const CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';
const formatEtag = (hash: string) => `"${hash}"`;

/** Handles W/"..." weak validators and comma-separated If-None-Match lists. */
function etagMatches(header: string | null, etag: string): boolean {
  if (!header) return false;
  return header.split(',').some((value) => value.trim().replace(/^W\//, '') === etag);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;
  const key = segments.join('/');
  const ifNoneMatch = request.headers.get('if-none-match');

  try {
    const meta = await getStoredProductImageMeta(key);
    const storedHash = meta?.etag ?? null;
    // With a stored hash, a conditional hit returns 304 without loading bytes.
    if (storedHash && etagMatches(ifNoneMatch, formatEtag(storedHash))) {
      return new Response(null, {
        status: 304,
        headers: {
          'Content-Type': meta?.contentType ?? 'application/octet-stream',
          'Cache-Control': CACHE_CONTROL,
          ETag: formatEtag(storedHash),
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const { bytes, contentType } = await readStoredProductImage(key);
    const etag = formatEtag(storedHash ?? imageEtag(bytes));
    const headers = {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': CACHE_CONTROL,
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    };

    if (etagMatches(ifNoneMatch, etag)) {
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
