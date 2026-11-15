import { expect, test, type Locator, type Page } from '@playwright/test';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

async function tabTo(page: Page, target: Locator) {
  for (let presses = 0; presses < 20; presses += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }
  }

  throw new Error('Target was not reachable with the Tab key.');
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

test('footer PRODUCTS opens a real category page', async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  await footer.getByRole('link', { name: 'PRODUCTS' }).click();

  await expect(page).toHaveURL(/\/c\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('blog pages expose one h1 and one OTHER BLOGS post', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  await page.goto('/blog/cach-chon-nhan-cuoi-phu-hop');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const otherBlogs = page.getByRole('region', { name: 'OTHER BLOGS' });
  await expect(otherBlogs.getByRole('article')).toHaveCount(1);
});

test('keyboard users can open the PRODUCTS menu and reach every category link', async ({
  page,
}) => {
  await page.goto('/');

  const mainNav = page.getByRole('navigation', { name: 'Main navigation' });
  const productsButton = mainNav.getByRole('button', { name: 'PRODUCTS' });
  const categoryLinks = page.getByRole('list', { name: 'Product categories' }).getByRole('link');

  await tabTo(page, productsButton);
  await page.keyboard.press('Enter');
  await expect(productsButton).toHaveAttribute('aria-expanded', 'true');

  await expect(categoryLinks).toHaveCount(4);
  await page.keyboard.press('Tab');
  await expect(categoryLinks.first()).toBeFocused();

  for (let index = 1; index < 4; index += 1) {
    await page.keyboard.press('Tab');
    await expect(categoryLinks.nth(index)).toBeFocused();
  }

  await page.keyboard.press('Tab');
  await expect(productsButton).toHaveAttribute('aria-expanded', 'false');
  await expect(mainNav.getByRole('link', { name: 'BLOG' })).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(productsButton).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(categoryLinks.first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(productsButton).toHaveAttribute('aria-expanded', 'false');
  await expect(productsButton).toBeFocused();
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

test('EDITOR can edit product details but cannot edit a product price', async ({ page }) => {
  await signIn(page, 'editor@antjewelry.local', 'Editor@123');
  await page.goto('/admin/products?search=Aurora');

  const productRow = page.getByRole('row').filter({ hasText: 'Aurora Band' });
  await productRow.getByRole('link', { name: 'Edit' }).click();

  const productDialog = page.getByRole('dialog');
  await expect(productDialog.getByLabel('Price (VND)')).toHaveAttribute('readonly', '');
  await expect(
    productDialog.getByRole('textbox', { name: 'Name', exact: true }),
  ).not.toHaveAttribute('readonly', '');
  await expect(productDialog.getByRole('button', { name: 'Save product' })).toBeVisible();
});
