# Full codebase + production review (final verification round)

- **Ngày:** 2026-11-19
- **Skill:** `requesting-code-review` + `verification-before-completion`
- **Head được review:** `6679a0e` (main sau PR #108) · **Base:** `5e19d3f` (commit đầu tiên)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-19 ... - Kiểm tra toàn diện codebase + production`.

## Phương pháp

- 3 reviewer độc lập (core/auth+upload, admin UI+E2E+CI, docs/process), không biết kết quả lẫn nhau, chế độ **read-only**. Tất cả phát hiện dưới đây đã được người viết **đọc lại mã thật** trước khi ghi quyết định.
- Production check bằng **Playwright** với tài khoản ADMIN do người dùng cung cấp (không lưu thông tin đăng nhập vào repo). Chỉ đọc/điều hướng; **không tạo, sửa hay xóa dữ liệu nội dung**. Output thực ở mục Production bên dưới.
- Quy ước: **Accepted** = có thật, cần sửa (có PR/nhánh tiếp theo) · **Rejected** = không đổi vì lý do nêu rõ.

## Production check (có output)

Lần đầu đăng nhập với mật khẩu cũ bị từ chối (`Invalid email or password.`); người dùng cung cấp mật khẩu mới, lần hai thành công. (Hệ quả: 2 bản ghi `LoginAttempt` trên production — chỉ là log hệ thống, không phải dữ liệu nội dung; không có dữ liệu test nào được tạo.)

```text
LOGIN: OK -> https://ant-jewelry.vercel.app/admin
/admin -> 200 | h1="Dashboard"
/admin/products -> 200 | h1="Products"
/admin/categories -> 200 | h1="Categories"
/admin/blog -> 200 | h1="Blog"
/admin/hero-slides -> 200 | h1="Hero Slides"
/admin/settings -> 200 | h1="Settings"
/admin/users -> 200 | h1="Users"          (ADMIN access confirmed)
products rows: 2
edit dialog: visible | price readonly = null   (ADMIN có thể sửa giá)
edit dialog Escape: closed
/admin/blog -> confirm opened | focus="Cancel" | dangerStyle=true | Escape closed (no delete)
native window.confirm dialogs: 0
browser errors: none
LOGOUT: OK -> https://ant-jewelry.vercel.app/admin/login
```

Kết luận production: đăng nhập/đăng xuất, 7 màn admin, dialog sửa sản phẩm, popover xác nhận xóa (focus Cancel, style danger, Escape hủy, **không** dùng `window.confirm`) đều hoạt động; không có lỗi console hay HTTP 5xx.

## Findings và quyết định

| # | Mức | Phát hiện (file:line) · tái hiện | Quyết định |
|---|---|---|---|
| 1 | **Critical (acceptance)** | `src/features/products/components/product-management.tsx:183-190` — nút **Ẩn** gọi `toggleProductVisibility` ngay, **không có bước xác nhận**. Vi phạm NFR-017 (`REQUIREMENTS.md:772`), AC-054 (`:1431`, "100% thao tác xóa/ẩn có xác nhận"), FR-024 (`:540`). Mọi thao tác xóa khác dùng `AdminConfirmForm`. | **Accepted → đã sửa trong `fix/hide-confirmation`.** Tái dùng `AdminConfirmForm` có sẵn (tham số hóa `confirmLabel` / `danger` / `pendingMessage`) thay vì tạo component mới; chỉ wrap chiều Ẩn, giữ "Hiển thị" không confirm. E2E: click Ẩn → dialog "Hide" → Cancel giữ nguyên; confirm → đổi trạng thái rồi khôi phục. |
| 2 | Important (owner decision) | `src/features/shared/lib/permissions.ts:28-34` cấp cho EDITOR `products:update`, `categories:manage`, `hero_slides:manage`; `docs/REQUIREMENTS.md:279-286` (ma trận "đã chốt") nói EDITOR **chỉ đọc sản phẩm**, không quản lý danh mục/hero slide. `docs/PERMISSIONS.md` và `permissions.test.ts` khớp code, không khớp spec. | **Resolved — theo `PERMISSIONS.md` (quyết định chủ sở hữu):** `REQUIREMENTS.md` đã được cập nhật toàn bộ (§1.3.1, §2 actor, §3.3 matrix, mô tả module, route table, OI-004) để khớp mô hình quyền đã triển khai. **Không đổi code hay `PERMISSIONS.md`.** |
| 3 | Important | `docs/CONTRIBUTING.md:102-104,121`, `docs/REQUIREMENTS.md:1268-1272,1318,1331,1559` vẫn chép trạng thái cũ "Prisma/Zod chưa cài", "ảnh lưu filesystem"; `REQUIREMENTS.md:1237-1239` sai route tĩnh (`/terms-and-conditions` thay vì `/terms`, v.v.). | **Fixed trong PR docs này.** CONTRIBUTING mục Database/Validation ghi Prisma 7 + Zod 4 đã cài; REQUIREMENTS ghi DB-backed `ProductImageBlob` thay vì filesystem; route tĩnh đổi thành `/terms`, `/privacy`, `/ship` (+ `/jewelry-care`); quyền `/admin/categories/*`, `/admin/hero-slides/*` cho EDITOR. |
| 4 | Important | `AI_LOG.md:2873-4607` lặp byte-for-byte tại `4668-6402` (1.735 dòng); 52/137 heading `## ` trùng; một entry 2026-11-17 nằm cuối file, sai thứ tự và sai tên mục. | **Fixed trong PR docs này.** Dùng script một lần (ngoài repo) xóa bản lặp chính xác (4.528 dòng), gộp 1 đoạn lặp đuôi 43 dòng, sửa 1 dòng `---## ` bị dính, chuyển entry 2026-11-17 14:02 vào đúng vị trí, đổi 25 heading mojibake `â€”` → `—` và chuẩn hóa 2 heading legacy. Kết quả: **0 heading trùng**, 85 mục, thứ tự mới nhất lên đầu; **không sửa nội dung prompt nguyên văn**. |
| 5 | Important (evidence) | `e2e/ui-screenshots.spec.ts:16-18` bỏ qua ảnh `loading="lazy"`; chụp `fullPage` không cuộn trang, nên vùng ảnh dưới fold có thể trống, trong khi `docs/DEPLOY.md:195` ghi "đã tải xong". | **Fixed trong `fix/screenshot-eager`.** RED: assert `complete && naturalWidth > 0` cho mọi ảnh local ⇒ Home fail với 2 ảnh blog cover lazy chưa tải. GREEN: ép `loading='eager'` + `decode()` (giữ timeout 3s), assert lại trước khi chụp; 6/6 pass và regenerate 6 ảnh. Lưu ý: 6 PNG đầu ra **byte-identical** với bản cũ, nên không khẳng định ảnh cũ bị trống — fix đảm bảo điều đó về sau. `DEPLOY.md:195` đã sửa mô tả. |
| 6 | Important (test gap) | `confirm-popover.test.tsx` chỉ `renderToStaticMarkup`; xóa toàn bộ `useEffect` focus trap vẫn `npm test` xanh. Không có E2E cho Escape/focus/delete-cancel. | **Accepted → `test/confirm-interaction`.** Thêm test jsdom (focus ban đầu, Tab wrap, Escape, backdrop) + 1 E2E Escape không xóa dữ liệu. |
| 7 | Important (ops) | Cột `etag` nullable, mọi blob cũ có `NULL` until script E1/B6 chạy tay → 304 vẫn kéo bytes. Chưa có dòng checklist deploy cho việc chạy script. | **Accepted → thêm dòng "đã chạy E1/B6" vào `docs/DEPLOY.md` readiness checklist** (`docs/deploy-checklist`). Không đưa vào migration SQL vì script cần sharp + URL bust. |
| 8 | Minor | `uploads/route.ts:37` dùng `??` nên `contentType: ''` trả header rỗng ở 304 (200 thì có fallback) · `reencode-legacy-uploads.mjs:59` ghép `?v=2` vào URL đã có query · danger colors chưa token hóa · effect focus trap phụ thuộc `[onCancel]` dễ re-focus · `expect(file).toBeTruthy()` trong screenshot spec là no-op. | **Accepted (gộp `fix/polish`)** — không block. |
| 9 | Rejected | EDITOR upload ảnh phải bị 403. | **Rejected** — đã kiểm chứng ở S1: `permissions.ts:49` dùng `products:update`, EDITOR có quyền này theo quyết định #41. Không đổi. |
| 10 | Rejected | XFF first-hop là lỗ hổng trên Vercel. | **Rejected** — Vercel ghi đè `x-forwarded-for`; chỉ là rủi ro nếu deploy sau proxy khác. |
| 11 | Rejected | Sửa Lighthouse numbers trong PERFORMANCE.md theo PR mới. | **Rejected** — chưa đo lại; giữ số cũ và ghi rõ mốc đo (đã làm ở PR #108). |

## Kiểm chứng local (fresh, trước khi ghi báo cáo)

```text
npm run lint          exit=0
npm run typecheck     exit=0
npm test              exit=0  (64 files / 289 tests)
npm run format:check  exit=0
npm run build         exit=0
AI_LOG: 6454 lines, 137 headings, 52 duplicate headings (finding #4)
```

## Hạn chế

- Không có file Figma gốc nên không thể xác nhận khớp pixel cho 6 màn R6.3; bảng chỉ ghi lệch đã biết.
- Không đọc được schema/migration status của production DB (không có credentials DB), không kiểm tra được dữ liệu test trong DB. Các ô `[ ]` trong DEPLOY.md giữ nguyên.
- Không sửa code hay dữ liệu production trong lượt này; mọi phát hiện chỉ được ghi quyết định.
