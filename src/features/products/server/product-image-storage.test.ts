import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { prisma } from '@/features/shared/db/prisma';
import {
  InvalidProductImageError,
  InvalidProductImageStorageKeyError,
  StoredProductImageNotFoundError,
  deleteStoredProductImage,
  readStoredProductImage,
  uploadProductImage,
} from './product-image-storage';

const originalUploadDir = process.env.PRODUCT_IMAGE_UPLOAD_DIR;
let tempDir: string | undefined;
const createdKeys: string[] = [];

beforeEach(() => {
  createdKeys.length = 0;
});

afterEach(async () => {
  await prisma.productImageBlob.deleteMany({ where: { storageKey: { in: createdKeys } } });
  if (originalUploadDir === undefined) delete process.env.PRODUCT_IMAGE_UPLOAD_DIR;
  else process.env.PRODUCT_IMAGE_UPLOAD_DIR = originalUploadDir;
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('database-backed local product image storage', () => {
  it('resizes, stores, reads and deletes image bytes in the database', async () => {
    const bytes = await sharp({
      create: { width: 2000, height: 2000, channels: 3, background: '#b8860b' },
    })
      .png()
      .toBuffer();

    const stored = await uploadProductImage('product-1', bytes);
    createdKeys.push(stored.storageKey);

    expect(stored.storageKey).toMatch(/^products\/product-1\/.+\.webp$/);
    expect(stored.url).toBe(`/uploads/${stored.storageKey}`);

    const blob = await prisma.productImageBlob.findUnique({
      where: { storageKey: stored.storageKey },
    });
    expect(blob?.contentType).toBe('image/webp');
    expect(blob?.etag).toBe(createHash('sha256').update(blob!.bytes).digest('hex'));
    const metadata = await sharp(blob!.bytes).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBeLessThanOrEqual(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);

    await expect(readStoredProductImage(stored.storageKey)).resolves.toEqual({
      bytes: new Uint8Array(blob!.bytes),
      contentType: 'image/webp',
    });

    await deleteStoredProductImage(stored.storageKey);
    await expect(readStoredProductImage(stored.storageKey)).rejects.toBeInstanceOf(
      StoredProductImageNotFoundError,
    );
  });

  it('reports a corrupt image as InvalidProductImageError, not a raw sharp failure', async () => {
    // PNG signature + IHDR tag (passes detectProductImageType) but no valid
    // image data, so sharp throws while decoding.
    const corrupt = new Uint8Array(40);
    corrupt.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    corrupt.set([0x49, 0x48, 0x44, 0x52], 12);

    await expect(uploadProductImage('product-1', corrupt)).rejects.toBeInstanceOf(
      InvalidProductImageError,
    );
  });

  it('treats deleting a missing key as success', async () => {
    await expect(
      deleteStoredProductImage('products/product-1/missing.webp'),
    ).resolves.toBeUndefined();
  });

  it('rejects invalid storage keys', async () => {
    await expect(readStoredProductImage('../secrets.txt')).rejects.toBeInstanceOf(
      InvalidProductImageStorageKeyError,
    );
    await expect(deleteStoredProductImage('products/../../etc/passwd')).rejects.toBeInstanceOf(
      InvalidProductImageStorageKeyError,
    );
  });

  it('still reads legacy files written by the old filesystem storage', async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'ant-jewelry-uploads-'));
    process.env.PRODUCT_IMAGE_UPLOAD_DIR = tempDir;
    const key = 'products/product-1/legacy.webp';
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await mkdir(path.join(tempDir, 'products', 'product-1'), { recursive: true });
    await writeFile(path.join(tempDir, ...key.split('/')), bytes);

    await expect(readStoredProductImage(key)).resolves.toEqual({
      bytes,
      contentType: 'image/webp',
    });
    await deleteStoredProductImage(key);
  });
});
