# ANT JEWELRY

Website giới thiệu trang sức cho ANT JEWELRY. Khách hàng duyệt danh mục, sản phẩm và Blog,
sau đó liên hệ trực tiếp với cửa hàng qua số điện thoại, Facebook hoặc Instagram. Website
không có giỏ hàng, thanh toán online hay biểu mẫu liên hệ.

Khu vực `/admin` cho phép ADMIN và EDITOR quản lý sản phẩm, ảnh, danh mục, Blog, hero
slides, Settings và người dùng. Toàn bộ nội dung công khai đọc từ database qua Prisma.

## 1. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Ngôn ngữ | TypeScript strict |
| Styling | Tailwind CSS v4, design tokens trong `src/app/globals.css` |
| Database / ORM | Prisma 7; SQLite cho local/test, PostgreSQL cho production |
| Validation | Zod |
| Authentication | JWT ký bằng `AUTH_SECRET`, lưu trong cookie `httpOnly` |
| Test | Vitest (unit), Playwright (E2E) |
| Lint / Format | ESLint 9, Prettier 3 |

Ứng dụng là **một Next.js project duy nhất**: Server Components cho phần đọc, Server
Actions cho mutation, Route Handlers cho upload ảnh sản phẩm. Không có backend REST riêng.

## 2. Chạy local từ clone mới

Yêu cầu: **Node.js 22** (xem `engines.node` trong `package.json`), **npm 10 trở lên** (đã kiểm chứng cả npm 12) và **Git**. `packageManager` ghi npm 10.9.9 để corepack dùng phiên bản thống nhất; nếu dùng trực tiếp npm 12 thì vẫn chạy được vì `allowScripts` đã được khai báo trong `package.json` cho các dependency cần install script (`better-sqlite3`, `esbuild`, `prisma`, `@prisma/engines`). Khi nâng cấp dependency, chạy `npm install-scripts ls` để xem script nào cần phê duyệt mới.

```bash
git clone https://github.com/khanhtung2410/ant-jewelry.git
cd ant-jewelry
npm install
```

### 2.1. Tạo file môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền tối thiểu:

```dotenv
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="<chuỗi random>"
```

> **Vì sao là `.env` mà không phải `.env.local`?**
> Next.js đọc cả `.env` và `.env.local`, nhưng **Prisma CLI chỉ đọc `.env`**. Nếu chỉ tạo
> `.env.local`, các lệnh `npm run db:push` / `npm run db:seed` sẽ không thấy `DATABASE_URL`.
> Dùng `.env` cho cả hai, hoặc nạp `.env.local` vào Prisma bằng
> `dotenv -e .env.local -- npx prisma ...` nếu dự án của bạn đã cài `dotenv-cli`.
> `prisma.config.ts` nạp `.env` qua gói `dotenv` (đã khai báo trong `package.json`).

Tạo `AUTH_SECRET` bằng:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Các biến trong `.env.example`:

| Biến | Bắt buộc (local) | Ghi chú |
|---|---:|---|
| `DATABASE_URL` | Có | `file:./prisma/dev.db` cho local; PostgreSQL cho production |
| `AUTH_SECRET` | Có | Khóa ký session admin; không commit giá trị thật |
| `SITE_URL` | Không | Mặc định `http://localhost:3000`; đặt origin thật khi deploy |
| `PRODUCT_IMAGE_UPLOAD_DIR` | Không | Chỉ đường dẫn legacy để đọc/dọn ảnh upload trước khi chuyển sang DB |

`.env` và `.env.local` đã nằm trong `.gitignore`; chỉ `.env.example` được commit.

### 2.2. Khởi tạo database và seed dữ liệu mẫu

```bash
npm run db:push
npm run db:generate
npm run db:seed
```

- `db:push` tạo schema SQLite từ `prisma/schema.prisma` (file `prisma/dev.db`).
- `npm install` / `npm ci` đã tự chạy `postinstall` → `prisma generate`, nên client luôn có model mới sau khi pull. Với Prisma 7, `db push` **không** tự generate; khi đổi schema trong lúc đang dev thì chạy thêm `npm run db:generate`.
- `db:seed` nạp danh mục, sản phẩm, Blog, hero slides, Settings và hai tài khoản mẫu.
- Seed chỉ chạy với SQLite (`DATABASE_URL` bắt đầu bằng `file:`) và từ chối database khác.

Tài khoản local sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| ADMIN | `admin@antjewelry.local` | `Admin@123` |
| EDITOR | `editor@antjewelry.local` | `Editor@123` |

