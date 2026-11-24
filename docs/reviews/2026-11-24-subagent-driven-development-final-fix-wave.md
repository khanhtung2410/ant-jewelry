# Code review - scoped re-review of the final fix wave (2026-11-24)

- **Skill:** `subagent-driven-development`
- **Scope:** fix round for the three findings of the final whole-branch review, commits `d51174b..846f11d`, plus the small follow-ups accepted from this re-review
- **Base:** `d51174b` | **Head:** `846f11d` (`fix/ci-fail-closed-migrations`)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 22:30:00 +07:00 - Scoped re-review va PR cho final fix wave`.

## Method

A fresh-context reviewer was dispatched with the exact skill id `subagent-driven-development` and the scoped re-review template. It received the task brief, the fix report, the three findings under verification, and the diff package for `d51174b..846f11d`. It re-read the whole `scripts/detect-pending-migrations.mjs`, `src/test/detect-pending-migrations.test.ts`, `src/test/deploy-workflow.test.ts`, `.github/workflows/deploy.yml`, `docs/DEPLOY.md`, `README.md` and `docs/ARCHITECTURE.md`, and grepped consumers of `hasPendingMigrations`, the four secret names and `DIRECT_URL`. It did not re-run the suites; it verified the implementer report's named tests and output.

## Finding verdicts

| # | Severity · file:line | Verdict | Evidence |
|---|---|---|---|
| R1 | Important · `scripts/detect-pending-migrations.mjs:14-16,32-46`, `src/test/detect-pending-migrations.test.ts:14-16`, `.github/workflows/deploy.yml:95` | **ADDRESSED** | Pending banner first at `:17-21`; `false` only on the three explicit no-pending markers at `:7-8`; every other value including empty returns `true`. The CLI keeps the banner check before the command-error check at `:38-41,45-50`, so a failed status command still exits 1. Workflow `:72-73` publishes `pending`, `:88-90` captures stdout, `:95` is the exact approval condition. Tests at `src/test/detect-pending-migrations.test.ts:34-36`, `:38-40`, `:22-32` and the flow test at `src/test/deploy-workflow.test.ts:335-348`. |
| R2 | Important · `docs/DEPLOY.md:56,70,77,99,350`, `README.md:70` | **ADDRESSED** | Four-secret phrases at `docs/DEPLOY.md:56,76,98,358`; no `DIRECT_URL` row in `docs/DEPLOY.md` or `README.md`; `README.md:265-266` and `docs/ARCHITECTURE.md:986` agree with four secrets; `docs/DEPLOY.md:132` intentionally keeps three Vercel credentials plus `DATABASE_URL`. Guard at `src/test/deploy-workflow.test.ts:350-370`. |
| R3 | Minor · `docs/DEPLOY.md:193-203` | **ADDRESSED** | Both `curl` calls at `docs/DEPLOY.md:192-198` and `:200-208` use `-w '\n%{http_code}'`, split with `tail -n 1` and `sed '$d'`, and print `HTTP $status`, matching `.github/workflows/deploy.yml:189-193`. |

## New breakage in the fix diff

| # | Severity · file:line | Finding | Decision |
|---|---|---|---|
| N1 | Minor · `AI_LOG.md:15,20,28`, `docs/reviews/2026-11-24-receiving-code-review-final-fix-wave.md:17` | The unchanged "ba secret Vercel" sentence moved from `docs/DEPLOY.md:133` to `:132` after the deleted row above it, so the citations were stale by one line. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - all three AI_LOG mentions and the record now say `docs/DEPLOY.md:132`. |
| N2 | Minor · `src/test/deploy-workflow.test.ts:369` | The rollback doc guard asserted only `%{http_code}`; deleting the status split and `HTTP $status` would still pass. The implementer report also overstated the guard as pinning "both table shapes". | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - the guard now also asserts `tail -n 1`, `sed '$d'` and `echo "HTTP $status"` inside `### Manual rollback`, and `.env.example` contains no `DIRECT_URL`. |
| N3 | Minor · `docs/reviews/2026-11-24-receiving-code-review-final-fix-wave.md:15` | The F1 row cited `src/test/detect-pending-migrations.test.ts:30-32`, which is the no-migration-file case; the empty and unknown cases are at `:34-40`. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - citation corrected to `:34-40`. |

