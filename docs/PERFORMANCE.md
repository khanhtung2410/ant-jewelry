# SEO and Performance

## R6.1 — Lighthouse (Home mobile + trang sản phẩm)

### Môi trường đo

- **Công cụ:** Lighthouse 13.6.0, Chrome headless shell (Playwright Chromium), mobile emulation, simulated throttling (`--form-factor=mobile --throttling-method=simulate`).
- **Bản deploy (production):** `https://ant-jewelry.vercel.app/`, `https://ant-jewelry.vercel.app/p/aurora-band` và `https://ant-jewelry.vercel.app/blog/cach-chon-nhan-cuoi-phu-hop`, đo ngày 2026-11-18.
- **Bản production build local (tham chiếu):** `npm run build && npm run start` (`DATABASE_URL=file:./prisma/dev.db` với dữ liệu seed) tại `http://localhost:3000`, cùng ngày.

Mỗi trang được đo **1 lần khởi động (bỏ qua, không lưu báo cáo) rồi 3 lần liên tiếp** trên cùng bản/cấu hình; bảng báo cáo **trung vị** và **dải (min–max)** của đúng 3 lần đã lưu. Lần khởi động chịu chi phí Lighthouse/Chrome nên không được tính vào trung vị. Chỉ bộ baseline hiện tại (v4 và ivy) được giữ lại, dưới dạng `.json.gz` trong [`docs/lighthouse-reports/`](lighthouse-reports/); các lượt đã bị thay (v1, v2, v3, warm-up) đã bị xoá khỏi repo. Ảnh chụp mobile đối chiếu Figma: [`docs/r6-1-screenshots/home-mobile.png`](r6-1-screenshots/home-mobile.png) và [`docs/r6-1-screenshots/blog-detail-mobile.png`](r6-1-screenshots/blog-detail-mobile.png).

### Kết quả đo trên production deploy (3 lần đã lưu; median; range)

| Trang | Performance | Accessibility | SEO | FCP (ms) | LCP (ms) | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Home (`/`) | **95** (91–96) | **96** | **100** | 996 (930–1471) | 2580 (2346–3174) | 148 (142–163) |
| Sản phẩm (`/p/aurora-band`) | **97** (94–99) | **100** | **100** | 970 (954–1131) | 2204 (1537–2671) | 162 (109–198) |
| Blog chi tiết (`/blog/cach-chon-nhan-cuoi-phu-hop`) | **97** (81–98) | **98** | **100** | 1009 (966–2411) | 2466 (2209–3616) | 87 (71–198) |

**Chi tiết 3 lần đo (Performance); báo cáo gốc của lượt này đã bị xoá:**

| Trang | Lần 1 | Lần 2 | Lần 3 | Trung vị | Báo cáo |
|---|---:|---:|---:|---:|---|
| Home | 91 | 96 | 95 | **95** | (đã xoá) |
| Sản phẩm | 97 | 99 | 94 | **97** | (đã xoá) |
| Blog chi tiết | 81 | 98 | 97 | **97** | (đã xoá) |

**Mục tiêu:** Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 (trung vị 3 lần). **Trạng thái:** số liệu mới nhất là lượt v4 ở mục "Đo lại production 2026-11-20 — lượt 3 (v4)" bên dưới — đây là nơi duy nhất trong repo giữ số Lighthouse hiện tại; các bảng lịch sử phía trên chỉ để giải thích. File khác (kể cả `DEPLOY.md`) chỉ link tới mục đó thay vì chép lại số. Báo cáo gốc của các lượt cũ đã bị xoá khỏi repo.

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

## Đo lại production 2026-11-20 — lượt 1 (nhiễu, v2)

Lượt này có độ phân tán lớn (xem bên dưới); giữ số liệu lại để giải thích nhưng **không dùng làm baseline**. Bảng cập nhật nhất là lượt 3 (v4) ngay sau đây.

Chạy Lighthouse 13.6.0 với Chrome của Playwright, mobile + simulated throttling, **bỏ 1 lần khởi động rồi lưu 3 lần** cho mỗi trang (cùng cách với lượt 2026-11-18). Báo cáo gốc `prod-{home,product,blog}-v2-{1,2,3}.json` đã bị xoá khỏi repo theo chính sách bên dưới.

| Trang | Performance (median; range) | Accessibility | SEO | FCP / LCP / TBT median |
|---|---:|---:|---:|---|
| Home (`/`) | **74** (30–85) | 96 | 100 | 1.0 s / 3.0 s / 1.000 ms |
| Sản phẩm (`/p/aurora-band`) | **86** (78–87) | 100 | 100 | 1.0 s / 2.8 s / 410 ms |
| Blog chi tiết | **74** (73–76) | 98 | 100 | 1.0 s / 3.0 s / 950 ms |

