# Production deployment and operations

## Overview

Production target: **Vercel** (Next.js) + **PostgreSQL**. Uploaded product image bytes are stored in the application database (`ProductImageBlob`) and served from `/uploads/...`.

**Important:** on Vercel the deployment root is read-only and `/tmp` is discarded between instances, so the app never writes uploads to `cwd/uploads`. The database is the durable local store; `PRODUCT_IMAGE_UPLOAD_DIR` is only a legacy read path for files uploaded by older versions. The production migration `20261118100000_add_product_image_blobs` creates the new table.

`npm install` / `npm ci` run a `postinstall` script that executes `prisma generate` with a harmless local SQLite default when `DATABASE_URL` is not set yet. Pulling a commit with a new Prisma model, then running `npm install` and `npm test`, therefore works without manually generating the client. The Vitest global setup also removes `prisma/test.db` plus any `-wal`, `-shm` and `-journal` companions before each run so stale pages cannot leak between runs.

## Storage decision record: product images in Postgres

**Quyết định:** bytes ảnh sản phẩm được lưu trong bảng `ProductImageBlob` của chính database ứng dụng (PostgreSQL ở production, SQLite ở local/test) và phục vụ qua `/uploads/<storageKey>`.

**Lịch sử quyết định:**

- PR #61 (R6.2) từng thêm storage S3/R2 (`@aws-sdk/client-s3`, biến `S3_*`, URL public của bucket) để ảnh sống qua redeploy.
- PR #62 revert lại toàn bộ workflow S3/R2 theo yêu cầu giữ luồng lưu trữ local/không thêm nhà cung cấp và secrets ngoài; code/docs trở về filesystem `PRODUCT_IMAGE_UPLOAD_DIR`.
- PR #84 chuyển "local" sang **DB-backed local blobs**: Vercel có `cwd/uploads` chỉ đọc và `/tmp` mất khi đổi instance, nên filesystem không bền; database thì đã có sẵn và được backup. Không còn dependency hay biến `S3_*` nào trong repo.
- PR #86 giới hạn 4 MB/file, gửi từng file một (Vercel Function ~4,5 MB/body) và thêm `s-maxage` + ETag cho `/uploads/[...path]`.

**Đánh đổi (trade-offs):**

- **Dung lượng DB:** ảnh nằm trong `bytea`, làm tăng kích thước backup và thời gian `pg_dump`/PITR; không có bucket riêng để tách dữ liệu nhị phân.
- **Backup:** ảnh được backup cùng database (xem mục Migration/backup) — không cần backup filesystem riêng, nhưng restore DB là restore luôn ảnh.
- **Chi phí Function + DB khi CDN miss:** mỗi lần cache miss chạy một Function và một query kéo blob từ DB. Đã giảm bằng `Cache-Control: s-maxage=31536000, immutable` và ETag/304; vẫn cần theo dõi tỉ lệ cache HIT và số invocation.
- **Đổi lấy:** không thêm vendor/secrets, ít cấu hình hơn, nhất quán giữa local và production, ảnh tồn tại qua redeploy.

**Giới hạn sẽ theo dõi (review định kỳ):**

| Chỉ số | Ngưỡng hiện tại / cần theo dõi |
|---|---|
| Kích thước 1 file | Tối đa 4 MB (cứng trong code, do giới hạn body Vercel) |
| Số file chọn 1 lần | Tối đa 10, gửi tuần tự từng request |
| Tổng dung lượng blob | Cảnh báo ở 500 MB, review ở 1 GB (hoặc thấp hơn tùy gói DB); xem SQL dưới đây |
| Cache HIT ratio của `/uploads/*` | Theo dõi `x-vercel-cache`; nếu HIT thấp kéo dài → review lại thiết kế |
| Function invocations / DB read | Theo dõi sau mỗi đợt upload lớn; nếu tăng bất thường → kiểm tra header cache |

```sql
-- PostgreSQL: tổng số ảnh và dung lượng blob
SELECT count(*) AS images, pg_size_pretty(coalesce(sum(length(bytes)), 0)::bigint) AS total_bytes
FROM "ProductImageBlob";
```

Nếu vượt ngưỡng dung lượng hoặc cache HIT không cải thiện, mở lại phương án object storage (S3/R2) như một quyết định mới — không tự động bật lại trong PR này.

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

