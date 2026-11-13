# ANT JEWELRY

Website giới thiệu sản phẩm trang sức; khách hàng liên hệ trực tiếp với cửa hàng qua số điện thoại và các liên kết Facebook, Instagram được công bố.

## 1. Tổng quan dự án

ANT JEWELRY là website dành cho khách hàng có nhu cầu tìm hiểu các sản phẩm trang sức và liên hệ trực tiếp với cửa hàng.

**Trạng thái hiện tại:** repository có ứng dụng Next.js 16.4.5 (App Router), Prisma, PostgreSQL production schema, SQLite local/test schema, authentication ADMIN/EDITOR, quản trị nội dung, và lưu ảnh sản phẩm trên local filesystem (`/uploads`). Production infrastructure chưa được provision và website tại domain ANT JEWELRY chưa được xác nhận là bản deploy của repository này. Xem [`DEPLOY.md`](./DEPLOY.md) để biết trạng thái và các bước go-live.

Chức năng hiện có:

- Storefront danh mục/sản phẩm, lọc và sắp xếp, trang chi tiết, Blog và thông tin liên hệ.
- Admin quản lý sản phẩm, ảnh, danh mục, Blog, hero slides, Settings và người dùng theo quyền ADMIN/EDITOR.
- Upload ảnh sản phẩm vào thư mục local của server (`/uploads`); production cần filesystem bền vững và quyền ghi.

**Phạm vi hiện tại:** Website giới thiệu sản phẩm; khách hàng liên hệ trực tiếp qua số điện thoại và các liên kết Facebook, Instagram được công bố. Hệ thống không bao gồm Shopping Cart, Online Ordering, Online Payment hoặc Custom Jewelry Design. Không có biểu mẫu liên hệ hoặc luồng tiếp nhận/gửi yêu cầu liên hệ.

## 2. Công nghệ

Các thành phần đang có trong work tree:

| Thành phần | Công nghệ | Trạng thái |
|---|---|---|
| Frontend | Next.js 16.4.5 (App Router) | Đã cài đặt |
| UI runtime | React 19.3.0 | Đã cài đặt |
| Styling | Tailwind CSS v4 qua `@tailwindcss/turbopack` | Đã cấu hình |
| Ngôn ngữ | TypeScript 5, chế độ `strict` | Đã cấu hình |
| Lint | ESLint 9 + `eslint-config-next` | Đã cấu hình |
| Format | Prettier 3 + `.prettierrc` | Đã cấu hình |
| Test | Vitest 5 + `vitest.config.mts` | Đã cấu hình |
| Package manager | npm (`package-lock.json`) | Đang sử dụng |
| Version Control | Git / GitHub | Đang sử dụng |
| Server-side | Next.js Server Components, Server Actions, Route Handlers | Đã triển khai |
| Database / ORM | SQLite (dev/test), PostgreSQL (production); Prisma | Đã triển khai; production DB chưa provision |
| Validation | Zod | Đã cài đặt |
| Authentication | JWT trong secure cookie | Đã triển khai; production secret chưa cấu hình |
| Image Storage | Local filesystem (`/uploads`) | Đã triển khai; production cần storage bền vững có quyền ghi |

Kiến trúc là **một Next.js application duy nhất**: Server Components cho read, Server Actions cho mutation, Route Handlers chỉ dùng cho upload. Không có NestJS hoặc tầng REST API riêng.

## 3. Yêu cầu / Điều kiện tiên quyết

- **Node.js** >= 20.9.0 (theo yêu cầu của Next.js 16.4.5).
- **npm** (repository dùng `package-lock.json`).
- **Git** để clone và quản lý phiên bản.
- Local dev/test dùng SQLite; production dùng PostgreSQL và cần cấu hình environment variables theo [`DEPLOY.md`](./DEPLOY.md).
- Product-image uploads được lưu trên filesystem local của server và phục vụ qua `/uploads`. Trên môi trường serverless/ephemeral (ví dụ Vercel), filesystem có thể không bền vững giữa các lần deploy/instance.

## 4. Bắt đầu sử dụng

### 4.1. Clone repository

```bash
git clone https://github.com/khanhtung2410/ant-jewelry.git
cd ant-jewelry
```


### 4.2. Cài đặt dependencies

```bash
npm install
```

