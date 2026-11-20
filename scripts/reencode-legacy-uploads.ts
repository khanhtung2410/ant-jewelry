import 'dotenv/config';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { resizeToStoredWebp } from '../src/features/products/server/product-image-processing';

const etag = (bytes: Uint8Array<ArrayBufferLike>): string =>
  createHash('sha256').update(bytes).digest('hex');

/** Add the CDN-bust version without breaking query strings or fragments. */
export function withVersionQuery(url: string): string {
  const hashIndex = url.indexOf('#');
  const fragment = hashIndex === -1 ? '' : url.slice(hashIndex);
  const main = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const isAbsolute = /^https?:\/\//i.test(main);
  const parsed = new URL(main, 'https://placeholder.local');
  // Always set (never just add) so a stale `?v=1` is actually busted.
  parsed.searchParams.set('v', '2');
  const base = isAbsolute ? `${parsed.origin}${parsed.pathname}` : parsed.pathname;
  return `${base}${parsed.search}${fragment}`;
}

/** E1: re-encode an old blob with the same helper used by new uploads. */
export async function reencodeLegacyBlob(bytes: Uint8Array<ArrayBufferLike>): Promise<{
  bytes: Uint8Array<ArrayBuffer>;
  contentType: string;
  etag: string;
}> {
  const resized = await resizeToStoredWebp(bytes);
  return { bytes: resized, contentType: 'image/webp', etag: etag(resized) };
}

/**
 * E1 + B6: re-encode non-WebP blobs, and backfill the ETag on legacy WebP
 * blobs that predate the etag column so conditional GETs stop loading bytes.
 * Scope is database blobs only; legacy images still on the old filesystem are
 * a read-only compatibility path and are not rewritten by this script.
 */
export async function migrateLegacyBlobs(
  prisma: PrismaClient,
  { dryRun = false, log = console.log }: { dryRun?: boolean; log?: (message: string) => void } = {},
): Promise<number> {
  const blobs = await prisma.productImageBlob.findMany({
    where: {
      OR: [{ contentType: { not: 'image/webp' } }, { etag: null }],
    },
    orderBy: { storageKey: 'asc' },
  });
  log(`mode: ${dryRun ? 'dry-run' : 'write'}`);
  log(`legacy blobs to process: ${blobs.length}`);

  for (const blob of blobs) {
    const needsResize = blob.contentType !== 'image/webp';
    const beforeEtag = blob.etag ?? etag(blob.bytes);
    const result = needsResize
      ? await reencodeLegacyBlob(blob.bytes)
      : { bytes: blob.bytes, contentType: blob.contentType, etag: etag(blob.bytes) };

    log(
      `${blob.storageKey}: ${blob.bytes.length} -> ${result.bytes.length} bytes, ETag ${beforeEtag} -> ${result.etag}`,
    );
    if (dryRun) continue;

    await prisma.productImageBlob.update({
      where: { storageKey: blob.storageKey },
      data: { bytes: result.bytes, contentType: result.contentType, etag: result.etag },
    });

    if (needsResize) {
      // Storage keys keep their old .png suffix, so bust the CDN with a
      // versioned URL; the /uploads route ignores the query string.
      const rows = await prisma.productImage.findMany({
        where: { storageKey: blob.storageKey },
        select: { id: true, url: true },
      });
      for (const row of rows) {
        await prisma.productImage.update({
          where: { id: row.id },
          data: { url: withVersionQuery(row.url) },
        });
      }
    }
  }

  log(dryRun ? 'dry-run complete; no rows written' : `migrated ${blobs.length} blob(s)`);
  return blobs.length;
}

async function runCli(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required (use a direct connection for production).');

  const prisma =
    url.startsWith('file:') || url.startsWith('sqlite:')
      ? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
      : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    await migrateLegacyBlobs(prisma, { dryRun: process.argv.includes('--dry-run') });
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
