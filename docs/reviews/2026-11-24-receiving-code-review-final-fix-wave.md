# Code review - final whole-branch fix wave (2026-11-24)

- **Skill:** `receiving-code-review`
- **Scope:** the three findings from the final review of `86f286b..d51174b`, fixed in one wave: fail-closed migration detection, live-configuration documentation, and an observable manual rollback HTTP status
- **Base:** `d51174b` | **Head:** `846f11d` (`fix/ci-fail-closed-migrations`)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 21:54:09 +07:00 - Final fix wave: fail-closed migrations, docs and rollback status`.

## Method

Self-review under the exact skill id `receiving-code-review` (loaded with the `skill` tool before any edit). Before changing a value, I re-read the whole `scripts/detect-pending-migrations.mjs`, `src/test/detect-pending-migrations.test.ts`, `src/test/deploy-workflow.test.ts`, `docs/DEPLOY.md`, `README.md` and `.github/workflows/deploy.yml`, and grepped every consumer of `hasPendingMigrations`, `DIRECT_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and `DATABASE_URL`. The controller ruling that the spec wins over the plan's "empty output -> false" was treated as trusted owner feedback after checking the workflow: `approval` is the only reviewer gate, and `migrate` runs even when `approval` is skipped. Findings were fixed one at a time with TDD: assertions were written first, the focused files were run RED, then the implementation and docs were written and the same files run GREEN. Every "đạt/pass" row below names a test or captured output; nothing is marked pass from the checklist alone.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| F1 | Important · `scripts/detect-pending-migrations.mjs:14-16,32-46`, `src/test/detect-pending-migrations.test.ts:34-40`, `.github/workflows/deploy.yml:95` | Empty or unrecognised `prisma migrate status` output returned `false`, so the wrapper printed `false` and exited 0, `approval` was skipped by `needs.check-migrations.outputs.pending == 'true'`, and `migrate` applied the migration with no reviewer. A Prisma wording change could therefore ship an unreviewed schema change. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - the pending banner is checked first, only three explicit no-pending markers return `false`, and empty/truncated/unknown output returns `true`. The CLI still checks the banner separately so a failed status command with no marker exits 1. Unit, flow and CLI probe evidence below. |
| F2 | Important · `docs/DEPLOY.md:56,70,77,99,350`, `README.md:70` | `DEPLOY.md:56` correctly listed four Environment secrets, but `:77`, `:99` and `:350` said three; `:70` and `README.md:70` still offered `DIRECT_URL`, which the owner explicitly rejected. An operator following the runbook would provision the wrong set of secrets. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - all three counts now say four, both `DIRECT_URL` rows are deleted, and `DEPLOY.md:132` is unchanged because it correctly means three Vercel credentials plus `DATABASE_URL`. Doc guard evidence below. |
| F3 | Minor · `docs/DEPLOY.md:193-203` | Manual rollback told the operator to check HTTP 2xx and `oldDeploymentId`, but both `curl` commands printed the body only, so the status was never observable. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - both commands now use `-w '\n%{http_code}'` and split the last line into `status` with `tail -n 1` and `body` with `sed '$d'`, mirroring `.github/workflows/deploy.yml:189-193`; the exact command is pinned by a doc test. |

## Declined to judge

- A live `deploy.yml` run, a drill, or any GitHub/Vercel setting: the brief forbids pushing and live changes, and the controller owns those actions.
- The historical plan's Step 1 "empty output -> false": deliberately not rewritten. It is a historical record; the controller ruled that the spec governs behavior and this fix follows the spec.
- `.env.example` still documents optional `DIRECT_URL`: outside the brief, which names only `DEPLOY.md` and `README.md` rows, and `check:language` plus the doc guards do not cover it. Left untouched.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Pending banner stays the highest-priority signal; explicit no-pending markers stay false | `src/test/detect-pending-migrations.test.ts > detects the real Prisma phrase for an unapplied migration`, `> detects the plural form of the Prisma phrase`, `> treats an up-to-date database as having no pending migrations`, `> treats the explicit no-pending message as having no pending migrations`, `> treats no migration file message as having no pending migrations` | đạt/pass |
| Empty and unknown output are pending | `src/test/detect-pending-migrations.test.ts > treats empty output as pending so the approval gate cannot be skipped` and `> treats unknown output as pending when Prisma changes its wording`; RED showed `expected false to be true`, GREEN `Tests 27 passed (27)` | đạt/pass |
| Unknown output crosses into the exact approval condition | `src/test/deploy-workflow.test.ts > feeds unknown status output through to the approval condition` (imports `hasPendingMigrations` and asserts both `pending: ${{ steps.check.outputs.pending }}` and `needs.check-migrations.outputs.pending == 'true'`) | đạt/pass |
| A failed status command with no pending marker still stops the run | manual probe `$ node scripts/detect-pending-migrations.mjs` with `DATABASE_URL=file:./prisma/dev.db`: `[detect-pending-migrations] prisma migrate status failed; refusing to continue.` and `EXIT=1` | đạt/pass |
| Four Environment secrets and no `DIRECT_URL` row in the live docs | `src/test/deploy-workflow.test.ts > keeps the Environment secret counts and direct URL rows consistent`; RED failed on `đọc bốn secret của Environment`, GREEN `Tests 27 passed (27)` | đạt/pass |
| Manual rollback prints the HTTP status | the same doc guard asserts `%{http_code}` inside `section(deployDoc, '### Manual rollback')` | đạt/pass |
| Full check set on the final tree | complete capture below, every `EXIT=0`, `FAILED_COMMANDS=0` | đạt/pass |

Focused runs captured before and after the implementation (UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`):

```text
RED:  npx --no-install vitest run src/test/detect-pending-migrations.test.ts src/test/deploy-workflow.test.ts
      Test Files  2 failed (2)
           Tests  4 failed | 23 passed (27)
      EXIT=1
GREEN: npx --no-install vitest run src/test/detect-pending-migrations.test.ts src/test/deploy-workflow.test.ts
      Test Files  2 passed (2)
           Tests  27 passed (27)
      EXIT=0
```

## Verification output

Full check set on the final tree, captured via Node `spawnSync` in UTF-8 with `NO_COLOR=1` and `DATABASE_URL=file:./prisma/dev.db`. The Next.js legend character U+0192 was replaced by `F` in the pasted text (see `AGENTS.md` rule 12):

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
      Tests  435 passed (435)
   Start at  21:48:31
   Duration  201.50s (import 39%, environment 32%, tests 20%, transform 7%, setup 1%, worker 1%)

     Import  210 modules were evaluated 673 times · 37.64s total, 39% of tracked time
             ~25.90s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 594ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 23.5s
  Running TypeScript ...
  Finished TypeScript in 13.1s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 5.6s
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
FAILED_COMMANDS=0
```

## Limitations

- No live `deploy.yml` run, drill or GitHub/Vercel setting was changed; fail-closed behavior is proven by unit and flow tests plus a local CLI probe, not by a production migration.
- The check set ran on Windows with SQLite, not on `ubuntu-latest` with PostgreSQL.
- The exact Prisma no-pending phrases are pinned to three known messages; an entirely new no-pending wording causes an extra approval pause by design, never an unreviewed migration.
- The review record was written before the fix commit was created; the Head line now names the exact commit `846f11d`.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 21:54:09 +07:00 - Final fix wave: fail-closed migrations, docs and rollback status`.
