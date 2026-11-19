import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { prisma } from '@/features/shared/db/prisma';
import {
  migrateLegacyBlobs,
  reencodeLegacyBlob,
  withVersionQuery,
} from '../../scripts/reencode-legacy-uploads.mjs';

const createdKeys: string[] = [];

afterEach(async () => {
  await prisma.productImageBlob.deleteMany({
    where: { storageKey: { in: createdKeys } },
  });
  createdKeys.length = 0;
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
});
