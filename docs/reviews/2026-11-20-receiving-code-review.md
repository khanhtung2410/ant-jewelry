# Review of review process — S6, S7, S8 (2026-11-20)

- **Skill:** `receiving-code-review` (ten skill that actually drove this round: read -> understand -> verify in source -> evaluate -> decide)
- **Head reviewed:** `3249432` (main after PR #123)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-20 15:55:00 +07:00 - Ghi nhận phản hồi Superpowers S6-S8`.
- **Nguồn phát hiện:** mentor (qua người dùng). Mọi phát hiện được đọc lại từ file thật trước khi ghi quyết định.

## Findings và quyết định

| # | Mức · file:line | Reproduction / effect | Quyết định |
|---|---|---|---|
| S6 | Important · `src/features/auth/actions.ts:26-29,71`; `src/features/users/lib/user-form-schema.ts:15`; `src/features/users/actions.ts:118`; `src/features/users/lib/user-form-schema.test.ts:18-26` | Review finding #11 ("password trim chỉ ở update") được sửa bằng `.trim()` ở create + test RED→GREEN, nhưng không ai đọc `loginAction`. `grep -rn "password" src/features` cho thấy email được `normalizeEmail` còn password đi thẳng vào `bcrypt.compare`. User tạo với mật khẩu có dấu cách đầu/cuối được hash dạng đã trim; đăng nhập bằng đúng chuỗi đó fails. Test chỉ phủ schema, không phủ luồng tạo user → đăng nhập (F1). | **Accepted (documented).** Đã chèn ví dụ này vào mục "AI sai ở đâu" của entry `AI_LOG.md` `13:49`. Quy tắc cho lượt sau: với mọi phát hiện về một giá trị, grep mọi nơi dùng giá trị đó trước khi sửa và viết test cho cả luồng, không dừng ở unit test schema. F1 vẫn mở; chưa fix vì người dùng không yêu cầu fix code trong phản hồi này. |
| S7 | Important · `docs/reviews/2026-11-19-superpowers.md:1,22` | File ghi skill là "superpowers" — không phải tên skill. 11 phát hiện đều trùng checklist đợt 3–4 của mentor, không có phát hiện mới. Finding #9 bác việc sửa mojibake, trái yêu cầu mentor. | **Accepted (fixed).** Sửa dòng 1 thành `receiving-code-review` (khớp `AI_LOG.md` entry cũ ghi dùng nguyên tắc receiving-code-review); thêm ghi chú đầu file rằng không có phát hiện mới và không được trình bày như review độc lập; đổi trạng thái finding #9 thành "Rejected (sai — đã đảo tại PR #123)". Quy tắc mới: mọi file review ghi đúng tên skill; nếu không tìm thêm gì ngoài checklist, nói rõ. |
| S8 | Important · `e2e/production.smoke.spec.ts:33-57`; `docs/reviews/2026-11-19-systematic-debugging.md:6`; 5 file `requesting-code-review*` | Bốn lượt review không phát hiện T2 (thiếu E2E upload thật qua ADMIN) và không phát hiện F2 (kết luận S3 nói quá). Các mục "Đạt" trong review không được đối chiếu với test/output cụ thể. | **Accepted (fixed cho quy trình).** Thêm vùng "Đối chiếu checklist mentor ↔ code/test thật" bên dưới với từng mục và bằng chứng hoặc ghi rõ "không có". Quy tắc mới được ghi vào `docs/CONTRIBUTING.md`. T2/F2 vẫn mở; chưa fix code/docs kỹ thuật vì nằm ngoài phạm vi phản hồi này. |

## Đối chiếu checklist mentor ↔ code/test thật

| Mục mentor ghi Đạt / phát hiện | Bằng chứng trong repo | Kết luận đối chiếu |
|---|---|---|
| `requesting-code-review` 4 lượt, reviewer độc lập read-only | 5 file: `2026-11-19-requesting-code-review.md`, `2026-11-19-requesting-code-review-final.md`, `2026-11-20-requesting-code-review.md`, `2026-11-20-requesting-code-review-round-2.md`, `2026-11-20-requesting-code-review-d9-d10.md`; mỗi file có file:line, mức độ, quyết định | Có bằng chứng (số lượt thực tế 5, mentor nói 4) |
| `receiving-code-review` có bảng kiểm chứng, phát hiện bị bác kèm lý do | Các bảng "Quyết định" / "Phát hiện bác" trong các file review ở trên và `2026-11-19-superpowers.md` | Có bằng chứng |
| `systematic-debugging` đủ 4 phase | `docs/reviews/2026-11-19-systematic-debugging.md` (Phase 1-4); `docs/reviews/2026-11-20-requesting-code-review-round-2.md` mục "Flake investigation" (Phase 1-4, probe 3/10) | Có bằng chứng |
| TDD commit đỏ riêng #102 `6cb30bb` → `66b7238` | `git cat-file -t` trả `commit` cho cả hai; `git show --stat 6cb30bb`: `test(images): add red tests...`, 2 file, 104 dòng mới; `66b7238`: fix tương ứng | Có bằng chứng |
| `verification-before-completion` có output | PR #121/#122/#123 body chứa stdout+stderr đầy đủ của 6 lệnh; `AI_LOG.md` các entry gắn output | Có bằng chứng |
| brainstorming → spec → plan cho PR #119 | `docs/superpowers/specs/2026-11-20-token-layer-design.md`, `docs/superpowers/plans/2026-11-20-layered-design-tokens.md` | Có bằng chứng |
| S6 / F1: luồng tạo user → đăng nhập có test | Chỉ có `user-form-schema.test.ts:18-26` (schema). `src/features/auth/actions.test.ts` không có ca password có dấu cách. `grep -rn "password" src/features` xác nhận `loginAction` không trim | **Không có test cho luồng** — đúng S6 |
| S8 / T2: E2E upload thật qua ADMIN | `e2e/` chỉ có `production.smoke.spec.ts:33-57` kiểm tra ảnh upload đã có (`/uploads/...`, <400 KB, ETag). Không có test nào đăng nhập ADMIN rồi upload file | **Thiếu** — đúng T2 |
| S8 / F2: kết luận S3 có output chứng minh | `docs/reviews/2026-11-19-systematic-debugging.md:6` khẳng định chắc chắn nguyên nhân là `images.localPatterns`; các lượt review sau không trích output thử nghiệm đối chứng | **Kết luận nói quá so với bằng chứng** — đúng F2 |

## Kiểm chứng

- Đọc lại toàn bộ file được trích dẫn; không tin vào mô tả của feedback khi chưa thấy file.
- Các lệnh `git cat-file`, `git show --stat`, `grep -rn`, `glob` được chạy thật trong lượt này; output tóm tắt nằm trong bảng đối chiếu.
- Không chạy full check gate trong reviewer này (chỉ thay đổi tài liệu); gate được chạy riêng và dán nguyên vào PR body.

## Hạn chế

- F1, T2, F2 được xác nhận là hở nhưng chưa sửa: phản hồi của người dùng chỉ yêu cầu ghi nhận ví dụ S6 và đổi quy trình review cho S7/S8.
- Không có bản gốc checklist mentor trong repo để đối chiếu ngoài nội dung prompt; bảng đối chiếu dựa trên các mục mentor nêu trong prompt.

## Cập nhật F1 (2026-11-20, branch `fix/f1-password-whitespace`)

Người dùng yêu cầu sửa F1 theo hướng được khuyên dùng: **không trim, từ chối khoảng trắng đầu/cuối bằng thông báo rõ**, áp cho cả ba chỗ.

| File | Thay đổi | Bằng chứng |
|---|---|---|
| `src/features/users/lib/user-form-schema.ts` | Bỏ `.trim()` ở create và update; thêm refine `value === value.trim()` với cùng thông báo. Update giữ `''` hợp lệ (không đổi mật khẩu) nhưng `'   '` bị từ chối. | `user-form-schema.test.ts` |
| `src/features/auth/messages.ts`, `src/features/auth/errors.ts`, `src/features/auth/actions.ts` | Thêm `AUTH_MESSAGES.PASSWORD_WHITESPACE`, `invalidPasswordFormatState()`, và check sớm trong `loginAction` trước khi đếm rate limit. | `password-flow.test.ts` |
| `src/features/auth/password-flow.test.ts` (mới) | Test luồng thật: create → login đúng chuỗi; update → login đúng chuỗi; create/update có khoảng trắng → lỗi trường; login có khoảng trắng → cùng thông báo rõ. | RED 3/5 trước sửa, GREEN 5/5 sau sửa |

Quyết định: **Accepted (fixed)**. Các file review lịch sử vẫn giữ nguyên mô tả cũ theo đúng nguyên tắc không viết lại lịch sử; entry này ghi nhận quyết định mới. Hạn chế: user đã tạo trước đây với mật khẩu chứa dấu cách (bị trim lúc tạo) vẫn cần dùng mật khẩu đã trim để đăng nhập — không thể tự sửa hash cũ trong phạm vi này.

## Cập nhật F2 (2026-11-20, branch `fix/f2-s3-conclusion`)

Người dùng chỉ ra S3 khẳng định quá mức: lỗi gốc của PR #94 xảy ra với URL **không có query string**, trước khi E1 thêm `?v=2`; `localPatterns.search = ''` giải thích lỗi của bản sửa E1, không phải lỗi 400 ban đầu.

| File | Thay đổi | Quyết định |
|---|---|---|
| `docs/reviews/2026-11-19-systematic-debugging.md:6` (và tiêu đề, ghi chú Phase 1) | Tách thành hai lỗi: "lỗi do `?v=2` (đã sửa)" và "lỗi 400 ban đầu trên Vercel (chưa rõ nguyên nhân)"; Phase 1 ghi rõ repro chỉ phủ biến thể có query. | **Accepted (fixed)** |
| `docs/DEPLOY.md:138` và `:23` | Bỏ câu "Nguyên nhân thật của 400 đã được tìm và sửa"; nêu rõ lỗi ban đầu không query vẫn chưa rõ. | **Accepted (fixed)** |
| `docs/PERFORMANCE.md:133` (phát hiện thêm khi grep) | Đồng bộ cùng cách diễn đạt để không còn câu mâu thuẫn. | **Accepted (fixed)** |

Không viết lại các phát hiện lịch sử khác; chỉ sửa các câu khẳng định nguyên nhân. Hạn chế: vẫn không có bằng chứng giải thích `uniqueContextId not found` — file review tiếp tục ghi nhận là chưa rõ.
