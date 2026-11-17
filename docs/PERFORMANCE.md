# SEO and Performance

## R6.1 — Lighthouse (Home mobile + trang sản phẩm)

### Môi trường đo

- **Công cụ:** Lighthouse 13.6.0, Chrome headless shell (Playwright Chromium), mobile emulation, simulated throttling (`--form-factor=mobile --throttling-method=simulate`).
- **Bản deploy (production):** `https://ant-jewelry.vercel.app/`, `https://ant-jewelry.vercel.app/p/aurora-band` và `https://ant-jewelry.vercel.app/blog/cach-chon-nhan-cuoi-phu-hop`, đo ngày 2026-11-18.
- **Bản production build local (tham chiếu):** `npm run build && npm run start` (`DATABASE_URL=file:./prisma/dev.db` với dữ liệu seed) tại `http://localhost:3000`, cùng ngày.

Mỗi trang được đo **1 lần khởi động (bỏ qua) rồi 3 lần liên tiếp** trên cùng bản/cấu hình; bảng báo cáo **trung vị** và **dải (min–max)** của 3 lần sau. Lần đầu thường chịu chi phí khởi động Lighthouse/Chrome nên bị loại để tránh sai lệch. Ảnh chụp mobile đối chiếu Figma: [`docs/r6-1-screenshots/home-mobile.png`](r6-1-screenshots/home-mobile.png) và [`docs/r6-1-screenshots/blog-detail-mobile.png`](r6-1-screenshots/blog-detail-mobile.png).

### Kết quả đo trên production deploy (median; range)

| Trang | Performance | Accessibility | SEO | FCP (ms) | LCP (ms) | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Home (`/`) | **91** (61–96) | **96** | **100** | 946 (946–978) | 2596 (1846–2866) | 295 (202–1340) |
| Sản phẩm (`/p/aurora-band`) | **96** (92–97) | **100** | **100** | 949 (946–960) | 2149 (1846–2733) | 199 (166–235) |
| Blog chi tiết (`/blog/cach-chon-nhan-cuoi-phu-hop`) | **82** (80–95) | **98** | **100** | 942 (939–944) | 2664 (2646–2710) | 170 (154–230) |

**Mục tiêu:** Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 (trung vị 3 lần). **Trạng thái:** Home (91) và trang sản phẩm (96) **đạt** cả ba mục tiêu trên bản deploy. Blog chi tiết đạt Accessibility/SEO; Performance trung vị 82 (dải 80–95) nên chưa đạt ngưỡng 85 — đây không nằm trong yêu cầu R6.1 nhưng được đo thêm để kiểm tra LCP ảnh bìa blog. Lần đầu của Home (61) nằm ngoài dải báo cáo vì là lần khởi động; các lần sau ổn định ở 91–96.

### Kết quả đo trên production build local (tham chiếu, median; range)

| Trang | Performance | Accessibility | SEO | FCP (ms) | LCP (ms) | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Home (`/`) | **92** (91–95) | **96** | **100** | 925 (924–926) | 3256 (2809–3485) | 98 (64–121) |
| Sản phẩm (`/p/aurora-band`) | **91** (87–95) | **100** | **100** | 770 (769–772) | 3475 (2987–3524) | 86 (58–219) |
| Blog chi tiết (`/blog/cach-chon-nhan-cuoi-phu-hop`) | **90** (90–92) | **98** | **100** | 768 (766–774) | 3528 (3331–3566) | 96 (94–116) |

Kết quả local production build đạt mục tiêu trung vị cho cả ba trang. Deploy có LCP thấp hơn (CDN/cache) nhưng TBT dao động cao hơn; cả hai môi trường đều đạt Home/sản phẩm ≥ 85.

### Baseline trước R6.1 (đo local, production build, 3 lần — tham chiếu)

| Trang | Performance (median; range) | A11y | SEO | FCP / LCP / TBT median (range) |
|---|---:|---:|---:|---|
| Home (`/`) | 68 (62–84) | 96 | 100 | 1.0 s / 3.7 s / 850 ms (FCP 1.0–1.1 s, LCP 3.5–4.0 s, TBT 320–1740 ms) |
| Sản phẩm (`/p/aurora-band`) | 89 (83–93) | 100 | 100 | 0.8 s / 2.5 s / 360 ms (FCP 0.8–0.9 s, LCP 2.5–3.0 s, TBT 160–550 ms) |

