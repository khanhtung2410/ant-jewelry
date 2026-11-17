# SEO and Performance

## R6.1 — Lighthouse (Home mobile + trang sản phẩm)

### Môi trường đo

- **Công cụ:** Lighthouse 13.6.0, Chrome headless (Windows, local), mobile emulation, simulated throttling (`--form-factor=mobile --throttling-method=simulate`).
- **Bản deploy (production):** `https://ant-jewelry.vercel.app/` (Home) và `https://ant-jewelry.vercel.app/p/aurora-band` (trang sản phẩm), đo ngày 2026-11-17.
- **Bản production build local (tham chiếu):** `npm run build && npm run start` (`DATABASE_URL=file:./dev.db` với dữ liệu seed) tại `http://localhost:3000`.

Mỗi trang được đo **3 lần liên tiếp** trên cùng bản/cùng cấu hình. Bảng báo cáo **trung vị** và **dải (min–max)**.

### Kết quả đo trên production deploy (median; range)

| Trang | Performance | Accessibility | SEO | FCP (ms) | LCP (ms) | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Home (`/`) | **84** (82–92) | **96** | **100** | 976 (970–1243) | 2893 (2869–2973) | 430 (199–515) |
| Sản phẩm (`/p/aurora-band`) | **89** (81–91) | **100** | **100** | 957 (951–1666) | 2368 (2353–2866) | 305 (259–677) |

**Mục tiêu:** Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 (trung vị 3 lần). **Trạng thái:** Accessibility và SEO đạt trên cả hai trang. Performance trung vị đạt mục tiêu ở trang sản phẩm (89) nhưng **chưa đạt** ở Home (84) do dao động/TBT và chi phí render trên mobile; cần tối ưu thêm trên bản deploy.

### Kết quả đo trên production build local (tham chiếu, median; range)

| Trang | Performance | Accessibility | SEO | FCP (ms) | LCP (ms) | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Home (`/`) | **92** (91–96) | **96** | **100** | 927 (919–930) | 3279 (2452–3329) | 126 (92–138) |
| Sản phẩm (`/p/aurora-band`) | **98** (92–99) | **100** | **100** | 765 (764–770) | 2311 (2220–3358) | 64 (52–68) |

Kết quả local production build đạt mục tiêu trung vị cho cả hai trang; chênh lệch so với deploy phản ánh khác biệt hạ tầng/mạng/cache/CDN và biến thiên đo.

### Baseline trước R6.1 (đo local, production build, 3 lần — tham chiếu)

| Trang | Performance (median; range) | A11y | SEO | FCP / LCP / TBT median (range) |
|---|---:|---:|---:|---|
| Home (`/`) | 68 (62–84) | 96 | 100 | 1.0 s / 3.7 s / 850 ms (FCP 1.0–1.1 s, LCP 3.5–4.0 s, TBT 320–1740 ms) |
| Sản phẩm (`/p/aurora-band`) | 89 (83–93) | 100 | 100 | 0.8 s / 2.5 s / 360 ms (FCP 0.8–0.9 s, LCP 2.5–3.0 s, TBT 160–550 ms) |

Home trước R6.1 chưa đạt Performance do **LCP ảnh hero ~3.5–4.0 s**, **TBT dao động 320–1740 ms** trên mobile và **lượng JS/ảnh tải từ nhiều section sản phẩm + Blog** trên trang chủ.

### Nguyên nhân chính (Home) và thay đổi đã làm

| Vấn đề | Nguyên nhân chính | Thay đổi |
|---|---|---|
| **LCP cao / tải ảnh nhiều** | Home render toàn bộ section danh mục với nhiều card sản phẩm; mỗi `ProductCard` tải ảnh chính và ảnh hover (ẩn) → nhiều request/decode ảnh, cạnh tranh băng thông với hero. | Giảm `CAROUSEL_PRODUCT_LIMIT` cho section Home từ 10 xuống 5 sản phẩm/section (`src/features/products/lib/carousel-products.ts`). Ảnh hover của `ProductCard` đặt `loading="lazy"` và `fetchPriority="low"` để ưu tiên tài nguyên LCP/above-the-fold (`src/features/products/components/product-card.tsx`). |
| **TBT / chi phí render main thread** | Nhiều section và ảnh bên dưới màn hình đầu được render/giải mã sớm, làm tăng công việc trên mobile. | Thêm `content-visibility: auto` + `contain-intrinsic-size` cho các section carousel sau section đầu và section Blog trên Home (`src/app/(public)/page.tsx`), và defer section “YOU MIGHT ALSO LIKE” trên trang sản phẩm (`src/app/(public)/p/[slug]/product-page-content.tsx`). Ảnh bìa Blog đặt `loading="lazy"` (`src/features/blog/components/blog-row.tsx`). |
| **Ưu tiên LCP trang sản phẩm** | Ảnh gallery chính cần được ưu tiên rõ ràng; thumbnail không cần tranh tài nguyên. | Ảnh chính `ProductGallery` giữ `preload` và thêm `fetchPriority="high"`; thumbnail đặt `loading="lazy"` + `fetchPriority="low"` (`src/features/products/components/product-gallery.tsx`). |

Các thay đổi giữ nguyên hành vi UI (carousel vẫn cuộn/điều hướng, hover ảnh vẫn hoạt động khi có ảnh phụ, gallery/chi tiết sản phẩm không đổi). Người dùng vẫn vào trang danh mục `/c/[slug]` để xem đầy đủ sản phẩm.

## Các thay đổi SEO/hiệu năng đã có từ trước

- Product card trong carousel render phía server; chỉ control điều hướng dùng client JavaScript.
- Ảnh hero tải `eager` + `fetchPriority="high"`; ảnh lead gallery dùng `preload`. Ảnh có `sizes` và `alt` mô tả.
- Trang sản phẩm/Blog có canonical, Open Graph, Twitter metadata.
- `sitemap.xml` liệt kê danh mục/sản phẩm hiển thị và Blog đã xuất bản; `robots.txt` cho phép storefront và loại trừ admin/API.

`SITE_URL` phải trỏ tới origin production chính thức khi deploy (xem `.env.example`, `docs/DEPLOY.md`).
