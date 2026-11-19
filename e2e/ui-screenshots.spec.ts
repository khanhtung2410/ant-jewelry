import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const outputDirectory = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : path.resolve(process.cwd(), 'docs/deploy-screenshots');

async function capture(page: Page, pathname: string, filename: string) {
  await page.goto(pathname, { waitUntil: 'networkidle' });
  // Only take the shot once fonts and every image have settled.
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Lazy images below the fold may never load; wait only for eager ones and
    // cap the wait so a single stalled request cannot hang the capture.
    const pending = Array.from(document.images).filter(
      (image) => image.loading !== 'lazy' && !image.complete,
    );
    await Promise.race([
      Promise.all(
        pending.map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
        ),
      ),
      new Promise<void>((resolve) => setTimeout(resolve, 3_000)),
    ]);
  });

  const file = path.join(outputDirectory, filename);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  expect(file).toBeTruthy();
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
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const file = path.join(outputDirectory, 'product-contact-popover-1920.png');
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    expect(file).toBeTruthy();
  },
);

test('capture Blog list at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/blog', 'blog-list-1920.png');
});

test('capture Blog detail at 1920px', { tag: '@screenshots' }, async ({ page }) => {
  await capture(page, '/blog/cach-chon-nhan-cuoi-phu-hop', 'blog-detail-1920.png');
});