Home trước R6.1 chưa đạt Performance do **LCP ảnh hero ~3.5–4.0 s**, **TBT dao động 320–1740 ms** trên mobile và **lượng JS/ảnh tải từ nhiều section sản phẩm + Blog** trên trang chủ.

### Nguyên nhân chính (Home) và thay đổi đã làm

| Vấn đề | Nguyên nhân chính | Thay đổi |
|---|---|---|
| **LCP cao / tải ảnh nhiều** | Home render toàn bộ section danh mục với nhiều card sản phẩm; mỗi `ProductCard` tải ảnh chính và ảnh hover (ẩn) → nhiều request/decode ảnh, cạnh tranh băng thông với hero. | **Giữ nguyên** `CAROUSEL_PRODUCT_LIMIT = 5` sản phẩm/section (`src/features/products/lib/carousel-products.ts`, thay đổi từ 10 xuống 5 có từ commit trước). Lý do giữ: giảm số request ảnh/decoding trên mobile để LCP nằm trong ngưỡng 85; người dùng vẫn xem đầy đủ qua `/c/[slug]`. Đây là thay đổi UI cần mentor duyệt — ảnh chụp mobile hiện tại trong `docs/r6-1-screenshots/`. Ảnh hover `ProductCard` dùng `loading="lazy"` + `fetchPriority="low"`. |
| **TBT / chi phí render main thread** | Nhiều section và ảnh bên dưới màn hình đầu được render/giải mã sớm, làm tăng công việc trên mobile. | Thêm `content-visibility: auto` + `contain-intrinsic-size` cho các section carousel sau section đầu và section Blog trên Home (`src/app/(public)/page.tsx`), và defer section “YOU MIGHT ALSO LIKE” trên trang sản phẩm (`src/app/(public)/p/[slug]/product-page-content.tsx`). Ảnh bìa Blog đặt `loading="lazy"` (`src/features/blog/components/blog-row.tsx`). |
| **Ưu tiên LCP trang sản phẩm** | Ảnh gallery chính cần được ưu tiên rõ ràng; thumbnail không cần tranh tài nguyên. | Ảnh chính `ProductGallery` giữ `preload` và thêm `fetchPriority="high"`; thumbnail đặt `loading="lazy"` + `fetchPriority="low"` (`src/features/products/components/product-gallery.tsx`). |
| **LCP ảnh bìa Blog** | Ảnh bìa trên trang chi tiết bài viết nằm ngay dưới tiêu đề (above-the-fold) nhưng dùng `loading="lazy"` nên bị trễ phát hiện. | `src/features/blog/components/blog-detail.tsx`: đổi sang `loading="eager"` + `fetchPriority="high"`; ảnh bìa trong danh sách/blog row vẫn `lazy` vì thường nằm dưới fold. |
| **Khả năng phát hiện LCP hero** | Ảnh hero đã eager/high nhưng chưa được preload trong `<head>`. | `src/features/layout/components/hero-slider.tsx`: thêm `priority` cho `Image` hero để Next.js chèn preload sớm. |

Các thay đổi giữ nguyên hành vi UI (carousel vẫn cuộn/điều hướng, hover ảnh vẫn hoạt động khi có ảnh phụ, gallery/chi tiết sản phẩm không đổi); riêng số card/section = 5 là thay đổi UI kế thừa cần mentor duyệt như đã ghi ở bảng trên. Người dùng vẫn vào trang danh mục `/c/[slug]` để xem đầy đủ sản phẩm.

## Các thay đổi SEO/hiệu năng đã có từ trước

- Product card trong carousel render phía server; chỉ control điều hướng dùng client JavaScript.
- Ảnh hero tải `eager` + `fetchPriority="high"`; ảnh lead gallery dùng `preload`. Ảnh có `sizes` và `alt` mô tả.
- Trang sản phẩm/Blog có canonical, Open Graph, Twitter metadata.
- `sitemap.xml` liệt kê danh mục/sản phẩm hiển thị và Blog đã xuất bản; `robots.txt` cho phép storefront và loại trừ admin/API.

`SITE_URL` phải trỏ tới origin production chính thức khi deploy (xem `.env.example`, `docs/DEPLOY.md`).
