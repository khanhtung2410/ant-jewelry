# SEO and Performance

## R6.1 — Lighthouse (Home mobile + trang sản phẩm)

### Môi trường đo

- **Công cụ:** Lighthouse 13.6.0, Chrome headless shell (Playwright Chromium), mobile emulation, simulated throttling (`--form-factor=mobile --throttling-method=simulate`).
- **Bản deploy (production):** `https://ant-jewelry.vercel.app/`, `https://ant-jewelry.vercel.app/p/aurora-band` và `https://ant-jewelry.vercel.app/blog/cach-chon-nhan-cuoi-phu-hop`, đo ngày 2026-11-18.
- **Bản production build local (tham chiếu):** `npm run build && npm run start` (`DATABASE_URL=file:./prisma/dev.db` với dữ liệu seed) tại `http://localhost:3000`, cùng ngày.

Mỗi trang được đo **1 lần khởi động (bỏ qua, không lưu báo cáo) rồi 3 lần liên tiếp** trên cùng bản/cấu hình; bảng báo cáo **trung vị** và **dải (min–max)** của đúng 3 lần đã lưu. Lần khởi động chịu chi phí Lighthouse/Chrome nên không được tính vào trung vị. Báo cáo JSON của cả 3 lần mỗi trang nằm trong [`docs/lighthouse-reports/`](lighthouse-reports/) và được liên kết trực tiếp ở bảng chi tiết bên dưới. Ảnh chụp mobile đối chiếu Figma: [`docs/r6-1-screenshots/home-mobile.png`](r6-1-screenshots/home-mobile.png) và [`docs/r6-1-screenshots/blog-detail-mobile.png`](r6-1-screenshots/blog-detail-mobile.png).

### Kết quả đo trên production deploy (3 lần đã lưu; median; range)

| Trang | Performance | Accessibility | SEO | FCP (ms) | LCP (ms) | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Home (`/`) | **95** (91–96) | **96** | **100** | 996 (930–1471) | 2580 (2346–3174) | 148 (142–163) |
| Sản phẩm (`/p/aurora-band`) | **97** (94–99) | **100** | **100** | 970 (954–1131) | 2204 (1537–2671) | 162 (109–198) |
| Blog chi tiết (`/blog/cach-chon-nhan-cuoi-phu-hop`) | **97** (81–98) | **98** | **100** | 1009 (966–2411) | 2466 (2209–3616) | 87 (71–198) |

**Chi tiết 3 lần đo (Performance) và báo cáo JSON:**

| Trang | Lần 1 | Lần 2 | Lần 3 | Trung vị | Báo cáo |
|---|---:|---:|---:|---:|---|
| Home | 91 | 96 | 95 | **95** | [1](lighthouse-reports/prod-home-1.json) · [2](lighthouse-reports/prod-home-2.json) · [3](lighthouse-reports/prod-home-3.json) |
| Sản phẩm | 97 | 99 | 94 | **97** | [1](lighthouse-reports/prod-product-1.json) · [2](lighthouse-reports/prod-product-2.json) · [3](lighthouse-reports/prod-product-3.json) |
| Blog chi tiết | 81 | 98 | 97 | **97** | [1](lighthouse-reports/prod-blog-1.json) · [2](lighthouse-reports/prod-blog-2.json) · [3](lighthouse-reports/prod-blog-3.json) |

**Mục tiêu:** Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 (trung vị 3 lần). **Trạng thái:** Home (95) và sản phẩm (97) **đạt** rõ ràng trên bản deploy ở lượt đo lại sau khi upload ảnh thật. Blog chi tiết giữ số liệu của lượt đo trước (97 trung vị) và cũng đạt. Các bộ số liệu cũ (Home “84 (82–92)”, “91 (61–96)” rồi “85 (84–95)”) phản ánh các lần đo khác nhau; bảng trên là lượt mới nhất, JSON gốc được lưu lại để đối chiếu.

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

## Đo lại production 2026-11-20 (sau PR #108–#112)

