# Code review - Hero slider pause button removal (2026-11-23)

- **Skill:** requesting-code-review
- **Scope:** whole branch `fix/remove-hero-pause-button`, 3 source/test files plus the spec, plan and docs added in Task 3
- **Base:** d7a51e73daab4c02523f6612d18297d6a32eb2a9 | **Head:** 67a0b393e91e60c96c168dbb126e5536215f6ee2
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 16:19:20 +07:00 - Bỏ nút pause khỏi hero slider`.

## Method

Reviewer độc lập (fresh context) được dispatch qua skill `requesting-code-review`, dùng mẫu `code-reviewer.md`, chế độ read-only. Reviewer đọc trọn spec, plan, ledger, toàn bộ diff, cả hai file test hero slider, file e2e và grep toàn repo để tìm reference còn sót. Sau khi nhận findings, tôi đọc trọn `docs/ARCHITECTURE.md` trước khi sửa, grep mọi consumer của giá trị bị đổi, và đối chiếu từng mục checklist với test hoặc output thật. Các script shell của Superpowers không chạy được do không có distro WSL; review package được thay bằng SHAs và `git diff` trực tiếp.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `docs/ARCHITECTURE.md:72` | Mở file, dòng 72 vẫn viết "Người dùng có thể tạm dừng hoặc tiếp tục bằng nút Pause/Play". Sau change không còn nút này, nên tài liệu hiện trạng sai và vi phạm rule 3. | **Accepted (fixed in `fix/remove-hero-pause-button`)** - đã đổi thành mô tả các cơ chế tạm dừng không hiển thị. |
| 2 | Minor · `src/features/layout/components/hero-slider.auto-slide.test.tsx:294` | Tên test "announces while auto advancing" nhưng assertion kiểm tra `aria-live="off"`, tức là tắt thông báo. Gây hiểu nhầm khi đọc test. | **Accepted (scheduled in follow-up branch `fix/hero-slider-test-name`)** - chỉ sai tên, không sai hành vi; theo giao thức inline execution, finding Minor không vào đợt sửa này. |
| 3 | Minor · `docs/superpowers/plans/2026-11-23-remove-hero-pause-button.md:33-34` | Review Focus nói e2e còn pin assertion "không có nút pause", nhưng Task 2 đã xóa assertion đó khỏi `e2e/hero-slider-a11y.spec.ts`. | **Accepted (fixed in `fix/remove-hero-pause-button`)** - đã sửa Review Focus để chỉ ghi nhận unit test; đây là lỗi trong tài liệu tôi vừa viết nên sửa trước khi commit. |

## Declined to judge

- Khoảng trống WCAG 2.2.2 (không còn điều khiển pause cố định): chủ dự án đã chọn "remove visible button only" và chấp nhận; không mở lại.
- Yêu cầu WAI-ARIA APG carousel pause control: cùng quyết định của chủ dự án.
- Approach C (xóa mọi hành vi tạm dừng): nằm ngoài phạm vi đã chọn, spec đã từ chối.
- Product carousel và carousel khác: spec Non-goals cấm sửa.
- Đổi khoảng cách 5000 ms: spec Non-goals cấm sửa.
- Viết lại `AI_LOG.md:213` và `docs/reviews/2026-11-23-receiving-code-review.md:30`: nội dung lịch sử verbatim, spec Non-goals cấm sửa.
- Tự chạy lại bộ test/e2e trong review read-only: reviewer dùng bằng chứng đã ghi trong ledger (16 unit tests, 2 e2e tests); tôi đã tự chạy lại toàn bộ sau đó.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Không còn nút pause/play render | `does not render a pause or play control and announces while auto advancing` trong `hero-slider.auto-slide.test.tsx` | đạt/pass |
| Reduced motion vẫn dừng auto advance và live region về `polite` | `never auto slides when the user prefers reduced motion` (unit) và `hero slider does not auto advance when reduced motion is preferred` (e2e, 2 browser projects) | đạt/pass |
| Hover vẫn tạm dừng | `pauses auto slide while the pointer is over the slider` | đạt/pass |
| Focus trong slider vẫn tạm dừng | `pauses auto slide while focus is inside the slider and resumes when focus leaves` | đạt/pass |
| Live region bắt đầu ở `off` | assertion mới trong test ở `hero-slider.auto-slide.test.tsx:298` | đạt/pass |
| Không còn reference tới `isPlaying` trong production source | grep toàn `src/`, chỉ còn assertion mới có chủ đích | đạt/pass |
| Docs hiện trạng được cập nhật | diff `docs/ARCHITECTURE.md:72`, không có test tự động | lacking evidence (chỉ có diff, không có test tự động) |
| Kiểm tra ngôn ngữ sạch | `npm run check:language`, EXIT=0, stdout không có dòng nào | đạt/pass |

## Verification output

```text
### prepare: npx --no-install next typegen
EXIT=0
--- STDOUT ---
Generating route types...
✓ Types generated successfully