`vercel.json` runs `npm run build:production`: it generates the PostgreSQL Prisma client, applies pending migrations on **Production** Vercel builds (`scripts/migrate-production.mjs` → `prisma migrate deploy`), then runs `next build`. Local builds skip migrations. A production build now fails if the database is unreachable instead of deploying an app with no schema. Migrations can still be run manually (see below). Local dev/test use SQLite and write image bytes into that SQLite database's `ProductImageBlob` table — there is no filesystem upload path anymore; `PRODUCT_IMAGE_UPLOAD_DIR` only reads/removes legacy files from older versions.

> ⚠️ **Rủi ro Preview dùng chung DB Production:** Preview hiện không chạy migration và trỏ tới cùng `DATABASE_URL` với Production. Một Server Action hoặc upload từ Preview có thể **ghi vào dữ liệu thật**. Các lựa chọn: (1) tách database riêng cho Preview (`DATABASE_URL` theo environment), (2) tắt Preview deploy, hoặc (3) nếu bắt buộc giữ như hiện tại, chỉ dùng Preview để xem và **không thực hiện thao tác ghi**; mọi mutation phải được kiểm tra trong checklist bàn giao. Đây là rủi ro đã biết, chưa được khắc phục bằng cấu hình trong repo.

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
   - Upload one image near 4 MB and a batch of three images in admin (the UI sends them one per request) and confirm all display; bytes come from `ProductImageBlob`, so they survive a redeploy.
   - `curl -I` an uploaded `/uploads/...` URL twice: expect an `etag` and `x-vercel-cache: HIT` on the second request. A repeat request with matching `If-None-Match` should return 304. (Vercel rewrites `cache-control` on the edge to `public, max-age=31536000, immutable`; the `s-maxage` value is set by the app but is not echoed back in the response headers.)
   - Check `/robots.txt`, `/sitemap.xml`, and canonical/`SITE_URL` behavior.

### Bằng chứng upload thật trên production (2026-11-18)

Đăng nhập `/admin` bằng tài khoản ADMIN test, mở sản phẩm Ivy Tennis Bracelet (`/p/ivy-tennis-bracelet`), upload 1 ảnh PNG 3.78 MB rồi chọn 3 ảnh cùng lúc (UI gửi tuần tự từng file):

```text
admin login: https://ant-jewelry.vercel.app/admin
large image (~3.78 MB): 1 image(s) uploaded
batch of 3 images: 3 image(s) uploaded
upload API responses: 201 / 201 / 201 / 201
product page: status=200 contains uploaded key=true
HEAD 1: status=200 cache-control=public, max-age=31536000, immutable etag="77157c..." x-vercel-cache=MISS
HEAD 2: status=200 x-vercel-cache=HIT
HEAD 3 (If-None-Match): status=304 x-vercel-cache=HIT
```

Ảnh chụp: [admin đã đăng nhập](deploy-screenshots/admin-logged-in.png), [danh sách ảnh sau upload](deploy-screenshots/admin-uploaded-images.png), [trang sản phẩm có ảnh upload](deploy-screenshots/product-with-uploaded-image.png), [Home](deploy-screenshots/home.png), [sản phẩm](deploy-screenshots/product.png). Chưa tự phát động redeploy Production từ môi trường agent; ảnh nằm trong DB nên bước còn lại là xác nhận sau lần deploy tiếp theo.

**Lỗi optimizer đã gặp và cách xử lý:** ảnh PNG ~3,8 MB upload ở lượt trên có lúc trả `400 INVALID_IMAGE_OPTIMIZE_REQUEST` qua `/_next/image?...&w=256&q=75` (`uniqueContextId not found`, kèm cảnh báo Permissions-Policy không liên quan từ trình duyệt). Ảnh đã được upload mới sẽ được resize thành WebP ≤1600 px ngay khi lưu và component dùng `shouldSkipImageOptimizer()` để phục vụ trực tiếp `/uploads/...`, không còn phụ thuộc vào image optimizer.

### Migration ảnh legacy (E1)

Các blob cũ vẫn là PNG và có thể vượt ngân sách LCP trên mobile 4G. Chạy một lần trên từng môi trường:

```bash
#_local (file:./prisma/dev.db trong .env)_
node scripts/reencode-legacy-uploads.mjs --dry-run
node scripts/reencode-legacy-uploads.mjs

# production: đặt DATABASE_URL là chuỗi direct của Prisma Postgres, rồi chạy hai lệnh trên
```

