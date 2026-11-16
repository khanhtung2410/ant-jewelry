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
| Database / ORM | Prisma 6; SQLite cho local/test, PostgreSQL cho production |
| Validation | Zod |
| Authentication | JWT ký bằng `AUTH_SECRET`, lưu trong cookie `httpOnly` |
| Test | Vitest (unit), Playwright (E2E) |
| Lint / Format | ESLint 9, Prettier 3 |

Ứng dụng là **một Next.js project duy nhất**: Server Components cho phần đọc, Server
Actions cho mutation, Route Handlers cho upload ảnh sản phẩm. Không có backend REST riêng.

## 2. Chạy local từ clone mới

Yêu cầu: **Node.js >= 20.9**, **npm** và **Git**.

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
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<chuỗi random>"
```

> **Vì sao là `.env` mà không phải `.env.local`?**
> Next.js đọc cả `.env` và `.env.local`, nhưng **Prisma CLI chỉ đọc `.env`**. Nếu chỉ tạo
> `.env.local`, các lệnh `npm run db:push` / `npm run db:seed` sẽ không thấy `DATABASE_URL`.
> Dùng `.env` cho cả hai, hoặc nạp `.env.local` vào Prisma bằng
> `dotenv -e .env.local -- npx prisma ...` nếu dự án của bạn đã cài `dotenv-cli`.

Tạo `AUTH_SECRET` bằng:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Các biến trong `.env.example`:

| Biến | Bắt buộc (local) | Ghi chú |
|---|---:|---|
| `DATABASE_URL` | Có | `file:./dev.db` cho local; PostgreSQL cho production |
| `AUTH_SECRET` | Có | Khóa ký session admin; không commit giá trị thật |
| `SITE_URL` | Không | Mặc định `http://localhost:3000`; production nên đặt `https://<project>.vercel.app` |
| `PRODUCT_IMAGE_UPLOAD_DIR` | Không | Local: mặc định `./uploads` |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Production (Vercel) | Lưu ảnh sản phẩm lên S3/R2 để ảnh còn sau redeploy |
| `DIRECT_URL` | Production | URL PostgreSQL trực tiếp cho Prisma Migrate |

`.env` và `.env.local` đã nằm trong `.gitignore`; chỉ `.env.example` được commit.

### 2.2. Khởi tạo database và seed dữ liệu mẫu

```bash
npm run db:push
npm run db:seed
```

- `db:push` tạo schema SQLite từ `prisma/schema.prisma` (file `prisma/dev.db`).
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
| `npm run format` / `npm run format:check` | Prettier ghi / kiểm tra |
| `npm run db:push` | Đồng bộ schema SQLite local |
| `npm run db:seed` | Nạp dữ liệu mẫu |
| `npm run db:generate` | Generate Prisma Client cho SQLite |
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
│   │   └── uploads/            # Phục vụ file upload local (filesystem); S3/R2 dùng URL public
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

- Local/test: `prisma/schema.prisma` với SQLite. Các URL `file:./dev.db`,
  `file:./test.db`, `file:./e2e.db` được resolve tương đối trong thư mục `prisma/`.
- Production: `prisma/postgresql/schema.prisma` và migrations trong
  `prisma/postgresql/migrations/`.
- `src/features/shared/db/prisma.ts` giữ một `PrismaClient` dùng chung.
- Ảnh sản phẩm: local lưu trên filesystem (`PRODUCT_IMAGE_UPLOAD_DIR`, mặc định `./uploads`) và phục vụ qua `/uploads/...`; production có thể dùng S3-compatible object storage (R2/S3) khi cấu hình `S3_*` để ảnh còn sau redeploy.

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
- `npm test` chạy trên `prisma/test.db` nhờ `vitest.setup.ts`; global setup reset và seed
  database test, nên **không đụng `prisma/dev.db`**.
- **E2E** dùng Playwright. `playwright.config.ts` tự reset `prisma/e2e.db`, build production
  và chạy `next start` trên `http://127.0.0.1:3100`, nên E2E kiểm tra đúng bundle production
  và cũng không đụng `dev.db`.
- Test E2E cần Chromium của Playwright:
  `npx playwright install chromium` (chỉ cần một lần).

Khi thay đổi UI, kiểm tra thêm thủ công các luồng bị ảnh hưởng và ghi rõ trong Pull Request.

## 7. Deploy production (R6.2)

Production dùng **Vercel + PostgreSQL + S3-compatible object storage (R2/S3)**. Dùng domain `*.vercel.app` (không đổi DNS `antjewelry.vn`).

1. Provision PostgreSQL, bucket R2/S3 + public base URL, và cấu hình `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `SITE_URL` (`https://<project>.vercel.app`), cùng `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (R2), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`.
2. Chạy migration: `npm run db:migrate:production` và `npm run db:migrate:status:production`.
3. Deploy qua Vercel (`vercel.json` dùng `npm run build:production`).
4. Tạo ADMIN đầu tiên: `npm run db:create-admin:production` (không chạy `db:seed` production).
5. Kiểm tra 6 màn public + admin trên `*.vercel.app`; upload ảnh rồi redeploy để xác nhận ảnh còn (S3/R2).

Nếu build Vercel báo `P2021: The table public.BlogPost does not exist`, cần chạy migration cho đúng DB trước/sau deploy (xem chi tiết và checklist trong [`docs/DEPLOY.md`](docs/DEPLOY.md)). Chi tiết đầy đủ, backup/restore và rollback xem
[`docs/DEPLOY.md`](docs/DEPLOY.md).

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
