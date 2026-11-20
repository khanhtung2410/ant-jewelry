import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/features/shared/db/prisma';
import {
  LEGACY_MIGRATION_BATCH_SIZE,
  migrateLegacyBlobs,
  reencodeLegacyBlob,
  withVersionQuery,
} from '../../scripts/reencode-legacy-uploads';

const createdKeys: string[] = [];
const createdImageIds: string[] = [];

afterEach(async () => {
  await prisma.productImage.deleteMany({ where: { id: { in: createdImageIds } } });
  await prisma.productImageBlob.deleteMany({
    where: { storageKey: { in: createdKeys } },
  });
  createdKeys.length = 0;
  createdImageIds.length = 0;
});

async function png(width = 2000, height = 2000): Promise<Uint8Array<ArrayBuffer>> {
  return (await sharp({
    create: { width, height, channels: 3, background: '#b8860b' },
  })
    .png()
    .toBuffer()) as Uint8Array<ArrayBuffer>;
}

const sha256Hex = (bytes: Uint8Array<ArrayBufferLike>) =>
  createHash('sha256').update(bytes).digest('hex');

describe('E1 legacy image re-encode', () => {
  it('turns a large PNG into WebP within 1600px and computes a sha256 etag', async () => {
    const result = await reencodeLegacyBlob(await png());

    expect(result.contentType).toBe('image/webp');
    const metadata = await sharp(result.bytes).metadata();
    expect(metadata.width).toBeLessThanOrEqual(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);
    expect(result.etag).toBe(sha256Hex(result.bytes));
  });
});

describe('versioned CDN URL', () => {
  it('adds v=2 without breaking an existing query string', () => {
    expect(withVersionQuery('/uploads/products/p-1/a.png')).toBe('/uploads/products/p-1/a.png?v=2');
    expect(withVersionQuery('/uploads/products/p-1/a.png?foo=1')).toBe(
      '/uploads/products/p-1/a.png?foo=1&v=2',
    );
    expect(withVersionQuery('/uploads/products/p-1/a.png?v=2')).toBe(
      '/uploads/products/p-1/a.png?v=2',
    );
  });

  it('busts a stale version, keeps fragments and does not truncate extra query text', () => {
    expect(withVersionQuery('/uploads/products/p-1/a.png?v=1')).toBe(
      '/uploads/products/p-1/a.png?v=2',
    );
    expect(withVersionQuery('/uploads/products/p-1/a.png#frag')).toBe(
      '/uploads/products/p-1/a.png?v=2#frag',
    );
    expect(withVersionQuery('/uploads/products/p-1/a.png?foo=x?y')).toBe(
      '/uploads/products/p-1/a.png?foo=x%3Fy&v=2',
    );
    expect(withVersionQuery(withVersionQuery('/uploads/products/p-1/a.png'))).toBe(
      '/uploads/products/p-1/a.png?v=2',
    );
  });
});

describe('B6 etag backfill', () => {
  it('backfills etag on legacy WebP blobs and re-encodes non-WebP blobs', async () => {
    const webp = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#ffffff' },
    })
      .webp()
      .toBuffer();
    const oldPng = await png();
    const webpKey = 'products/p-1/legacy-webp.webp';
    const pngKey = 'products/p-1/legacy-png.png';

    await prisma.productImageBlob.createMany({
      data: [
        { storageKey: webpKey, bytes: webp, contentType: 'image/webp', etag: null },
        { storageKey: pngKey, bytes: oldPng, contentType: 'image/png', etag: null },
      ],
    });
    createdKeys.push(webpKey, pngKey);

    await migrateLegacyBlobs(prisma, { dryRun: false });

    const afterWebp = await prisma.productImageBlob.findUnique({ where: { storageKey: webpKey } });
    const afterPng = await prisma.productImageBlob.findUnique({ where: { storageKey: pngKey } });

    expect(afterWebp?.etag).toBe(sha256Hex(webp));
    expect(afterPng?.contentType).toBe('image/webp');
    expect(afterPng?.etag).toBe(sha256Hex(afterPng!.bytes));
  });

  it('writes the blob and all URL updates in one transaction', async () => {
    const bytes = await png(400, 400);
    const blob = {
      storageKey: 'products/p-1/atomic.png',
      contentType: 'image/png',
      etag: null,
      bytes,
    };
    const image = { id: 'image-atomic', url: `/uploads/${blob.storageKey}` };
    const operations: { kind: string }[] = [];
    const transaction = vi.fn(async (ops: Promise<unknown>[]) => {
      const results = (await Promise.all(ops)) as { kind: string }[];
      operations.push(...results);
    });
    const fakePrisma = {
      productImageBlob: {
        findMany: vi.fn().mockResolvedValueOnce([blob]).mockResolvedValueOnce([]),
        update: vi.fn(async () => ({ kind: 'blob' })),
      },
      productImage: {
        findMany: vi.fn(async () => [image]),
        update: vi.fn(async () => ({ kind: 'url' })),
      },
      $transaction: transaction,
    } as unknown as PrismaClient;

    await migrateLegacyBlobs(fakePrisma, { log: () => {} });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(operations.map((op) => op.kind)).toEqual(['blob', 'url']);
  });

  it('reads blobs in bounded batches instead of loading every row at once', async () => {
    const bytes = await png(400, 400);
    const blob = {
      storageKey: 'products/p-1/batched.png',
      contentType: 'image/png',
      etag: null,
      bytes,
    };
    const findMany = vi.fn().mockResolvedValueOnce([blob]).mockResolvedValueOnce([]);
    const fakePrisma = {
      productImageBlob: { findMany, update: vi.fn(async () => ({})) },
      productImage: { findMany: vi.fn(async () => []), update: vi.fn(async () => ({})) },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    } as unknown as PrismaClient;

    await migrateLegacyBlobs(fakePrisma, { log: () => {} });

    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany.mock.calls[0][0].take).toBe(LEGACY_MIGRATION_BATCH_SIZE);
  });

  it('updates the ProductImage CDN URL when a legacy blob is re-encoded', async () => {
    const product = await prisma.product.findFirst({ select: { id: true } });
    expect(product, 'seeded product exists').toBeTruthy();

    const storageKey = 'products/p-1/legacy-with-row.png';
    await prisma.productImageBlob.create({
      data: {
        storageKey,
        bytes: await png(400, 400),
        contentType: 'image/png',
        etag: null,
      },
    });
    createdKeys.push(storageKey);

    const image = await prisma.productImage.create({
      data: {
        productId: product!.id,
        storageKey,
        url: `/uploads/${storageKey}?v=1`,
        alt: 'legacy image',
      },
    });
    createdImageIds.push(image.id);

    await migrateLegacyBlobs(prisma, { dryRun: false });

    const after = await prisma.productImage.findUnique({ where: { id: image.id } });
    expect(after?.url).toBe(`/uploads/${storageKey}?v=2`);
  });
});
