# Code review - PR 154 CI failure and merge conflict (2026-11-23)

- **Skill:** systematic-debugging
- **Scope:** PR 154 `fix/remove-hero-pause-button`: failing `static` check in workflow `ci` and `CONFLICTING` mergeable state after PR 155 was merged
- **Base:** `24ff8a2` (origin/main sau PR 155) | **Head:** `14452e8` (merge commit trên nhánh PR)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 16:47:41 +07:00 - Sửa PR 154: lỗi static check và xung đột merge`.

## Method

Self-review theo đúng bốn phase của `systematic-debugging`, không đưa ra fix trước khi có root cause.

1. Phase 1 - đọc `gh pr view 154 --json statusCheckRollup,mergeable` và `gh run view 45147984546 --log-failed`: job `static` đỏ duy nhất vì `npm run check:language` tìm thấy ký tự U+0192; bốn job còn lại xanh. `gh pr view 155` xác nhận PR 155 đã MERGED và xanh cả bốn job, đúng như feedback của chủ dự án.
2. Phase 1 - `git fetch origin`, `git merge-base`, `git merge origin/main`: chỉ `AI_LOG.md` conflict; `docs/ARCHITECTURE.md` tự merge sạch. Diff của hai PR cho thấy cả hai đều prepend entry vào đầu `AI_LOG.md`.
3. Phase 1 - đọc trọn `scripts/check-language.mjs`: `SCAN_EXTENSIONS` gồm `md|ts|tsx|mjs|js|json|css|html|yml|yaml`, không gồm `txt`. `grep` ký tự U+0192 toàn repo ra 9 lần ở 2 file; 5 lần trong file `.md` là nguyên nhân đỏ CI, 4 lần trong file `.txt` là bản capture thô không bị script quét.
4. Phase 2 - đối chiếu cách PR body đã xử lý cùng ký tự này (thay bằng `F` và ghi chú theo rule 12) với nội dung file review chưa được sửa: đây là điểm khác biệt giữa bản đã xử lý và bản còn sót.
5. Phase 3 - giả thuyết: "job `static` đỏ vì ký tự U+0192 nằm trong file `.md` được check-language quét, và lỗi nằm ở bản capture không được cập nhật sau lần chạy check cuối". Test tối thiểu: chạy `npm run check:language` sau khi thay ký tự → hết lỗi; chạy guard test mới trên file cũ → RED, trên file đã sửa → GREEN.
6. Phase 4 - sửa đúng gốc: thay ký tự trong file `.md`, giữ nguyên bản `.txt` theo rule 9, resolve conflict bằng cách giữ cả hai entry AI_LOG, thêm guard test, chạy lại toàn bộ check set.

Không có script shell của Superpowers do không có distro WSL; mọi bằng chứng được capture bằng Node `spawnSync` UTF-8, `NO_COLOR=1` theo rule 6. Đây là round review có findings thật, không phải chỉ liệt kê lại mentor checklist.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `docs/reviews/2026-11-23-requesting-code-review-hero-slider.md:169`, `:186`, `:189`, `:193`, `:211` | Chạy `npm run check:language` trên HEAD cũ → `Disallowed letters found (Vietnamese and English only): docs/reviews/2026-11-23-requesting-code-review-hero-slider.md: U+0192`, EXIT=1. Trên GitHub, job `static` của run `45147984546` đúng dòng `Process completed with exit code 1`; bốn job `test`, `build`, `e2e`, Vercel vẫn xanh. | **Accepted (fixed in PR 154)** - thay 5 lần U+0192 bằng `F` và viết lại ghi chú để không còn ký tự bị cấm; file `.txt` giữ nguyên bản capture. |
| 2 | Important · `AI_LOG.md:1` | `gh pr view 154` trả `mergeable: CONFLICTING`; `git merge origin/main` báo `CONFLICT (content): Merge conflict in AI_LOG.md`. Cả PR 154 và PR 155 đều chèn entry mới ngay dòng 1. | **Accepted (fixed in merge commit `14452e8`)** - giữ cả hai entry theo thứ tự thời gian mới trước cũ: `16:19:20` (PR 154), `16:04:27` (PR 155), rồi đến entry C1 cũ. Không sửa nội dung verbatim của entry nào. |
| 3 | Minor · PR body mục `Testing (full output)` | PR body ghi `npm run check:language - EXIT=0` nhưng CI cùng commit lại đỏ ở chính lệnh đó; bằng chứng check được chạy trước khi commit docs cuối thêm file review chứa ký tự lạ. | **Accepted (sửa trong PR 154)** - thêm guard test `keeps review records language-clean for the CI static check` trong `src/test/superpowers-process.test.ts`, chạy RED trên bản cũ và GREEN trên bản sửa, chạy lại toàn bộ check set và cập nhật PR body bằng output mới. |

## Declined to judge

- Khoảng trống WCAG 2.2.2 và WAI-ARIA APG carousel pause control: chủ dự án đã chọn "remove visible button only" ở PR 154 và chấp nhận; rule 10 yêu cầu tôn trọng quyết định đã kiểm chứng, không mở lại trong round này.
- Bốn lần U+0192 trong `docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt`: đây là bản capture thô; `SCAN_EXTENSIONS` của check-language không quét `txt` và rule 9 cấm viết lại nội dung verbatim lịch sử chỉ để ép rule. Giữ nguyên và ghi rõ trong ghi chú của file `.md`.
- Thiết kế CI/deploy của PR 155: đã MERGED, nằm ngoài phạm vi sửa PR 154; chỉ được dùng làm bằng chứng xác nhận nguyên nhân conflict.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Job `static` đỏ vì ký tự U+0192, không phải vì lint/typecheck/test | `gh run view 45147984546 --log-failed`: dòng `docs/reviews/2026-11-23-requesting-code-review-hero-slider.md: U+0192` | đạt/pass |
| Hết ký tự bị cấm trong file `.md` | `npm run check:language` EXIT=0, stdout không có dòng failure (xem Verification output) | đạt/pass |
| Guard test chạy RED trước khi sửa | `keeps review records language-clean for the CI static check`, output capture: `expected [ U+0192 ] to deeply equal []`, EXIT=1 | đạt/pass |
| Guard test chạy GREEN sau khi sửa | cùng test, `Tests 8 passed (8)`, EXIT=0 | đạt/pass |
| Nhánh hết conflict với main | `git merge origin/main --no-edit` hoàn tất sau khi resolve; `git status` sạch; sẽ kiểm tra lại `gh pr view 154 --json mergeable` sau push | lacking evidence (chưa push tại thời điểm viết review) |
| Toàn bộ check set xanh | Verification output bên dưới: 8 lệnh, mỗi lệnh `EXIT=0`, gồm `npm test` 84 files / 405 tests | đạt/pass |

### Đối chiếu checklist mentor ↔ code/test thật

- "Không đưa fix trước khi có root cause" (systematic-debugging): có log CI và `git merge` thật trước khi sửa bất kỳ dòng nào; bằng chứng nằm ở Method và Finding 1-2.
- "Grep mọi consumer của giá trị đổi": `grep` ký tự U+0192 toàn repo ra đúng 2 file; `scripts/check-language.mjs:28` chứng minh `txt` không bị quét.
- "Flow test thay vì chỉ unit RED→GREEN": guard test dùng chính `findDisallowedLetters` từ `scripts/check-language.mjs` chứ không tự viết lại logic, nên luồng file docs → checker → `npm test` được kiểm thử trực tiếp; RED/GREEN ở bảng trên.
- "Mọi mục Đạt phải có test hoặc output tên cụ thể": từng dòng ở bảng Checklist versus evidence đều trỏ tới tên test hoặc lệnh/output; dòng chưa có bằng chứng được ghi rõ `lacking evidence`.

## Verification output

Captured với Node `spawnSync`, `encoding: 'utf8'`, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`. Ký tự legend U+0192 của Next.js đã được thay bằng `F` trong bản dán này theo rule 12; các ký tự khung và trạng thái được giữ nguyên như capture.

