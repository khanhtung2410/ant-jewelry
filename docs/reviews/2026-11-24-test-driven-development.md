# Code review - su deploy skip (2026-11-24)

- **Skill:** `test-driven-development`
- **Scope:** `.github/workflows/deploy.yml`, hai guard test, `docs/DEPLOY.md` va entry AI_LOG cua follow-up fix.
- **Base:** `74b14a2` | **Head:** working tree truoc commit local.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 16:49:37 +07:00 - Follow-up: su deploy skip khi approval bi bo qua`.

## Method

Self-review, khong dung reviewer subagent theo constraint cua task. Da load skill theo dung id: `using-superpowers`, `test-driven-development`, `verification-before-completion`. Doc lai toan bo file lien quan, grep mo consumer cua `needs.deploy.result`, `needs.approval.result`, `needs.verify-ci.result` va `github.event_name` truoc khi doi. Round nay **khong tim them defect moi ngoai root cause do chu duan cung cap**; bang duoi day la bang chung kiem chung, khong phat hien independent.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `.github/workflows/deploy.yml:140` | Voi pending=false, `approval` skip; `deploy` chi co `if: github.event_name != 'workflow_dispatch'` nen skip theo dependency chain, keo smoke/rollback skip va finalize do. | **Accepted (fixed in `ci/fix-deploy-skip`)**: them `always() && needs.verify-ci.result == 'success' && needs.migrate.result == 'success' && github.event_name != 'workflow_dispatch'`. |
| 2 | Minor · `src/test/deploy-workflow.test.ts:92-99` | Guard cu khong pin dieu kien `deploy`, nen co the xoa `always()` ma van xanh. | **Accepted (fixed in `ci/fix-deploy-skip`)**: assertion moi do RED truoc, GREEN sau. |
| 3 | Minor · `src/test/smoke-rollback.test.ts:60-65` | Assertion pin `smoke.if` xanh ngay vi hanh vi da dung; khong phai RED driver cua round nay. | **Accepted (fixed in `ci/fix-deploy-skip`)**: giu lam pin chong hoi quy, ghi ro khong tinh la ket qua RED. |
| 4 | Minor · `docs/DEPLOY.md:127` | Chain docs khong giai thich vi sao `approval` skip van deo `deploy`. | **Accepted (fixed in `ci/fix-deploy-skip`)**: them mot cau ve dieu kien va truong hop drill. |
| 5 | Minor · `AI_LOG.md:1` | Entry C4 con ghi limitation secret `DATABASE_URL` trong; khong duoc viet lai lich su. | **Accepted (fixed in `ci/fix-deploy-skip`)**: prepend entry hieu chinh, giu nguyen prompt nguyen van va header cu. |
| 6 | Important · live GitHub | Thay doi live setting, push hay chay deploy muon de lay bang chung. | **Rejected**: task cam, la tai san cua dieu phoi vien. |
| 7 | Minor · `.github/workflows/deploy.yml:202` | Doi `smoke.if` hay bo `needs.deploy.result` de "don gian hoa". | **Rejected**: smoke da dung, assertion pin xanh; thay doi lam mat bao ve drill. |

Declined to judge

- Live run cua `deploy.yml` sau fix: khong co credential va khong duoc phep chay; chi co truth table tu YAML da parse.
- Ket qua cua required reviewer tren Environment: cau hinh live do chu duan quan ly, khong nam trong repo.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Deploy chay khi approval skip va hai needs success | `src/test/deploy-workflow.test.ts` > `deploys when approval was skipped and both real needs succeeded`; RED `Tests 1 failed / 20 passed`, GREEN `Tests 21 passed (21)` | pass |
| Deploy khong chay khi verify/migrate fail hoac drill | script `verify-condition.mjs` parse YAML, bon tinh huong `PASS`, `EXIT=0` | pass |
| Smoke van chay sau deploy thanh cong va trong drill | `src/test/smoke-rollback.test.ts` > `smokes after a successful deploy or during an owner drill`; cung nam trong 21 test GREEN | pass |
| YAML hop le va giu tam job goc | `YAML OK jobs=verify-ci,check-migrations,approval,migrate,deploy,smoke,rollback,finalize` | pass |
| Full check set xanh | 8 lenh capture trong phan Verification output, tat ca `EXIT=0` | pass |
| Ngon ngu sach | `npm run check:language` `EXIT=0`; `npm run format:check` `All matched files use Prettier code style!` | pass |
| Header AI_LOG cu con sau `---` kiem tra bang Node: dong 90 la `## 2026-11-24 16:13:16 ...` | output lenh Node (xem report) | pass |

## Verification output

Capture bang Node `spawnSync` UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`. Ghi chu: ky tu U+0192 trong legend cua Next.js da duoc thay bang `F` de tuan thu rule 9; cac ky tu khong phai chu cai khac giu nguyen.

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
      Tests  423 passed (423)
   Start at  16:52:18
   Duration  89.19s (tests 38%, import 34%, environment 17%, transform 7%, setup 2%, worker 2%)

     Import  210 modules were evaluated 672 times · 17.75s total, 34% of tracked time
             ~12.20s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 269ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 6.4s
  Running TypeScript ...
  Finished TypeScript in 9.9s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24)
  Generating static pages using 7 workers (12/24)
  Generating static pages using 7 workers (18/24)
✓ Generating static pages using 7 workers (24/24) in 9.9s
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
```

## Limitations

- Khong co live run moi cua workflow sau fix; truth table chi mo phong bieu thuc YAML da parse.
- Khong push, khong mo PR, khong doi setting GitHub; commit local only.
- Check set chay tren Windows voi SQLite, khong phai `ubuntu-latest`.
- Khong chay smoke production hay rollback Vercel; khong ghi gia tri secret nao vao file.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 16:49:37 +07:00 - Follow-up: su deploy skip khi approval bi bo qua`.
