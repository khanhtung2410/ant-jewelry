# Production deployment and operations

## Status and go-live gate

**Status on 2026-11-12:** Vercel, PostgreSQL, and object-storage resources have not been provisioned for this repository. No production deployment or first ADMIN account was created by this change.

The supplied production URL, [https://antjewelry.vn/](https://antjewelry.vn/), responds, but its homepage links product pages such as `/facert-ring`; this repository uses `/p/[slug]`. The URL is therefore not verified as a deployment of this Next.js application. Confirm the existing site's ownership and cutover plan before changing DNS or replacing it.

The Figma URL supplied for this milestone is [Jewelry website — Figma](https://www.figma.com/design/tdTs89ynAQUSvUzAEnMhj8/Jewelry-website?node-id=0-1&p=f). Only the file-level link is available here; named frame links and production screenshots still need to be recorded after deployment. The comparison below is intentionally marked unverified rather than claiming visual parity.

| Figma screen | Target route in this app | Production observation | Result |
|---|---|---|---|
| Home (Figma file; frame not identified) | `/` | The supplied domain responds with a storefront, but it is not verified as this app. | Not verified |
| Category | `/c/[slug]` | A category link is present on the current domain; visual and data parity are not verified. | Not verified |
| Product detail | `/p/[slug]` | Current homepage links use paths such as `/facert-ring`, not this app's `/p/[slug]` route. | Route mismatch; cutover required |
| Blog list | `/blog` | No deployment of this app has been confirmed. | Not verified |
| Blog detail | `/blog/[slug]` | No deployment of this app has been confirmed. | Not verified |
| Admin login and dashboard | `/admin/login`, `/admin/*` | Production access and first ADMIN are not configured. | Blocked |

After go-live, replace each result with the exact Figma frame, production URL, viewport (desktop/mobile), and a screenshot or observed difference. Do not mark visual parity complete without checking both viewports.

## Prerequisites

- Vercel project connected to this repository with permission to configure its production environment.
- PostgreSQL database and its pooled application URL plus direct migration URL.
- S3-compatible bucket (AWS S3 or Cloudflare R2) and HTTPS public base URL/CDN for product images.
- Approval to cut `antjewelry.vn` over from its current site, or a separately approved production domain.
- A real, monitored owner email for the first ADMIN. Do not use the local sample address `admin@antjewelry.local`.
- Decide whether production starts empty or needs an approved data migration. No SQLite database or existing image objects are copied by this release.

## Environment variables

Set these in Vercel **Production** environment variables; use separate values for Preview/Development. Never commit actual values or paste credentials into source code, pull requests, or logs.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL pooled/runtime connection string |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection for Prisma migrations; must target the same database/schema as `DATABASE_URL` |
| `AUTH_SECRET` | Yes | Random signing key for admin sessions; generate with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` and store directly in Vercel |
| `SITE_URL` | Yes | Canonical HTTPS origin, for example the approved production domain |
| `S3_REGION` | Yes | AWS region or `auto` for a compatible service that requires it |
| `S3_BUCKET` | Yes | Bucket name |
| `S3_ACCESS_KEY_ID` | Yes | Server-side object-storage access key |
| `S3_SECRET_ACCESS_KEY` | Yes | Server-side object-storage secret |
| `S3_PUBLIC_URL` | Yes | HTTPS public base URL/CDN used to display uploaded images |
| `S3_ENDPOINT` | No for AWS | HTTPS S3-compatible API origin, e.g. the provider's R2 endpoint; do not include a path |

Use a bucket key with only the access needed to upload and delete objects in this bucket; configure public object reads through the provider/CDN. These variables are server-only and must not use a `NEXT_PUBLIC_` prefix.

`.env.example` contains placeholders only. Local SQLite uses `prisma/schema.prisma`; production uses `prisma/postgresql/schema.prisma`. `vercel.json` selects `npm run build:production`, which generates the PostgreSQL Prisma Client before the Next.js build.

## Initial deployment sequence

1. Provision the services above and configure all variables in Vercel. Confirm storage can serve a test image over HTTPS and the domain owner approved the cutover.
2. Take a database snapshot before running migrations. From a trusted terminal, set both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) securely to the same production database, then run:

   ```powershell
   npm ci
   npm run db:migrate:production
   npm run db:migrate:status:production
   ```

   `DIRECT_URL` is used by Prisma Migrate; both PostgreSQL URLs must be available to validate the schema. The initial migration creates the current production schema. Do not use `prisma db push` against production.
3. Generate the production Prisma Client and build/deploy through the Vercel project. The committed Vercel build command is `npm run build:production`; do not override it with the local SQLite build.
4. Create the first ADMIN after migrations, using the secure one-time command below. Do not run `npm run db:seed` on a production database; it contains local demo content and sample accounts.
5. Sign in at `/admin/login`, enter the store's actual Settings values, add approved products and Blog content, then verify the public pages and uploaded images.
6. Confirm the chosen canonical domain, TLS, `/robots.txt`, `/sitemap.xml`, login, database-backed pages, and an image upload before directing customers to the site. Complete the Figma comparison table above on mobile and desktop.

### First ADMIN (one-time)

Run this in an interactive terminal with `DATABASE_URL` and `DIRECT_URL` set securely to the same production PostgreSQL database. The script confirms the database host, asks for the email, reads the password without echoing it, requires a 16-character minimum and confirmation, hashes it, and refuses to create another bootstrap account if an ADMIN already exists.

```powershell
npm run db:create-admin:production
```

The supplied `admin@antjewelry.local` is a local-only example, not a production mailbox. Use the store owner's real email and keep the password in a password manager. Clear the database URLs from the shell environment after the operation. The generated Prisma Client is switched to PostgreSQL by this command; run `npm run db:generate` before returning to local SQLite development.

## Migration, backup, restore, and rollback

- **Before each production migration:** take a provider snapshot/PITR checkpoint, confirm the restore point, and record the deployment version. Apply only reviewed files under `prisma/postgresql/migrations/`.
- **Migration command:** `npm run db:migrate:production`. Check status with `npm run db:migrate:status:production`. Never edit a migration that has already been applied; add a forward migration.
- **Backup:** enable the provider's automated backups/PITR and test a scheduled logical backup. A manual custom-format backup can be made from a secure terminal:

  ```powershell
  pg_dump "$env:DIRECT_URL" --format=custom --file=ant-jewelry-production.dump
  ```

  Store backup files in protected backup storage, not in this repository or the deployment artifact.
- **Restore test:** restore the dump to a separate staging database first, then verify row counts, login, storefront pages, and image URLs. Never restore over production without owner approval because writes after the backup point will be lost.

  ```powershell
  pg_restore --clean --if-exists --no-owner --dbname="$env:DIRECT_URL" ant-jewelry-production.dump
  ```

- **Application rollback:** redeploy the previous Vercel deployment if its schema remains compatible. If a migration is not backward-compatible or data is corrupted, stop writes and use the provider's point-in-time restore after the owner approves the recovery point. Do not attempt to reverse an applied migration by editing its SQL.

## Production readiness checklist

- [ ] Vercel, PostgreSQL, and S3-compatible storage provisioned; production variables verified without exposing them.
- [ ] Approved production domain and cutover plan recorded.
- [ ] PostgreSQL migrations applied and status clean.
- [ ] First ADMIN created using a real owner email; sign-in verified.
- [ ] Store Settings, products, Blog, and image upload verified.
- [ ] Backup and restore procedure tested outside production.
- [ ] Figma ↔ production comparison completed for mobile and desktop.