```text
### npx.cmd --no-install next typegen
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---
Generating route types...
✓ Types generated successfully

--- STDERR ---


### npm.cmd run db:push
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

The database is already in sync with the Prisma schema.


--- STDERR ---
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.


### npm.cmd run lint
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 lint
> eslint


--- STDERR ---


### npm.cmd run typecheck
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit


--- STDERR ---


### npm.cmd test
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/remove-hero-pause-button


 Test Files  84 passed (84)
      Tests  405 passed (405)
   Start at  16:54:23
   Duration  151.81s (import 39%, environment 36%, tests 17%, transform 6%, setup 1%, worker 1%)

     Import  207 modules were evaluated 667 times · 31.49s total, 39% of tracked time
             ~21.72s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation


--- STDERR ---


### npm.cmd run format:check
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

--- STDERR ---


### npm.cmd run build
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 312ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 14.6s
  Running TypeScript ...
  Finished TypeScript in 6.1s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 4.2s
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


### npm.cmd run check:language
EXIT=0
SIGNAL=null
ERROR=none
--- STDOUT ---

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs


--- STDERR ---

```

## Limitations

- Chưa push nhánh này tại thời điểm viết review, nên chưa có kết quả `gh pr checks 154` sau fix; mục mergeable được ghi là `lacking evidence` và sẽ được kiểm chứng sau push.
- Không chạy production check hoặc Vercel deploy thật; chỉ có build local và full check set như rule 7.
- Không có distro WSL nên không chạy được các script shell của Superpowers; dùng `git`, `gh` và Node `spawnSync` thay thế.
- Giữ nguyên bản capture `.txt` có chứa U+0192 theo rule 9; chỉ bản `.md` và PR body được thay theo rule 12.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 16:47:41 +07:00 - Sửa PR 154: lỗi static check và xung đột merge`.
