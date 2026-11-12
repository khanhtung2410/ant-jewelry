# SEO and Performance

## Lighthouse mobile baseline and targets

The baseline was captured on the production build before this change with Lighthouse 13.6.0 and Chrome 157.0.8103.52, using mobile emulation and simulated throttling. Each URL was audited once on the local Windows environment; the homepage ran first after server startup, so treat its result as an indicative, potentially cold-cache baseline rather than a repeatable average.

Three post-change runs were captured sequentially against the same production build with the same Lighthouse and Chrome versions and mobile settings. The Home Performance score varied substantially, so the median and full range are shown.

| Page | Audit | Before (one run) | After (median; range) | Target |
|---|---|---:|---:|---:|
| Home (`/`) | Performance | 41 | 68 (62–84) | ≥ 85 — not met |
| Home (`/`) | Accessibility | 96 | 96 | ≥ 90 — met |
| Home (`/`) | SEO | 100 | 100 | ≥ 95 — met |
| Product (`/p/aurora-band`) | Performance | 83 | 89 (83–93) | ≥ 85 — median met |
| Product (`/p/aurora-band`) | Accessibility | 100 | 100 | ≥ 90 — met |
| Product (`/p/aurora-band`) | SEO | 100 | 100 | ≥ 95 — met |

| Page | Before FCP / LCP / TBT | After median FCP / LCP / TBT (range) |
|---|---|---|
| Home | 2.2 s / 6.8 s / 2,380 ms | 1.0 s / 3.7 s / 850 ms (FCP 1.0–1.1 s, LCP 3.5–4.0 s, TBT 320–1,740 ms) |
| Product | 1.0 s / 3.0 s / 440 ms | 0.8 s / 2.5 s / 360 ms (FCP 0.8–0.9 s, LCP 2.5–3.0 s, TBT 160–550 ms) |

The hero LCP request is discoverable, eagerly loaded, and marked high priority in the final run. Home Performance remained below target in all three runs (best 84); its TBT also varied considerably on this local Windows runner. The product median meets the target, but one of its three runs scored 83. Treat these scores as local measurements, not a production-device guarantee.

## Changes

- Product cards in carousels now remain server-rendered; only the scroll-arrow controls need client-side JavaScript.
- The hero image uses eager loading and high fetch priority; the product-gallery lead image uses the Next.js 16 `preload` prop. Responsive images provide `sizes` and descriptive `alt` text.
- Product and blog detail pages emit canonical, Open Graph, and Twitter metadata.
- `sitemap.xml` lists visible categories/products and published blog posts; `robots.txt` allows storefront routes and excludes admin/API paths.

Set `SITE_URL` to the canonical production origin. Vercel deployments can fall back to `VERCEL_PROJECT_PRODUCTION_URL`; local development defaults to `http://localhost:3000`.
