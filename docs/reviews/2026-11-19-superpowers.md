# Review 2026-11-19 — superpowers (tự review kiểu E1)

- **Phạm vi:** `main` tại `e64c30b` (sau PR #94), toàn bộ code/docs hiện hành.
- **Mục đích:** tự tìm lỗi kiểu E1 (sai lệch giữa tài liệu/spec và code, bằng chứng không khớp) trước khi mentor tìm ra.
- **Phương pháp:** đọc toàn bộ file liên quan, đối chiếu code ↔ docs ↔ bằng chứng; phân loại Critical / Important / Minor; mỗi phát hiện đều phải có trạng thái `Fixed` hoặc `Rejected/Deferred` kèm lý do.
- **Prompt đã dùng:** xem `AI_LOG.md` mục `2026-11-19 10:38 +07:00`.

## Kết quả tổng hợp

Không có phát hiện **Critical** nào còn mở. Các phát hiện **Important** đã được sửa từ các PR trước hoặc có lý do bác/hoãn rõ ràng bên dưới.

| # | Mức | Phát hiện | Trạng thái | Bằng chứng / lý do |
|---|---|---|---|---|
| 1 | Important | Upload vượt body ~4,5 MB của Vercel (5 MB × 10 file) | **Fixed** (PR #86 + #94) | `MAX_PRODUCT_IMAGE_SIZE = 4 MB`, 1 file/request, UI gửi tuần tự; upload resize WebP ≤1600 px; upload thật 4×201 trên production (`docs/DEPLOY.md:103-120`) |
| 2 | Important | Ảnh upload đi qua `/_next/image` → `400 INVALID_IMAGE_OPTIMIZE_REQUEST` | **Fixed** (PR #94) | `shouldSkipImageOptimizer()` + `unoptimized` cho `/uploads/...` trong 5 component; test `image-url.test.ts` |
| 3 | Important | Prisma 7 không tự generate client sau pull → `npm test` fail | **Fixed** (PR #92) | `postinstall` gọi `scripts/generate-prisma.mjs`; fresh clone không cần lệnh tay; test DB pass |
| 4 | Important | `npm ci` lỗi “not in sync” trên Linux/macOS | **Fixed** (PR #91) | 19 entry `@tailwindcss/oxide*`; workflow `npm ci (Linux)` 3 lần gần nhất success |
| 5 | Important | Checklist deploy phần lớn chưa tick, thiếu bằng chứng production | **Deferred (có lý do)** | `docs/DEPLOY.md:164-175` đã nêu rõ từng artifact cần đính kèm. Agent không có quyền truy cập Vercel dashboard/DB production để lấy output `db:migrate:status:production` hay ảnh ADMIN thật; không tự tick khi chưa có bằng chứng |
| 6 | Important | Preview dùng chung DB Production, có thể ghi vào dữ liệu thật | **Deferred (có lý do)** | Đã cảnh báo rõ tại `docs/DEPLOY.md:68` kèm 3 lựa chọn. Việc tách DB/tắt Preview cần quyền cấu hình Vercel ngoài repo; không tự ý đổi hạ tầng |
| 7 | Important | Bảng Figma ↔ production thiếu màn Contact popover và cột “lệch + lý do” | **Deferred (có lý do)** | `docs/DEPLOY.md:122-133` có 6 màn + ảnh chụp; repo không có file Figma gốc nên không tự suy diễn mức lệch. Chờ mentor cung cấp Figma hoặc chấp nhận đối chiếu theo SAD v1.1 |
| 8 | Minor | Số liệu Lighthouse nhiều bộ (84 / 91 / 85 / 95) dễ gây nhầm | **Fixed** (PR #89/#93) | Bảng mới ghi rõ 3 lần đo + trung vị, các số cũ được ghi nhãn là lượt trước; 9 JSON report gốc trong `docs/lighthouse-reports/` |
| 9 | Minor | `AI_LOG.md` có đoạn mojibake lịch sử (`â€`, `Ã`, …) | **Rejected** | Đây là bản ghi prompt nguyên văn của các phiên cũ; sửa nội dung lịch sử làm sai tính “prompt đã dùng”. Các entry mới đều ghi UTF-8 bằng tool |
| 10 | Minor | PR #72 còn dòng “Full lint/typecheck/test/build not run” | **Rejected** | Là nhận xét trung thực tại thời điểm đó; các PR sau (#83, #84…) đã dán output đầy đủ. Không sửa lịch sử PR |
| 11 | Minor | `bg-black/10` còn xuất hiện trong AI_LOG | **Rejected** | Chỉ nằm trong câu prompt lịch sử; code `contact-popover.tsx:22` đã dùng `bg-[var(--backdrop-color)]` |

## Hành động tiếp theo (không phải Critical/Important chưa xử lý)

- Khi có quyền Vercel: bổ sung output migration status, ảnh ADMIN thật, verify upload sau redeploy và tách/tắt Preview.
- Khi có file Figma: thêm màn Contact popover và cột lệch vào bảng đối chiếu.
