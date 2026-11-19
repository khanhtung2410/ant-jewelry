import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function analyze(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();

  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.help} [${violation.nodes.length} node(s)]`);
}

async function expectClean(page: Page, include?: string) {
  await expect(await analyze(page, include)).toEqual([]);
}

test('home has no serious or critical accessibility violations', { tag: '@a11y' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectClean(page);
});

test('category page has no serious or critical accessibility violations', { tag: '@a11y' }, async ({
  page,
}) => {
  await page.goto('/c/wedding-ring');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectClean(page);
});

test('product page has no serious or critical accessibility violations', { tag: '@a11y' }, async ({
  page,
}) => {
  await page.goto('/p/aurora-band');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectClean(page);
});

test('blog list has no serious or critical accessibility violations', { tag: '@a11y' }, async ({
  page,
}) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectClean(page);
});

test('blog detail has no serious or critical accessibility violations', { tag: '@a11y' }, async ({
  page,
}) => {
  await page.goto('/blog/cach-chon-nhan-cuoi-phu-hop');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectClean(page);
});

test('contact popover has no serious or critical accessibility violations', { tag: '@a11y' }, async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'CONTACT' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'CONTACT US' });
  await expect(dialog).toBeVisible();
  await expectClean(page, '[role="dialog"]');
});
