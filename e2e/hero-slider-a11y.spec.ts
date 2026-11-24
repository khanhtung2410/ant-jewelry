import { expect, test, type Page } from '@playwright/test';

const carousel = (page: Page) => page.locator('section[aria-label="Featured collections"]');
const currentSlide = (page: Page) =>
  carousel(page).locator('button[aria-current="true"][aria-label^="Go to slide"]');
const liveRegion = (page: Page) => carousel(page).locator('[aria-live]');

test(
  'hero slider does not auto advance when reduced motion is preferred',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
    await expect(liveRegion(page)).toHaveAttribute('aria-live', 'polite');

    await page.waitForTimeout(5500);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
  },
);
