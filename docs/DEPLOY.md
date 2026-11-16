# Production deployment and operations

## Overview

Production target: **Vercel** (Next.js) + **PostgreSQL**. Product image uploads are stored on the **local filesystem** (`PRODUCT_IMAGE_UPLOAD_DIR`, default `./uploads`) and served by the application from `/uploads/...`.

**Note:** On serverless/ephemeral platforms (such as Vercel), local filesystem storage is not durable across redeploys or instances. Keep uploaded image persistence requirements in mind when choosing hosting/storage.

## Prerequisites

- Vercel project connected to this repository (production environment).
- PostgreSQL database with a pooled application URL (`DATABASE_URL`) and a direct URL (`DIRECT_URL`) pointing to the same database/schema.
- A real, monitored owner email for the first ADMIN (not `admin@antjewelry.local`).
- Decide whether production starts empty or needs approved data migration. Do not run `db:seed` on production.

## Environment variables (Vercel)

Set in Vercel **Production** (and Preview/Development as appropriate). Never commit values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL pooled/runtime connection string |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection for Prisma migrations (same DB/schema as `DATABASE_URL`) |
| `AUTH_SECRET` | Yes | Random signing key for admin sessions (`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`) |
| `SITE_URL` | Yes | Canonical HTTPS origin for the deployment (e.g. `https://<project>.vercel.app`) |
| `PRODUCT_IMAGE_UPLOAD_DIR` | No | Filesystem path for uploaded product images (default `./uploads`, relative to app working directory) |

`vercel.json` runs `npm run build:production` (`prisma generate --schema prisma/postgresql/schema.prisma && next build`). Local dev/test use SQLite and local uploads unless configured otherwise.

## Vercel deployment sequence

1. **Provision services**: PostgreSQL and Vercel project. Configure all environment variables above.
2. **Run migrations** (before or alongside first successful content build):
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
   Interactive command: confirms the remote DB host, prompts for a real owner email, requires a 16+ character password (not echoed), hashes it, and refuses if an ADMIN already exists. Clear `DATABASE_URL` from your shell after use; run `npm run db:generate` before returning to local SQLite dev.
5. **Verify deployment:**
   - Public screens: Home (`/`), category (`/c/<slug>`), product (`/p/<slug>`), Blog list (`/blog`), Blog detail (`/blog/<slug>`), and other public pages as applicable.
   - Admin: `/admin/login`, dashboard and content management.
   - Upload a product image in admin and confirm it displays.
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
  Keep dumps in protected backup storage (not in repo/artifacts). Include a backup strategy for uploaded files stored under `PRODUCT_IMAGE_UPLOAD_DIR` if they must be retained.
- **Restore:** restore to staging first, verify data/login/pages/images, then follow approved recovery procedure for production. Redeploy previous Vercel build only when schema remains compatible.

## Production readiness checklist

- [ ] Vercel + PostgreSQL provisioned; env vars set (no secrets in code/logs).
- [ ] `SITE_URL` set to the deployment HTTPS origin.
- [ ] Migrations applied and status clean.
- [ ] First ADMIN created with real owner email via `db:create-admin:production`.
- [ ] Public deployment loads key pages and admin login/dashboard.
- [ ] Product image upload works in the deployed environment (note: local filesystem uploads may not persist across redeploys on ephemeral hosts).
- [ ] Backup/restore procedure documented and tested outside production as applicable.
