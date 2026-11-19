import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const outputDirectory = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : path.resolve(process.cwd(), 'docs/deploy-screenshots');

async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    const local = Array.from(document.images).filter((image) =>
      image.getAttribute('src')?.startsWith('/'),
    );
    // fullPage capture does not scroll, so lazy images below the fold would
    // stay blank. Force them eager, then decode before taking the shot.
    for (const image of local) image.loading = 'eager';
    await document.fonts.ready;
    await Promise.race([
      Promise.all(
        local.map(async (image) => {
          if (image.complete && image.naturalWidth > 0) return;
          try {
            await image.decode();
          } catch {
            // A failed decode is resolved by the load/error listeners below.
          }
          if (!image.complete || image.naturalWidth === 0) {
            await new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            });
          }
        }),
      ),
      new Promise<void>((resolve) => setTimeout(resolve, 3_000)),
    ]);
  });
}

async function assertImagesLoaded(page: Page) {
  const unloaded = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.getAttribute('src')?.startsWith('/'))
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute('src') ?? ''),
  );
  expect(unloaded, `images not fully loaded: ${unloaded.join(', ')}`).toEqual([]);
}

async function capture(page: Page, pathname: string, filename: string) {
  await page.goto(pathname, { waitUntil: 'networkidle' });
  await waitForImages(page);
  await assertImagesLoaded(page);

  const file = path.join(outputDirectory, filename);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  expect(existsSync(file)).toBe(true);
}

test.beforeAll(() => {
  mkdirSync(outputDirectory, { recursive: true });
});

test('capture Home at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/', 'home-1920.png');
});

test('capture Category at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/c/wedding-ring', 'category-1920.png');
});

test('capture Product at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/p/aurora-band', 'product-1920.png');
});

test(
  'capture Product with contact popover at 1920px',
  { tag: '@screenshots' },
  async ({ page }) => {
    await page.goto('/p/aurora-band', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'ORDER NOW' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'CONTACT US' });
    await expect(dialog).toBeVisible();
    await dialog.locator('a').first().waitFor({ state: 'visible' });
    await waitForImages(page);
    await assertImagesLoaded(page);

    const file = path.join(outputDirectory, 'product-contact-popover-1920.png');
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    expect(existsSync(file)).toBe(true);
  },
);

test('capture Blog list at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/blog', 'blog-list-1920.png');
});

test('capture Blog detail at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/blog/cach-chon-nhan-cuoi-phu-hop', 'blog-detail-1920.png');
});
