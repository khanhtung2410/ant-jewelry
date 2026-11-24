# Code review - final whole-branch review of CI deploy gating (2026-11-24)

- **Skill:** `requesting-code-review`
- **Scope:** whole plan range `86f286b..d51174b` (C1-C4 plus follow-ups #158, #159, #160)
- **Base:** `86f286b` | **Head:** `d51174b`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 21:40:00 +07:00 - Final whole-branch review cho CI deploy gating`.

## Method

Fresh-context senior reviewer dispatched with the exact skill id `requesting-code-review` and `code-reviewer.md`. It read the plan, the spec, the ledger with every ruling and deferred minor, the full review-package diff (`86f286b..d51174b`, about 350 KB), the whole source of every touched file at `d51174b` via read-only `git show`, and independently inspected both live runs (`gh run view 45413253843` and `45413765905`) and all seven PR bodies. It did not mutate the worktree and did not re-run the suites; every pass claim names an existing captured output or live run.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| F1 | Important · `scripts/detect-pending-migrations.mjs:14-16,32-46`, `src/test/detect-pending-migrations.test.ts:14-16`, `.github/workflows/deploy.yml:266-269,310-311` | Empty or unrecognised `prisma migrate status` output returns `false`, so `approval` is skipped and `migrate` applies a schema change without a reviewer. The live run only proves the no-pending case. The plan's Step 1 mandates this fail-open behavior, but spec C3 requires a pause when a migration is pending. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - the controller ruled the spec wins: `false` only on an explicit no-pending marker, unknown or empty output becomes `true`, and the CLI still exits 1 when the status command fails. Unit and flow tests updated. |
| F2 | Important · `docs/DEPLOY.md:56,70,77,99,350`, `README.md:70` | The runbook says three Environment secrets in three places while the workflow needs four, and still offers `DIRECT_URL` in two places, contrary to the owner decision. An operator following it can omit `DATABASE_URL` and break `check-migrations` and `migrate`. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - counts corrected to four, both `DIRECT_URL` rows deleted, doc guards added. |
| F3 | Minor · `docs/DEPLOY.md:193-203` | Manual rollback tells the operator to check HTTP 2xx and `oldDeploymentId`, but the `curl` commands do not print the HTTP status. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - `-w '\n%{http_code}'` added and pinned by a doc test. |

Deferred minors triaged by the final review: the job-set-not-exactly-four guard, the two off-by-one citations in the C1 record, the hard-coded action major tags, the SQLite `db:push` limitation, the redundant `--token` suffix, the literal `\u0020`, the stale `DATABASE_URL` limitation, the clean no-target rollback, trailing spaces in historical captured logs, and the pending live drill all stay deferred with the reviewer's reasons. The `DIRECT_URL`/secret-count item and the manual `curl` status item were promoted into this fix wave.

## Declined to judge

- C5 preview deploys with a separate database: optional future work, not a numbered task.
- Hero slider pause-button removal (#154): in the range but unrelated to this spec.
- Application runtime, schema and seed behavior; local SQLite workflow; re-enabling Vercel Git deploys; automatic schema rollback: explicit spec non-goals.
- GitHub branch protection, Environment settings and Vercel dashboard state: controller-owned external configuration.
- Owner-present simulated-failure rollback drill and the approval-pause run: not performed, known evidence gap.
- Action SHA pinning and job timeouts: owner decisions already recorded in C1/C2 reviews.
- Vitest `isolate` advisory and Next.js `agentFeedback` warning: pre-existing informational output.
- Figma/R6.3 pixel comparison: not in this plan.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Four required CI contexts exist and run | `src/test/ci-workflow.test.ts` plus `gh run view 45413253843` (static, test, build, e2e green) | đạt/pass |
| Deploy only after a green CI run on the current `main` | `src/test/deploy-workflow.test.ts > verifies the run succeeded and that its commit is still the tip of main`; live run `45413765905` verify-ci success | đạt/pass |
| Migration is gated before deploy | `src/test/deploy-workflow.test.ts > checks pending migrations before the migration and deploy jobs`; live `check-migrations` and `migrate` success | đạt/pass |
| Pending detection fails closed after the fix | `src/test/detect-pending-migrations.test.ts` empty and unknown cases plus the new flow test | đạt/pass |
| Capture and rollback use the alias REST API | `src/test/deploy-workflow.test.ts` capture tests, `src/test/smoke-rollback.test.ts` rollback tests, live capture log line | đạt/pass |
| Smoke runs against the canonical origin and a real failure keeps the run red | `src/test/smoke-rollback.test.ts`; live `smoke=success rollback=skipped` | đạt/pass |
| Full check set on the fix-wave tree | output below with every `EXIT=` line | đạt/pass |

## Verification output

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
   Start at  22:28:08
   Duration  111.06s (tests 41%, import 27%, environment 22%, transform 7%, setup 1%, worker 1%)

     Import  210 modules were evaluated 673 times · 18.24s total, 27% of tracked time
             ~12.55s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 311ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 8.1s
  Running TypeScript ...
  Finished TypeScript in 23.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 9.7s
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

## Limitations

- No automated rollback drill with the owner present; only the happy-path live run and guard tests exist.
- Checks run on Windows with SQLite, not on `ubuntu-latest` in Actions.
- Historical `AI_LOG.md` and review entries are kept verbatim by ruling, including the old `DIRECT_URL` mention and the literal `\u0020`.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 21:40:00 +07:00 - Final whole-branch review cho CI deploy gating`.
