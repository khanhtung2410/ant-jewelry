# SEO and Performance

## Lighthouse mobile baseline and targets

The baseline was captured on the production build before this change with Lighthouse 13.6.0 and Chrome 157.0.8103.52, using mobile emulation and simulated throttling. Each URL was audited once on the local Windows environment; the homepage ran first after server startup, so treat its result as an indicative, potentially cold-cache baseline rather than a repeatable average.

| Page | Audit | Before | After | Target |
|---|---|---:|---:|---:|
| Home (`/`) | Performance | 41 | Not measured | ≥ 85 |
| Home (`/`) | Accessibility | 96 | Not measured | ≥ 90 |
| Home (`/`) | SEO | 100 | Not measured | ≥ 95 |
| Product (`/p/aurora-band`) | Performance | 83 | Not measured | ≥ 85 |
| Product (`/p/aurora-band`) | Accessibility | 100 | Not measured | ≥ 90 |
| Product (`/p/aurora-band`) | SEO | 100 | Not measured | ≥ 95 |

| Page | Before FCP | Before LCP | Before TBT |
|---|---:|---:|---:|
| Home | 2.2 s | 6.8 s | 2,380 ms |
| Product | 1.0 s | 3.0 s | 440 ms |

The post-change Lighthouse run was not permitted by the execution environment, so the target scores are **not verified** and no after scores are claimed. Re-run the same mobile Lighthouse audits against a production build to complete the comparison.

## Changes

- Product cards in carousels now remain server-rendered; only the scroll-arrow controls need client-side JavaScript.
- The hero and product-gallery lead images use the Next.js 16 `preload` prop; responsive images provide `sizes` and descriptive `alt` text.
- Product and blog detail pages emit canonical, Open Graph, and Twitter metadata.
- `sitemap.xml` lists visible categories/products and published blog posts; `robots.txt` allows storefront routes and excludes admin/API paths.

Set `SITE_URL` to the canonical production origin. Vercel deployments can fall back to `VERCEL_PROJECT_PRODUCTION_URL`; local development defaults to `http://localhost:3000`.
