# AN JEWELRY

Website giới thiệu sản phẩm trang sức; khách hàng liên hệ trực tiếp với cửa hàng qua số điện thoại và các liên kết Facebook, Instagram được công bố.

## 1. Tổng quan dự án

AN JEWELRY là website dành cho khách hàng có nhu cầu tìm hiểu các sản phẩm trang sức và liên hệ trực tiếp với cửa hàng.

**Trạng thái hiện tại:** repository có bộ khung Next.js 16.4.5 (App Router) trong `src/app/`, cấu hình TypeScript strict, ESLint, Prettier, Vitest và các contract domain trong `src/types/domain.ts`; mock data nằm trong `src/lib/mock/` (sản phẩm dùng ảnh `.webp` trong `public/mock/products/`, sản phẩm chưa có ảnh dùng SVG placeholder) và mọi trang phải đọc dữ liệu qua query function trong `src/lib/queries/`. Trang chủ vẫn hiển thị nội dung mặc định của `create-next-app`. Chưa có Database, Prisma, Authentication hoặc giao diện AN JEWELRY. Các chức năng nghiệp vụ bên dưới là định hướng theo yêu cầu, **chưa được triển khai**.

Chức năng định hướng:

- Xem danh sách và thông tin chi tiết sản phẩm trang sức.
- Lọc và sắp xếp sản phẩm theo các tiêu chí được hỗ trợ.
- Xem thông tin các loại trang sức và danh mục sản phẩm.
- Xem danh sách và nội dung chi tiết Blog.
- Xem số điện thoại và các liên kết Facebook, Instagram của cửa hàng.
- Hỗ trợ khu vực quản trị nội dung theo quyền được cấp (dự kiến).

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
| Server-side | Next.js Server Components, Server Actions, Route Handlers | Đã chốt; chưa triển khai |
| Database / ORM | SQLite (dev) / PostgreSQL (production); Prisma | Đã chốt; chưa cấu hình |
| Validation | Zod | Đã chốt; chưa cài đặt |
| Authentication | JWT | Đề xuất, chưa cấu hình |
| Image Storage | Cloudinary | Đề xuất, chưa cấu hình |

Kiến trúc đã chốt là **một Next.js application duy nhất**: Server Components cho read, Server Actions cho mutation, Route Handlers chỉ dùng cho upload. Không có NestJS hoặc tầng REST API riêng. Authentication và Image Storage vẫn là đề xuất trong `ARCHITECTURE.md`, chưa được xác nhận hoặc triển khai.

## 3. Yêu cầu / Điều kiện tiên quyết

- **Node.js** >= 20.9.0 (theo yêu cầu của Next.js 16.4.5).
- **npm** (repository dùng `package-lock.json`).
- **Git** để clone và quản lý phiên bản.
- Chưa cần Database, ORM, tài khoản Cloudinary hoặc biến môi trường cho bộ khung hiện tại.
- `.env.example` liệt kê các biến dự kiến; local dev hiện chưa bắt buộc biến nào. Khi làm phase Database, local dev dùng SQLite và production dùng PostgreSQL.

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
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Hiện tại trang chủ hiển thị nội dung mặc định của `create-next-app`, chưa phải giao diện AN JEWELRY.

### 4.4. Build và chạy production

```bash
npm run build
npm run start
```

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
| `package.json` | Dependencies và các script `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch` |
| `.github/pull_request_template.md` | Mẫu mô tả Pull Request |
| `.gitignore` | Bỏ qua `node_modules`, `.next`, `out`, `build`, `.env*` (trừ `.env.example`), file SQLite local và file build của TypeScript |

`.env.example` đã có và được commit; `.env.local` và các file `.env*` khác nằm trong `.gitignore`. Hiện chưa có biến môi trường nào bắt buộc cho local dev.

Database dùng Prisma với SQLite local và PostgreSQL production; cấu hình JWT và Cloudinary: TBD, chưa có trong work tree. Không commit credentials, passwords, API keys hoặc secrets vào repository.

## 6. Sử dụng

Work tree hiện tại chỉ có trang chủ mặc định của Next.js. Luồng người dùng dự kiến (chưa triển khai):

1. Khách hàng truy cập website AN JEWELRY.
2. Khách hàng xem danh sách sản phẩm trang sức.
3. Khách hàng chọn sản phẩm để xem thông tin chi tiết.
4. Khách hàng xem nội dung Blog hoặc thông tin liên hệ để liên hệ trực tiếp với cửa hàng.

Chưa có khu vực Admin/Staff, API nghiệp vụ hoặc dữ liệu sản phẩm/Blog trong work tree.

## 7. Cấu trúc dự án

Cấu trúc thực tế hiện tại:

```text
ant-jewelry/
├── .github/
│   └── pull_request_template.md  # Mẫu mô tả Pull Request
├── src/
│   ├── app/              # App Router: layout, page, global styles
│   ├── lib/
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
- [`AI_LOGS.md`](./AI_LOGS.md) — Nhật ký thay đổi do AI thực hiện.
- `AN_JEWELRY_SAD_v1.1.docx` — Tài liệu nguồn System Analysis and Design (không có trong work tree hiện tại).

`ARCHITECTURE.md` được xây dựng dựa trên SAD v1.1. Những công nghệ và thiết kế chưa được xác nhận trong tài liệu kiến trúc không được xem là implementation đã hoàn thành.
