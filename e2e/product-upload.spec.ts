import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { expect, test, type APIRequestContext, type Page, type Response } from '@playwright/test';
import sharp from 'sharp';
import { E2E_DATABASE_URL } from './database';

const ADMIN_EMAIL = 'admin@antjewelry.local';
const ADMIN_PASSWORD = 'Admin@123';
const PRODUCT_SLUG = 'eclipse-pave-band';
const PRODUCT_NAME = 'Eclipse Pavé Band';
const PRODUCT_SEARCH = 'Eclipse';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const SITE = 'http://localhost:3100';

async function signIn(page: Page) {
  await page.goto(`${SITE}/admin/login`);
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

async function noisyPng(width: number, height: number): Promise<Buffer> {
  const raw = randomBytes(width * height * 3);
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

async function solidPng(background: string): Promise<Buffer> {
  return sharp({ create: { width: 400, height: 400, channels: 3, background } })
    .png()
    .toBuffer();
}

async function openImagesTab(page: Page) {
  await page.goto(`${SITE}/admin/products?search=${PRODUCT_SEARCH}`);
  const row = page.getByRole('row').filter({ hasText: PRODUCT_NAME });
  await row.getByRole('link', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: /^Images/ }).click();
  return dialog;
}

function cleanupClient(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: E2E_DATABASE_URL }) });
}

