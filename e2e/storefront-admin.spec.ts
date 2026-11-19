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

test('storefront visitors can sort, choose a color, and contact the store', { tag: '@storefront' }, async ({ page }) => {
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

test('footer PRODUCTS opens a real category page', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  await footer.getByRole('link', { name: 'PRODUCTS' }).click();

  await expect(page).toHaveURL(/\/c\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('blog pages expose one h1 and one OTHER BLOGS post', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  await page.goto('/blog/cach-chon-nhan-cuoi-phu-hop');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const otherBlogs = page.getByRole('region', { name: 'OTHER BLOGS' });
  await expect(otherBlogs.getByRole('article')).toHaveCount(1);
});

test(
  'header CONTACT trigger controls the shared dialog and the home h1 stays fixed',
  { tag: '@storefront' },
  async ({ page }) => {
  await page.goto('/');

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText('ANT JEWELRY');
  await page.getByRole('button', { name: 'Next slide' }).click();
  await expect(heading).toHaveText('ANT JEWELRY');

  const headerTrigger = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'CONTACT' });
  const footerTrigger = page.getByRole('contentinfo').getByRole('button', { name: 'CONTACT' });

  await headerTrigger.click();
  const dialog = page.getByRole('dialog', { name: 'CONTACT US' });
  await expect(dialog).toBeVisible();

  const dialogId = await dialog.getAttribute('id');
  expect(dialogId).toBeTruthy();
  await expect(headerTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(headerTrigger).toHaveAttribute('aria-controls', dialogId ?? '');
  await expect(footerTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(footerTrigger).not.toHaveAttribute('aria-controls', /.*/);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(headerTrigger).toHaveAttribute('aria-expanded', 'false');

  await footerTrigger.click();
  await expect(page.getByRole('dialog', { name: 'CONTACT US' })).toHaveAttribute(
    'id',
    dialogId ?? '',
  );
  await expect(footerTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(headerTrigger).toHaveAttribute('aria-expanded', 'false');
});

test('storefront pages do not scroll horizontally and keep the header sticky', { tag: '@storefront' }, async ({ page }) => {
  for (const width of [375, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow, `no horizontal overflow at ${width}px`).toBe(false);

    const headerTop = await page.evaluate(async () => {
      window.scrollTo(0, 700);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Math.round(document.querySelector('header')!.getBoundingClientRect().top);
    });
    expect(headerTop, `sticky header at ${width}px`).toBe(0);
  }
});

test(
  'keyboard users can open the PRODUCTS menu and reach every category link',
  { tag: '@storefront' },
  async ({ page }) => {
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

test('logout revokes the previous admin session cookie', async ({ page, context }) => {
  await signIn(page, 'admin@antjewelry.local', 'Admin@123');

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'aj_admin_session',
  );
  expect(sessionCookie).toBeTruthy();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/admin\/login/);

  await context.addCookies([sessionCookie!]);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
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
  await expect(async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('12.345.678', { exact: true })).toBeVisible();
  }).toPass({ timeout: 20_000 });
});

test('EDITOR can save product details but cannot edit a product price', async ({ page }) => {
  await signIn(page, 'editor@antjewelry.local', 'Editor@123');
  await page.goto('/admin/products?search=Aurora');

  const productRow = page.getByRole('row').filter({ hasText: 'Aurora Band' });
  await productRow.getByRole('link', { name: 'Edit' }).click();

  const productDialog = page.getByRole('dialog');
  const priceInput = productDialog.getByLabel('Price (VND)');
  await expect(priceInput).toHaveAttribute('readonly', '');
  const originalPrice = await priceInput.inputValue();
  const nameInput = productDialog.getByRole('textbox', { name: 'Name', exact: true });
  await expect(nameInput).not.toHaveAttribute('readonly', '');

  await nameInput.fill('Aurora Band (EDITOR rename)');
  await productDialog.getByRole('button', { name: 'Save product' }).click();
  await expect(page).toHaveURL(/saved=1/);

  await page.goto('/admin/products?search=Aurora');
  await expect(page.getByText('Aurora Band (EDITOR rename)')).toBeVisible();
  const renamedRow = page.getByRole('row').filter({ hasText: 'Aurora Band (EDITOR rename)' });
  await renamedRow.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog').getByLabel('Price (VND)')).toHaveValue(originalPrice);
});