**Đọc kết quả thận trọng:** số Accessibility/SEO ổn định và khớp lượt cũ, nhưng Performance dao động lớn — Home có một lần TBT **3.690 ms** và CLS **0,516** trong khi 2 lần kia TBT 410/1.000 ms và CLS 0. Lượt 2026-11-18 ghi TBT Home ~150 ms. Đây là dấu hiệu **nhiễu từ máy chạy đo/mạng lúc đó**, chưa đủ bằng chứng để kết luận code bị chậm lại sau #108–#112. Cần đo lại trên máy/CI yên tĩnh (hoặc thêm nhiều lần lặp) trước khi coi 74 là mức baseline mới. Không tự ghi "đạt" cho Home ở lượt này.

### Output thô (trích)

```text
home warmup: perf=49 accessibility=96 seo=100
home v2-1:   perf=85 ...   home v2-2: perf=30 ...   home v2-3: perf=74 ...
product v2-1: perf=86 ...  product v2-2: perf=78 ... product v2-3: perf=87 ...
blog v2-1: perf=74 ...     blog v2-2: perf=73 ...    blog v2-3: perf=76 ...
```

## Đo lại production 2026-11-20 — lượt 2 (v3, ổn định)

Chạy lại cùng quy trình (Lighthouse 13.6.0, Chrome Playwright, mobile, simulated throttling, bỏ 1 warm-up, lưu 3 lần) trên máy yên tĩnh hơn. Báo cáo gốc `prod-{home,product,blog}-v3-{1,2,3}.json` đã bị xoá khỏi repo theo chính sách bên dưới.

| Trang | Performance (median; range) | Accessibility | SEO | FCP / LCP / TBT median |
|---|---:|---:|---:|---|
| Home (`/`) | **94** (89–94) | 96 | 100 | 0.9 s / 2.8 s / 210 ms |
| Sản phẩm (`/p/aurora-band`) | **94** (94–95) | 100 | 100 | 0.9 s / 2.5 s / 190 ms |
| Blog chi tiết | **93** (92–93) | 98 | 100 | 0.9 s / 2.7 s / 210 ms |

Lần này TBT chỉ 170–290 ms và CLS = 0 ở cả 9 lần, sát với lượt 2026-11-18 (TBT ~148 ms). Điều đó xác nhận lượt v2 (TBT tới 3.690 ms, CLS 0,516) là **nhiễu môi trường đo**, không phải regression từ PR #108–#113. Cả ba trang **đạt** mục tiêu Performance ≥ 85 / A11y ≥ 90 / SEO ≥ 95. Đây là baseline trước lượt v4.

## Đo lại production 2026-11-20 — lượt 3 (v4, sau PR #119/#120)

Chạy lại cùng quy trình (Lighthouse 13.6.0, Chrome Playwright headless shell, mobile, simulated throttling, 3 lần mỗi trang) trên production sau khi token layer và E2E isolation được merge. Báo cáo gốc: `prod-{home,product,blog}-v4-{1,2,3}.json.gz` trong [`docs/lighthouse-reports/`](lighthouse-reports/) (nén gzip để giảm dung lượng repo). Bộ ivy (3 lần trên `/p/ivy-tennis-bracelet`) cũng được giữ dưới dạng `prod-ivy-{1,2,3}.json.gz`; trung vị Performance **93** (91–100), Accessibility 100, SEO 100. Đây là nơi duy nhất ghi số ivy; `DEPLOY.md` chỉ link tới đây.

| Trang | Performance (median; range) | Accessibility | Best practices | SEO | FCP / LCP / TBT median | CLS |
|---|---:|---:|---:|---:|---|---:|
| Home (`/`) | **95** (85–98) | 96 | 100 | 100 | 1.2 s / 3.0 s / 47 ms | 0 |
| Sản phẩm (`/p/aurora-band`) | **98** (94–100) | 100 | 100 | 100 | 1.2 s / 2.2 s / 93 ms | 0 |
| Blog chi tiết | **98** (95–98) | 98 | 100 | 100 | 1.0 s / 2.2 s / 103 ms | 0 |

TBT 30–207 ms và CLS = 0 ở cả 9 lần, xác nhận lượt v2 vẫn là nhiễu đo. Cả ba trang đạt mục tiêu Performance ≥ 85 / A11y ≥ 90 / SEO ≥ 95. Đây là **baseline hiện tại**. Output đầy đủ 9 lần nằm trong PR evidence và file review `docs/reviews/2026-11-20-requesting-code-review-round-2.md`.

## Chính sách lưu báo cáo Lighthouse

- Chỉ giữ bộ đang làm baseline (v4 cho Home/Sản phẩm/Blog và 3 lần ivy) trong `docs/lighthouse-reports/`, ở dạng `.json.gz`.
- Các lượt đã bị thay (v1, v2, v3, warm-up) đã bị xoá khỏi repo. Chúng vẫn tồn tại trong lịch sử Git cũ, nhưng không được thêm vào PR code nữa.
- Khi cần báo cáo cho một lần đo mới, đính kèm qua GitHub Release/artifact hoặc PR riêng chỉ chứa evidence; PR code không kèm file JSON/gzip báo cáo.
- Test `src/test/lighthouse-reports.test.ts` chặn việc thêm file báo cáo không phải baseline.

## Kiểm chứng tự động khác (2026-11-19 → 2026-11-20)