Script dùng chung `resizeToStoredWebp()` với `uploadProductImage()`, ghi đè `bytes`/`contentType` và **giữ nguyên storage key** (đuôi `.png`). Vì nội dung đổi nhưng URL cũ có thể còn nằm trong CDN cache, script thêm `?v=2` vào `ProductImage.url`; route `/uploads/[...path]` bỏ qua query và ETag được tính lại từ bytes mới ở mỗi request. Sau khi chạy, kiểm tra mọi ảnh `/uploads/...` trên trang sản phẩm có `size_download < 400000` và chạy lại Lighthouse mobile cho trang đó (dùng `/p/ivy-tennis-bracelet`, trang có ảnh upload thật).

**Kết quả kiểm chứng production 2026-11-19:** 4 ảnh `/uploads/...` trên `/p/ivy-tennis-bracelet` lần lượt 29.732 / 29.728 / 29.868 / 337.464 byte (đều <400 KB). Lighthouse mobile 3 lần: 93 / 91 / 100 → trung vị Performance **93**, Accessibility 100, SEO 100; báo cáo JSON trong [`docs/lighthouse-reports/`](lighthouse-reports/) (`prod-ivy-{1,2,3}.json`). Các ảnh production được thay bằng giao diện ADMIN vì agent không có `DATABASE_URL` production; script ở trên vẫn là cách chuẩn để migrate các blob còn lại sau khi deploy.

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
- **Lighthouse (production, 2026-11-18, 3 recorded runs after a discarded warm-up, mobile):** Home median Performance 95 / Accessibility 96 / SEO 100; product `/p/aurora-band` median Performance 97 / Accessibility 100 / SEO 100. Raw scores and JSON reports for all three runs are linked in `docs/PERFORMANCE.md`.

## Production readiness checklist (kèm bằng chứng)

| Item | Trạng thái | Bằng chứng / nội dung cần đính kèm |
|---|---|---|
| Vercel deployment accessible | [x] | 6 URL public + `/admin/login` trả 200 ngày 2026-11-18; ảnh chụp trong [`docs/deploy-screenshots/`](deploy-screenshots/) |
| Vercel + PostgreSQL provisioned, env vars đúng, không lọt secret | [ ] | Cần ảnh/xuất danh sách biến trong Vercel dashboard (đã che giá trị). Repo chỉ có `.env.example`; production render được dữ liệu → gián tiếp chứng tỏ `DATABASE_URL` hoạt động |
| `SITE_URL` đúng origin production | [x] | `curl https://ant-jewelry.vercel.app/` có `<link rel="canonical" href="https://ant-jewelry.vercel.app"/>` (6 lần xuất hiện origin trong HTML) |
| Migration đã áp dụng, status sạch | [ ] | Cần output thật của `npm run db:migrate:status:production` (chạy với `DATABASE_URL` direct). Không thể tự lấy từ môi trường agent |
| ADMIN đầu tiên bằng email thật | [ ] | Cần ảnh trang admin sau khi đăng nhập bằng tài khoản ADMIN vừa tạo (`db:create-admin:production`) |
| 6 màn public + admin mở được | [x] | Bảng đối chiếu Figma ↔ production ở trên, 6 ảnh chụp kèm HTTP 200 |
| Upload ảnh qua redeploy vẫn còn | [ ] | Cần ảnh `/p/<slug>` có ảnh `/uploads/...` **trên production sau redeploy**. Bằng chứng local (production build): [`docs/a1-screenshots/product-after-upload.png`](a1-screenshots/product-after-upload.png), upload ~4 MB + batch 3 ảnh vào DB rồi restart `next start` → ảnh vẫn 200 |
| Backup/restore đã test | [ ] | Quy trình/pg_dump được mô tả ở mục Migration/backup; chưa có bản ghi test restore ngoài production |

**Bằng chứng local đã có** (không thay thế bằng chứng production): admin đăng nhập và các thao tác xác nhận/upload trong [`docs/ux-screenshots/`](ux-screenshots/), ảnh sản phẩm sau upload trong [`docs/a1-screenshots/`](a1-screenshots/), báo cáo Lighthouse 3 lần trong [`docs/lighthouse-reports/`](lighthouse-reports/). Các ô còn `[ ]` chỉ được tick khi mentor đính kèm output/ảnh tương ứng từ Vercel — không tự tick khi chưa có bằng chứng.