async function deleteUploadedImages(urls: string[]) {
  if (urls.length === 0) return;
  const prisma = cleanupClient();
  try {
    const storageKeys = urls.map((url) =>
      new URL(url, 'http://localhost').pathname.replace(/^\/uploads\//, ''),
    );
    await prisma.productImage.deleteMany({ where: { url: { in: urls } } });
    await prisma.productImageBlob.deleteMany({ where: { storageKey: { in: storageKeys } } });
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteUploadedImagesViaUi(page: Page, count: number) {
  if (count === 0) return;
  // Use the real Server Action so product/category pages are revalidated.
  // Direct DB deletion leaves cached HTML pointing at removed blobs.
  const dialog = await openImagesTab(page);
  const items = dialog.locator('ol > li');
  const before = await items.count();
  for (let deleted = 0; deleted < count; deleted += 1) {
    await items.last().getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog', { name: 'CONFIRM ACTION' });
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(items).toHaveCount(before - deleted - 1);
  }
}

async function assertStoredImage(request: APIRequestContext, url: string): Promise<number> {
  const response = await request.get(url);
  expect(response.status(), `${url} status`).toBe(200);
  expect(response.headers()['content-type'] ?? '').toContain('image/webp');
  const body = await response.body();
  expect(body.byteLength, `${url} size`).toBeLessThan(400_000);

  const etag = response.headers().etag;
  expect(etag, `${url} etag`).toBeTruthy();
  const cached = await request.get(url, { headers: { 'If-None-Match': etag ?? '' } });
  expect(cached.status(), `${url} conditional GET`).toBe(304);
  return body.byteLength;
}

async function assertOptimizedImage(
  request: APIRequestContext,
  page: Page,
  url: string,
  rawBytes: number,
) {
  const srcs = await page
    .locator('img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? ''));
  const optimized = srcs.find(
    (src) => src.startsWith('/_next/image?') && decodeURIComponent(src).includes(url),
  );
  expect(optimized, `storefront renders optimizer URL for ${url}`).toBeTruthy();

  const response = await request.get(`${SITE}${optimized}`);
  expect(response.status(), `optimizer status for ${url}`).toBe(200);
  expect(response.headers()['content-type'] ?? '').toMatch(/^image\/(jpeg|webp)/);
  const bytes = (await response.body()).byteLength;
  expect(bytes, `optimizer bytes for ${url}`).toBeLessThan(rawBytes);
  expect(bytes, `optimizer budget for ${url}`).toBeLessThan(400_000);
}

test('ADMIN uploads three images and the storefront serves small cached WebP copies', async ({
  page,
  request,
}) => {
  await signIn(page);

  const large = await noisyPng(1120, 1120);
  expect(large.byteLength).toBeGreaterThan(3_000_000);
  expect(large.byteLength).toBeLessThan(MAX_IMAGE_BYTES);

  const uploadResponses: Response[] = [];
  page.on('response', (response) => {
    if (response.request().method() === 'POST' && response.url().includes('/images')) {
      uploadResponses.push(response);
    }
  });

  const uploadedUrls: string[] = [];
  try {
    const dialog = await openImagesTab(page);
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __uploadStatuses: string[] }).__uploadStatuses = seen;
      new MutationObserver(() => {
        document.querySelectorAll('[role="status"]').forEach((element) => {
          const text = element.textContent ?? '';
          if (text && !seen.includes(text)) seen.push(text);
        });
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    await dialog.getByLabel('Select product images').setInputFiles([
      { name: 'large-noise.png', mimeType: 'image/png', buffer: large },
      { name: 'small-a.png', mimeType: 'image/png', buffer: await solidPng('#b8860b') },
      { name: 'small-b.png', mimeType: 'image/png', buffer: await solidPng('#265649') },
    ]);
    await dialog.getByRole('button', { name: 'Upload images' }).click();

    await expect(
      dialog.getByRole('status').filter({ hasText: '3 image(s) uploaded.' }),
    ).toBeVisible({
      timeout: 60_000,
    });

    const statuses = await page.evaluate(
      () => (window as unknown as { __uploadStatuses: string[] }).__uploadStatuses,
    );
    expect(
      statuses.some((text) => /Uploading 1\/3/.test(text)),
      'first progress toast',
    ).toBe(true);
    expect(
      statuses.some((text) => /Uploading 2\/3/.test(text)),
      'second progress toast',
    ).toBe(true);
    expect(
      statuses.some((text) => /Uploading 3\/3/.test(text)),
      'third progress toast',
    ).toBe(true);

    expect(uploadResponses).toHaveLength(3);
    expect(uploadResponses.map((response) => response.status())).toEqual([201, 201, 201]);
    for (const response of uploadResponses) {
      const body = (await response.json()) as { images?: { url: string }[] };
      uploadedUrls.push(...(body.images ?? []).map((image) => image.url));
    }
    expect(uploadedUrls).toHaveLength(3);

    await page.goto(`${SITE}/p/${PRODUCT_SLUG}`);
    await expect
      .poll(
        async () => {
          await page.reload();
          const html = await page.content();
          return uploadedUrls.every(
            (url) => html.includes(url) || html.includes(encodeURIComponent(url)),
          );
        },
        { timeout: 20_000, intervals: [1000, 2000, 3000] },
      )
      .toBe(true);

    const rawSizes = new Map<string, number>();
    for (const url of uploadedUrls) {
      rawSizes.set(url, await assertStoredImage(request, url));
    }

    // F3: the storefront must actually load the optimizer URL, not just
    // mention the raw blob, and the served variant must be smaller.
    let optimizedChecked = false;
    for (const url of uploadedUrls) {
      const srcs = await page
        .locator('img')
        .evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? ''));
      if (
        !srcs.some(
          (src) => src.startsWith('/_next/image?') && decodeURIComponent(src).includes(url),
        )
      ) {
        continue;
      }
      await assertOptimizedImage(request, page, url, rawSizes.get(url) ?? 400_000);
      optimizedChecked = true;
      break;
    }
    expect(optimizedChecked, 'at least one optimizer-served upload').toBe(true);
  } finally {
    await deleteUploadedImagesViaUi(page, uploadedUrls.length);
    // Safety net for rows the UI path may have missed after an early failure.
    await deleteUploadedImages(uploadedUrls);
  }
});

test('ADMIN upload rejects a file over 4 MB without sending a request', async ({ page }) => {
  await signIn(page);

  const uploadRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/images')) {
      uploadRequests.push(request.url());
    }
  });

  const oversized = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    randomBytes(MAX_IMAGE_BYTES + 1),
  ]);

  const dialog = await openImagesTab(page);
  await dialog.getByLabel('Select product images').setInputFiles({
    name: 'too-large.png',
    mimeType: 'image/png',
    buffer: oversized,
  });
  await dialog.getByRole('button', { name: 'Upload images' }).click();

  await expect(dialog.getByRole('alert')).toContainText('exceeds the 4 MB limit');
  expect(uploadRequests).toEqual([]);
});