Đây là tài khoản demo, không dùng cho production.

### 2.3. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000); admin ở
[http://localhost:3000/admin/login](http://localhost:3000/admin/login).

### 2.4. Chạy bản production tại máy local

```bash
npm run build
npm run start
```

`npm run build` dùng Prisma Client SQLite đã generate cho local. Production thật dùng
`npm run build:production` (xem mục 7).

## 3. Scripts

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Dev server có hot reload |
| `npm run build` / `npm run start` | Build và chạy bản production local |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit test (dùng database test riêng) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E; tự reset DB E2E và chạy `next build && next start` |
| `npm run test:smoke:production` | Smoke production chỉ đọc, dùng `BASE_URL` (chạy sau mỗi deploy) |
| `npm run test:screenshots` | Chụp 6 ảnh desktop 1920px cho bảng R6.3 (Playwright) |
| `npm run format` / `npm run format:check` | Prettier ghi / kiểm tra |
| `npm run db:push` | Đồng bộ schema SQLite local |
| `npm run db:seed` | Nạp dữ liệu mẫu SQLite local |
| `npm run db:seed:production` | Nạp catalogue PostgreSQL production (không tạo user demo) |
| `npm run db:generate` | Generate Prisma Client cho SQLite (bắt buộc sau `db:push`) |
| `npm run db:generate:production` | Generate Prisma Client cho PostgreSQL |
| `npm run db:migrate:production` | `prisma migrate deploy` cho production |
| `npm run db:migrate:status:production` | Kiểm tra trạng thái migration production |
| `npm run db:create-admin:production` | Tạo ADMIN đầu tiên cho production |
| `npm run build:production` | Generate client PostgreSQL rồi build |

## 4. Cấu trúc dự án

```text
ant-jewelry/
├── src/
│   ├── app/
│   │   ├── (public)/           # Trang khách hàng: /, /c/[slug], /p/[slug], /blog, ...
│   │   ├── admin/
│   │   │   ├── (auth)/login/   # Đăng nhập admin
│   │   │   └── (dashboard)/    # products, categories, blog, hero-slides, settings, users
│   │   ├── api/admin/          # Route Handler upload ảnh sản phẩm
│   │   └── uploads/            # Phục vụ blob ảnh từ ProductImageBlob (legacy: filesystem cũ)
│   ├── features/
│   │   ├── admin/              # Khung admin dùng chung
│   │   ├── auth/               # Session, login, rate limit
│   │   ├── blog/               # Trang Blog, admin form, query
│   │   ├── layout/             # Header, footer, hero slider, Settings
│   │   ├── products/           # Storefront, admin sản phẩm/danh mục, upload ảnh
│   │   ├── settings/           # Thông tin cửa hàng
│   │   ├── shared/             # Domain types, Prisma client, query dùng chung, validation
│   │   └── users/              # Quản lý người dùng admin
│   └── constants/              # Role, status dùng chung
├── prisma/
│   ├── schema.prisma           # Schema SQLite cho local/test
│   ├── seed.ts                 # Dữ liệu mẫu local
│   └── postgresql/             # Schema + migrations PostgreSQL cho production
├── e2e/                        # Playwright specs
├── docs/                       # Tài liệu dự án
├── public/                     # Static assets
├── vitest.config.mts           # Cấu hình Vitest
├── playwright.config.ts        # Cấu hình Playwright
└── package.json
```

Mỗi feature tự chứa `components/`, `actions/` (hoặc `actions.ts`), `queries/`,
`lib/`, `mocks/` và test đặt cạnh code. Trang trong `src/app` chủ yếu compose feature,
không truy cập Prisma trực tiếp.

## 5. Database và Prisma

- Local/test: `prisma/schema.prisma` với SQLite. Quy ước duy nhất: các URL
  `file:./prisma/dev.db`, `file:./prisma/test.db`, `file:./prisma/e2e.db` được resolve
  từ gốc repo bởi cả Prisma CLI lẫn PrismaClient (driver adapter), nên mỗi môi trường
  chỉ có đúng một file DB trong `prisma/`.
- Production: `prisma/postgresql/schema.prisma` và migrations trong
  `prisma/postgresql/migrations/`.
- `src/features/shared/db/prisma.ts` giữ một `PrismaClient` dùng chung.
- Ảnh sản phẩm upload được resize về WebP (tối đa 1600 px, tự giảm dần đến khi ≤380 KB) rồi lưu
  dưới dạng blob trong `ProductImageBlob`, phục vụ qua `/uploads/...` đi qua `/_next/image`
  (`images.localPatterns` cho phép mọi path local, kể cả query `?v=2`). Chỉ URL tuyệt đối http(s)
  do admin nhập mới bị bỏ qua optimizer (`shouldSkipImageOptimizer` trong
  `src/features/shared/lib/image-url.ts`). Ảnh vẫn còn sau redeploy.
  `PRODUCT_IMAGE_UPLOAD_DIR` chỉ dùng để đọc/dọn ảnh legacy từ bản filesystem cũ.
- Ảnh cũ còn lưu dạng PNG có thể migrate một lần bằng
  `npx tsx scripts/reencode-legacy-uploads.ts --dry-run` (xem trước) rồi bỏ `--dry-run` để ghi.
  Script import hàm resize từ `src/features/products/server/product-image-processing.ts`, cùng
  hàm với upload (không còn import từ `scripts/`), cập nhật bytes/contentType và thêm `?v=2` vào
  URL ảnh để CDN không trả nội dung cũ; ETag được tính lại từ bytes mới ở mỗi request.

Sau khi đổi schema local, chạy `npm run db:push` và `npm run db:generate` nếu Prisma Client
chưa được cập nhật. Không dùng `prisma db push` cho production.

## 6. Kiểm thử

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
npm run test:e2e
```

- **Unit test** dùng Vitest, đặt cạnh code trong `src/**/*.test.ts(x)`.
- `npm test` chạy trên `prisma/test.db` nhờ `vitest.setup.ts`; global setup kiểm tra đường dẫn,
  xoá đúng file test, tạo schema bằng `prisma db push` (không dùng `--force-reset`) rồi seed.
  Cách này chạy được cả khi AI agent bị Prisma chặn lệnh reset, và **không đụng `prisma/dev.db`**.
- **E2E** dùng Playwright. `playwright.config.ts` gọi `e2e/reset-database.ts`: script kiểm tra
  `E2E_DATABASE_URL` trỏ đúng `prisma/e2e.db`, xoá đúng file đó (kèm `-wal`/`-shm`/`-journal`),
  rồi chạy `prisma db push` + `db seed` **không dùng `--force-reset`** (Prisma 7 chặn cờ này với
  AI agent). Sau đó build production và chạy `next start` trên `http://127.0.0.1:3100`, nên E2E
  kiểm tra đúng bundle production và không đụng `dev.db`.
- Test E2E cần Chromium của Playwright: chạy `npx playwright install chromium` **một lần sau
  `npm ci` trên clone mới**. Chuỗi đầy đủ:

  ```bash
  npm ci
  npx playwright install chromium
  npm run test:e2e
  ```

- `npm run test:e2e` chạy **2 project**: `desktop-chrome` (29 test: 15 trong `e2e/storefront-admin.spec.ts`, 6 axe trong `e2e/accessibility.spec.ts`, 6 axe admin trong `e2e/admin-a11y.spec.ts`, 2 upload trong `e2e/product-upload.spec.ts`) và `pixel-7` (`devices['Pixel 7']`, grep `/@storefront|@a11y/`, 14 test: 8 storefront + 6 axe). Tổng 43 test. 2 test upload desktop phủ upload ảnh ADMIN và chặn file > 4 MB.
- `e2e/accessibility.spec.ts` dùng `@axe-core/playwright` để assert **0 lỗi serious/critical**
  trên Home, Category, Product, Blog list, Blog detail và contact popover (quét ở cả 2 project);
  `e2e/admin-a11y.spec.ts` quét 6 dialog/form admin (desktop).
- **Smoke production (chỉ đọc):** chạy sau mỗi lần deploy, thay cho các lệnh `curl` thủ công:

  ```bash
  BASE_URL=https://ant-jewelry.vercel.app npm run test:smoke:production
  ```

  Dùng `playwright.production.config.ts` (không khởi động server, không đụng DB, không đăng nhập,
  chỉ GET): 6 màn public trả 200 + một `h1` + canonical đúng, mọi ảnh `/uploads/` trên
  `/p/ivy-tennis-bracelet` có ETag và < 400 KB, `robots.txt` / `sitemap.xml` đúng. Smoke spec
  được loại khỏi `npm run test:e2e` (`testIgnore`). Dán output vào PR production.
- **Ảnh cho PR giao diện / bảng R6.3:** chạy
  `BASE_URL=https://ant-jewelry.vercel.app npm run test:screenshots`. Playwright chụp desktop
  **1920px** sau khi `networkidle` + font/ảnh eager đã tải xong (không chụp tay lúc trang chưa xong).
  Output mặc định vào `docs/deploy-screenshots/` (đổi bằng `SCREENSHOT_DIR`), gồm 6 file
  `home/category/product/product-contact-popover/blog-list/blog-detail-1920.png` — dùng luôn cho
  bảng đối chiếu Figma ↔ production. Smoke và screenshots đều nằm ngoài `npm run test:e2e`.

Khi thay đổi UI, kiểm tra thêm thủ công các luồng bị ảnh hưởng và ghi rõ trong Pull Request.

## 7. Deploy production

Production dùng Vercel + PostgreSQL (schema trong `prisma/postgresql/`). Ảnh sản phẩm upload
được lưu trong bảng `ProductImageBlob` của chính database đó và phục vụ qua `/uploads/...`,
không ghi vào `cwd/uploads` (chỉ đọc trên Vercel) hay `/tmp` (mất khi đổi instance). Chạy
migration mới `20261118100000_add_product_image_blobs` trước/sau khi deploy.

- **Storefront (production):** https://ant-jewelry.vercel.app/
- **Admin:** https://ant-jewelry.vercel.app/admin
- Trạng thái kiểm chứng và kết quả Lighthouse trên bản deploy: xem [`docs/DEPLOY.md`](docs/DEPLOY.md) và [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

1. Provision PostgreSQL và cấu hình `DATABASE_URL`, `AUTH_SECRET`,
   `SITE_URL`, `PRODUCT_IMAGE_UPLOAD_DIR` trong môi trường production (không dùng biến direct riêng).
   Đặt `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` và `DATABASE_URL` (chuỗi direct
   `db.prisma.io`) trong GitHub Environment `production`, không đặt ở cấp repository. Environment
   `migration-approval` cần có required reviewer do chủ dự án cấu hình.
2. Deploy Production lên Vercel qua GitHub Actions: sau khi workflow `ci` xanh trên `main`,
   `.github/workflows/deploy.yml` kiểm tra migration pending, dừng chờ duyệt khi có migration mới,
   áp dụng migration rồi mới chạy Vercel CLI (`pull` → `build --prod` →
   `deploy --prebuilt --prod`). Git integration của Vercel đã tắt
   (`vercel.json`: `"git": { "deploymentEnabled": false }`).
   `vercel.json` dùng `npm run build:production` để generate Prisma Client và build; bản build không
   đổi schema. Có thể chạy migration thủ công bằng `npm run db:migrate:production` và
   `npm run db:migrate:status:production` với URL **direct** (`db.prisma.io`, không dùng pooled).
3. (Tuỳ chọn) Nạp catalogue demo vào PostgreSQL bằng `npm run db:seed:production` (dùng URL
   **direct**, không tạo user demo). `npm run db:seed` chỉ dành cho SQLite local.
4. Tạo ADMIN đầu tiên bằng `npm run db:create-admin:production`.
5. Kiểm tra `/robots.txt`, `/sitemap.xml`, đăng nhập admin, dữ liệu và upload ảnh sau deploy.

Lưu ý: trên môi trường serverless/ephemeral (như Vercel), filesystem local không bền vững qua
redeploy/instance mới, nên ảnh upload được ghi vào `ProductImageBlob` trong database — không cần
mount/storage riêng. Quyết định, đánh đổi và ngưỡng theo dõi dung lượng xem ở
[`docs/DEPLOY.md`](docs/DEPLOY.md) mục “Storage decision record”. Nếu build báo
`P2021: The table public.BlogPost does not exist`, chạy migration cho đúng DB trước/sau deploy.

## 8. Tài liệu

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — Đặc tả yêu cầu.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Kiến trúc, luồng dữ liệu, quyết định kỹ thuật.
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — Quy trình branch, commit, PR và review.
- [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) — Ma trận quyền ADMIN/EDITOR.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Deploy, migration, secrets, backup, rollback.
- [`docs/HUONG_DAN_VAN_HANH.md`](docs/HUONG_DAN_VAN_HANH.md) — Hướng dẫn vận hành cho chủ cửa hàng.
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — Mục tiêu SEO và hiệu năng.
- [`AI_LOG.md`](AI_LOG.md) — Nhật ký thay đổi do AI thực hiện.

## 9. License

Repository chưa có file `LICENSE`; loại license đang để TBD.
