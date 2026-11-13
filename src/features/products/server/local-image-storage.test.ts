import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  InvalidProductImageStorageKeyError,
  StoredProductImageNotFoundError,
  deleteStoredProductImage,
  readStoredProductImage,
  uploadProductImage,
} from './local-image-storage';

const originalUploadDir = process.env.PRODUCT_IMAGE_UPLOAD_DIR;
let tempDir: string | undefined;

afterEach(async () => {
  if (originalUploadDir === undefined) {
    delete process.env.PRODUCT_IMAGE_UPLOAD_DIR;
  } else {
    process.env.PRODUCT_IMAGE_UPLOAD_DIR = originalUploadDir;
  }
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

async function useTempUploadDir() {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'ant-jewelry-uploads-'));
  process.env.PRODUCT_IMAGE_UPLOAD_DIR = tempDir;
  return tempDir;
}

describe('local product image storage', () => {
  it('uploads, reads and deletes an image file', async () => {
    const dir = await useTempUploadDir();
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    const stored = await uploadProductImage('product-1', bytes, {
      contentType: 'image/png',
      extension: 'png',
    });

    expect(stored.storageKey).toMatch(/^products\/product-1\/.+\.png$/);
    expect(stored.url).toBe(`/uploads/${stored.storageKey}`);

    const filePath = path.join(dir, 'products', 'product-1', path.basename(stored.storageKey));
    await expect(stat(filePath)).resolves.toBeTruthy();

    await expect(readStoredProductImage(stored.storageKey)).resolves.toEqual({
      bytes,
      contentType: 'image/png',
    });

    await deleteStoredProductImage(stored.storageKey);
    await expect(readStoredProductImage(stored.storageKey)).rejects.toBeInstanceOf(
      StoredProductImageNotFoundError,
    );
  });

  it('treats deleting a missing file as success', async () => {
    await useTempUploadDir();
    await expect(
      deleteStoredProductImage('products/product-1/missing.webp'),
    ).resolves.toBeUndefined();
  });

  it('rejects invalid storage keys', async () => {
    await useTempUploadDir();
    await expect(readStoredProductImage('../secrets.txt')).rejects.toBeInstanceOf(
      InvalidProductImageStorageKeyError,
    );
    await expect(deleteStoredProductImage('products/../../etc/passwd')).rejects.toBeInstanceOf(
      InvalidProductImageStorageKeyError,
    );
  });
});
