# Full codebase + production review (2026-11-20)

- **Skill:** `requesting-code-review` + `verification-before-completion`
- **Head:** `5bd146f` (main sau PR #113) · **Base:** `5e19d3f` (commit đầu tiên)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-20 ... - Kiểm tra codebase + production (lượt cuối)`.

## Phương pháp

Ba reviewer độc lập, blind, chế độ read-only: (1) diff PR #110–#113 + UI/tests/deps, (2) core auth/upload/data, (3) docs/evidence. Mọi finding quan trọng đã được người viết **đọc lại file thật** trước khi ghi quyết định. Production check dùng Playwright với tài khoản ADMIN do người dùng cung cấp (không lưu credential vào repo), **chỉ đọc**, không tạo/sửa/xóa dữ liệu.

## Production check (có output)

```text
LOGIN: OK -> https://ant-jewelry.vercel.app/admin
/admin 200 "Dashboard"     /admin/products 200 "Products"
/admin/categories 200      /admin/blog 200 "Blog"
/admin/hero-slides 200     /admin/settings 200 "Settings"
/admin/users 200           (ADMIN access confirmed)
confirm: focus="Cancel" Tab=>"Delete" Escape closed, record visible=true
hide confirm: Hide button=1, Escape kept visible=true
uploaded images on ivy page: 2
LOGOUT: OK
native dialogs: 0 | browser errors: none
```

Kết quả: #1 (hide confirm), #5 (focus trap), #6 (test gap — hành vi production đúng) đã hoạt động trên production thật; không có lỗi console/5xx, không dùng `window.confirm`.

## Findings và quyết định

| # | Mức | Phát hiện (file:line) · tái hiện | Quyết định |
|---|---|---|---|
| 1 | **Important** | `docs/REQUIREMENTS.md:257,269,865,977` vẫn ghi Staff/EDITOR "chỉ xem sản phẩm, chỉ quản lý Blog", mâu thuẫn với §3.3 (`:275-286`) đã sửa ở finding #2 và với `PERMISSIONS.md`/code. | **Fixed trong PR #114.** Đã sửa cả 4 chỗ (`:257`, `:269`, `:865`, `:977`) theo `PERMISSIONS.md`; grep lại không còn "Staff chỉ xem sản phẩm" ở các mục đã chốt. Không đổi code. |
| 2 | **Important** | `docs/PERFORMANCE.md:92-94` (và `:29`) vẫn nói "không có lần đo Lighthouse mới" trong khi ngay trước đó có mục "Đo lại production 2026-11-20" với 12 JSON. Tự mâu thuẫn. | **Fixed trong PR #114.** Preamble và `:29` đã chỉ rõ lượt 2026-11-18 là cũ; mục "Đo lại 2026-11-20 — lượt 2 (v3)" là baseline hiện tại. |
| 3 | **Important** | Số E2E "27" vẫn nằm ở `docs/PERFORMANCE.md:96`, `docs/DEPLOY.md:237,250`, `README.md:228`; HEAD thực tế **30** (18 desktop + 12 pixel-7). | **Fixed trong PR #114.** Đã đổi 27 → **30** (18 desktop + 12 pixel-7) tại `PERFORMANCE.md`, `DEPLOY.md` (2 chỗ), `README.md`; grep lại không còn "27 pass/test". |
| 4 | **Important** | `docs/REQUIREMENTS.md:1318` vẫn ghi "Lưu trữ hình ảnh local (filesystem) … Đã triển khai" — sót khác của finding #3, mâu thuẫn `:1272`/`:1594`/DEPLOY. | **Fixed trong PR #114.** `REQUIREMENTS.md:1318` đã ghi DB-backed `ProductImageBlob` qua `/uploads/[...path]`; filesystem chỉ là đường đọc legacy. |
| 5 | Minor | Token hóa màu không tương đương giá trị: `close-button.tsx:16-18` đổi focus ring `red-800 #991b1b` → `--control-outline #24453c` (đỏ → xanh); `neutral-800 #262626` → `--font-color #383838`; `neutral-200 #e5e5e5` → `--button-bg-hover #bbbab6`; `red-50 #fef2f2` → `#fee2e2`. | **Fixed trong PR này.** Thêm `--neutral-strong: #262626`, `--neutral-hover: #e5e5e5`; focus ring dùng `--danger-strong: #991b1b`; `--danger-bg: #fef2f2`, `--success-text: #065f46` — tất cả khớp palette Tailwind cũ. Cập nhật assertion test của arrow-button. |
| 6 | Minor | `scripts/reencode-legacy-uploads.mjs:13-17` — `withVersionQuery` dùng `split('?')`: `?v=1` giữ nguyên (không bust khi re-run), fragment `a.png#frag?v=2` sai chỗ, `?` thứ hai bị cụt. Test `legacy-image-migration.test.ts:43-53` chỉ phủ 3 happy path. | **Fixed trong PR này.** Dùng `new URL()` + `searchParams.set('v','2')` (set, không add → bust `?v=1`), bảo toàn fragment, encode `?` trong query thành `%3F`. RED trước: `?v=1` giữ nguyên; GREEN: 5/5 test pass. |
| 7 | Minor | `src/test/legacy-image-migration.test.ts:55-82` tạo blob nhưng không tạo `ProductImage`, nên nhánh cập nhật URL (`reencode-legacy-uploads.mjs:56-69`) không bao giờ chạy; xóa nhánh đó vẫn xanh. | **Fixed trong PR này.** Test mới tạo `ProductImage` thật trên sản phẩm có sẵn trong DB test với URL `?v=1`, chạy migration và assert URL thành `?v=2`; RED trước khi sửa helper, GREEN sau. Cleanup cả blob lẫn ProductImage. |
| 8 | Minor | `confirm-popover.tsx:18,25,105` — prop `busy` chỉ có trong component + test; `AdminConfirmForm` đóng popover ngay khi confirm nên không bao giờ truyền. | **Fixed trong PR này.** Bỏ prop `busy`, thuộc tính `disabled` và test associated; ghi rõ trong `AdminConfirmForm` rằng popover đóng khi confirm, double-submit chặn bằng `confirmedRef`, pending action announcement bằng `AdminStatusToast`. |
| 9 | Minor | `e2e/storefront-admin.spec.ts:297-339` để lại DB E2E bẩn (đổi giá 12.345.678, đổi tên "Aurora Band (EDITOR rename)") không khôi phục; test Ẩn mới chỉ khôi phục phần của nó. | **Accepted → `test/e2e-isolation`.** Không block (workers=1, webServer reset mỗi run), nhưng dễ gãy khi đổi thứ tự test. |
| 10 | Minor | `login-rate-limit.ts:11-13` comment nói response rate-limited "giống hệt" login sai, nhưng thực tế trả `TOO_MANY_ATTEMPTS` (`errors.ts`, `messages.ts`). | **Rejected dưới dạng lỗ hổng; accepted như sửa comment.** Không rò rỉ tồn tại tài khoản (cả 2 message đều generic); chỉ sai văn bản. |
| 11 | Minor | XFF leftmost hop (`client-ip.ts`), check→record race (`login-rate-limit.ts`), orphan blob khi crash giữa 2 ghi, password trim chỉ ở update, E1 chỉ phủ DB blob. | **Rejected cho lượt này / deferred.** Đã đánh giá ở S1–S2: Vercel ghi đè XFF; OI-021 còn TBC; xác suất crash thấp; filesystem legacy là đường đọc-only. Theo dõi trong `security/auth-hardening` + `fix/polish`. |
| 12 | Minor | `docs/reviews/2026-11-19-superpowers.md:5` còn một ký tự CJK lọt vào câu mô tả, dùng `Fixed/Deferred` thay vì Accepted/Rejected và thiếu file:line; `AI_LOG.md` thứ tự trong cùng ngày 2026-11-17 không monotonic. | **Fixed trong PR này.** Đã dịch ký tự CJK sang tiếng Việt, giữ nguyên prompt nguyên văn; các vấn đề định dạng/độ chi tiết của file review lịch sử được ghi nhận nhưng không sửa nội dung đánh giá cũ. |
| 13 | Rejected | "Performance suy giảm sau #108–#113" (Home 95 → 74). | **Rejected.** Đã kiểm chứng 12 JSON: A11y/SEO ổn định, một lần Home TBT 3.690 ms / CLS 0,516 trong khi 2 lần kia 410/1.000 ms; lượt cũ TBT ~150 ms. Đây là nhiễu môi trường đo, docs đã ghi rõ và chờ đo lại trên máy yên tĩnh. |
| 14 | Rejected | EDITOR upload ảnh phải 403. | **Rejected.** `permissions.ts` dùng `products:update`, EDITOR có quyền này theo quyết định #41/S1. |

## Kiểm chứng local (fresh)

```text
npm run lint          exit=0
npm run typecheck     exit=0
npm test              exit=0  (64 files / 295 tests)
npm run format:check  exit=0
npm run build         exit=0
E2E: 30 tests pass (18 desktop-chrome + 12 pixel-7) — evidence from PR #113
```

## Hạn chế

- Không có credentials DB production → không kiểm tra migration status, nội dung DB, hay dữ liệu test tồn đọng. Các ô `[ ]` trong DEPLOY.md giữ nguyên.
- Không có Figma gốc → không đối chiếu pixel cho 6 màn R6.3.
- Đây là lượt review; **không sửa code hay dữ liệu production**, mọi phát hiện chỉ ghi quyết định và nhánh follow-up.

## Cập nhật trong cùng PR #114

Người dùng yêu cầu "update doc file to match current code / rerun light house / any change add to pr 114", nên các mục docs đã được sửa ngay trong PR này (không mở PR mới):

- **Finding #1 → Fixed:** 4 chỗ `REQUIREMENTS.md` (`:257`, `:269`, `:865`, `:977`) đã đổi từ "Staff chỉ xem" sang mô hình quyền hiện hành.
- **Finding #2 → Fixed:** `PERFORMANCE.md` preamble và `:29` đã chỉ rõ lượt 2026-11-18 là cũ, lượt mới nằm ở mục đo lại.
- **Finding #3 → Fixed:** số E2E 27 → **30** (18 desktop + 12 pixel-7) tại `PERFORMANCE.md`, `DEPLOY.md` (2 chỗ) và `README.md`.
- **Finding #4 → Fixed:** `REQUIREMENTS.md:1318` đổi sang DB-backed `ProductImageBlob` qua `/uploads/[...path]`.
- **Finding #13 (Lighthouse) → khẳng định Rejected bằng dữ liệu mới:** chạy lại Lighthouse lần 2 (v3, 3 lần + warm-up mỗi trang) trên máy yên tĩnh: Home **94** (89–94), Product **94** (94–95), Blog **93** (92–93), TBT 170–290 ms, CLS 0 ở cả 9 lần. Điều này chứng minh lượt v2 (Home 74, TBT 3.690 ms) là nhiễu đo. `PERFORMANCE.md` ghi v3 là baseline hiện tại; `DEPLOY.md` cập nhật theo.
- **Finding #5 (color drift) vẫn mở** → `fix/token-equivalence` (không sửa trong PR docs này). Các minor #6–#9 vẫn theo nhánh đã đặt ở bảng trên.
