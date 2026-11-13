import {
  InvalidProductImageStorageKeyError,
  StoredProductImageNotFoundError,
  readStoredProductImage,
} from '@/features/products/server/local-image-storage';

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;

  try {
    const { bytes, contentType } = await readStoredProductImage(segments.join('/'));
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
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
