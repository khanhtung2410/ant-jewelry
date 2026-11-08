# AN JEWELRY

Website giới thiệu sản phẩm trang sức; khách hàng liên hệ trực tiếp với cửa hàng qua số điện thoại và các liên kết Facebook, Instagram được công bố.

## 1. Tổng quan dự án

AN JEWELRY là website dành cho khách hàng có nhu cầu tìm hiểu các sản phẩm trang sức và liên hệ trực tiếp với cửa hàng.

**Trạng thái hiện tại:** repository có bộ khung Next.js 16.4.5 (App Router) trong `src/app/`, cấu hình TypeScript strict và các contract domain ban đầu trong `src/types/domain.ts`; trang chủ vẫn hiển thị nội dung mặc định của `create-next-app`. Các chức năng nghiệp vụ bên dưới là định hướng theo yêu cầu, **chưa được triển khai**.

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
| Package manager | npm (`package-lock.json`) | Đang sử dụng |
| Version Control | Git / GitHub | Đang sử dụng |
| Backend | Node.js / NestJS | Đề xuất, chưa có trong work tree |
| Database / ORM | PostgreSQL / Prisma | Đề xuất, chưa cấu hình |
| Authentication | JWT | Đề xuất, chưa cấu hình |
| Image Storage | Cloudinary | Đề xuất, chưa cấu hình |

Các lựa chọn Backend, Database, ORM, Authentication và Image Storage vẫn là đề xuất trong `ARCHITECTURE.md`, chưa được xác nhận hoặc triển khai.

## 3. Yêu cầu / Điều kiện tiên quyết

- **Node.js** >= 20.9.0 (theo yêu cầu của Next.js 16.4.5).
- **npm** (repository dùng `package-lock.json`).
- **Git** để clone và quản lý phiên bản.
- Chưa cần Database, ORM, tài khoản Cloudinary hoặc biến môi trường cho bộ khung hiện tại.
- Yêu cầu phiên bản PostgreSQL và cấu hình Database local: TBD, chỉ áp dụng sau khi Backend/Database được xác nhận.

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
npx tsc --noEmit
```

## 5. Cấu hình

Các file cấu hình hiện có:

| File | Mục đích |
|---|---|
| `next.config.ts` | Cấu hình Next.js: `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback` và loader Tailwind CSS cho Turbopack |
| `eslint.config.mjs` | Cấu hình ESLint 9 với `eslint-config-next` |
| `tsconfig.json` | Cấu hình TypeScript strict; alias `@/*` trỏ về `src/*` |
| `package.json` | Dependencies và các script `dev`, `build`, `start`, `lint` |
| `.gitignore` | Bỏ qua `node_modules`, `.next`, `out`, `build`, file môi trường và file build của TypeScript |

Hiện **chưa có** `.env`, `.env.example` hoặc biến môi trường nào được xác nhận. `.env*` đã nằm trong `.gitignore`.

Các cấu hình dự kiến cho Database, JWT và Cloudinary: TBD, chưa có trong work tree. Không commit credentials, passwords, API keys hoặc secrets vào repository.

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
├── src/
│   ├── app/              # App Router: layout, page, global styles
│   └── types/            # TypeScript domain contracts (Product, Category, BlogPost)
├── public/               # Static assets
├── docs/                 # Tài liệu dự án
├── next.config.ts        # Cấu hình Next.js
├── eslint.config.mjs     # Cấu hình ESLint
├── tsconfig.json         # Cấu hình TypeScript
├── package.json          # Dependencies và scripts
├── package-lock.json     # Khóa phiên bản dependencies
├── AGENTS.md             # Quy tắc làm việc với Next.js trong repository
└── .gitignore
```

`ARCHITECTURE.md` có đề xuất tách `frontend/` và `backend/` trong tương lai, nhưng cấu trúc đó **chưa tồn tại** trong work tree. Khi thêm thư mục dùng chung như `components/`, `lib/` hoặc `constants/`, chỉ tạo khi thực sự có nhu cầu và cập nhật lại tài liệu.

## 8. Kiểm thử

Repository hiện **chưa cấu hình test framework** và chưa có script `test`. Các kiểm tra hiện có:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Với thay đổi giao diện, kiểm tra thủ công các luồng bị ảnh hưởng và ghi rõ trong Pull Request. Khi bổ sung test framework, cập nhật lệnh chạy test vào README và `CONTRIBUTING.md`.

## 9. License

Repository chưa có file `LICENSE`. Loại license (MIT, Apache-2.0, GPL-3.0 hoặc Proprietary): TBD.

## 10. Tài liệu liên quan

- [`REQUIREMENTS.md`](./REQUIREMENTS.md) — Đặc tả yêu cầu hệ thống.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Kiến trúc hệ thống đề xuất.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Quy trình làm việc, code, commit và Pull Request.
- [`AI_LOGS.md`](./AI_LOGS.md) — Nhật ký thay đổi do AI thực hiện.
- `AN_JEWELRY_SAD_v1.1.docx` — Tài liệu nguồn System Analysis and Design (không có trong work tree hiện tại).

`ARCHITECTURE.md` được xây dựng dựa trên SAD v1.1. Những công nghệ và thiết kế chưa được xác nhận trong tài liệu kiến trúc không được xem là implementation đã hoàn thành.
