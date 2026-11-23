# Code review - C3 separate migration and approval gate (2026-11-23)

- **Skill:** requesting-code-review
- **Scope:** `package.json`, `scripts/migrate-production.mjs`, `scripts/detect-pending-migrations.mjs`, `src/test/detect-pending-migrations.test.ts`, `src/test/deploy-workflow.test.ts`, `.github/workflows/deploy.yml`, `docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `README.md`, `AI_LOG.md`
- **Base:** `24ff8a2` | **Head:** working tree before commit
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 17:12:55 +07:00 - C3: tach migration khoi build va gate bang approval`.

## Method

Loaded the `requesting-code-review` skill by exact id and read `code-reviewer.md`. The skill normally dispatches a read-only reviewer subagent; the orchestrator for this task explicitly forbids dispatching any subagent or reviewer, so I applied the template myself, in passes: plan alignment, code quality, architecture, testing and production readiness. I re-read the whole source of every touched file, not a diff snippet, before ruling on a finding. Every changed value was followed through `grep` first:

- `grep migrate-production.mjs` found one real consumer (`package.json` build command) plus historical prose and living docs; the script was removed only after that check.
- `grep DATABASE_URL|DIRECT_URL|MIGRATION_DATABASE_URL` found the old guard in `src/test/deploy-workflow.test.ts`, the three production jobs in `deploy.yml`, and historical plan entries. No `MIGRATION_DATABASE_URL` remains in code.
- `grep detect-pending-migrations|migration-approval` confirmed the wrapper is called only by `check-migrations`, and the approval environment is referenced by the workflow and the three living docs.
- `deploy.yml` was parsed with the `yaml` package already in `node_modules`, and the wrapper was run locally against a SQLite URL to observe the fail-closed path; no real secret value was printed or written.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `src/test/deploy-workflow.test.ts:130` (old app-secret guard) | Add `DATABASE_URL: ${{ secrets.DATABASE_URL }}` to the deploy job to fix the C2 P1013 failure; the old guard that forbade every app-secret name in the workflow goes red. | **Accepted (fixed in this branch)**: narrowed the prohibition to `AUTH_SECRET`, `SITE_URL`, `DIRECT_URL` and added a positive assertion that all three Prisma-using jobs receive `DATABASE_URL` from the `production` Environment. Owner feedback was trusted only after checking the real P1013 finding and the wrapper source. |
| 2 | Important · `.github/workflows/deploy.yml:83` | With `if: always() && (approval == 'success' || approval == 'skipped')`, a failed `check-migrations` leaves approval `skipped`, so `migrate` would still start and run `prisma migrate deploy` against an unchecked database. | **Accepted (fixed in this branch)**: kept the exact required `if` string and added the `Refuse to migrate when the status check failed` step (lines 99-106) plus test `checks pending migrations before the migration and deploy jobs`, which asserts `needs.check-migrations.result` is consumed. |
| 3 | Important · `src/test/deploy-workflow.test.ts:140` (first draft of the guard) | The brief requires `db:migrate:status:production` in `deploy.yml`, but the workflow invokes `scripts/detect-pending-migrations.mjs`, which runs the npm script internally; the first guard run failed despite a correct design. | **Accepted (fixed in this branch)**: named the workflow step `Detect pending migrations (npm run db:migrate:status:production)` and added `links the workflow wrapper to the real status script across modules`, which follows workflow -> wrapper -> npm script -> `prisma migrate status`. |
| 4 | Minor · `docs/DEPLOY.md:275` | The backup example used `pg_dump "$DIRECT_URL"` although the chosen model keeps the direct string in `DATABASE_URL`; an operator following it would hit an unset variable. | **Accepted (fixed in this branch)**: use `pg_dump "$DATABASE_URL"`. |
| 5 | Important · brief Step 6 / plan Step 6 | `github.event` shows no Environment `migration-approval` with required reviewers and no `DATABASE_URL` secret; the approval gate is therefore not live after this change alone. | **Rejected for this branch**: the controller explicitly owns Environment, secret and reviewer creation and forbade live calls. Repo-side configuration only; AI_LOG records the hand-off. |
| 6 | Minor · `docs/superpowers/plans/2026-11-23-ci-deploy-gating.md:19,125` | `grep` still finds `MIGRATION_DATABASE_URL` in the historical plan while the workflow uses `secrets.DATABASE_URL`. | **Rejected for this branch**: the plan is a dated design record and the controller ruling overrides its literal secret name; rewriting history is not part of this task. The deviation is recorded in `AI_LOG.md`. |

