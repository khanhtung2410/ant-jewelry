import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@antjewelry.local');
  await page.getByLabel('Password').fill('Admin@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

type Violations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

function seriousViolations(violations: Violations): string[] {
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map(
      (violation) =>
        `${violation.id}: ${violation.help} -> ${violation.nodes
          .map((node) => `${node.target.join(' ')} (${node.html.slice(0, 160)})`)
          .join(', ')}`,
    );
}

async function analyzeDialog(page: Page): Promise<string[]> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include('dialog')
    .analyze();

  return seriousViolations(violations);
}

test('admin product dialog has no serious or critical accessibility violations', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/admin/products?search=Aurora');
  await page
    .getByRole('row')
    .filter({ hasText: 'Aurora Band' })
    .getByRole('link', { name: 'Edit' })
    .click();

  expect(await analyzeDialog(page)).toEqual([]);
});

test('admin category dialog has no serious or critical accessibility violations', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/admin/categories?new=1');
  expect(await analyzeDialog(page)).toEqual([]);
});

test('admin user dialog has no serious or critical accessibility violations', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/users?new=1');
  expect(await analyzeDialog(page)).toEqual([]);
});

test('admin blog dialog has no serious or critical accessibility violations', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/blog?new=1');
  expect(await analyzeDialog(page)).toEqual([]);
});

test('admin hero slide dialog has no serious or critical accessibility violations', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/admin/hero-slides?new=1');
  expect(await analyzeDialog(page)).toEqual([]);
});

test('admin settings form has no serious or critical accessibility violations', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/admin/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include('form')
    .analyze();
  expect(seriousViolations(violations)).toEqual([]);
});
