import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupportedProductImage } from '../lib/product-image-validation';

const storageKeySegmentPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const contentTypeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export class InvalidProductImageStorageKeyError extends Error {}
export class StoredProductImageNotFoundError extends Error {}

export function getProductImageUploadRoot(): string {
  const configured = process.env.PRODUCT_IMAGE_UPLOAD_DIR?.trim();
  return path.resolve(configured || path.join(process.cwd(), 'uploads'));
}

function resolveStoredImagePath(storageKey: string): string {
  const segments = storageKey.split('/');
  if (
    segments.length !== 3 ||
    segments[0] !== 'products' ||
    !segments.every((segment) => storageKeySegmentPattern.test(segment))
  ) {
    throw new InvalidProductImageStorageKeyError('Invalid product image storage key.');
  }

  const root = getProductImageUploadRoot();
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    throw new InvalidProductImageStorageKeyError('Invalid product image storage key.');
  }
  return filePath;
}

export async function uploadProductImage(
  productId: string,
  image: Uint8Array,
  type: SupportedProductImage,
): Promise<{ storageKey: string; url: string }> {
  const storageKey = `products/${productId}/${randomUUID()}.${type.extension}`;
  const filePath = resolveStoredImagePath(storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, image, { flag: 'wx' });
  return { storageKey, url: `/uploads/${storageKey}` };
}

export async function deleteStoredProductImage(storageKey: string): Promise<void> {
  const filePath = resolveStoredImagePath(storageKey);
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

export async function readStoredProductImage(
  storageKey: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const filePath = resolveStoredImagePath(storageKey);
  const contentType = contentTypeByExtension[path.extname(filePath).slice(1).toLowerCase()];
  if (!contentType) {
    throw new StoredProductImageNotFoundError('Unsupported product image type.');
  }

  try {
    return { bytes: new Uint8Array(await readFile(filePath)), contentType };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new StoredProductImageNotFoundError('Product image not found.');
    }
    throw error;
  }
}
