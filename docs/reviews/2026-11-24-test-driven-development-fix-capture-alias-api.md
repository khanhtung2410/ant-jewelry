# Code review - cap nguoc alias bang GET va sua dieu kien rollback/finalize (2026-11-24)

- **Skill:** `test-driven-development`
- **Scope:** `.github/workflows/deploy.yml`, `src/test/deploy-workflow.test.ts`, `src/test/smoke-rollback.test.ts`, `docs/DEPLOY.md` va entry AI_LOG cua fix nay.
- **Base:** `8ae929d` | **Head:** working tree truoc commit local.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 18:18:40 +07:00 - Follow-up: doc lai alias bang GET va sua dieu kien rollback/finalize`.

## Method

Self-review, khong dung reviewer subagent theo constraint cua task. Da load skill theo dung id: `test-driven-development` va `verification-before-completion`. Doc lai toan bo file lien quan va grep moi consumer cua `previous_url`, `previous_id`, `needs.deploy.result`, `needs.smoke.result`, `vars.SITE_URL` trong workflow va hai file test truoc khi doi. Round nay khong tim them defect moi ngoai ba root cause do dieu phoi vien xac nhan live; cac dong duoi day la bang chung kiem chung va quyet dinh.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Critical · `.github/workflows/deploy.yml:174-205` (before) | Live run: `vercel ls --prod --json` chi co `url,name,state,target,createdAt,...`, khong co `uid`; step capture thoat voi "The current production deployment has no uid" nen khong bao gio deploy. | **Accepted (fixed in `ci/fix-capture-alias-api`)**: thay bang `GET https://api.vercel.com/v1/aliases/$alias_host?teamId=$VERCEL_ORG_ID` voi Bearer token, alias host lay tu `vars.SITE_URL`. |
| 2 | Important · `.github/workflows/deploy.yml:174-205` (before) | "Deployment READY moi nhat" khong con dung sau mot lan rollback; previous target co the sai. | **Accepted (fixed in `ci/fix-capture-alias-api`)**: doc `deploymentId` va `deployment.url` tu chinh alias, xuat `previous_id` va `previous_url`; fail khi non-2xx hoac thieu field. |
| 3 | Important · `.github/workflows/deploy.yml:263` (before) | Khi `migrate` fail, `deploy` va `smoke` bi skip nhung `rollback` van chay vi `if: failure()`, roi do "No previous production deployment id is available"; `finalize` in "Smoke finished with skipped". | **Accepted (fixed in `ci/fix-capture-alias-api`)**: them `needs.deploy.result != 'skipped'` va giữ nhanh drill; `finalize` chi fail tren `failure`/`cancelled`, co step rieng ghi nhan `skipped`. |
| 4 | Minor · `src/test/deploy-workflow.test.ts`, `src/test/smoke-rollback.test.ts` (before) | Guard cu pin `vercel ls --prod --json`, `current.uid`, `if: failure()` va `needs.smoke.result != 'success'`; co the doi sai ma van xanh. | **Accepted (fixed in `ci/fix-capture-alias-api`)**: 8 assertions/test do RED truoc (`8 failed | 19 passed`), GREEN sau (`27 passed`). |
| 5 | Minor · `docs/DEPLOY.md:166,168-169,173-174` (before) | Tai lieu huong dan doc `vercel ls` va mo ta finalize sai. | **Accepted (fixed in `ci/fix-capture-alias-api`)**: mo ta GET alias API, dieu kien rollback co drill va finalize chi fail khi smoke chay that. |
| 6 | Important · live GitHub/Vercel | Push, mo PR, chay drill hoac doi Environment de lay bang chung. | **Rejected**: task cam; tai san cua dieu phoi vien. |
| 7 | Important · `.github/workflows/deploy.yml` (after) | Dat literal `if: failure() && needs.deploy.result != 'skipped'` se lam drill mat rollback vi deploy luon bi skip. | **Rejected**: da doc dieu kien cua smoke va them `|| github.event_name == 'workflow_dispatch'`; drill giu nguyen hanh vi. |
| 8 | Minor · `.github/workflows/deploy.yml` (after) | Cap nhat them `needs.deploy.outputs.previous_id != ''` de tranh rollback khi capture fail. | **Rejected**: nam ngoai pham vi task va khong nhat thiet voi guard cua dieu phoi vien; ghi nhận trong Limitations cua AI_LOG cho follow-up. |

## Declined to judge

- Live run cua `deploy.yml` sau fix: khong co credential va khong duoc phep chay; chi co guard test, flow test va output cua curl/alias do dieu phoi vien xac nhan.
- Ket qua required reviewer cua Environment `production`: cau hinh live do chu duan quan ly, khong nam trong repo.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Capture doc tu alias va khong con `uid` | `deploy-workflow.test.ts > captures the previous deployment from the production alias endpoint`, `smoke-rollback.test.ts > captures the previous production URL before promoting the new deployment` va `> captures the previous production id for the REST rollback` | pass |
| Gia tri `deployment.url` / `deploymentId` chay qua script vao GITHUB_OUTPUT | flow test `deploy-workflow.test.ts > parses the alias response into the deployment url and id` va `> rejects an alias response missing the deployment url or id`, chay dung script Node nhung trong step | pass |
| Fail khi HTTP ngoai 2xx hoac thieu field | `%{http_code}`, `case "$status" in 2??)` va nhanh `if ! previous=...` trong capture; assertion tuong ung trong `deploy-workflow.test.ts` | pass |
| Rollback khong chay khi migrate fail, drill van chay | `smoke-rollback.test.ts > rolls back through the project-scoped alias API when the chain fails` va `> does not roll back when an upstream job fails before promotion` | pass |
| Finalize chi fail khi smoke chay va fail | `smoke-rollback.test.ts > leaves the workflow red when smoke failed even after a rollback` | pass |
| Full check set xanh | Tam lenh trong phan Verification output, tat ca `EXIT=0`; `npm test` `Tests 429 passed (429)` | pass |
| Ngon ngu va format sach | `npm run format:check` va `npm run check:language` trong output day du, `EXIT=0` | pass |
| Header AI_LOG cu con sau `---` | Doc lai dong ngay sau separator: `## 2026-11-24 17:31:34 +07:00 ...` | pass |

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
      Tests  429 passed (429)
   Start at  18:21:24
   Duration  91.92s (import 35%, tests 33%, environment 23%, transform 5%, setup 2%, worker 2%)

      Import  210 modules were evaluated 672 times · 19.09s total, 35% of tracked time
              ~13.12s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
              learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

$npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

$npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0

$npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 270ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 4.9s
  Running TypeScript ...
  Finished TypeScript in 8.5s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 4.9s
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
│ └ ○ /c/__empty__                                 15m      1y
├ ○ /jewelry-care
├   /p/[slug]                                      15m      1y
│ ├ ◐ /p/[slug]                                    15m      1y
│ └ ○ /p/__empty__                                 15m      1y
├ ○ /privacy
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

- Không có live run mới của `deploy.yml` sau fix; payload alias chỉ do điều phối viên xác nhận, workflow được kiểm chứng bằng guard/flow test và parse cục bộ.
- Không chạy smoke production, rollback hay drill thật; không push, không mở PR, không đổi setting GitHub.
- Full check set chạy trên Windows với SQLite, không phải `ubuntu-latest` của Actions.
- Trường hợp capture fail trước khi promotion vẫn có thể để rollback chạy rồi báo thiếu id; run đã đỏ từ `deploy`, để lại follow-up nếu muốn tách riêng.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 18:18:40 +07:00 - Follow-up: doc lai alias bang GET va sua dieu kien rollback/finalize`.
