import { expect, test, type Page } from '@playwright/test';

const carousel = (page: Page) => page.locator('section[aria-label="Featured collections"]');
const currentSlide = (page: Page) =>
  carousel(page).locator('button[aria-current="true"][aria-label^="Go to slide"]');
const liveRegion = (page: Page) => carousel(page).locator('[aria-live]');

async function releasePointerAndFocus(page: Page) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.mouse.move(0, 0);
}

test(
  'hero slider does not auto advance when reduced motion is preferred',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
    await expect(liveRegion(page)).toHaveAttribute('aria-live', 'polite');
    await expect(
      carousel(page).getByRole('button', { name: /automatic slide changes/i }),
    ).toHaveCount(0);

    await page.waitForTimeout(5500);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
  },
);

test(
  'hero slider pause control stops auto advance and play resumes it',
  { tag: '@storefront' },
  async ({ page }) => {
    await page.goto('/');

    await expect(liveRegion(page)).toHaveAttribute('aria-live', 'off');
    await carousel(page).getByRole('button', { name: 'Pause automatic slide changes' }).click();
    await expect(liveRegion(page)).toHaveAttribute('aria-live', 'polite');
    await releasePointerAndFocus(page);

    await page.waitForTimeout(5500);
    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');

    await carousel(page).getByRole('button', { name: 'Resume automatic slide changes' }).click();
    await releasePointerAndFocus(page);
    await expect(liveRegion(page)).toHaveAttribute('aria-live', 'off');

    await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', {
      timeout: 8000,
    });
  },
);
