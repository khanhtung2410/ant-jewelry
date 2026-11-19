# Code Review toàn dự án (S1)

## Phạm vi và phương pháp

- **Base (commit đầu tiên):** `5e19d3f81b17ab491c0883287de424f2e6566dfa`
- **Head được review:** `6e5f7589f2e764eb7cb663a469e919c47e4a63ca` (`main` sau PR #99)
- **Skill đã dùng:** `requesting-code-review`. **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-19 14:14:21 +07:00 - Review toàn dự án theo 4 vùng (S1)`.
- **Cách làm:** 4 reviewer độc lập, mỗi người một vùng, đọc toàn bộ file trong phạm vi. Sau đó người viết **tự kiểm chứng lại từng phát hiện bằng cách đọc mã nguồn thật**, mới quyết định sửa / hoãn / bác. Không tự động chấp nhận gợi ý của AI.
- **Quy ước quyết định:**
  - **Accepted — sửa trong PR này** — đã kiểm chứng, sửa nhỏ, rủi ro thấp.
  - **Accepted — hoãn → `<nhánh/PR>`** — có thật nhưng cần thiết kế riêng, migration, hoặc thay đổi hành vi/UX; không trộn vào PR review.
  - **Rejected — bác** — sai với triển khai hiện tại, không có lỗ hổng thực tế, hoặc là đánh đổi đã được ghi nhận.

## Tóm tắt

| Vùng | Critical | Important | Minor | Accepted (fix) | Accepted (defer) | Rejected |
|---|---|---|---|---|---|---|
| (1) Upload & phục vụ ảnh | 0 | 0 | 4 | 2 | 2 | 0 |
| (2) Auth & phân quyền | 0 | 2 | 6 | 1 | 5 | 2 |
| (3) Server Actions & Zod | 0 | 0 | 6 | 1 | 4 | 1 |
| (4) Storefront & SEO | 0 | 1 | 8 | 3 | 5 | 1 |
| **Tổng** | **0** | **3** | **24** | **7** | **16** | **4** |

Ghi chú: reviewer storefront tách riêng 2 phát hiện CLS (blog cover, markdown inline ảnh); file này gộp thành mục 4.5 nên tổng số mục ở thân bài là 27 (7 + 16 + 4). Không có lỗi Critical. 3 lỗi Important: 2 nằm ở rate-limit đăng nhập (hoãn sang PR bảo mật riêng vì cần đổi thiết kế), 1 là metadata trang danh mục (đã sửa trong PR này).

---

## (1) Upload & phục vụ ảnh

### 1.1 · `src/app/uploads/[...path]/route.ts:13-16` · Minor

- **Tái hiện:** `curl -i -H 'If-None-Match: *' /uploads/products/<id>/x.webp` → vẫn trả `200` + toàn bộ body dù representation tồn tại.
- **Vì sao:** RFC 9110 §13.1.2 quy định `*` khớp mọi representation hiện có. Không có hậu quả bảo mật, chỉ tốn băng thông + một lần đọc blob.
- **Quyết định: Accepted — sửa trong PR này.** Thêm `*` vào `etagMatches()`, kèm test trong `route.test.ts`. Hành vi ảnh legacy (không có hash) vẫn tính từ bytes.

### 1.2 · `scripts/product-image-processing.mjs:21` · Minor

- **Tái hiện:** admin upload file PNG ~4 MB có IHDR khai báo ~16000×16000 nhưng dữ liệu nén rất dễ (low entropy). Qua được giới hạn 4 MB + magic-byte, rồi `sharp().resize()` giải mã ~256 MP (~1 GB RGBA) trước khi thu nhỏ.
- **Vì sao:** body cap chỉ giới hạn kích thước **nén**, không phải số pixel **giải mã**. Đây là vector tốn bộ nhớ/chi phí Function, chỉ admin mới dùng được.
- **Quyết định: Accepted — sửa trong PR này.** Truyền `{ limitInputPixels: 16_000_000 }` cho `sharp()` — cao hơn nhiều so với mục tiêu 1600 px nhưng chặn trường hợp cực đoan.

### 1.3 · `src/app/api/admin/products/[productId]/images/route.ts:76-99` · Minor

- **Tái hiện:** gửi file có chữ ký PNG + IHDR hợp lệ nhưng IDAT bị cắt/hỏng. `detectProductImageType` cho qua, `resizeToStoredWebp` ném lỗi → route trả `500 "Image upload failed. Please retry."`, không phân biệt được với sự cố DB thật.
- **Vì sao:** phân loại lỗi sai; cam kết "chỉ JPEG/PNG/WebP thật" mới chỉ dừng ở magic byte. Không có rủi ro stored-XSS vì bytes được mã hóa lại bằng sharp.
- **Quyết định: Accepted — hoãn → `fix/upload-errors`** (cùng nhóm với 1.4). Cần tách riêng lỗi sharp (415/422 "ảnh hỏng") khỏi lỗi lưu trữ (500); nên kèm test nên không đưa vào PR review.

### 1.4 · `.../images/route.test.ts:77-140` và `uploads/route.test.ts:13-66` · Minor

- **Tái hiện:** đọc test — không có case 403 (thiếu session / thiếu Origin / sai Origin), 413 (quá 4 MB), 415 (sai magic byte), 404 (key sai / thiếu blob). Test `/uploads` còn tự định nghĩa lại class lỗi, che giấu trường hợp route và storage dùng hai identity lỗi khác nhau (sẽ thành 500 mà test không phát hiện).
- **Vì sao:** các nhánh nhạy cảm nhất (CSRF, auth, path traversal) không có regression test.
- **Quyết định: Accepted — hoãn → `test/upload-security`.** Bổ sung case 403/413/415/404 và dùng class lỗi thật từ storage module.

---

## (2) Auth & phân quyền

### 2.1 · `src/features/auth/client-ip.ts:10-13` · Important

- **Tái hiện (trên proxy không ghi đè XFF):** gửi mỗi login POST với `X-Forwarded-For: 203.0.113.<n>` khác nhau → `parseClientIp` lấy hop đầu do attacker chọn → khóa `isLoginRateLimited(email, ip)` không bao giờ đạt 5.
- **Đánh giá lại:** triển khai mục tiêu là Vercel, nền tảng này **ghi đè** `x-forwarded-for` bằng chain thật, nên cách bypass cụ thể ở trên **không xảy ra trên production hiện tại**. Tuy nhiên với reverse proxy tự host (đúng như comment của file mô tả "proxy nối thêm địa chỉ vào cuối") thì client vẫn có thể giả hop đầu. Rủi ro có thật về tính di động, không phải lỗi đang bị khai thác.
- **Quyết định: Accepted — hoãn → `security/auth-hardening`.** Cần quyết định nguồn IP tin cậy theo môi trường (header của platform / trusted-proxy allowlist) và thêm bộ đếm **theo email** không phụ thuộc IP. Không đổi ngữ nghĩa rate-limit trong PR review.

### 2.2 · `src/features/auth/login-rate-limit.ts:15-29,36-39`; `src/features/auth/actions.ts:52,81` · Important

- **Tái hiện:** bắn ~50 request login sai password đồng thời cho cùng email/IP. Mỗi request chạy `isLoginRateLimited` khi count vẫn là 0 (chưa request nào commit), rồi mới `recordFailedLogin`; chỉ các request đến sau khi commit mới thấy `count >= 5`.
- **Vì sao:** chuỗi check→record không nguyên tử (TOCTOU), nên trần 5 lần/15 phút không được đảm bảo under concurrency — đúng cách bot tấn công.
- **Quyết định: Accepted — hoãn → `security/auth-hardening`** (chung với 2.1). Cần counter nguyên tử (upsert `count = count + 1 ... RETURNING` trong cùng transaction, hoặc Redis `INCR`/`EXPIRE`). Đây là thiết kế lại, không phải sửa nhỏ.

### 2.3 · `src/features/auth/actions.ts:23-25` · Minor

- **Tái hiện:** tamper field ẩn `next` trong POST server action thành `/admin/../../admin/settings` hoặc `/admin/login?...`. `resolveNextPath` cũ chỉ kiểm tra `startsWith('/admin')`, yếu hơn validator ở `login/page.tsx`.
- **Vì sao:** Không nhất quán giữa hai biên; không dẫn tới open redirect external (vẫn phải bắt đầu bằng `/admin`) nhưng cho phép sửa path và dễ hỏng khi refactor.
- **Quyết định: Accepted — sửa trong PR này.** Trích helper chung `src/features/auth/next-path.ts` dùng cho cả page và action; chặn external URL, `//`, `\`, `..`, control chars và `/admin/login`. Kèm `next-path.test.ts`.

### 2.4 · `src/features/auth/actions.ts:52-54` · Minor

- **Tái hiện:** sau 5 lần sai, lần thứ 6 trả `TOO_MANY_ATTEMPTS` mà **không** gọi `bcrypt.compare`, khác mọi nhánh lỗi khác.
- **Đánh giá lại:** không rò rỉ tồn tại tài khoản — nhánh nhanh áp dụng như nhau dù email có tồn tại hay không, và response vốn đã công bố trạng thái rate-limit. Đây là **lệch văn bản invariant** ("luôn chạy bcrypt.compare"), không phải lỗ hổng.
- **Quyết định: Rejected — bác** (không sửa code). Ghi nhận để không viết lại invariant theo nghĩa "luôn luôn" ở tài liệu sau này.

### 2.5 · `src/proxy.ts:23-31` · Minor

- **Tái hiện:** ADMIN khóa EDITOR (hoặc EDITOR logout, tăng `sessionVersion`), EDITOR replay token cũ còn hạn → `readValidatedSession` ở edge chỉ kiểm tra chữ ký/hạn, cho qua; layout `requireAdminSession` → `getAdminSession()` đọc DB rồi mới chặn.
- **Đánh giá lại:** hiện **không khai thác được** vì mọi page/action đều gọi lại `getAdminSession()`. Edge chỉ là redirect UX.
- **Quyết định: Rejected — bác dưới dạng lỗ hổng; chấp nhận là ghi chú tài liệu.** Làm rõ trong `docs/PERMISSIONS.md` rằng proxy không phải lớp authorization và mọi route admin phải tự kiểm tra session.

### 2.6 · `src/features/auth/session.ts:80-95` · Minor

- **Tái hiện:** giữ token cũ còn hạn của user U, gọi `logoutAction()` với token đó → `revokeAdminSession` chỉ đọc chữ ký/hạn, không so `sessionVersion`, rồi tăng version của U → vô hiệu hóa các session hợp lệ hiện tại của U.
- **Quyết định: Accepted — hoãn → `security/auth-hardening`.** Cần gọi `getAdminSession()` trong logout và update có điều kiện `where: { id, sessionVersion }`; đồng thời đảm bảo session hết hạn vẫn xóa được cookie. Không đưa vào PR review để tránh hồi quy luồng logout.

### 2.7 · `src/features/users/actions.test.ts:44-152` · Minor

- **Tái hiện:** test action chỉ spy mức isolation, không gọi `saveUserAccess` với DB thật cho trường hợp hạ quyền/khóa ADMIN cuối cùng; mới chỉ có unit test `wouldRemoveLastActiveAdmin`.
- **Quyết định: Accepted — hoãn → `test/security`.** Thêm integration test (1 ADMIN → bị chặn, DB không đổi; 2 ADMIN → thành công).

### 2.8 · `.../images/route.test.ts:23-32`; `session.test.ts:39-72` · Minor

- **Tái hiện:** test upload route chỉ mock session ADMIN — thiếu assert 403 cho EDITOR/null và missing/cross-origin `Origin`; `session.test.ts` không test `revokeAdminSession` tăng version + set cookie age 0 (đúng thứ commit 43c0d90 từng sửa).
- **Quyết định: Accepted — hoãn → `test/security`** (gộp với 2.7).

---

## (3) Server Actions & Zod validation

### 3.1 · `src/features/products/lib/product-form-schema.ts:15-23` · Minor

- **Tái hiện:** ADMIN tạo/sửa sản phẩm với giá `3.000.000.000`. Zod chấp nhận (`Number.isSafeInteger` đúng), rồi `prisma.product.create/update` ném lỗi vì `Product.price` là `Int` (tối đa 2.147.483.647); catch trong `saveProduct` chỉ xử lý `P2002`/`InvalidProductColorError` → lỗi tràn ra 500/error boundary.
- **Quyết định: Accepted — sửa trong PR này.** Thêm `.refine((v) => v <= 2_147_483_647, 'Price is too large.')` + test. Không đổi schema DB.

### 3.2 · `src/features/blog/actions.ts:61-80` · Minor

- **Tái hiện:** nếu `createMany` trong `syncBlogPostImages` lỗi sau khi post update ở `:126-135` đã commit, `deleteMany` ở `:69` đã xóa sạch `BlogImage` → bài vừa lưu mất toàn bộ ảnh cover/inline, không rollback.
- **Quyết định: Accepted — hoãn → `fix/blog-image-sync`.** Cần gói post upsert + image sync vào một `prisma.$transaction`, hoặc insert ảnh mới trước rồi xóa ảnh cũ. Thay đổi luồng ghi, không trộn vào PR review.

### 3.3 · `src/features/users/actions.test.ts:44-152` · Minor

- Trùng 2.7. **Quyết định: Accepted — hoãn → `test/security`.**

### 3.4 · `src/features/admin/lib/admin-redirect.ts:1-38` · Minor

- **Tái hiện:** không có test file. Một thay đổi tương lai bỏ check `url.pathname !== allowedPath` sẽ để `returnTo='//evil.com'` chảy vào `redirect()` ở `saveProduct/saveCategory/...`.
- **Quyết định: Accepted — hoãn → `test/security`.** Helper hiện đúng (đã đọc mã), chỉ thiếu regression test.

### 3.5 · `src/features/products/actions.ts:230-469` (và categories/blog/layout/users) · Minor

- **Tái hiện:** gọi `moveProductImage(id, imageId, undefined as any, ...)` → `direction` silently thành `'down'`; truyền `File` làm `productId` → `"[object File]"`. Các đối số server action này không được Zod validate.
- **Đánh giá lại:** **không có bypass khai thác được** — mọi ghi đều dùng `where` ghép (`id` **và** `productId`), kiểm tra tồn tại, và enforce permission. Chỉ là defense-in-depth.
- **Quyết định: Rejected — bác cho PR này; Accepted — hoãn → `refactor/action-args-validation`.** Phạm vi rất lớn (nhiều action), lợi ích thấp so với rủi ro thay đổi hàng loạt chữ ký.

### 3.6 · `src/features/products/actions/categories.ts:90-101,121-128` · Minor

- **Tái hiện:** hai request `saveCategory` tạo cùng `type` ('WEDDING RING') với slug khác nhau, cả hai đều qua check `findFirst`; `Category.type` không có `@unique` nên cả hai insert được.
- **Quyết định: Accepted — hoãn → `db/category-type-unique`.** Cần `@unique` + migration SQLite/PostgreSQL + map P2002 sang field `type`. Phối hợp migration, không làm trong PR review.

---

## (4) Storefront & SEO

### 4.1 · `src/app/(public)/c/[slug]/page.tsx:1-42` · Important

- **Tái hiện:** GET `/c/wedding-ring` → dùng chung `<title>ANT JEWELRY</title>`, description và OG image mặc định, **không có canonical**, dù trang này nằm trong `sitemap.ts` (priority 0.7).
- **Vì sao:** vi phạm yêu cầu SEO rõ ràng; nhiều URL trùng title/description/OG → tín hiệu duplicate content, snippet yếu, share mạng xã hội giống hệt.
- **Quyết định: Accepted — sửa trong PR này.** Thêm `generateMetadata` đọc `getCategoryBySlug`, set title/description/canonical/OG/Twitter, `notFound()` khi slug không tồn tại — đồng nhất với pattern của `/p/[slug]`.

### 4.2 · `src/features/layout/components/hero-slider.tsx:22-30,48-52` · Minor

- **Tái hiện:** xóa/ẩn mọi `HeroSlide` rồi GET `/` → nhánh empty-state có `<section>` nhưng **không có `<h1>`**; khi có slide thì H1 duy nhất nằm trong `<div className="sr-only">`.
- **Quyết định: Accepted — sửa trong PR này.** Đưa một `<h1 className="sr-only">ANT JEWELRY</h1>` duy nhất vào `<main>` của `src/app/(public)/page.tsx` (luôn render), bỏ H1 khỏi `HeroSlider`, giữ các `<p>` mô tả slide. Cập nhật test.

### 4.3 · `blog/page.tsx`, `terms/page.tsx`, `ship/page.tsx`, `privacy/page.tsx`, `jewelry-care/page.tsx` · Minor

- **Tái hiện:** các route indexable này có title/description nhưng không có `<link rel="canonical">` (chỉ `/`, `/p/[slug]`, `/blog/[slug]` có).
- **Quyết định: Accepted — sửa trong PR này.** Thêm `alternates: { canonical: '/<route>' }` cho 5 trang.

### 4.4 · `settings.ts` + `footer.tsx` + `contact-popover.tsx` · Minor

- **Tái hiện:** chạy khi không có `Setting` row / thiếu bảng (fallback P2021) → `facebookUrl`, `instagramUrl`, `phone`, `email` là `''`; footer và popover vẫn render `<a href="">`, `href="tel:"`, `href="mailto:"` → link chết.
- **Quyết định: Accepted — hoãn → `fix/contact-links`.** Cần render có điều kiện và dùng lại `isSafeLinkHref` cho social URL; là thay đổi UI nên cần kiểm tra thủ công. DB seed luôn có giá trị nên không ảnh hưởng production hiện tại.

### 4.5 · `src/features/blog/components/blog-detail.tsx:28-34`; `src/features/shared/lib/markdown.tsx:25-32` · Minor

- **Tái hiện:** `<img loading="eager" fetchPriority="high">` của ảnh cover (LCP) không có width/height/aspect-ratio → CLS; ảnh inline trong markdown cũng không có intrinsic size và không có `sizes`/`srcset`.
- **Quyết định: Accepted — hoãn → `perf/image-dimensions`.** Dùng aspect-ratio box + `next/image` (`fill`, `sizes`, `unoptimized={shouldSkipImageOptimizer(...)}`, `priority`). Lighthouse hiện 81–98 nên cần đo lại sau khi đổi.

### 4.6 · `product-card.test.tsx:8-23`; `product-detail.test.tsx:7-22` · Minor

- **Tái hiện:** mock `next/image` ở các test này chỉ lưu `src`/`alt`/`className`/`aria-hidden`, bỏ qua `unoptimized`/`sizes` — khác với `blog-row.test.tsx`/`hero-slider.test.tsx`. Hành vi "upload bỏ qua optimizer, mock dùng optimizer" không được assert ở bề mặt ảnh có lượng truy cập lớn nhất.
- **Quyết định: Accepted — hoãn → `test/image-optimizer`.**

### 4.7 · `sitemap.ts`, `robots.ts`, `layout.tsx`, các `generateMetadata` · Minor

- **Tái hiện:** không có test nào cho metadata output, canonical/OG/Twitter, nội dung sitemap hay rule robots — chính là lý do lỗi 4.1 lọt qua.
- **Quyết định: Accepted — hoãn → `test/seo`.** Thêm test serialize metadata + assert sitemap loại trừ sản phẩm ẩn, bài draft, category ẩn.

### 4.8 · `src/app/(public)/page.tsx:45-49,61`; `product-page-content.tsx:34` · Minor

- **Tái hiện:** carousel dưới fold dùng `contentVisibility: 'auto'` + `containIntrinsicSize` → subtree không được layout/paint cho đến khi cuộn gần.
- **Đánh giá lại:** crawler không cuộn có thể không thấy link sản phẩm, nhưng carousel đầu tiên không bị defer và **mọi URL sản phẩm đều có trong sitemap**. Đây là đánh đổi hiệu năng có chủ đích, đã ghi trong `docs/PERFORMANCE.md`.
- **Quyết định: Rejected — bác** (giữ nguyên), kèm điều kiện: mọi sản phẩm defer phải còn reachable qua link không-defer hoặc sitemap — hiện đã thỏa.

### 4.9 · `src/features/shared/lib/site-url.ts:1-8` · Minor

- **Tái hiện:** deploy không có `SITE_URL` và không phải Vercel → canonical/OG/sitemap/robots lặng lẽ trỏ `http://localhost:3000`.
- **Quyết định: Accepted — hoãn → `fix/seo-config`.** Đã có ghi chú trong `PERFORMANCE.md`; bổ sung item vào deploy checklist (warn/throw khi production thiếu origin canonical). Không sửa code trong PR review.

---

## Kiểm chứng

```text
git diff --stat 5e19d3f8..6e5f758   # 4 reviewer đọc toàn bộ file trong phạm vi
Tự đọc lại: client-ip.ts, login-rate-limit.ts, auth/actions.ts, login/page.tsx,
            uploads/route.ts, product-image-processing.mjs, product-form-schema.ts,
            blog/actions.ts, c/[slug]/page.tsx, home page, hero-slider.tsx, ...
```

Sau các fix trong PR này:

```text
npm run lint          exit=0
npm run typecheck     exit=0
npm run format:check  exit=0
npm test              61 files / 270 tests pass
npm run build         exit=0
```

## Đánh đổi khi clone production

Các phát hiện Important về rate-limit (2.1, 2.2) được hoãn có chủ đích: trên Vercel, XFF bị ghi đè nên 2.1 không xảy ra; 2.2 cần counter nguyên tử (DB/Redis) làm thay đổi hạ tầng. Cả hai được theo dõi trong `security/auth-hardening`, không bị "bác" vô lý. Các phát hiện bị bác (2.4, 2.5, 3.5, 4.8) đều có phân tích rõ lý do ở trên.