## Out-of-scope observations and rulings

| # | Observation | Decision |
|---|---|---|
| O1 | `.env.example:39-41` still documented an optional `DIRECT_URL`, and `README.md:62` says its table lists the variables in `.env.example`, which is now inconsistent. | **Accepted (fixed in `fix/ci-fail-closed-migrations`)** - the optional `DIRECT_URL` block is replaced by a one-line note that migrations use the same direct `DATABASE_URL`; the doc guard now rejects any `DIRECT_URL` token in `.env.example`. This follows the owner decision not to reintroduce the variable and keeps the README table truthful. |
| O2 | `docs/superpowers/specs/2026-11-23-ci-deploy-gating-design.md:11` still says the migration job applies with `DIRECT_URL`, while the same spec's owner decision at `:40` says not to reintroduce it. | **Rejected as a fix target** - the spec is a historical design record; the owner decision at `:40` and all live docs supersede it, and project rule 3 forbids rewriting historical records without an owner request. |
| O3 | Historical plan and review records still say three secrets (`docs/superpowers/plans/2026-11-23-ci-deploy-gating.md:87`, `docs/reviews/2026-11-23-requesting-code-review-c2.md:53,59`). | **Rejected as a fix target** - historical records; no live runbook reads them, and rule 3 keeps them verbatim. |

## Checklist versus evidence

| Claim | Test or captured output | Result |
|---|---|---|
| Empty and unknown status output are pending | `src/test/detect-pending-migrations.test.ts > treats empty output as pending so the approval gate cannot be skipped`, `> treats unknown output as pending when Prisma changes its wording` | đạt/pass |
| Explicit no-pending markers stay false | same file, `> treats an up-to-date database as having no pending migrations`, `> treats the explicit no-pending message as having no pending migrations`, `> treats no migration file message as having no pending migrations` | đạt/pass |
| Unknown output reaches the exact approval condition | `src/test/deploy-workflow.test.ts > feeds unknown status output through to the approval condition` | đạt/pass |
| A failed status command still stops the run | implementer probe: `[detect-pending-migrations] prisma migrate status failed; refusing to continue.` with `EXIT=1` | đạt/pass |
| Four secrets and no `DIRECT_URL` in the live docs or `.env.example` | `src/test/deploy-workflow.test.ts > keeps the Environment secret counts and direct URL rows consistent` (extended in this round) | đạt/pass |
| Manual rollback prints and splits the HTTP status | same test, assertions on `%{http_code}`, `tail -n 1`, `sed '$d'`, `echo "HTTP $status"` | đạt/pass |
| Focused suite on the amended files | `npx --no-install vitest run src/test/deploy-workflow.test.ts src/test/detect-pending-migrations.test.ts` -> `Test Files 2 passed (2)`, `Tests 27 passed (27)`, `EXIT=0` | đạt/pass |
| Full check set on the final tree | complete capture below, every `EXIT=0`, `FAILED_COMMANDS=0` | đạt/pass |

## Verification output

Full check set on the final tree, captured via Node `spawnSync` in UTF-8 with `NO_COLOR=1` and `DATABASE_URL=file:./prisma/dev.db`. The Next.js legend character U+0192 was replaced by `F`:

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

- No live `deploy.yml` run, migration, drill or setting change in this fix round; the fail-closed behavior rests on unit, flow and CLI-probe evidence.
- Checks ran on Windows with SQLite, not on `ubuntu-latest` with PostgreSQL.
- The re-reviewer did not re-run the suites; it verified the named tests and the controller re-ran the full set.
- A new Prisma no-pending wording causes one extra approval pause by design; it cannot produce an unreviewed migration.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 22:30:00 +07:00 - Scoped re-review va PR cho final fix wave`.
