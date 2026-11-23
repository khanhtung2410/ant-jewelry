import { expect, test } from '@playwright/test';

const pages = [
  ['home', '/'],
  ['category', '/c/wedding-ring'],
  ['product (mock images)', '/p/aurora-band'],
  ['blog list', '/blog'],
  ['blog detail', '/blog/cach-chon-nhan-cuoi-phu-hop'],
  ['product (uploaded images)', '/p/ivy-tennis-bracelet'],
] as const;

function canonicalFor(baseURL: string, path: string): string {
  return `${baseURL.replace(/\/$/, '')}${path === '/' ? '' : path}`;
}

for (const [name, path] of pages) {
  test(
    `${name}: 200, one h1 and a correct canonical`,
    { tag: '@smoke' },
    async ({ page, baseURL }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

      expect(response?.status(), `${name} status`).toBe(200);
      await expect(page.getByRole('heading', { level: 1 }), `${name} h1`).toHaveCount(1);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `${name} canonical`).toBe(canonicalFor(baseURL ?? '', path));
    },
  );
}

test(
  'uploaded images on the ivy product page stay under 400 KB',
  { tag: '@smoke' },
  async ({ page, request, baseURL }) => {
    await page.goto('/p/ivy-tennis-bracelet', { waitUntil: 'domcontentloaded' });

    // next/image serves local uploads through the optimizer: the rendered src
    // is "/_next/image?url=%2Fuploads%2F..." and the selected srcset candidate
    // is in currentSrc. A literal img[src*="/uploads/"] selector matches none.
    const sources = await page.locator('img').evaluateAll((images) =>
      images
        .map((image) => {
          const element = image as HTMLImageElement;
          return element.currentSrc || element.getAttribute('src') || '';
        })
        .filter((src) => src.includes('/uploads/') || src.includes('%2Fuploads%2F')),
    );
    // The optimizer response has no ETag; the stored /uploads/ blob does.
    const uploadUrls = [...new Set(sources)].map((source) => {
      const parsed = new URL(source, baseURL);
      const inner = parsed.searchParams.get('url');
      return inner ? new URL(inner, baseURL).toString() : parsed.toString();
    });
    expect(uploadUrls.length, 'at least one uploaded image').toBeGreaterThan(0);

    for (const url of uploadUrls) {
      const response = await request.get(url);

      expect(response.status(), `${url} status`).toBe(200);
      expect(response.headers()['content-type'] ?? '', `${url} content-type`).toContain('image/');
      expect(response.headers().etag, `${url} etag`).toBeTruthy();

      const body = await response.body();
      expect(body.byteLength, `${url} size`).toBeLessThan(400_000);
    }
  },
);

test(
  'robots.txt and sitemap.xml expose the public URLs',
  { tag: '@smoke' },
  async ({ request, baseURL }) => {
    const origin = (baseURL ?? '').replace(/\/$/, '');

    const robots = await request.get(`${origin}/robots.txt`);
    expect(robots.status()).toBe(200);
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/User-agent:/i);
    expect(robotsBody).toMatch(/Sitemap:/i);

    const sitemap = await request.get(`${origin}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/p/');
    expect(xml).toContain('/c/');
  },
);
