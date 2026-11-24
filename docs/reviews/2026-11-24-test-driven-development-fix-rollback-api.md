# Code review - thay CLI rollback bang REST alias API (2026-11-24)

- **Skill:** `test-driven-development`
- **Scope:** `.github/workflows/deploy.yml`, hai guard test, `docs/DEPLOY.md`, `docs/ARCHITECTURE.md` va entry AI_LOG cua follow-up fix.
- **Base:** `0ae74f6` | **Head:** working tree truoc commit local.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 17:31:34 +07:00 - Follow-up: thay CLI rollback bang REST alias API`.

## Method

Self-review, khong dung reviewer subagent theo constraint cua task. Da load skill theo dung id: `test-driven-development` va `verification-before-completion`. Doc lai toan bo file lien quan va grep moi consumer cua `previous_url`, `previous_id`, `previous_deployment_url`, `vars.SITE_URL` truoc khi doi. Round nay khong tim them defect moi ngoai root cause do chu duan cung cap; cac dong duoi day la bang chung kiem chung va quyet dinh voi cac thay doi bat buoc.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `.github/workflows/deploy.yml:283` (before) | Live run 45372736476: `vercel rollback "$PREVIOUS_URL" --yes` tra `Error: User not found. (404)` vi token cua team khong resolve duoc user. | **Accepted (fixed in `ci/fix-rollback-api`)**: thay bang POST alias REST API co `teamId`, `Bearer $VERCEL_TOKEN` va body alias tu `vars.SITE_URL`. |
| 2 | Important · `.github/workflows/deploy.yml:169-191` (before) | Buoc capture chi luu `previous_url`; REST API can id nen khong co gia tri de goi. | **Accepted (fixed in `ci/fix-rollback-api`)**: doc `uid` tu cung `vercel ls --prod --json`, xuat `previous_id` va van giu `previous_url`. |
| 3 | Important · `.github/workflows/deploy.yml:16-30` (before) | Drill chi co `previous_deployment_url`; khi deploy bi skip khong co id de rollback. | **Accepted (fixed in `ci/fix-rollback-api`)**: them input `previous_deployment_id`, uu tien trong drill; URL giu lai de hien thi. |
| 4 | Minor · `src/test/smoke-rollback.test.ts:100-113`, `src/test/deploy-workflow.test.ts:139-141` (before) | Guard cu pin CLI rollback va khong pin `previous_id`; co the xoa REST call ma van xanh. | **Accepted (fixed in `ci/fix-rollback-api`)**: assertion moi do RED truoc, GREEN sau. |
| 5 | Minor · `docs/DEPLOY.md:166,173-175,182-200,204`, `docs/ARCHITECTURE.md:994` (before) | Tai lieu huong dan `vercel rollback <url>`, khong phu hop voi token team va API moi. | **Accepted (fixed in `ci/fix-rollback-api`)**: mo ta REST endpoint, dashboard promotion va bon input drill. |
| 6 | Important · live GitHub/Vercel | Push, mo PR, chay drill hoac doi Environment de lay bang chung. | **Rejected**: task cam; tai san cua dieu phoi vien. |
| 7 | Minor · `src/test/smoke-rollback.test.ts:124`, `src/test/deploy-workflow.test.ts:156` | Assertion JSON body luc dau viet dang khong escape, lech voi `-d "{\"alias\":\"$alias_host\"}"` trong shell. | **Accepted (fixed in `ci/fix-rollback-api`)**: chinh assertion theo chuoi that cua implementation, van pin truong `alias` va `$alias_host`. |
| 8 | Minor · `.github/workflows/deploy.yml` | Giữ `vercel rollback` lam fallback trong workflow. | **Rejected**: lenh tra 404 voi token team; fallback that la promote tren dashboard, da ghi trong docs. |

## Declined to judge

- Live run cua `deploy.yml` sau fix: khong co credential va khong duoc phep chay; chi co guard test, flow test va YAML da parse.
- Ket qua required reviewer cua Environment `production`: cau hinh live do chu duan quan ly, khong nam trong repo.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Capture uid thanh previous_id va van giu previous_url | `smoke-rollback.test.ts > captures the previous production id for the REST rollback`; RED `Tests 4 failed / 19 passed`, GREEN `Tests 23 passed (23)` | pass |
| Rollback goi alias REST API va fail tren non-2xx | `smoke-rollback.test.ts > rolls back through the project-scoped alias API when the chain fails` va `deploy-workflow.test.ts > rolls back with the Vercel alias REST endpoint instead of the CLI` | pass |
| Drill truyen id qua `inputs.previous_deployment_id` | `smoke-rollback.test.ts > gates a dispatch drill behind the production environment` | pass |
| Gia tri chay qua bien giua cac job | flow test parse YAML: 18 dong `PASS`, `FLOW=PASS`, `EXIT=0` | pass |
| Full check set xanh | Bay lenh trong phan Verification output, tat ca `EXIT=0`; `npm test` `Tests 425 passed (425)` | pass |
| Ngon ngu va format sach | `npm run check:language` va `npm run format:check` chay lai sau khi viet xong file nay, `EXIT=0` | pass |
| Header AI_LOG cu con sau `---` | Node kiem tra dong `##` dau tien sau separator la `## 2026-11-24 16:49:37 +07:00 ...` | pass |

## Verification output

Capture bang Node `spawnSync` UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`. Ghi chu: ky tu U+0192 trong legend cua Next.js da duoc thay bang `F` de tuan thu rule ngon ngu; cac ky tu khong phai chu cai khac giu nguyen.

```text
$npx --no-install next typegen
Generating route types...
✓ Types generated successfully
EXIT=0

$npm run db:push

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

The database is already in sync with the Prisma schema.

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
EXIT=0

$npm run lint

> ant-jewelry@0.1.0 lint
> eslint

EXIT=0

$npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0

$npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/ci-deploy-gating


 Test Files  86 passed (86)
      Tests  425 passed (425)
   Start at  17:33:47
   Duration  65.50s (tests 41%, import 36%, environment 14%, transform 5%, setup 2%, worker 2%)

     Import  210 modules were evaluated 672 times · 13.60s total, 36% of tracked time
             ~9.35s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

$npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

$npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 221ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.8s
  Running TypeScript ...
  Finished TypeScript in 7.1s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 3.8s
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

```

## Limitations

- Khong co live run moi cua `deploy.yml` sau fix; khong chay smoke production, rollback that hay drill.
- Khong push, khong mo PR, khong doi Environment hay secret; moi thay doi la repo-side, commit local.
- Full check set chay tren Windows voi SQLite, khong phai `ubuntu-latest` cua Actions.
- Khong ghi gia tri secret nao vao file; chi nhac ten bien va trang thai.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 17:31:34 +07:00 - Follow-up: thay CLI rollback bang REST alias API`.
