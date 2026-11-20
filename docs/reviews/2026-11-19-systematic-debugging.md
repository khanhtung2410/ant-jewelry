# S3 — Điều tra lỗi 400 optimizer: giải thích được lỗi do `?v=2`, lỗi 400 ban đầu trên Vercel vẫn chưa rõ

- **Ngày:** 2026-11-19
- **Skill:** `systematic-debugging`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-19 15:xx +07:00 - Tìm root cause optimizer và TDD E1/B6 (S3/S4)`.
- **Kết luận ngắn (hiệu chỉnh theo F2 — cần phân biệt hai lỗi):**
  - **Lỗi do `?v=2` (đã tìm và sửa):** sau khi E1 thêm hậu tố `?v=2` vào URL ảnh, Next.js 16 chèn mặc định `images.localPatterns = [{ pathname: '**', search: '' }]`; `search: ''` từ chối mọi inner URL có query string → 400 `"url" parameter is not allowed`. Đã sửa bằng `images.localPatterns: [{ pathname: '**' }]`. Toàn bộ Phase 1–4 bên dưới mô tả **lỗi này**.
  - **Lỗi 400 ban đầu trên Vercel (chưa rõ nguyên nhân):** URL trong PR #94 là `/_next/image?url=%2Fuploads%2F…png&w=256`, **không có `?v=2`** (E1 chưa tồn tại lúc đó). Chuỗi `INVALID_IMAGE_OPTIMIZE_REQUEST` / `uniqueContextId not found` không tái hiện được ở local. **Không khẳng định đã tìm root cause của lỗi này** — xem mục "Phần không giải thích được" cuối file.

## Phase 1 — Root cause investigation

### 1. Đọc kỹ error message

- `grep -rn "INVALID_IMAGE_OPTIMIZE_REQUEST" node_modules/next` → **0 kết quả**.
- `grep -rn "uniqueContextId" node_modules` → chỉ có trong `playwright-core/types/protocol.d.ts` (protocol type, không liên quan optimizer).
- Next.js 16.4.5 tự sinh các lỗi 400 dạng `'"url" parameter is not allowed'` (`image-optimizer.js:235-238`, `:259-262`), không phải chuỗi `INVALID_IMAGE_OPTIMIZE_REQUEST`.

→ Kết luận tạm: app trả `"url" parameter is not allowed`; chuỗi mentor thấy là của lớp Vercel edge. Cần tìm tại sao validateParams từ chối.

### 2. Tái hiện ổn định

Build production (`npm run build`) rồi `npm run start`, gọi `/_next/image` qua Node `fetch` với các biến thể inner `url` (`w=256&q=75`). Output thực tế:

```text
control mock               200 image/jpeg
mock + inner ?v=2          400 null :: "url" parameter is not allowed
mock + inner ?foo=bar      400 null :: "url" parameter is not allowed
mock + inner ? (empty)     200 image/jpeg
control + outer &cb=99     200 image/jpeg
upload no query            404 null :: "url" parameter is valid but internal response is invalid
upload + inner ?v=2        400 null :: "url" parameter is not allowed
```

Lỗi tái hiện 100% local — nhưng chỉ cho biến thể **có query string** (`?v=2`, `?foo=bar`), tức lỗi phát sinh sau E1. Phát hiện này không giải thích được lỗi 400 ban đầu trên Vercel, vốn xảy ra với URL không query.

### 3. Kiểm tra thay đổi gần đây

`next.config.ts` không có `images`. Tuy nhiên `.next/required-server-files.json` (config runtime sau build) có:

```json
"localPatterns": [{ "pathname": "**", "search": "" }]
```

→ Next 16 tự chèn default này lúc build.

### 4. Evidence tại ranh giới component

Gọi trực tiếp `ImageOptimizerCache.validateParams()` với đúng config runtime từ `required-server-files.json`:

```text
/mock/products/ring-6.webp             -> OK
/mock/products/ring-6.webp?v=2         -> "url" parameter is not allowed
/mock/products/ring-6.webp?            -> OK
/mock/products/ring-6.webp?foo=bar     -> "url" parameter is not allowed
/uploads/products/p-1/cover.webp       -> OK
```

→ Lỗi nằm ở bước **validate params**, trước khi fetch ảnh nguồn.

### 5. Trace data flow

`validateParams` (`image-optimizer.js:235`) → `hasLocalMatch(localPatterns, url)` (`shared/lib/match-local-pattern.js:37`) → `new URL(url, 'http://n')` → `matchLocalPattern` (`:24-36`):

```js
if (pattern.search !== undefined) {
  if (pattern.search !== url.search) return false;
}
```

`pattern.search === ''`, `url.search === '?v=2'` → `false` → 400. Với `?` rỗng, `url.search === ''` → khớp → 200. Giải thích chính xác pattern ở bước 2.

## Phase 2 — Pattern analysis

- **Ví dụ hoạt động:** inner URL không query, inner `?` rỗng, outer `&cb=99` (không nằm trong giá trị `url`).
- **Ví dụ hỏng:** mọi inner URL có `?key=value` — đúng cả ảnh mock lẫn ảnh upload → loại ảnh upload/storage ra khỏi nguyên nhân.
- **Khác biệt duy nhất:** `url.search` của inner URL.
- **Dependency:** `images.localPatterns` được Next 16 inject default có `search: ''`; `matchLocalPattern` so sánh `search` nghiêm ngặt (không chuẩn hóa).
- **Tham chiếu đã đọc toàn bộ:** `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`, `image-optimizer.js` (validateParams), `match-local-pattern.js`, `image-config.js`, `required-server-files.json`.

## Phase 3 — Hypothesis & test

**Giả thuyết 1:** file ảnh hỏng. **Bác** — sharp đọc được metadata, direct GET 200.

**Giả thuyết 2:** `w` vượt chiều ảnh nguồn. **Bác** — `w=1920` vẫn 200; Next tự clamp.

**Giả thuyết 3:** kích thước file vượt ngưỡng. **Bác** — PNG 3,97 MB từng trả 200 ở `w=256`.

**Giả thuyết 4 (chấp nhận):** default `localPatterns` có `search: ''` chặn mọi inner URL có query. **Kiểm chứng tối thiểu:** thay config thành `localPatterns: [{ pathname: '**' }]` (bỏ trường `search`) rồi gọi lại `validateParams`:

```text
/mock/products/ring-6.webp?v=2         -> OK
/mock/products/ring-6.webp?foo=bar     -> OK
/uploads/products/p-1/cover.webp?v=2   -> OK
```

→ Giả thuyết đúng. Không cần đổi component, không cần strip query trong `next/image`.

## Phase 4 — Implementation

1. **RED test** (`src/test/image-optimizer-config.test.ts`) — mô phỏng config runtime có `search: ''`, assert `validateParams` không trả errorMessage cho URL có query. Chạy → FAIL: `"url" parameter is not allowed`. Commit riêng.
2. **GREEN** — thêm vào `next.config.ts`:

   ```ts
   images: { localPatterns: [{ pathname: '**' }] }
   ```

   Test chuyển xanh. Build lại + restart server + chạy lại HTTP repro: `?v=2` và `?foo=bar` từ 400 → 200; `/uploads/...?v=2` từ 400 → 404 (đã tới fetch nguồn, chứng tỏ validation không còn chặn).

3. **Không re-enable optimizer cho ảnh upload** — quyết định E3 vẫn giữ `unoptimized` vì lý do kích thước (ảnh ~1600 px cho mọi card). Config mới chỉ đảm bảo optimizer không còn trả 400 nếu sau này bật lại.

## Phần không giải thích được

Chuỗi `uniqueContextId not found` / `Resend failed` của mentor không có trong source Next.js lẫn dependency; không ép tái hiện được. Ghi nhận là lỗi lớp Vercel edge, **không** khẳng định đã tìm root cause cho phần này. Rule: khi không hiểu thì nói không hiểu, không giả vờ.