Bảng Lighthouse ngay trước mục này là lượt đo 2026-11-18; số liệu mới nhất nằm ở mục "Đo lại production 2026-11-20 — lượt 3 (v4)" phía trên — xem ở đó trước khi đánh giá hiệu năng. Những kiểm chứng tự động khác có output thực:

- **E2E local:** `npm run test:e2e` → 43 pass trên 2 project (`desktop-chrome` 29 + `pixel-7` 14), gồm 2 test upload ảnh ADMIN (3 ảnh, progress toast, 201, WebP < 400 KB có ETag/304, chặn file > 4 MB). Bộ axe gồm 6 test trong `e2e/accessibility.spec.ts` (Home, Category, Product, Blog list, Blog detail, contact popover - chạy cả 2 project) và 6 test trong `e2e/admin-a11y.spec.ts` (desktop) → **0 lỗi serious/critical**.
- **Smoke production:** `BASE_URL=https://ant-jewelry.vercel.app npm run test:smoke:production` → **8/8 pass**: 6 màn 200 + đúng 1 `h1` + canonical đúng; ảnh `/uploads/` trên `/p/ivy-tennis-bracelet` có ETag và < 400 KB; `robots.txt`/`sitemap.xml` đúng. Chạy sau mỗi deploy.
- **Ảnh đối chiếu:** `npm run test:screenshots` tạo 6 ảnh desktop 1920px (chờ `networkidle` + font/ảnh eager) trong `docs/deploy-screenshots/`; dùng cho bảng R6.3 trong `docs/DEPLOY.md`.
- **CI:** job `e2e` trong `.github/workflows/ci.yml` chạy browser + `npm run test:e2e` và upload `playwright-report/`, `test-results/` (trace) khi fail.
- **Đánh đổi E3 đã đóng:** ảnh upload từng được phục vụ `unoptimized` ở mọi kích thước như một workaround cho lỗi 400 chưa rõ trên Vercel — không phải để tiết kiệm dung lượng, mà ngược lại làm tăng bytes. Sau khi sửa `images.localPatterns` và đo production 2026-11-20 (optimizer trả 13.350 B cho ảnh raw 337.464 B), ảnh `/uploads/` đã đi qua optimizer. Lỗi 400 ban đầu với URL không query vẫn chưa rõ nguyên nhân. Chi tiết + số đo trong `docs/DEPLOY.md` mục S3/E3.

## Ngân sách hiệu năng trong CI (K1, 2026-11-25)

CI không thay thế baseline đo tay ở trên. Job `e2e` trong [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) chạy `npx lhci autorun` sau `npm run test:e2e`, trên production build local đã reset database E2E. [`lighthouserc.json`](../lighthouserc.json) quy định bốn trang: Home `/`, danh mục `/c/wedding-ring`, sản phẩm `/p/aurora-band` và blog chi tiết `/blog/cach-chon-nhan-cuoi-phu-hop`; mỗi trang **3 lần mobile** với simulated throttling, aggregation **median**. Ngưỡng assert ở mức `error`: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95, CLS ≤ 0,1. Assert dưới ngưỡng làm job `e2e` đỏ; không dùng `continue-on-error`.

Báo cáo gốc được ghi vào `lhci-report/` (đã nằm trong `.gitignore`) rồi upload làm artifact **`lighthouse-report`** với `if: always()`, giữ 7 ngày. Không commit báo cáo CI vào repo; xem artifact của từng run trên [workflow `ci`](https://github.com/khanhtung2410/ant-jewelry/actions/workflows/ci.yml) để đối chiếu, không chép số của một run vào bảng baseline tay ở trên.

Lần chạy đầu tiên sau khi sửa sandbox (`45655992481`) đỏ đúng như thiết kế: ảnh bìa blog không có kích thước rõ nên khi ảnh về trễ, footer bị đẩy xuống với CLS trung vị `0,2515` (ngưỡng `0,1`) và Performance trung vị `0,76`. Báo cáo Lighthouse trong artifact ghi nguyên nhân `Unsized image element` cho `<img>` bìa. `src/features/blog/components/blog-detail.tsx` đã thêm `width="1200"` và `height="630"` để trình duyệt dành chỗ trước khi ảnh tải; guard `blog-detail.test.tsx` chặn việc bỏ hai thuộc tính này. Một lần đo Home trong cùng run cũng ghi CLS `0,5164` nhưng trung vị vẫn `0`, nên chưa làm đỏ assert; đó vẫn là rủi ro nhiễu trên runner dùng chung.

`ci.collect.settings.chromeFlags` chứa `--no-sandbox`: runner `ubuntu-latest` không cho phép Chrome dùng unprivileged user namespaces, nên nếu thiếu flag này LHCI dừng ở `ChromeLauncher` trước khi chạy bất kỳ assert nào. Flag nằm trong config dùng chung nên có hiệu lực với **mọi** lần `npx lhci autorun` đọc file này, kể cả chạy trên máy local; LHCI chỉ mở server local do chính nó khởi động. Test `src/test/lighthouse-config.test.ts` chặn việc xoá flag hoặc thay bằng token không hợp lệ.
