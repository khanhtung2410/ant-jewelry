# Production deployment and operations

## Overview

Production target: **Vercel** (Next.js) + **PostgreSQL**. Uploaded product image bytes are stored in the application database (`ProductImageBlob`) and served from `/uploads/...`.

**Important:** on Vercel the deployment root is read-only and `/tmp` is discarded between instances, so the app never writes uploads to `cwd/uploads`. The database is the durable local store; `PRODUCT_IMAGE_UPLOAD_DIR` is only a legacy read path for files uploaded by older versions. The production migration `20261118100000_add_product_image_blobs` creates the new table.

## Prerequisites

- Vercel project connected to this repository (production environment).
- PostgreSQL database with an application URL (`DATABASE_URL`). A separate direct URL (`DIRECT_URL`) is optional and not required by the current schema/build.
- A real, monitored owner email for the first ADMIN (not `admin@antjewelry.local`).
- Decide whether production starts empty or needs the demo catalogue. `npm run db:seed` is local SQLite only; production may use `npm run db:seed:production`, which seeds categories, products, blog posts, hero slides and settings but **never** the demo users.

## Environment variables (Vercel)

Set in Vercel **Production** (and Preview/Development as appropriate). Never commit values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for runtime/build Prisma client generation |
| `AUTH_SECRET` | Yes | Random signing key for admin sessions (`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`) |
| `SITE_URL` | Yes | Canonical HTTPS origin for the deployment (e.g. `https://<project>.vercel.app`) |
| `DIRECT_URL` | No | Optional; not required by the current PostgreSQL schema/build. Provide only if your migration/tooling setup needs it |
| `PRODUCT_IMAGE_UPLOAD_DIR` | No | Legacy filesystem path used only to read/remove pre-migration uploads (default `./uploads`) |

`vercel.json` runs `npm run build:production`: it generates the PostgreSQL Prisma client, applies pending migrations on **Production** Vercel builds (`scripts/migrate-production.mjs` → `prisma migrate deploy`), then runs `next build`. Preview builds skip migrations because Preview and Production are connected to the same database here; local builds also skip them. A production build now fails if the database is unreachable instead of deploying an app with no schema. Migrations can still be run manually (see below). Local dev/test use SQLite and local uploads unless configured otherwise.

## Vercel deployment sequence

1. **Provision services**: PostgreSQL and Vercel project. Configure all environment variables above.
2. **Migrations** (automatic on Production builds, manual when needed):
   ```bash
   npm ci
   npm run db:migrate:production
   npm run db:migrate:status:production
   ```
   The Vercel Production build runs `prisma migrate deploy` before `next build`, so a normal deploy applies pending migrations. The manual commands are still useful for a first-time setup, a database created outside a deploy, or checking status. Run them from a trusted machine with `DATABASE_URL` set to the **direct** connection string (Prisma Postgres: `db.prisma.io`, not `pooled.db.prisma.io`). Do not use `prisma db push` on production.

   If `prisma migrate deploy` reports `P1001: Can't reach database server`, check the URL before the network: against Prisma Postgres, P1001 is also returned for stale/wrong credentials. Confirm with the `pg` probe below, and copy the current direct string from the Prisma Console (`npx vercel integration open prisma`).
   ```bash
   node -e "const{Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});c.connect().then(()=>{console.log('CONNECTED');return c.end()}).catch(e=>{console.log(e.code||'',e.message);process.exit(1)})"
   ```
3. **(Optional) Seed the demo catalogue** (before deploying, so the build prerenders real slugs):
   ```bash
   npm run db:seed:production
   ```
   Upserts the demo categories, products, blog posts, hero slides and settings from the mocks. It refuses a SQLite URL, skips the demo `admin@antjewelry.local` / `editor@antjewelry.local` accounts, and is safe to re-run. Use the **direct** `db.prisma.io` string. If you seed after a deploy, redeploy (or wait for the 15-minute revalidate) so cached empty pages are regenerated.
4. **Deploy** from Vercel (connected repo/branch). Build uses PostgreSQL Prisma client. `generateStaticParams` for blog/category/product slugs returns empty params if tables are missing (`P2021`) so a build can complete before data exists, but migrations should be applied for correct runtime data.
5. **Create the first ADMIN** (after migrations):
   ```bash
   npm run db:create-admin:production
   ```
   Interactive command: confirms the remote DB host, prompts for a real owner email, requires a 16+ character password (not echoed), hashes it, and refuses if an ADMIN already exists. Clear `DATABASE_URL` from your shell after use; run `npm run db:generate` before returning to local SQLite dev.
