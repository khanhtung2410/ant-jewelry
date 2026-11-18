import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/features/shared/db/prisma';
import {
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
  it('uploads, reads and deletes image bytes in the database', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    const stored = await uploadProductImage('product-1', bytes, {
      contentType: 'image/png',
      extension: 'png',
    });
    createdKeys.push(stored.storageKey);

    expect(stored.storageKey).toMatch(/^products\/product-1\/.+\.png$/);
    expect(stored.url).toBe(`/uploads/${stored.storageKey}`);

    const blob = await prisma.productImageBlob.findUnique({
      where: { storageKey: stored.storageKey },
    });
    expect(blob?.contentType).toBe('image/png');
    expect(new Uint8Array(blob!.bytes)).toEqual(bytes);

    await expect(readStoredProductImage(stored.storageKey)).resolves.toEqual({
      bytes,
      contentType: 'image/png',
    });

    await deleteStoredProductImage(stored.storageKey);
    await expect(readStoredProductImage(stored.storageKey)).rejects.toBeInstanceOf(
      StoredProductImageNotFoundError,
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
