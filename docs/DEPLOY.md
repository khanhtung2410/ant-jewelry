# Production deployment and operations (R6.2)

## Overview

Production target: **Vercel** (Next.js) + **PostgreSQL** + **S3-compatible object storage** (Cloudflare R2 or AWS S3) for product image uploads. Use the Vercel-assigned **`*.vercel.app`** domain for this rollout and **do not change DNS for `antjewelry.vn`**.

**Status:** This repository now includes S3/R2-capable upload storage, PostgreSQL schema/migrations, and a build that can tolerate an unmigrated database during static params collection. Actual Vercel project, PostgreSQL, bucket, migration execution, first ADMIN creation, and live verification still require provisioned credentials and operator access (they cannot be completed from source changes alone).

## Prerequisites

- Vercel project connected to this repository (production environment).
- PostgreSQL database with a pooled application URL (`DATABASE_URL`) and a direct URL (`DIRECT_URL`) pointing to the same database/schema.
- S3-compatible object storage bucket (Cloudflare R2 or AWS S3) with a **public base URL** (public bucket, R2 public access/custom domain, or CDN) so uploaded images can be loaded by browsers and by Next.js `<Image>` (images are rendered with `unoptimized` when the URL is external).
- A real, monitored owner email for the first ADMIN (not `admin@antjewelry.local`).
- Decide whether production starts empty or needs approved data migration. Do not run `db:seed` on production.

## Environment variables (Vercel)

Set in Vercel **Production** (and Preview/Development as appropriate). Never commit values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL pooled/runtime connection string |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection for Prisma migrations (same DB/schema as `DATABASE_URL`) |
| `AUTH_SECRET` | Yes | Random signing key for admin sessions (`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`) |
| `SITE_URL` | Yes | Canonical HTTPS origin, e.g. `https://<project>.vercel.app` (use `*.vercel.app`; no custom DNS cutover) |
| `S3_BUCKET` | Yes (Vercel) | Object storage bucket name for product uploads |
| `S3_REGION` | Yes | Region (use `auto` for R2 where applicable) |
| `S3_ENDPOINT` | R2/compatible | S3 endpoint (e.g. `https://<accountid>.r2.cloudflarestorage.com` for R2) |
| `S3_ACCESS_KEY_ID` | Yes | Bucket access key |
| `S3_SECRET_ACCESS_KEY` | Yes | Bucket secret key |
| `S3_FORCE_PATH_STYLE` | No | Set `true` only if the provider requires path-style requests |
| `S3_PUBLIC_BASE_URL` | Yes (Vercel) | Public base URL serving objects (no trailing slash), e.g. `https://pub-...r2.dev` or CDN/custom domain |
| `PRODUCT_IMAGE_UPLOAD_DIR` | No | Local filesystem path only; **not used when `S3_BUCKET` is set** |

`vercel.json` runs `npm run build:production` (`prisma generate --schema prisma/postgresql/schema.prisma && next build`). Local dev/test continue to use SQLite + local uploads unless S3 variables are configured.

## Vercel deployment sequence

1. **Provision services**: PostgreSQL, S3/R2 bucket + public access/base URL, Vercel project. Configure all environment variables above. Set `SITE_URL` to the `*.vercel.app` production URL.
2. **Run migrations (before or alongside first successful content build):**
   ```bash
   npm ci
   npm run db:migrate:production
   npm run db:migrate:status:production
   ```
   Run from a trusted machine with `DATABASE_URL` and `DIRECT_URL` set to the production database. Do not use `prisma db push` on production.
3. **Deploy** from Vercel (connected repo/branch). Build uses PostgreSQL Prisma client. `generateStaticParams` for blog/category/product slugs returns empty params if tables are missing (`P2021`) so a build can complete before data exists, but migrations should be applied for correct runtime data.
4. **Create the first ADMIN** (after migrations):
   ```bash
   npm run db:create-admin:production
   ```
   Interactive command: confirms the remote DB host, prompts for a real owner email, requires a 16+ character password (not echoed), hashes it, and refuses if an ADMIN already exists. Clears `DATABASE_URL` from your shell after use; run `npm run db:generate` before returning to local SQLite dev.
5. **Verify on `*.vercel.app`:**
   - Public screens: Home (`/`), category (`/c/<slug>`), product (`/p/<slug>`), Blog list (`/blog`), Blog detail (`/blog/<slug>`), and a static/info page as applicable.
   - Admin: `/admin/login`, dashboard and content management.
   - Upload a product image in admin, confirm it displays, **redeploy**, and confirm the image still loads (proves S3/R2 persistence; Vercel filesystem is ephemeral).
   - Check `/robots.txt`, `/sitemap.xml`, and canonical/`SITE_URL` behavior.

## Vercel build error: `public.BlogPost` does not exist (P2021)

If `next build` fails during page data collection with:

- `Invalid \`prisma.blogPost.findMany()\` ... The table \`public.BlogPost\` does not exist in the current database.` (P2021)

**Cause:** the build queried PostgreSQL before migrations were applied (or pointed at the wrong/empty database). **Fix:**

1. Confirm `DATABASE_URL`/`DIRECT_URL` point to the intended production database.
2. Run `npm run db:migrate:production` and `npm run db:migrate:status:production`.
3. Redeploy. The app also guards `generateStaticParams` for blog/category/product slugs against P2021 so builds are more resilient, but the database must be migrated for runtime pages and admin content to work.

## Migration, backup, restore, rollback

- **Before each migration:** snapshot/PITR checkpoint and record deployment version. Apply only reviewed files in `prisma/postgresql/migrations/`. Never edit an applied migration.
- **Commands:** `npm run db:migrate:production`, `npm run db:migrate:status:production`. No `prisma db push` in production.
- **Backups:** enable provider automated backups/PITR and test restores in staging. Logical backup example:
  ```bash
  pg_dump "$DIRECT_URL" --format=custom --file=ant-jewelry-production.dump
  ```
  Keep dumps in protected backup storage (not in repo/artifacts). Back up or rely on durability/versioning of the object storage bucket for uploaded images.
- **Restore:** restore to staging first, verify data/login/pages/images, then follow approved recovery procedure for production. Redeploy previous Vercel build only when schema/uploads remain compatible.

## Production readiness checklist (R6.2)

- [ ] Vercel + PostgreSQL + S3/R2 bucket provisioned; env vars set (no secrets in code/logs).
- [ ] `SITE_URL` set to `*.vercel.app`; **no DNS changes to `antjewelry.vn`**.
- [ ] Migrations applied and status clean.
- [ ] First ADMIN created with real owner email via `db:create-admin:production`.
- [ ] Public `*.vercel.app` loads Home, category, product, Blog list, Blog detail, and admin login/dashboard.
- [ ] Image upload works and **persists after redeploy** (S3/R2).
- [ ] Backup/restore procedure documented and tested outside production as applicable.