6. **Verify deployment:**
   - Public screens: Home (`/`), category (`/c/<slug>`), product (`/p/<slug>`), Blog list (`/blog`), Blog detail (`/blog/<slug>`), and other public pages as applicable.
   - Admin: `/admin/login`, dashboard and content management.
   - Upload a product image in admin and confirm it displays, then redeploy and confirm the image still displays (bytes come from `ProductImageBlob`, not the filesystem).
   - Check `/robots.txt`, `/sitemap.xml`, and canonical/`SITE_URL` behavior.

## Đối chiếu Figma ↔ production (6 màn)

Đối chiếu theo bản thiết kế Figma/đặc tả `ANT_JEWELRY_SAD_v1.1.docx` (Figma gốc không được lưu trong repo). Ảnh chụp production lúc kiểm chứng 2026-11-18 nằm trong `docs/deploy-screenshots/`.

| Màn hình | Figma / thiết kế đối chiếu | Production URL | Trạng thái | Ảnh chụp |
|---|---|---|---|---|
| Home | Hero 16:9, thanh điều hướng, 4 carousel danh mục (5 card/section), khối BLOG | `/` | 200 | [home](deploy-screenshots/home.png) |
| Danh mục | Header/filter, danh sách sản phẩm theo `ProductType`, sort SEE MORE | `/c/wedding-ring` | 200 | [category](deploy-screenshots/category.png) |
| Chi tiết sản phẩm | Gallery ảnh chính + thumbnail, thông tin/giá, YOU MIGHT ALSO LIKE | `/p/aurora-band` | 200 | [product](deploy-screenshots/product.png) |
| Blog list | Tiêu đề, danh sách bài có ảnh bìa/tóm tắt, phân trang | `/blog` | 200 | [blog-list](deploy-screenshots/blog-list.png) |
| Blog chi tiết | Tiêu bài, ảnh bìa above-the-fold, nội dung Markdown, OTHER BLOGS | `/blog/cach-chon-nhan-cuoi-phu-hop` | 200 | [blog-detail](deploy-screenshots/blog-detail.png) |
| Admin | Trang đăng nhập (`/admin/login`), sau đó dashboard và các màn quản lý | `/admin/login` | 200 | [admin-login](deploy-screenshots/admin-login.png) |

## Vercel build error: `public.BlogPost` does not exist (P2021)

If `next build` fails during page data collection with:

- `Invalid \`prisma.blogPost.findMany()\` ... The table \`public.BlogPost\` does not exist in the current database.` (P2021)

**Cause:** the build queried PostgreSQL before migrations were applied (or pointed at the wrong/empty database). **Fix:**

1. Confirm `DATABASE_URL` points to the intended production database.
2. Run `npm run db:migrate:production` and `npm run db:migrate:status:production`.
3. Redeploy. The app also guards `generateStaticParams` for blog/category/product slugs against P2021 so builds are more resilient, but the database must be migrated for runtime pages and admin content to work.

## Migration, backup, restore, rollback

- **Before each migration:** snapshot/PITR checkpoint and record deployment version. Apply only reviewed files in `prisma/postgresql/migrations/`. Never edit an applied migration.
- **Commands:** `npm run db:migrate:production`, `npm run db:migrate:status:production`. No `prisma db push` in production.
- **Backups:** enable provider automated backups/PITR and test restores in staging. Logical backup example:
  ```bash
  pg_dump "$DIRECT_URL" --format=custom --file=ant-jewelry-production.dump
  ```
  Keep dumps in protected backup storage (not in repo/artifacts). Uploaded image bytes are part of the PostgreSQL database, so the same backup/PITR covers them; no separate filesystem backup is needed.
- **Restore:** restore to staging first, verify data/login/pages/images, then follow approved recovery procedure for production. Redeploy previous Vercel build only when schema remains compatible.

## Current deployment status (verified)

- **Storefront:** https://ant-jewelry.vercel.app/ (HTTP 200 at time of check, 2026-11-17)
- **Admin:** https://ant-jewelry.vercel.app/admin (redirects to login as expected for unauthenticated access)
- **Lighthouse (production, 2026-11-17, 3 runs, mobile):** Home median Performance 84 / Accessibility 96 / SEO 100; product `/p/aurora-band` median Performance 89 / Accessibility 100 / SEO 100. See `docs/PERFORMANCE.md` for ranges and methodology.

## Production readiness checklist

- [x] Vercel deployment accessible at `https://ant-jewelry.vercel.app/` (storefront and admin routes respond).
- [ ] Vercel + PostgreSQL provisioned; env vars set (no secrets in code/logs) — confirm in Vercel dashboard.
- [ ] `SITE_URL` set to the deployment HTTPS origin.
- [ ] Migrations applied and status clean.
- [ ] First ADMIN created with real owner email via `db:create-admin:production`.
- [ ] Public deployment loads key pages and admin login/dashboard — verify with real content and authenticated admin access.
- [ ] `ProductImageBlob` migration applied; an uploaded image survives a redeploy.
- [ ] Backup/restore procedure documented and tested outside production as applicable.
