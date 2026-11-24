# Code review - fix capture round 1 (2026-11-24)

- **Skill:** `receiving-code-review`
- **Scope:** `docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `.github/workflows/deploy.yml` rollback selection, two guard test files, plus the AI_LOG and report updates for this round.
- **Base:** `d58149a` | **Head:** working tree truoc commit local.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 18:40:38 +07:00 - Fix round 1: cap nhat docs va guard rollback`.

## Method

Self-review cua feedback tu task reviewer, khong dung subagent. Da load skill theo dung id: `receiving-code-review` va `test-driven-development`. Doc lai toan bo "Deploy & rollback" cua `docs/DEPLOY.md` (dong 156-210), muc 14.2 cua `docs/ARCHITECTURE.md` (dong 975-999), step capture va step rollback cua `.github/workflows/deploy.yml`. `grep` moi lan nhac `uid`, `vercel ls`, `!= 'success'` trong `docs/`: chi co ba dong duoc bao cao la con sai; cac file plan/review lich su giu nguyen. Viet hai test RED truoc khi doi code; ca hai fail dung ly do thieu hanh vi, khong phai syntax.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `docs/DEPLOY.md:190,198`, `docs/ARCHITECTURE.md:994` (before) | Doc van huong dan lay `uid` tu `vercel ls --prod --json` (field khong ton tai) va noi finalize do khi smoke khong `success` (sai voi smoke `skipped`). | **Accepted (fixed in `ci/fix-capture-alias-api`)**: manual rollback lay `deploymentId` tu `GET /v1/aliases/{alias}`, giu dashboard promotion lam fallback; ca hai doc mo ta finalize chi fail tren `failure`/`cancelled`, ghi nhan rieng `skipped`. |
| 2 | Minor · `.github/workflows/deploy.yml:315-318` (before) | Khi capture fail truoc promotion, step select in `::error::No previous production deployment id...` roi step rollback van goi API voi id rong, tao loi thu hai. | **Accepted (fixed in `ci/fix-capture-alias-api`)**: step select co `id: select`, nhanh khong co target in thong bao trung tinh, ghi `has_target=false` va `exit 0`; step rollback co `if: steps.select.outputs.has_target == 'true'`. Drill thieu id van `::error::` va `exit 1`. Run van do vi deploy fail. |
| 3 | Minor · `.github/workflows/deploy.yml:183-184` (before) | Alias host chi bo `https://`; neu `SITE_URL` co `http://` thi alias sai. Duong dan `/` cuoi da duoc bo boi `${alias_host%%/*}`. | **Accepted as documented (fixed in `ci/fix-capture-alias-api`)**: chon phuong an nho hon la ghi ro rang trong `DEPLOY.md` rang chi ho tro HTTPS origin, khong chuyen `http://`, va lookup se doi HTTP ngoai 2xx neu SITE_URL sai. Khong doi workflow. |
| 4 | Important · live GitHub/Vercel | Push, mo PR, chay drill hoac doi setting de lay bang chung. | **Rejected**: task cam; tai san cua dieu phoi vien. |

## Declined to judge

- Live run cua `deploy.yml` sau fix: khong co credential va khong duoc phep chay.
- Cac file `docs/superpowers/plans/` va review cu van nhac `uid`/CLI rollback; la ho so lich su, khong nam trong pham vi ba dong duoc bao cao.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Doc manual rollback lay id tu alias API va khong con `uid` | `deploy-workflow.test.ts > documents the alias capture, the alias fallback and the exact finalize cases` | pass |
| ARCH mo ta `deploymentId` va finalize `failure`/`cancelled` | cung test tren, doc tim dong chua chuoi finalize | pass |
| Constraint HTTPS cua SITE_URL duoc ghi ro | cung test tren, assertion `không chuyển \`http://\`` | pass |
| Khong co loi thu hai khi thieu target | `smoke-rollback.test.ts > skips the alias call cleanly when capture produced no target` | pass |
| Guard cu van walk duoc | `smoke-rollback.test.ts > rolls back through the project-scoped alias API when the chain fails` va `> does not roll back when an upstream job fails before promotion` | pass |
| Focused test RED -> GREEN | RED `2 failed | 27 passed (29)`, EXIT=1; GREEN `29 passed (29)`, EXIT=0 | pass |
| Full check set xanh | Output day du o phan Verification output, tat ca `EXIT=0` | pass |

## Verification output

Full check set on the final tree of this round, captured via Node `spawnSync` in UTF-8 with `NO_COLOR=1` and `DATABASE_URL=file:./prisma/dev.db`:

```text
$ npx --no-install next typegen
Generating route types...
✓ Types generated successfully
EXIT=0

$ npm run db:push

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

The database is already in sync with the Prisma schema.

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
EXIT=0

$ npm run lint

> ant-jewelry@0.1.0 lint
> eslint

EXIT=0

$ npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0

$ npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/ci-deploy-gating


 Test Files  86 passed (86)
      Tests  431 passed (431)
   Start at  21:07:18
   Duration  190.67s (environment 42%, import 33%, tests 18%, transform 6%, setup 1%, worker 1%)

     Import  210 modules were evaluated 672 times · 45.95s total, 33% of tracked time
             ~31.59s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

$ npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 503ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 22.4s
  Running TypeScript ...
  Finished TypeScript in 10.5s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 6.3s
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

EXIT=0

$ npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0
FAILED_COMMANDS=0
```

Ghi chu: ky tu legend U+0192 cua Next.js da duoc thay bang `F`.

## Limitations

- Khong co live run hay drill that; payload alias chi do dieu phoi vien xac nhan.
- Full check set chay tren Windows voi SQLite, khong phai `ubuntu-latest`.
- Khong push, khong mo PR, khong doi setting GitHub.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 18:40:38 +07:00 - Fix round 1: cap nhat docs va guard rollback`.
