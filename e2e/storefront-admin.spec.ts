import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test('storefront visitors can sort, choose a color, and contact the store', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('region', { name: 'Wedding Ring' })
    .getByRole('link', { name: 'VIEW PRODUCTS' })
    .click();

  const category = page.getByRole('region', { name: 'Wedding Ring' });
  await category.getByLabel('Sort by').selectOption('price_desc');
  await expect(page).toHaveURL(/sort=price_desc/);

  const productLinks = category.getByRole('list').getByRole('link');
  await expect(productLinks.first()).toContainText('Halo Eternity Band');
  const productTexts = await productLinks.allTextContents();
  const prices = productTexts.map((text) => {
    const match = text.match(/([\d.]+)\s*₫/);
    if (!match) {
      throw new Error(`Expected product link to contain a formatted price: ${text}`);
    }
    return Number(match[1].replaceAll('.', ''));
  });
  expect(prices.length).toBeGreaterThan(1);
  expect(prices).toEqual([...prices].sort((first, second) => second - first));

  await category.getByRole('link', { name: /Aurora Band/ }).click();
  await expect(page).toHaveURL(/\/p\/aurora-band$/);
  await expect(page.getByRole('heading', { name: 'Aurora Band', level: 1 })).toBeVisible();

  const colorOptions = page.getByRole('group', { name: 'Color' });
  await colorOptions.getByRole('button', { name: 'Vàng trắng 18K' }).click();
  await expect(colorOptions.getByRole('button', { name: 'Vàng trắng 18K' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'ORDER NOW' }).click();
  const contactDialog = page.getByRole('dialog', { name: 'CONTACT US' });
  await expect(contactDialog.getByRole('link', { name: '0900 000 000' })).toHaveAttribute(
    'href',
    'tel:0900000000',
  );
});

test('ADMIN price changes are reflected on the storefront', async ({ page }) => {
  await signIn(page, 'admin@antjewelry.local', 'Admin@123');
  await page.goto('/admin/products?search=Aurora');

  const productRow = page.getByRole('row').filter({ hasText: 'Aurora Band' });
  await productRow.getByRole('link', { name: 'Edit' }).click();

  const productDialog = page.getByRole('dialog');
  await productDialog.getByLabel('Price (VND)').fill('12345678');
  await productDialog.getByRole('button', { name: 'Save product' }).click();
  await expect(page).toHaveURL(/saved=1/);

  await page.goto('/p/aurora-band');
  await expect(page.getByText('12.345.678', { exact: true })).toBeVisible();
});

test('EDITOR can view but cannot edit a product price', async ({ page }) => {
  await signIn(page, 'editor@antjewelry.local', 'Editor@123');
  await page.goto('/admin/products?search=Aurora');

  const productRow = page.getByRole('row').filter({ hasText: 'Aurora Band' });
  await productRow.getByRole('link', { name: 'View' }).click();

  const productDialog = page.getByRole('dialog');
  await expect(productDialog.getByLabel('Price (VND)')).toHaveAttribute('readonly', '');
  await expect(productDialog.getByRole('button', { name: 'Save product' })).toHaveCount(0);
});
