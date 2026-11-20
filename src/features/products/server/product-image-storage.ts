import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { resizeToStoredWebp } from './product-image-processing';
import { prisma } from '@/features/shared/db/prisma';

const storageKeySegmentPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const contentTypeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export class InvalidProductImageStorageKeyError extends Error {}
export class StoredProductImageNotFoundError extends Error {}
/** Thrown when magic bytes pass but sharp cannot decode the file. */
export class InvalidProductImageError extends Error {}

function normalizeStorageKey(storageKey: string): string {
  const segments = storageKey.split('/').filter(Boolean);
  if (
    segments.length !== 3 ||
    segments[0] !== 'products' ||
    !segments.every((segment) => storageKeySegmentPattern.test(segment))
  ) {
    throw new InvalidProductImageStorageKeyError('Invalid product image storage key.');
  }
  return segments.join('/');
}

export function getProductImageUploadRoot(): string {
  const configured = process.env.PRODUCT_IMAGE_UPLOAD_DIR?.trim();
  // Kept only for reading/deleting images uploaded by older filesystem-based
  // versions. New uploads are stored in the database.
  return path.resolve(/*turbopackIgnore: true*/ configured || path.join(process.cwd(), 'uploads'));
}

function resolveLegacyImagePath(storageKey: string): string {
  const key = normalizeStorageKey(storageKey);
  const root = getProductImageUploadRoot();
  const filePath = path.resolve(root, ...key.split('/'));
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    throw new InvalidProductImageStorageKeyError('Invalid product image storage key.');
  }
  return filePath;
}

function isMissingFile(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT';
}

/**
 * Uploaded bytes live in the application database, not on the server
 * filesystem. On Vercel `cwd/uploads` is read-only and `/tmp` is ephemeral,
 * while the database is durable across redeploys and instances.
 */
export async function uploadProductImage(
  productId: string,
  image: Uint8Array,
): Promise<{ storageKey: string; url: string }> {
  // Store a bounded WebP so the file can be served directly from /uploads
  // without the Next.js image optimizer (which can fail on Vercel cold starts).
  // Magic-byte checks cannot detect a truncated/corrupt payload. Surface a
  // distinct error so the route can answer 415 instead of a misleading 500.
  const bytes = await resizeToStoredWebp(image).catch((error: unknown) => {
    throw new InvalidProductImageError('The uploaded image is corrupt or unsupported.', {
      cause: error,
    });
  });
  const storageKey = normalizeStorageKey(`products/${productId}/${randomUUID()}.webp`);
  await prisma.productImageBlob.create({
    data: { storageKey, bytes, contentType: 'image/webp', etag: imageEtag(bytes) },
  });
  return { storageKey, url: `/uploads/${storageKey}` };
}

/** SHA-256 hex without quotes, stored on the blob and used for conditional GETs. */
export function imageEtag(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Lightweight metadata read so a matching If-None-Match never loads the blob. */
export async function getStoredProductImageMeta(
  storageKey: string,
): Promise<{ contentType: string; etag: string | null } | null> {
  const key = normalizeStorageKey(storageKey);
  const row = await prisma.productImageBlob.findUnique({
    where: { storageKey: key },
    select: { contentType: true, etag: true },
  });
  return row ?? null;
}

export async function deleteStoredProductImage(storageKey: string): Promise<void> {
  const key = normalizeStorageKey(storageKey);
  await prisma.productImageBlob.deleteMany({ where: { storageKey: key } });

  // Best-effort cleanup of a legacy filesystem copy, if one exists.
  try {
    await unlink(resolveLegacyImagePath(key));
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }
}

export async function readStoredProductImage(
  storageKey: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const key = normalizeStorageKey(storageKey);
  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  const fallbackContentType = contentTypeByExtension[extension];
  if (!fallbackContentType) {
    throw new StoredProductImageNotFoundError('Unsupported product image type.');
  }

  const blob = await prisma.productImageBlob.findUnique({ where: { storageKey: key } });
  if (blob) {
    return {
      bytes: new Uint8Array(blob.bytes),
      contentType: blob.contentType || fallbackContentType,
    };
  }

  // Legacy images written before the database-backed storage change.
  try {
    return {
      bytes: new Uint8Array(await readFile(resolveLegacyImagePath(key))),
      contentType: fallbackContentType,
    };
  } catch (error) {
    if (isMissingFile(error)) {
      throw new StoredProductImageNotFoundError('Product image not found.');
    }
    throw error;
  }
}
