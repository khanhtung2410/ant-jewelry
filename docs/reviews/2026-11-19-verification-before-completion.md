# S5 — Kiểm chứng trước khi báo xong

- **Ngày:** 2026-11-19
- **Skill:** `verification-before-completion`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-19 15:xx +07:00 - Kiểm chứng trước khi báo xong (S5)`.
- **Nguyên tắc:** chỉ ghi "đạt" khi có output đi kèm. Output dưới đây được chạy lại **sau** khi sửa warning lint và xóa script tạm, ngay trước khi mở PR.

## 1. Bộ lệnh trong `docs/CONTRIBUTING.md` (mục Testing / trước khi mở PR)

Capture bằng Node `spawnSync`, UTF-8, `FORCE_COLOR=0`, `NO_COLOR=1` — không dùng PowerShell redirect.

```text
===== npm run lint (exit 0) =====

> ant-jewelry@0.1.0 lint
> eslint

===== npm run typecheck (exit 0) =====

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

===== npm test (exit 0) =====

> ant-jewelry@0.1.0 test
> vitest run

 RUN  v5.1.0 D:/thuc tap/ant-jewelry

  Test Files  64 passed (64)
       Tests  289 passed (289)
    Duration  40.62s (tests 47%, import 41%, transform 6%, setup 3%, worker 3%)

===== npm run format:check (exit 0) =====

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

===== npm run build (exit 0) =====

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 262ms
✓ Compiled successfully in 5.7s
  Finished TypeScript in 6.8s ...
✓ Generating static pages using 7 workers (53/53) in 10.1s
```

**Kết luận:** cả 5 lệnh exit 0; lint không còn warning (lần chạy đầu còn 1 warning `adminB unused` từ PR #101 — đã sửa trong PR này trước khi chạy lại).

## 2. Kiểm tra production (read-only)

Đích: `https://ant-jewelry.vercel.app`. Chỉ GET, không tạo/sửa/xóa dữ liệu.

```text
home                   200 text/html; charset=utf-8 len=120371 canonical=https://ant-jewelry.vercel.app
category               200 text/html; charset=utf-8 len=63522  canonical=https://ant-jewelry.vercel.app/c/wedding-ring
blog list              200 text/html; charset=utf-8 len=39178  canonical=https://ant-jewelry.vercel.app/blog
terms                  200 text/html; charset=utf-8 len=27224  canonical=https://ant-jewelry.vercel.app/terms
sitemap                200 application/xml len=5271
robots                 200 text/plain; charset=utf-8 len=109
upload image           200 image/webp len=319809 etag="33a31f86c69f934cc7bf0bcf5561c36c7f9da27b4f14d1b7208d385f62d3ce63"
conditional upload     304 "33a31f86c69f934cc7bf0bcf5561c36c7f9da27b4f14d1b7208d385f62d3ce63"
optimizer inner query  200 image/jpeg len=3477
```

Đối chiếu với phát hiện:

| Kiểm tra | Phát hiện | Kết quả |
|---|---|---|
| Category có canonical riêng | 4.1 / PR #100 | đạt (`/c/wedding-ring`) |
| Blog list + static page có canonical | 4.3 / PR #100 | đạt (`/blog`, `/terms`) |
| `/uploads` có ETag, conditional trả 304 | B6 / PR #98, #102 | đạt |
| Inner `url` có `?v=2` qua optimizer không còn 400 | S3 / PR #102 | đạt (200) |
| sitemap / robots phục vụ được | 4.7 | đạt |

## 3. Kiểm tra đầu ra mong đợi của chuỗi S1→S5

| Yêu cầu | Bằng chứng |
|---|---|
| Có một file `docs/reviews/…` cho S1 | `docs/reviews/2026-11-19-requesting-code-review.md` (đã bổ sung bảng liên kết PR + danh sách bác) |
| PR sửa lỗi liên kết tới phát hiện tương ứng | Bảng "Liên kết phát hiện ↔ PR" trong file review S1 (#98, #100, #101, #102) |
| Danh sách phát hiện đã bác kèm lý do | Mục "Phát hiện bị bác" trong file review S1 (2.4, 2.5, 3.5, 4.8 + bác một phần 2.1, 4.7) |

## Hạn chế

- Không có thông tin Vercel/PostgreSQL production nên không chạy `db:migrate:status:production` hay truy vấn DB production; production check chỉ là HTTP read-only ở trên.
- Không tạo dữ liệu thử trên production; không có cleanup phải làm.
