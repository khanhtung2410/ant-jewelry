import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { resizeToStoredWebp } from './product-image-processing.mjs';

const dryRun = process.argv.includes('--dry-run');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required (use a direct connection for production).');

const prisma =
  url.startsWith('file:') || url.startsWith('sqlite:')
    ? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
    : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const etag = (bytes) => `"${createHash('sha256').update(bytes).digest('hex')}"`;

async function main() {
  const blobs = await prisma.productImageBlob.findMany({
    where: { contentType: { not: 'image/webp' } },
    orderBy: { storageKey: 'asc' },
  });
  console.log(`mode: ${dryRun ? 'dry-run' : 'write'}`);
  console.log(`legacy non-webp blobs: ${blobs.length}`);

  for (const blob of blobs) {
    const bytes = await resizeToStoredWebp(blob.bytes);
    const beforeEtag = etag(blob.bytes);
    const afterEtag = etag(bytes);
    console.log(
      `${blob.storageKey}: ${blob.bytes.length} -> ${bytes.length} bytes, ETag ${beforeEtag} -> ${afterEtag}`,
    );
    if (dryRun) continue;

    await prisma.productImageBlob.update({
      where: { storageKey: blob.storageKey },
      data: { bytes, contentType: 'image/webp' },
    });
    // Storage keys keep their old .png suffix, so bust the CDN with a versioned
    // URL; the /uploads route ignores the query string and serves the new blob.
    const rows = await prisma.productImage.findMany({
      where: { storageKey: blob.storageKey },
      select: { id: true, url: true },
    });
    for (const row of rows) {
      await prisma.productImage.update({
        where: { id: row.id },
        data: { url: row.url.includes('?v=') ? row.url : `${row.url}?v=2` },
      });
    }
  }
  console.log(dryRun ? 'dry-run complete; no rows written' : `migrated ${blobs.length} blob(s)`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