### 4.3. Chạy dự án local

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Đặt `DATABASE_URL="file:./dev.db"` và `AUTH_SECRET` trong environment local trước khi chạy. Seed chỉ dành cho SQLite local/test; script từ chối các database không phải SQLite. Mở [http://localhost:3000](http://localhost:3000).

### 4.4. Build ứng dụng

```bash
npm run build
npm run start
```

Vercel production build dùng `npm run build:production`, khai báo trong `vercel.json`; không dùng build SQLite ở production.

### 4.5. Kiểm tra chất lượng mã

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
```

## 5. Cấu hình

Các file cấu hình hiện có:

| File | Mục đích |
|---|---|
| `next.config.ts` | Cấu hình Next.js: `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback` và loader Tailwind CSS cho Turbopack |
| `eslint.config.mjs` | Cấu hình ESLint 9 với `eslint-config-next` |
| `tsconfig.json` | Cấu hình TypeScript strict; alias `@/*` trỏ về `src/*` |
| `.prettierrc`, `.prettierignore` | Cấu hình format mã nguồn; bỏ qua `docs/`, `public/`, Markdown và lockfile |
| `vitest.config.mts` | Cấu hình Vitest cho test đặt cạnh code trong `src/` |
| `src/app/globals.css` | Design tokens toàn cục từ Figma: nền `#FEFDF8`, nền ảnh sản phẩm `#EFEEEC`, đường kẻ `#93AAA0`, chữ `#000000`, font heading/nav monospace viết hoa và font nội dung sans-serif |
| `package.json` | Dependencies, test/build scripts, PostgreSQL migration và ADMIN bootstrap |
| `.github/pull_request_template.md` | Mẫu mô tả Pull Request |
| `.gitignore` | Bỏ qua `node_modules`, `.next`, `out`, `build`, `.env*` (trừ `.env.example`), file SQLite local và file build của TypeScript |

`.env.example` đã có và được commit; `.env.local` và các file `.env*` khác nằm trong `.gitignore`. `SITE_URL` không bắt buộc khi chạy local (mặc định `http://localhost:3000`), nhưng cần đặt thành origin chính thức của website khi deploy để metadata, sitemap và robots.txt dùng URL chuẩn.

Local SQLite dùng `prisma/schema.prisma`; production build và migrations dùng `prisma/postgresql/schema.prisma`. Không chạy demo seed trên production và không commit credentials, passwords, API keys hoặc secrets vào repository.

## 6. Sử dụng

Luồng khách hàng và quản trị:

1. Khách hàng duyệt danh mục, lọc/sắp xếp sản phẩm, xem chi tiết và liên hệ cửa hàng trực tiếp.
2. ADMIN quản lý nội dung và thông tin liên hệ tại `/admin/*`; EDITOR có quyền giới hạn theo [`PERMISSIONS.md`](./PERMISSIONS.md).
3. Vercel/PostgreSQL production chưa được provision. Ảnh sản phẩm lưu local cần storage bền vững khi deploy. Xem [`DEPLOY.md`](./DEPLOY.md) trước khi thực hiện go-live.

Chưa có khu vực Admin/Staff, API nghiệp vụ hoặc dữ liệu sản phẩm/Blog trong work tree.

## 7. Cấu trúc dự án

Cấu trúc thực tế hiện tại:

```text
ant-jewelry/
├── .github/
│   └── pull_request_template.md  # Mẫu mô tả Pull Request
├── src/
│   ├── app/              # App Router: layout, page, global styles
│   ├── components/       # Header, footer, ProductCard, Carousel, BlogRow, icon dùng chung
│   ├── lib/
│   │   ├── format-price.ts  # Định dạng giá VND, ví dụ 10000000 -> 10.000.000
│   │   ├── mock/         # Mock data có type cho Product, Category, BlogPost, HeroSlide, Settings
│   │   └── queries/      # Query functions; trang chỉ import từ đây
│   ├── types/            # TypeScript domain contracts
│   └── config.test.ts    # Test cấu hình project
├── public/               # Static assets
├── docs/                 # Tài liệu dự án
├── next.config.ts        # Cấu hình Next.js
├── eslint.config.mjs     # Cấu hình ESLint
├── vitest.config.mts     # Cấu hình Vitest
├── tsconfig.json         # Cấu hình TypeScript
├── package.json          # Dependencies và scripts
├── package-lock.json     # Khóa phiên bản dependencies
├── .prettierrc           # Cấu hình Prettier
├── .prettierignore       # File Prettier bỏ qua
├── .env.example          # Biến môi trường mẫu
├── AGENTS.md             # Quy tắc làm việc với Next.js trong repository
└── .gitignore
```

`ARCHITECTURE.md` chốt **một Next.js application duy nhất**, không tách `frontend/` và `backend/`. Khi thêm thư mục dùng chung như `components/`, `lib/` hoặc `constants/`, đặt trong `src/`, chỉ tạo khi thực sự có nhu cầu và cập nhật lại tài liệu.

**Quy ước dữ liệu:** `src/lib/mock/` chỉ chứa dữ liệu mẫu; page và component **không import trực tiếp** thư mục này. Mọi truy cập dữ liệu đi qua `src/lib/queries/` để khi thay mock bằng Prisma chỉ cần sửa tầng query. ESLint chặn import `@/lib/mock` từ `src/app/**`. `ProductType` và Category là một khái niệm: mỗi sản phẩm có `type`, và bộ lọc danh mục dùng chính `ProductType`.

## 8. Kiểm thử

Repository dùng **Vitest** cho unit test; test đặt cạnh code trong `src/`. Các kiểm tra hiện có:

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Với thay đổi giao diện, kiểm tra thủ công các luồng bị ảnh hưởng và ghi rõ trong Pull Request.

## 9. License

Repository chưa có file `LICENSE`. Loại license (MIT, Apache-2.0, GPL-3.0 hoặc Proprietary): TBD.

## 10. Tài liệu liên quan

- [`REQUIREMENTS.md`](./REQUIREMENTS.md) — Đặc tả yêu cầu hệ thống.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Kiến trúc hệ thống đề xuất.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Quy trình làm việc, code, commit và Pull Request.
- [`PERFORMANCE.md`](./PERFORMANCE.md) — Mục tiêu SEO, hiệu năng và số liệu Lighthouse.
- [`DEPLOY.md`](./DEPLOY.md) — Hướng dẫn deploy, migration, secrets, backup và khôi phục.
- [`HUONG_DAN_VAN_HANH.md`](./HUONG_DAN_VAN_HANH.md) — Hướng dẫn chủ cửa hàng thêm sản phẩm, viết Blog và cập nhật liên hệ.
- [`AI_LOG.md`](../AI_LOG.md) — Nhật ký thay đổi do AI thực hiện.
- `ANT_JEWELRY_SAD_v1.1.docx` — Tài liệu nguồn System Analysis and Design (không có trong work tree hiện tại).

`ARCHITECTURE.md` được xây dựng dựa trên SAD v1.1. Những công nghệ và thiết kế chưa được xác nhận trong tài liệu kiến trúc không được xem là implementation đã hoàn thành.