Chạy Lighthouse 13.6.0 với Chrome của Playwright, mobile + simulated throttling, **bỏ 1 lần khởi động rồi lưu 3 lần** cho mỗi trang (cùng cách với lượt 2026-11-18). JSON gốc: `prod-{home,product,blog}-v2-{1,2,3}.json` trong [`docs/lighthouse-reports/`](lighthouse-reports/).

| Trang | Performance (median; range) | Accessibility | SEO | FCP / LCP / TBT median |
|---|---:|---:|---:|---|
| Home (`/`) | **74** (30–85) | 96 | 100 | 1.0 s / 3.0 s / 1.000 ms |
| Sản phẩm (`/p/aurora-band`) | **86** (78–87) | 100 | 100 | 1.0 s / 2.8 s / 410 ms |
| Blog chi tiết | **74** (73–76) | 98 | 100 | 1.0 s / 3.0 s / 950 ms |

**Đọc kết quả thận trọng:** số Accessibility/SEO ổn định và khớp lượt cũ, nhưng Performance dao động lớn — Home có một lần TBT **3.690 ms** và CLS **0,516** trong khi 2 lần kia TBT 410/1.000 ms và CLS 0. Lượt 2026-11-18 ghi TBT Home ~150 ms. Đây là dấu hiệu **nhiễu từ máy chạy đo/mạng lúc đó**, chưa đủ bằng chứng để kết luận code bị chậm lại sau #108–#112. Cần đo lại trên máy/CI yên tĩnh (hoặc thêm nhiều lần lặp) trước khi coi 74 là mức基线 mới. Không tự ghi "đạt" cho Home ở lượt này.

### Output thô (trích)

```text
home warmup: perf=49 accessibility=96 seo=100
home v2-1:   perf=85 ...   home v2-2: perf=30 ...   home v2-3: perf=74 ...
product v2-1: perf=86 ...  product v2-2: perf=78 ... product v2-3: perf=87 ...
blog v2-1: perf=74 ...     blog v2-2: perf=73 ...    blog v2-3: perf=76 ...
```

## Kiểm chứng tự động mới (2026-11-19, code hiện tại)

Các số Lighthouse ở trên là của lượt đo 2026-11-18; **không có lần đo Lighthouse mới** sau các PR #98–#108 nên không được ghi là đã cải thiện. Những kiểm chứng mới có output thực:

- **E2E local:** `npm run test:e2e` → 27 pass trên 2 project (`desktop-chrome` + `pixel-7`). Bộ axe (`@axe-core/playwright`) chạy trên Home, Category, Product, Blog list, Blog detail và contact popover ở cả hai project → **0 lỗi serious/critical**.
- **Smoke production:** `BASE_URL=https://ant-jewelry.vercel.app npm run test:smoke:production` → **8/8 pass**: 6 màn 200 + đúng 1 `h1` + canonical đúng; ảnh `/uploads/` trên `/p/ivy-tennis-bracelet` có ETag và < 400 KB; `robots.txt`/`sitemap.xml` đúng. Chạy sau mỗi deploy.
- **Ảnh đối chiếu:** `npm run test:screenshots` tạo 6 ảnh desktop 1920px (chờ `networkidle` + font/ảnh eager) trong `docs/deploy-screenshots/`; dùng cho bảng R6.3 trong `docs/DEPLOY.md`.
- **CI:** job `e2e` trong `.github/workflows/npm-ci.yml` chạy browser + `npm run test:e2e` và upload `playwright-report/`, `test-results/` (trace) khi fail.
- **Đánh đổi E3 vẫn mở:** ảnh upload được phục vụ `unoptimized` ở mọi kích thước (card, thumbnail 96px, admin 88px); nguyên nhân 400 optimizer đã tìm thấy và sửa cấu hình (`images.localPatterns`), nhưng chưa sinh bản 480px nên chưa bật lại optimizer. Chi tiết + số đo trong `docs/DEPLOY.md` mục S3/E3.