## Declined to judge

- Live GitHub Actions execution of `check-migrations`, `approval` and `migrate`: no runner run was triggered and no Environment exists outside the controller's account.
- Whether a job-level `DATABASE_URL` wins over the redacted value `vercel pull` writes: needs the controller's next live deploy; only repo-side wiring is verified here.
- Prisma exit codes on a real PostgreSQL pending migration: the wrapper checks the banner before the exit status, but no production database was contacted.
- C4 smoke, rollback and screenshots: out of scope for C3.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| `build:production` no longer migrates | `src/test/deploy-workflow.test.ts`, `never applies migrations during the production build`; `package.json:32` | pass |
| Pending detection matches real Prisma output | `src/test/detect-pending-migrations.test.ts`, 5 tests; RED output was `Cannot find module` before implementation | pass |
| Migration is checked, gated and applied before deploy | `src/test/deploy-workflow.test.ts`, `checks pending migrations before the migration and deploy jobs`; `yaml` parse shows jobs `[verify-ci, check-migrations, approval, migrate, deploy]` | pass |
| Direct database URL reaches all Prisma jobs | `src/test/deploy-workflow.test.ts`, `injects the direct database URL into every job that uses Prisma`; `yaml` parse shows `deploy.env.DATABASE_URL` | pass |
| Wrapper fails closed without printing secrets | local run with `DATABASE_URL=file:./prisma/dev.db`: `[detect-pending-migrations] prisma migrate status failed; refusing to continue.`, `EXIT=1` | pass |
| Full check set green | captured output below, all six `EXIT=0`, `Tests 413 passed (413)` | pass |
| Language rule clean | `npm run check:language` `EXIT=0`; `findDisallowedLetters(AI_LOG.md)` returned `[]` | pass |
| Approval environment live with required reviewers | none: controller-owned, no API output | lacking evidence |

## Verification output

Captured with Node `spawnSync` in UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`, after `next typegen` and `db:push` as in CI. The Next.js route legend character U+0192 was replaced with `F` in this pasted text so the Vietnamese/English letter rule holds. This block is the run captured before inserting it here; the final post-insert run on the committed tree is in the task report.

```text
Preparation (same as .github/workflows/ci.yml):

$ npx.cmd --no-install next typegen
Generating route types...
✓ Types generated successfully
EXIT=0

$ npm.cmd run db:push

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

The database is already in sync with the Prisma schema.

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
EXIT=0

Full check set:

$ npm.cmd run lint

> ant-jewelry@0.1.0 lint
> eslint
EXIT=0

$ npm.cmd run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit
EXIT=0

$ npm.cmd test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/ci-deploy-gating


 Test Files  85 passed (85)
      Tests  413 passed (413)
   Start at  17:10:01
   Duration  112.84s (import 36%, environment 35%, tests 20%, transform 7%, setup 1%, worker 1%)

     Import  209 modules were evaluated 669 times · 29.47s total, 36% of tracked time
             ~20.26s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation
EXIT=0

$ npm.cmd run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

$ npm.cmd run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 372ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 14.1s
  Running TypeScript ...
  Finished TypeScript in 6.3s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 3.4s
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

$ npm.cmd run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs
EXIT=0
```

## Limitations

- No live GitHub Environment, secret, reviewer, Vercel CLI call or database migration was performed; those belong to the controller.
- `deploy.yml` is validated by parser and text guards, not by a GitHub runner; expression evaluation for `workflow_run` and `always()` was reasoned about, not executed.
- Local checks ran on Windows; E2E, production smoke and rollback are not part of this task's check set.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 17:12:55 +07:00 - C3: tach migration khoi build va gate bang approval`.