--- STDERR ---


### prepare: npm run db:push
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

The database is already in sync with the Prisma schema.


--- STDERR ---
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.


### npm run lint
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 lint
> eslint


--- STDERR ---


### npm run typecheck
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit


--- STDERR ---


### npm test
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/remove-hero-pause-button


 Test Files  83 passed (83)
      Tests  396 passed (396)
    Start at  16:24:54
    Duration  71.14s (tests 42%, import 33%, environment 17%, transform 4%, setup 2%, worker 2%)

     Import  206 modules were evaluated 664 times · 13.19s total, 33% of tracked time
             ~9.10s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation


--- STDERR ---


### npm run format:check
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

--- STDERR ---


### npm run build
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 223ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.5s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 3.3s
  Finalizing page optimization ...

Route (app)                                 Revalidate  Expire
┌ ○ /                                              15m      1y
├ ○ /_not-found
├ ◐ /admin
├ ◐ /admin/blog
├ ◐ /admin/categories
├ ◐ /admin/hero-slides
├ ◐ /admin/login
├ ◐ /admin/products
├ ◐ /admin/settings
├ ◐ /admin/users
├ F /api/admin/products/[productId]/images
├ ○ /blog                                          15m      1y
├   /blog/[slug]                                   15m      1y
│ ├ ◐ /blog/[slug]                                 15m      1y
│ └ ○ /blog/__empty__                              15m      1y
├   /c/[slug]                                      15m      1y
│ ├ ◐ /c/[slug]                                    15m      1y
│ └ ◐ /c/__empty__                                 15m      1y
├ ○ /jewelry-care                                  15m      1y
├   /p/[slug]                                      15m      1y
│ ├ ◐ /p/[slug]                                    15m      1y
│ └ ○ /p/__empty__                                 15m      1y
├ ○ /privacy                                       15m      1y
├ ○ /robots.txt
├ ○ /ship                                          15m      1y
├ ○ /sitemap.xml                                   15m      1y
├ ○ /terms                                         15m      1y
└ F /uploads/[...path]


F Proxy (Middleware)

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
F  (Dynamic)            server-rendered on demand


--- STDERR ---


### npm run check:language
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs


--- STDERR ---

```

Bản capture thô đã được xóa vào 2026-11-25 vì trùng lặp với khối output ở trên; toàn bộ output vẫn nằm trong chính review record này. Ký tự legend U+0192 của Next.js đã được thay bằng `F` trong bản trích dẫn ở file này và trong PR body theo rule 12.

## Limitations

- Không có production check trên môi trường deploy; chỉ có build local và e2e local.
- Reviewer không tự chạy lại test; bằng chứng là ledger và lượt chạy lại của tôi.
- Finding 2 được xếp lịch ở nhánh follow-up, chưa sửa trong PR này.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 16:19:20 +07:00 - Bỏ nút pause khỏi hero slider`.
