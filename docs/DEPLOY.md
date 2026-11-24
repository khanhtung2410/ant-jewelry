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
- PR #94 resize ảnh mới thành WebP ≤1600 px lúc lưu và phục vụ mọi `/uploads/...` dạng `unoptimized` (bỏ `/_next/image`).
- PR #98 lưu hash SHA-256 vào `ProductImageBlob.etag`: 304 đọc metadata trước, **không kéo blob**; hỗ trợ `W/"…"` và danh sách ETag.
- PR #102 xác định và sửa lỗi 400 do query `?v=2` (xem mục S3) bằng cách chỉnh `images.localPatterns` cho phép query string; lỗi 400 ban đầu trên Vercel với URL không query vẫn chưa rõ nguyên nhân; `unoptimized` khi đó chỉ là workaround. Từ 2026-11-20 ảnh upload đã đi qua optimizer sau khi đo lại trên production.
- PR #104–#106: E2E chạy được trên clone sạch, có thêm Pixel 7 + axe a11y, và smoke production chỉ đọc.
- PR #108: E2E chạy trong CI kèm artifact report/trace; ảnh chụp 1920 px bằng Playwright cho bảng R6.3.

**Đánh đổi (trade-offs):**

- **Dung lượng DB:** ảnh nằm trong `bytea`, làm tăng kích thước backup và thời gian `pg_dump`/PITR; không có bucket riêng để tách dữ liệu nhị phân.
- **Backup:** ảnh được backup cùng database (xem mục Migration/backup) — không cần backup filesystem riêng, nhưng restore DB là restore luôn ảnh.
- **Chi phí Function + DB khi CDN miss:** mỗi lần cache miss chạy một Function và một query kéo blob từ DB. Đã giảm bằng `Cache-Control: s-maxage=31536000, immutable` và ETag/304 (từ PR #98 đọc hash từ DB trước nên 304 không kéo bytes); vẫn cần theo dõi tỉ lệ cache HIT và số invocation.
- **Ảnh cũ trước #94:** vẫn là PNG gốc nếu chưa chạy script E1 bên dưới; từ #94 đến 2026-11-20 các URL `/uploads/` từng được phục vụ `unoptimized` nên ảnh cũ được trả nguyên kích thước. Đây là lý do E1 là việc bắt buộc, không phải tùy chọn, trên môi trường có ảnh upload cũ; sau lần đo 2026-11-20 ảnh upload đi qua optimizer và nhận bản nhỏ hơn.
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

- Vercel project connected to this repository (production environment). CLI nên dùng npm 10.9.9 (`packageManager`); npm 12 cũng được hỗ trợ vì `package.json` đã khai báo `allowScripts` cho `better-sqlite3`, `esbuild`, `prisma`, `@prisma/engines`. Kiểm tra lại bằng `npm install-scripts ls` sau mỗi lần nâng dependency.
- GitHub Environment `production` chứa bốn secret: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` và `DATABASE_URL` (chuỗi direct của Prisma Postgres). Chủ dự án đặt bằng `gh secret set --env production <name>`; không lưu giá trị trong repo và không đặt ở cấp repository. Environment `migration-approval` có required reviewer do chủ dự án cấu hình.
- PostgreSQL database reached through the direct connection string in `DATABASE_URL` (Prisma Postgres `db.prisma.io`, not `pooled.db.prisma.io`). The current schema and build do not use a second direct URL variable.
- A real, monitored owner email for the first ADMIN (not `admin@antjewelry.local`).
- Decide whether production starts empty or needs the demo catalogue. `npm run db:seed` is local SQLite only; production may use `npm run db:seed:production`, which seeds categories, products, blog posts, hero slides and settings but **never** the demo users.

## Environment variables (Vercel)

Set in Vercel **Production** (and Preview/Development as appropriate). Never commit values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for runtime and Prisma client generation; also mirrored as a direct string in the GitHub `production` Environment for build, status and migration |
| `AUTH_SECRET` | Yes | Random signing key for admin sessions (`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`) |
| `SITE_URL` | Yes | Canonical HTTPS origin for the deployment (e.g. `https://<project>.vercel.app`) |
| `DIRECT_URL` | No | Optional; not required by the current PostgreSQL schema/build. Provide only if your migration/tooling setup needs it |
| `PRODUCT_IMAGE_UPLOAD_DIR` | No | Legacy filesystem path used only to read/remove pre-migration uploads (default `./uploads`) |

`vercel.json` runs `npm run build:production`: it generates the PostgreSQL Prisma client, then runs `next build`. The build never changes the database schema. Migrations run as a separate, approved job in `.github/workflows/deploy.yml` before `vercel build` and `vercel deploy` (see "Migration gate and backward compatibility" below). Local dev/test use SQLite and write image bytes into that SQLite database's `ProductImageBlob` table — there is no filesystem upload path anymore; `PRODUCT_IMAGE_UPLOAD_DIR` only reads/removes legacy files from older versions.

### Deploy credentials (GitHub Environment `production`)

`vercel.json` tắt Git deployment, nên `.github/workflows/deploy.yml` là nơi duy nhất deploy production. Workflow đọc ba secret của Environment `production`:

| Secret | Purpose |
|---|---|
| `VERCEL_TOKEN` | Token của Vercel CLI |
| `VERCEL_ORG_ID` | ID team/user trên Vercel |
| `VERCEL_PROJECT_ID` | ID project trên Vercel |

Không đặt bốn giá trị này ở cấp repository. Chủ dự án đặt bằng `gh secret set --env production VERCEL_TOKEN` (tương tự các biến còn lại) và kiểm tra tên bằng `gh api repos/<owner>/<repo>/environments/production/secrets`. `AUTH_SECRET` vẫn chỉ nằm trong Vercel; workflow lấy qua `vercel pull --environment=production`. `SITE_URL` cũng được đặt trong Vercel cho canonical của app và được khai báo thêm làm **biến** (không phải secret) của Environment `production` bằng `gh variable set SITE_URL --env production`, để job `smoke` đọc `vars.SITE_URL`. Tuy nhiên `vercel pull` ghi `[SENSITIVE]` thay cho URL thật, nên `DATABASE_URL` từ Environment `production` được truyền vào `env` của mọi job dùng Prisma để build, kiểm tra trạng thái và migration không gặp lỗi P1013.

### Quyết định A3 — tắt toàn bộ Git deployment của Vercel

**Lựa chọn:** Vercel không tự deploy từ Git cho bất kỳ nhánh nào. Cấu hình trong `vercel.json`:

```json
"git": { "deploymentEnabled": false }
```

Production chỉ được deploy bởi `.github/workflows/deploy.yml`, chạy sau khi workflow `ci` trên `main` kết thúc thành công.

**Lý do:** Trước đây Preview dùng chung `DATABASE_URL` với Production và **không chạy migration** (trước C3, migration chỉ nằm trong build Production), nên một Server Action hoặc upload từ Preview có thể ghi vào dữ liệu thật. Tắt Preview ở cấp nền tảng loại bỏ đường ghi đó mà không cần thêm database hay secrets. Đồng thời, khi Git integration còn bật cho `main`, mỗi push lên `main` tạo deployment ngay, không chờ CI, nên một commit đỏ vẫn lên Production và có thể đã đổi schema. Chuyển trigger sang `workflow_run` của workflow `ci` là cách duy nhất bảo đảm chỉ commit đã xanh mới được deploy; job `verify-ci` còn so `github.event.workflow_run.head_sha` với tip hiện tại của `main` để không deploy commit cũ khi có push mới trong lúc CI đang chạy.

**Đánh đổi:** không còn URL preview tự động để reviewer xem thay đổi giao diện; dùng `npm run build` local, `npm run test:e2e` và `npm run test:screenshots` (6 ảnh desktop 1920px cho bảng R6.3) thay thế. Deploy production phụ thuộc GitHub Actions và ba secret trong Environment `production` (xem mục "Deploy credentials"); nếu workflow lỗi trước bước deploy, production giữ nguyên bản cũ.

Cấu hình có hiệu lực sau lần deploy đầu tiên áp dụng `vercel.json` mới; từ đó dashboard Vercel không còn deployment nguồn Git, chỉ có deployment do CLI tạo từ Actions. Nếu sau này bật lại Preview, bắt buộc cấp `DATABASE_URL` riêng (Neon branch) trước.

## Vercel deployment sequence

1. **Provision services**: PostgreSQL and Vercel project. Configure all environment variables above.
2. **Migrations** (separate gated job before deploy, manual commands when needed):
   ```bash
   npm ci
   npm run db:migrate:production
   npm run db:migrate:status:production
   ```
   A normal deploy applies pending migrations only after the `check-migrations` and `approval` jobs in `.github/workflows/deploy.yml`. `vercel build` itself only generates the Prisma client and compiles the app. The manual commands are useful for a first-time setup, a database created outside a deploy, or checking status. Run them from a trusted machine with `DATABASE_URL` set to the **direct** connection string (Prisma Postgres: `db.prisma.io`, not `pooled.db.prisma.io`). Do not use `prisma db push` on production.

   If `prisma migrate deploy` reports `P1001: Can't reach database server`, check the URL before the network: against Prisma Postgres, P1001 is also returned for stale/wrong credentials. Confirm with the `pg` probe below, and copy the current direct string from the Prisma Console (`npx vercel integration open prisma`).
   ```bash
   node -e "const{Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});c.connect().then(()=>{console.log('CONNECTED');return c.end()}).catch(e=>{console.log(e.code||'',e.message);process.exit(1)})"
   ```
3. **(Optional) Seed the demo catalogue** (before deploying, so the build prerenders real slugs):
   ```bash
   npm run db:seed:production
   ```
   Upserts the demo categories, products, blog posts, hero slides and settings from the mocks. It refuses a SQLite URL, skips the demo `admin@antjewelry.local` / `editor@antjewelry.local` accounts, and is safe to re-run. Use the **direct** `db.prisma.io` string. If you seed after a deploy, redeploy (or wait for the 15-minute revalidate) so cached empty pages are regenerated.
4. **Deploy** bằng GitHub Actions, không phải Git integration của Vercel:
   - Merge PR vào `main` sau khi bốn check `static`, `test`, `build`, `e2e` xanh. Workflow `ci` chạy lại trên `main`.
   - Khi `ci` kết thúc, `.github/workflows/deploy.yml` nhận event `workflow_run`; job `verify-ci` chỉ cho đi tiếp khi `conclusion == 'success'` và commit của run đúng là tip hiện tại của `main`.
   - Job `check-migrations` chạy trong Environment `production`, gọi `npm run db:migrate:status:production` qua `scripts/detect-pending-migrations.mjs` và xuất `pending` là `true` hoặc `false`. Nếu `pending = true`, job `approval` dừng tại Environment `migration-approval` (có required reviewer); reviewer xác nhận đã có snapshot/PITR rồi mới duyệt. Job `migrate` chạy sau đó, hoặc chạy ngay khi không có migration mới, nhưng chỉ áp dụng `npm run db:migrate:production` sau khi kiểm tra kết quả `check-migrations` là thành công.
   - Job `deploy` chạy trong Environment `production` với đúng ba lệnh:
     ```bash
     npx --yes vercel@66.6.0 pull --environment=production
     npx --yes vercel@66.6.0 build --prod
     npx --yes vercel@66.6.0 deploy --prebuilt --prod
     ```
     `vercel pull` lấy phần lớn biến runtime từ Vercel; GitHub giữ ba secret Vercel và `DATABASE_URL` direct vì file Vercel kéo về chỉ chứa `[SENSITIVE]`. Build dùng PostgreSQL Prisma client và không đổi schema. `generateStaticParams` cho blog/category/product trả params rỗng khi bảng chưa có (`P2021`) nên build vẫn xong trước khi có dữ liệu, nhưng migration phải được áp dụng để dữ liệu runtime đúng.
   - Không chạy `vercel --prod` tay từ máy cá nhân cho luồng thường; chỉ dùng khi rollback/khẩn cấp và ghi lại lý do.
   - Sau deploy, job `smoke` của workflow tự chạy `BASE_URL=${{ vars.SITE_URL }} npm run test:smoke:production` rồi làm checklist bước 6. Có thể chạy lại tay bằng `BASE_URL=https://ant-jewelry.vercel.app npm run test:smoke:production` để đối chiếu, xem mục "Deploy & rollback".
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

### Migration gate and backward compatibility

Migration chạy **trước** deploy vì mã mới có thể cần bảng hoặc cột chỉ tồn tại sau khi schema đổi. Nếu deploy trước rồi mới migrate, ứng dụng có thể truy vấn cấu trúc chưa có và trả lỗi cho người dùng ngay sau khi promotion. Việc tách migration khỏi `build:production` còn bảo đảm build lại không âm thầm đổi schema, và chỉ commit đã xanh CI mới được phép migrate.

Migration phải **tương thích ngược**: bản code đang chạy trên Production vẫn phải đọc/ghi được trên schema mới. Thực tế: thêm cột nullable hoặc có default, tạo bảng mới trước khi chuyển luồng đọc/ghi, không xoá cột hay đổi kiểu trong cùng một bản phát hành, và dời việc xoá dữ liệu sang một migration sau khi code mới chạy ổn định. Nhờ vậy, nếu smoke test hoặc giám sát bắt buộc rollback code, bản cũ vẫn làm việc trên schema đã migrate; rollback không cần đảo ngược migration và không làm mất dữ liệu. Không dùng `prisma db push` hay sửa migration đã áp dụng trên Production.

Trước mỗi migration, reviewer phải xác nhận có snapshot hoặc điểm PITR còn dùng được. Job `migrate` chỉ in commit SHA và lời nhắc này vì workflow không có credentials của provider để tự tạo snapshot; đây là cửa kiểm soát thủ công, không phải bước tự động giả tạo.

## Deploy & rollback

Chuỗi production bắt đầu sau khi workflow `ci` xanh trên `main`:

```text
ci (static, test, build, e2e xanh)
  -> deploy.yml: verify-ci (head SHA cua run phai la tip hien tai cua main)
  -> check-migrations (Environment production, output pending)
  -> approval (migration-approval, chi khi pending = true)
  -> migrate (prisma migrate deploy)
  -> deploy (production): vercel pull -> build --prod -> capture previous_url -> deploy --prebuilt --prod
  -> smoke (production): BASE_URL = vars.SITE_URL, npm run test:smoke:production
  -> rollback (if: failure())
  -> finalize (if: always(), red neu smoke khong success)
```

- Smoke chạy trên origin `SITE_URL`, không phải URL của deployment mới, vì assertion canonical trong `e2e/production.smoke.spec.ts` so sánh `BASE_URL + path` với `<link rel="canonical">` của app. URL deployment mới chỉ được lưu ở output `deployment_url` để đối chiếu; nó không được dùng làm `BASE_URL`.
- Trước khi promotion, job `deploy` đọc `npx --yes vercel@66.6.0 ls --prod --json`, chọn deployment `READY` đầu tiên và ghi vào output `previous_url`. Nếu bước này lỗi thì không có deployment mới nào được tạo.
- Job `rollback` chạy khi `deploy` hoặc `smoke` fail (`if: failure()`), dùng `npx --yes vercel@66.6.0 rollback "$PREVIOUS_URL" --yes` với `PREVIOUS_URL` lấy từ `needs.deploy.outputs.previous_url`. Job `finalize` vẫn đỏ nếu `needs.smoke.result != 'success'`, kể cả khi rollback xanh, nên run không bao giờ được coi là thành công sau một smoke fail.
- Migration chạy trước deploy và phải tương thích ngược (xem mục trước), nên rollback code không cần đảo ngược schema. Không dùng rollback thay cho backup/PITR khi dữ liệu đã bị ghi sai.

### Inspect the smoke artifact

- Trong Actions run của `deploy.yml`, mở job `smoke`, tab **Artifacts**, tải `playwright-report-smoke`. Step upload dùng `if: always()` nên artifact vẫn có khi smoke đỏ.
- Giải nén rồi mở `playwright-report/index.html` bằng trình duyệt; `test-results/` chứa trace và screenshot của test fail. `playwright.production.config.ts` dùng `[['list'], ['html', { open: 'never' }]]` để tạo report mà không tự mở trình duyệt trên runner.

### Manual rollback

Trên máy đã có ba biến môi trường của Environment `production` (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`):

```bash
export VERCEL_TOKEN=...
export VERCEL_ORG_ID=...
export VERCEL_PROJECT_ID=...
npx --yes vercel@66.6.0 ls --prod
npx --yes vercel@66.6.0 rollback <previous-url>
```

Chọn `<previous-url>` từ danh sách `vercel ls --prod`, đối chiếu với `previous_url` trong log của job `deploy` trước khi chạy. Sau rollback, chạy lại `BASE_URL=https://ant-jewelry.vercel.app npm run test:smoke:production` và ghi kết quả vào PR/phần recovery; nếu vẫn đỏ, chuyển sang forward-fix thay vì cố rollback lần nữa.

### Drill: smoke fail co y

`workflow_dispatch` của `deploy.yml` nhận ba input: `base_url` (origin dùng cho smoke), `previous_deployment_url` (URL rollback duy nhất của drill) và `simulate_failure` (bắt smoke step trả lỗi giả để diễn tập rollback). Ở chế độ này `verify-ci`, `check-migrations`, `approval`, `migrate` và `deploy` đều bị bỏ qua; smoke và rollback khai báo `environment: production` nên phải qua required reviewer của Environment này. Chỉ chạy drill khi có chủ dự án; không dùng input để thao tác trên deployment thật ngoài URL đã được cung cấp.

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

**Lỗi optimizer đã gặp và cách xử lý:** ảnh PNG ~3,8 MB upload ở lượt trên có lúc trả `400 INVALID_IMAGE_OPTIMIZE_REQUEST` qua `/_next/image?...&w=256&q=75` (`uniqueContextId not found`, kèm cảnh báo Permissions-Policy không liên quan từ trình duyệt). Ảnh mới được resize thành WebP ≤1600 px ngay khi lưu; ban đầu component dùng `shouldSkipImageOptimizer()` để phục vụ trực tiếp `/uploads/...`, nay đã bỏ skip sau khi đo lại. Cần phân biệt hai lỗi: (1) lỗi 400 khi URL ảnh có `?v=2` (xuất hiện sau E1) đã được xác định và sửa ở mục S3 bên dưới (`images.localPatterns` mặc định chặn query string); (2) lỗi `400 INVALID_IMAGE_OPTIMIZE_REQUEST` ban đầu trên Vercel xảy ra với URL **không có query string** (`/_next/image?url=%2Fuploads%2F…png&w=256`), kèm `uniqueContextId not found`, và **chưa rõ nguyên nhân**. `unoptimized` ban đầu là **workaround cho lỗi 400 chưa rõ nguyên nhân**, không phải tối ưu kích thước — chính nó bắt card/thumbnail tải bản lớn. Sau khi sửa `images.localPatterns` và đo production 2026-11-20 (optimizer trả 200 cho ảnh upload), `shouldSkipImageOptimizer` chỉ còn bỏ qua URL tuyệt đối bên ngoài; ảnh `/uploads/` đã đi qua optimizer.

### Migration ảnh legacy (E1)

Các blob cũ vẫn là PNG và có thể vượt ngân sách LCP trên mobile 4G. Chạy một lần trên từng môi trường:

```bash
#_local (file:./prisma/dev.db trong .env)_
npx tsx scripts/reencode-legacy-uploads.ts --dry-run
npx tsx scripts/reencode-legacy-uploads.ts

# production: đặt DATABASE_URL là chuỗi direct của Prisma Postgres, rồi chạy hai lệnh trên
```

Script import `resizeToStoredWebp()` từ `src/features/products/server/product-image-processing.ts` — cùng hàm với `uploadProductImage()` — nên chạy bằng `tsx`. Blob theo lô 50 (`storageKey` làm cursor, không tải mọi row vào RAM); với mỗi blob, việc ghi `bytes`/`contentType`/`etag` và đổi URL sang `?v=2` nằm trong **một `prisma.$transaction`** — dừng giữa chừng không để lại blob WebP với URL cũ (CDN immutable 1 năm). Script **giữ nguyên storage key** (đuôi `.png`). Vì nội dung đổi nhưng URL cũ có thể còn nằm trong CDN cache, script thêm `?v=2` vào `ProductImage.url` và lưu ETag mới (`ProductImageBlob.etag`); route `/uploads/[...path]` bỏ qua query, đọc hash từ DB trước và trả 304 **mà không kéo blob** khi `If-None-Match` khớp (hỗ trợ `W/"…"` và danh sách ETag). Với ảnh legacy chưa có hash, route tính từ bytes như cũ. Sau khi chạy, kiểm tra mọi ảnh `/uploads/...` trên trang sản phẩm có `size_download < 400000` và chạy lại Lighthouse mobile cho trang đó (dùng `/p/ivy-tennis-bracelet`, trang có ảnh upload thật).

**Kết quả kiểm chứng production 2026-11-19:** 4 ảnh `/uploads/...` trên `/p/ivy-tennis-bracelet` lần lượt 29.732 / 29.728 / 29.868 / 337.464 byte (đều <400 KB). Số Lighthouse của bộ ivy chỉ ghi tại [`docs/PERFORMANCE.md`](PERFORMANCE.md) mục "Đo lại production 2026-11-20 — lượt 3 (v4)"; báo cáo JSON nén trong [`docs/lighthouse-reports/`](lighthouse-reports/) (`prod-ivy-{1,2,3}.json.gz`). Các ảnh production được thay bằng giao diện ADMIN vì agent không có `DATABASE_URL` production; script ở trên vẫn là cách chuẩn để migrate các blob còn lại sau khi deploy.

### Đánh đổi E3: một kích thước cho mọi chỗ (đã đóng sau lần đo 2026-11-20)

Khi ảnh `/uploads/...` còn `unoptimized`, card sản phẩm, thumbnail 96 px và ảnh admin 88 px đều tải cùng một blob WebP đã resize (~1600 px hoặc ngưỡng 380 KB). **Lý do lúc đó là workaround cho lỗi 400 trên Vercel chưa rõ nguyên nhân, không phải tối ưu dung lượng** — ngược lại, chính `unoptimized` làm trang tăng theo số ảnh × kích thước blob. Sau khi sửa `images.localPatterns` và kiểm chứng production, ảnh upload đã đi qua optimizer nên đánh đổi này không còn.

**Số đo thực tế 2026-11-19** (production, `/c/other-jewelry` đang có 1 ảnh upload thật):

```text
page: /c/other-jewelry status=200 html=60994 bytes
image requests: 3 (2 mock svg: 6966 + 776 bytes; 1 upload: 337464 bytes)
total image bytes: 345206
upload image bytes: 337464 (≈97.8% tổng bytes ảnh)
cùng ảnh nếu có bản 480px webp q80: 98998 bytes (~96.6 KB, giảm ~70%)
```

Với 5 card upload thật cùng kích thước, phần ảnh sẽ ~1,7 MB thay vì ~0,5 MB nếu có bản 480 px.

**Kiểm chứng 2026-11-20:** trên production, ảnh `/uploads/...webp` ở `/p/ivy-tennis-bracelet` trả 337.464 byte; `/_next/image?url=…&w=256&q=75` trả **200, 13.350 byte** `image/jpeg` (giảm ~96%). Local production build cho kết quả tương tự (275.246 → 9.609 byte). Không có lỗi 400 nào xuất hiện ở hai môi trường, nên `isStoredUploadUrl` đã bị bỏ khỏi `shouldSkipImageOptimizer`. Phần đo 2026-11-19 ở trên giữ lại làm baseline của trạng thái `unoptimized`.

### Điều tra lỗi 400 INVALID_IMAGE_OPTIMIZE_REQUEST (S3 — nguyên nhân thật)

Bản ghi đầy đủ các bước systematic-debugging: [`docs/reviews/2026-11-19-systematic-debugging.md`](reviews/2026-11-19-systematic-debugging.md).

1. **Đọc error:** chuỗi `INVALID_IMAGE_OPTIMIZE_REQUEST` và `uniqueContextId not found` **không tồn tại trong mã nguồn Next.js 16.4.5** (`grep` toàn `node_modules/next` và `playwright-core` chỉ thấy `uniqueContextId` trong protocol type của Playwright). Next.js trả `400 "url" parameter is not allowed` (`image-optimizer.js:235-238`). Vậy chuỗi mentor thấy là của lớp Vercel edge, không phải của app.
2. **Tái hiện ổn định (local production build, `next start`):** truyền các biến thể vào inner `url` của `/_next/image?...&w=256&q=75`.

   | Inner `url` | Trước fix | Sau fix |
   |---|---|---|
   | `/mock/...webp` | 200 | 200 |
   | `/mock/...webp?v=2` | **400** | **200** |
   | `/mock/...webp?foo=bar` | **400** | **200** |
   | `/mock/...webp?` (query rỗng) | 200 | 200 |
   | `/mock/...webp` + outer `&cb=99` | 200 | 200 |
   | `/uploads/...?v=2` | **400** | 404 (key giả; đã tới bước fetch ảnh nguồn) |

3. **Pattern:** chỉ khác biệt là `search` của inner URL khác `""`. Dấu `?` rỗng cho `search === ""` nên vẫn 200 — khớp chính xác điều kiện so sánh trong Next.js.
4. **Root cause:** bản build của Next 16 chèn mặc định `images.localPatterns = [{ pathname: '**', search: '' }]` (đọc được trong `.next/required-server-files.json`). `match-local-pattern.js:25-28` so sánh `pattern.search !== url.search` → mọi local URL có query sẽ bị từ chối. Gọi trực tiếp `ImageOptimizerCache.validateParams()` với config build xác nhận: `?v=2`/`?foo=bar` -> `"url" parameter is not allowed`; không query và `?` -> OK.
5. **Giả thuyết bị bác:** file hỏng (sharp đọc được metadata); `w` vượt ảnh nguồn (w=1920 vẫn 200); kích thước file (PNG 3,97 MB từng 200); cold-start Vercel (lỗi tái hiện 100% local, không phải ngẫu nhiên).
6. **Fix root cause:** `next.config.ts` khai báo `images.localPatterns: [{ pathname: '**' }]` — bỏ trường `search` nên mọi path local được phép với mọi query. Config này cho phép optimizer xử lý `/uploads/...`; sau lần đo production 2026-11-20 (xem mục E3) skip đã được bỏ nên ảnh upload thực sự dùng optimizer. Test `src/test/image-optimizer-config.test.ts` chuyển từ đỏ sang xanh; HTTP repro ở bước 2 cũng xanh.
7. **Phần không tái hiện được:** URL không query kèm `uniqueContextId not found` của mentor vẫn là lớp edge Vercel; không ép lại được và không có trong source. Không giả vờ đã giải thích được phần này — ghi nhận là platform-specific, không ảnh hưởng fix ở trên.

## Production test hygiene (quy tắc bắt buộc)

Khi chạy thử nghiệm trên production (đăng nhập ADMIN test, upload ảnh, tạo/sửa sản phẩm, bài viết, hero slide, tài khoản tạm…):

1. Dọn dữ liệu thử ngay sau khi test bằng giao diện ADMIN (hoặc script được phê duyệt). Không để ảnh/test record nằm lại trên sản phẩm thật.
2. Nếu cần giữ một record làm bằng chứng cho checklist deploy (ví dụ ảnh upload để verify “sau redeploy ảnh vẫn hiện”), chỉ giữ **đúng một** và ghi rõ trong PR: sản phẩm nào, storage key/URL nào, kích thước và lý do giữ.
3. Mọi PR có test production phải có mục “Production cleanup” nêu lệnh/thao tác đã dọn và trạng thái còn lại. Không được chỉ dán output rồi bỏ dữ liệu thử.
4. Ưu tiên dùng một sản phẩm ẩn riêng cho test; nếu buộc dùng sản phẩm thật, phải dọn trước khi merge PR.

Ví dụ đã áp dụng 2026-11-19: trên `/p/ivy-tennis-bracelet`, 3 ảnh test trùng nội dung đã xóa; giữ lại đúng ảnh `/uploads/products/cmwk5l3wx002x84wmecz7pzfv/c2f7b4a5-02d7-463b-96e1-e9ac019a2f09.webp` (337.464 byte) làm bằng chứng redeploy cho R6.2b ý 4.

## Đối chiếu Figma ↔ production (6 màn)

Đối chiếu theo bản thiết kế Figma/đặc tả `ANT_JEWELRY_SAD_v1.1.docx` (**Figma gốc không có trong repo**, nên cột "Thiết kế" là mô tả từ SAD, chưa phải so sánh pixel). Sáu ảnh production bên dưới được tạo bằng `npm run test:screenshots` (Playwright, desktop **1920px**) ngày **2026-11-19**, nằm trong `docs/deploy-screenshots/`. Trước khi chụp, script đợi `networkidle` + font, **ép mọi ảnh local về `loading="eager"` rồi gọi `decode()`**, và assert `complete && naturalWidth > 0` cho từng ảnh — kể cả ảnh `loading="lazy"` dưới fold — nên không có vùng ảnh trống do chưa tải xong. Lệnh chụp và cách dùng cho R6.3 được ghi trong `README.md` mục 6 và `CONTRIBUTING.md` mục Screenshots.

| Màn hình | Thiết kế đối chiếu (SAD) | Production URL | Chỗ lệch / lý do | Ảnh production 1920px |
|---|---|---|---|---|
| Home | Hero 16:9, thanh điều hướng, carousel danh mục, khối BLOG | `/` | **Lệch đã biết:** mỗi carousel 5 card (đổi từ 10); chờ mentor duyệt. Ảnh mobile 940px cũ không thay thế được bản desktop này | [home-1920](deploy-screenshots/home-1920.png) |
| Danh mục | Header/filter, danh sách theo `ProductType`, sort, SEE MORE | `/c/wedding-ring` | Chưa phát hiện lệch so với SAD; chờ đối chiếu Figma gốc | [category-1920](deploy-screenshots/category-1920.png) |
| Chi tiết sản phẩm | Gallery ảnh chính + thumbnail, thông tin/giá, YOU MIGHT ALSO LIKE | `/p/aurora-band` | Chưa phát hiện lệch so với SAD; trang dùng ảnh mock (không đại diện ảnh upload) | [product-1920](deploy-screenshots/product-1920.png) |
| Sản phẩm + Contact popover | Nút ORDER NOW mở dialog CONTACT US (phone/Facebook/Instagram) | `/p/aurora-band` (bấm ORDER NOW) | Màn này trước đây bị thiếu trong bảng; đã chụp từ dialog thật, không phải chèn tay | [product-contact-popover-1920](deploy-screenshots/product-contact-popover-1920.png) |
| Blog list | Tiêu đề, danh sách bài có ảnh bìa/tóm tắt, phân trang | `/blog` | Chưa phát hiện lệch so với SAD; chờ đối chiếu Figma gốc | [blog-list-1920](deploy-screenshots/blog-list-1920.png) |
| Blog chi tiết | Tiêu bài, ảnh bìa above-the-fold, Markdown, OTHER BLOGS | `/blog/cach-chon-nhan-cuoi-phu-hop` | **Lệch đã biết:** khối OTHER BLOGS chỉ 1 bài theo Figma | [blog-detail-1920](deploy-screenshots/blog-detail-1920.png) |

Ảnh admin (`admin-login.png`, `admin-logged-in.png`) vẫn nằm trong cùng thư mục nhưng **không tính vào 6 màn R6.3** theo checklist đợt 4. Cột "Chỗ lệch / lý do" chỉ ghi những gì đã kiểm chứng được; các ô "chờ đối chiếu Figma gốc" không được tự đánh dấu khớp khi chưa có file thiết kế.

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
  pg_dump "$DATABASE_URL" --format=custom --file=ant-jewelry-production.dump
  ```
  Keep dumps in protected backup storage (not in repo/artifacts). Uploaded image bytes are part of the PostgreSQL database, so the same backup/PITR covers them; no separate filesystem backup is needed.
- **Restore:** restore to staging first, verify data/login/pages/images, then follow approved recovery procedure for production. Redeploy previous Vercel build only when schema remains compatible.

## Current deployment status (verified)

- **Storefront:** https://ant-jewelry.vercel.app/ (HTTP 200 at time of check, 2026-11-17; re-checked 2026-11-19 by the read-only smoke suite)
- **Admin:** https://ant-jewelry.vercel.app/admin (redirects to login as expected for unauthenticated access)
- **Lighthouse production:** số liệu mới nhất (v4, 2026-11-20) và toàn bộ lịch sử đo chỉ nằm tại [`docs/PERFORMANCE.md`](PERFORMANCE.md) mục "Đo lại production 2026-11-20 — lượt 3 (v4)". File này không chép lại số.
- **Smoke production 2026-11-19:** `BASE_URL=https://ant-jewelry.vercel.app npm run test:smoke:production` → **8/8 pass**: 6 màn public trả 200, đúng 1 `h1`, canonical đúng; ảnh `/uploads/` trên `/p/ivy-tennis-bracelet` có ETag và < 400 KB; `robots.txt` / `sitemap.xml` đúng. Chạy lệnh này sau mỗi lần deploy và dán output vào PR production.
- **A11y / mobile 2026-11-19 → 2026-11-20:** E2E local 43 test (29 desktop + 14 pixel-7): 6 test axe public trong `e2e/accessibility.spec.ts` (chạy ở cả 2 project) và 6 test axe admin trong `e2e/admin-a11y.spec.ts` (desktop), đều **0 lỗi serious/critical**; 2 test upload ảnh ADMIN (progress toast, 3 request 201, WebP < 400 KB có ETag/304, chặn file > 4 MB). `npm run test:screenshots` tạo 6 ảnh 1920px đã dùng cho bảng R6.3 ở trên.

## Production readiness checklist (kèm bằng chứng)

| Item | Trạng thái | Bằng chứng / nội dung cần đính kèm |
|---|---|---|
| Vercel deployment accessible | [x] | 6 URL public + `/admin/login` trả 200 ngày 2026-11-18; ảnh chụp trong [`docs/deploy-screenshots/`](deploy-screenshots/) |
| Vercel + PostgreSQL provisioned, env vars đúng, không lọt secret | [ ] | Cần ảnh/xuất danh sách biến trong Vercel dashboard (đã che giá trị). Repo chỉ có `.env.example`; production render được dữ liệu → gián tiếp chứng tỏ `DATABASE_URL` hoạt động |
| `SITE_URL` đúng origin production | [x] | `curl https://ant-jewelry.vercel.app/` có `<link rel="canonical" href="https://ant-jewelry.vercel.app"/>` (6 lần xuất hiện origin trong HTML) |
| A3 — không còn deploy tự động từ Git, chỉ Actions sau CI | [x] (repo) / [ ] (live) | `vercel.json` đặt `git.deploymentEnabled = false`; `.github/workflows/deploy.yml` chỉ chạy từ `workflow_run` của `ci` trên `main`, có guard SHA. Bằng chứng repo: `src/test/deploy-workflow.test.ts`. Bằng chứng live (dashboard Vercel không còn deployment nguồn Git, một run Actions CI → deploy) cần chủ dự án cung cấp sau khi merge và đặt ba secret Environment |
| Migration đã áp dụng, status sạch | [ ] | Cần output thật của `npm run db:migrate:status:production` (chạy với `DATABASE_URL` direct). Không thể tự lấy từ môi trường agent |
| Script E1/B6 backfill ảnh legacy đã chạy | [ ] | Bắt buộc nếu DB có blob cũ: chạy `npx tsx scripts/reencode-legacy-uploads.ts --dry-run` rồi lệnh thật với `DATABASE_URL` direct; dán output số blob + ETag mới. Cho đến khi chạy, các blob có `etag = NULL` vẫn phải đọc bytes để trả 304 (đúng nhưng chậm hơn). Không nằm trong `prisma migrate deploy` vì cần sharp + cập nhật URL `?v=2` |
| ADMIN đầu tiên bằng email thật | [ ] | Cần ảnh trang admin sau khi đăng nhập bằng tài khoản ADMIN vừa tạo (`db:create-admin:production`) |
| 6 màn R6.3 mở được + ảnh đối chiếu | [x] | Bảng đối chiếu ở trên: 6 ảnh 1920px từ `npm run test:screenshots` (2026-11-19); smoke production 8/8 pass cùng ngày; admin/login vẫn có ảnh riêng nhưng không tính vào 6 màn |
| E2E + a11y + smoke chạy được trên clone sạch / CI | [x] | `npm run test:e2e` 43 pass (29 desktop + 14 pixel-7; axe 0 serious/critical trên 6 màn public + 6 dialog/form admin, 2 test upload ảnh ADMIN); job `e2e` trong `.github/workflows/ci.yml` upload report/trace khi fail; smoke production 8/8 pass |
| Upload ảnh qua redeploy vẫn còn | [ ] | Cần ảnh `/p/<slug>` có ảnh `/uploads/...` **trên production sau redeploy**. Bằng chứng local (production build): [`docs/a1-screenshots/product-after-upload.png`](a1-screenshots/product-after-upload.png), upload ~4 MB + batch 3 ảnh vào DB rồi restart `next start` → ảnh vẫn 200 |
| Backup/restore đã test | [ ] | Quy trình/pg_dump được mô tả ở mục Migration/backup; chưa có bản ghi test restore ngoài production |

**Bằng chứng local đã có** (không thay thế bằng chứng production): admin đăng nhập và các thao tác xác nhận/upload trong [`docs/ux-screenshots/`](ux-screenshots/), ảnh sản phẩm sau upload trong [`docs/a1-screenshots/`](a1-screenshots/), báo cáo Lighthouse 3 lần trong [`docs/lighthouse-reports/`](lighthouse-reports/). Các ô còn `[ ]` chỉ được tick khi mentor đính kèm output/ảnh tương ứng từ Vercel — không tự tick khi chưa có bằng chứng.
