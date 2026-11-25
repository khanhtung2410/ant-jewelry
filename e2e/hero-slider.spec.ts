import { expect, test, type Page } from '@playwright/test';

const carousel = (page: Page) => page.locator('section[aria-label="Featured collections"]');
const currentSlide = (page: Page) =>
  carousel(page).locator('button[aria-current="true"][aria-label^="Go to slide"]');
const liveRegion = (page: Page) => carousel(page).locator('[aria-live]');

async function releasePointerAndFocus(page: Page) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

test(
  'hero slider advances one slide after five seconds and loops',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.goto('/');
    await releasePointerAndFocus(page);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', {
      timeout: 12_000,
    });
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 3', {
      timeout: 12_000,
    });
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1', {
      timeout: 12_000,
    });
  },
);

test(
  'hero slider pauses while the pointer is over it and resumes after the pointer leaves',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.goto('/');
    await releasePointerAndFocus(page);
    await carousel(page).hover();
    await page.waitForTimeout(5_500);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1', {
      timeout: 2_000,
    });
    await page.mouse.move(1, 1);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', {
      timeout: 12_000,
    });
  },
);

test(
  'hero slider pauses while focus is inside it and resumes after focus leaves',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.goto('/');
    await releasePointerAndFocus(page);
    await currentSlide(page).focus();
    await page.waitForTimeout(5_500);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1', {
      timeout: 2_000,
    });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', {
      timeout: 12_000,
    });
  },
);

test(
  'choosing a slide restarts the five second countdown',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.goto('/');
    await releasePointerAndFocus(page);
    await page.waitForTimeout(3_000);
    await carousel(page).getByRole('button', { name: 'Go to slide 3' }).click();
    await releasePointerAndFocus(page);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 3');
    await page.waitForTimeout(2_500);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 3');
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1', {
      timeout: 12_000,
    });
  },
);

test(
  'hero slider renders no pause control and keeps the live region quiet while advancing',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.goto('/');
    await expect(
      carousel(page).getByRole('button', { name: /automatic slide changes/i }),
    ).toHaveCount(0);
    await expect(liveRegion(page)).toHaveAttribute('aria-live', 'off');
  },
);
