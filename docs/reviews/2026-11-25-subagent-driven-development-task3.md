# Code review - Task 3 pending migration CLI (2026-11-25)

- **Skill:** `subagent-driven-development` (controller) + `requesting-code-review` (exact id loaded by the reviewer)
- **Scope:** Task 3 of `docs/superpowers/plans/2026-11-25-new-update-test-flow.md` - cover CLI exit behavior with two exported functions while preserving the wrapper contract
- **Base:** `670ab507` | **Head:** `97b457e`
- **Prompt nguyên văn:** the driving request was `clean stale report, review docs / use superpower to create new test flow (unit, integration, workflow) for all new update / review and check relevant changes again`; the AI_LOG entry for this work is added in Task 5.

## Method

Fresh-context read-only reviewer dispatched under the exact skill ids above. It read the task brief, the design spec, the implementer report, and one review package containing the commit list, stat summary and full `-U10` diff (`review-670ab50..97b457e.diff`). It did not re-run the suite. It checked the named cross-module risk by reading `src/test/deploy-workflow.test.ts:322-333` against the final wrapper source and confirmed both literal strings survive. The controller confirmed that `task-5-brief.md:1-6` owns the AI_LOG and review records and that the final commit changes only the two assigned files.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T3-1 | Minor · `src/test/detect-pending-migrations-cli.test.ts:52-70` | The injected runner is cast `as never` and does not assert `encoding: 'utf8'` passed by `runStatusCommand`. | **Accepted (scheduled in `follow-up/cli-runner-contract`)** - the brief mandates this exact stub shape, so changing it here would depart from the required test code; strengthen the runner contract in a named follow-up branch. |
| T3-2 | Minor · `scripts/detect-pending-migrations.mjs:71-74` | `process.exit(exitCode)` can truncate a piped refusal line before the stream drains. | **Accepted (scheduled in `follow-up/cli-output-flush`)** - this is a pre-existing pattern and outside the behavior-preserving refactor; switch to `process.exitCode` in a named follow-up branch. |
| T3-3 | Minor · `task-3-report.md:445-447` | The first `format:check` failed before the two changed files were formatted. | **Rejected as a defect** - the captured final run at `task-3-report.md:287-304` exits 0, and the fix touched formatting only. |

## Declined to judge

- Literal `git add` and `git commit` invocation from the brief: its effect is visible in the single commit title and two-file file set at `review-670ab50..97b457e.diff:5,8-10`; the exact shell spelling is not a product requirement.
- Live production `db:migrate:status:production`: no production PostgreSQL access exists in this agent environment; the local wrapper probe is captured below.
- AI_LOG and final review records: confirmed owned by Task 5 in `task-5-brief.md:1-6`, outside this task's two-file brief.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Both exports and exact signatures exist | `scripts/detect-pending-migrations.mjs:28,56` in the diff | pass |
| Pending banner wins over command failure | RED/GREEN report `task-3-report.md:33-139`, `:141-165`; six new tests | pass |
| Refusal message and exit code preserved | direct probe `task-3-report.md:421-431`, `EXIT=1` with exact stderr | pass |
| Empty and unknown output return `true` | new test cases at `src/test/detect-pending-migrations-cli.test.ts:27-32` | pass |
| Exact npm args and injected env | new test case at `src/test/detect-pending-migrations-cli.test.ts:52-70` | pass |
| Existing workflow guard still satisfiable | `scripts/detect-pending-migrations.mjs:50,59` versus `src/test/deploy-workflow.test.ts:322-333` | pass |
| Focused suite green | `npm test -- src/test/detect-pending-migrations-cli.test.ts src/test/detect-pending-migrations.test.ts src/test/deploy-workflow.test.ts`, 3 files / 33 tests, `EXIT=0` | pass |
| Full suite green | `npm test`, 87 files / 441 tests, `EXIT=0`, captured below | pass |
| Lint, typecheck, format and language green | captured check set below, every `EXIT=0` | pass |
| Build green with database variable | captured build below, `EXIT=0` | pass |
| Branch based on `origin/main`, `main` untouched | `git log -1 main` = `86f286b`; assigned base kept with `origin/main` as ancestor | pass |
| AI_LOG and review records | deferred to Task 5 by brief | lacking evidence until Task 5 |
| Full check output in PR body | deferred to Task 5 by brief | lacking evidence until Task 5 |

## Verification output

The implementer's final captured check set is reproduced below. The Next.js legend character U+0192 is replaced by `F` as required by rule 12.

```text
COMMAND: npx --no-install next typegen
DATABASE_URL_IN_CHILD: not set
EXIT=0

STDOUT:
Generating route types...
✓ Types generated successfully

STDERR:

COMMAND: npm run db:push
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "e2e.db" at "file:./prisma/e2e.db"

The database is already in sync with the Prisma schema.


STDERR:
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.

COMMAND: npm run lint
DATABASE_URL_IN_CHILD: not set
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 lint
> eslint


STDERR:

COMMAND: npm run typecheck
DATABASE_URL_IN_CHILD: not set
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit


STDERR:

COMMAND: npm test
DATABASE_URL_IN_CHILD: not set
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/clever-pixel


 Test Files  87 passed (87)
      Tests  441 passed (441)
   Start at  12:17:01
   Duration  49.60s (tests 42%, import 35%, environment 13%, transform 5%, setup 2%, worker 2%)

     Import  211 modules were evaluated 676 times · 9.98s total, 35% of tracked time
             ~6.86s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation


STDERR:

COMMAND: npm run format:check
DATABASE_URL_IN_CHILD: not set
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

STDERR:

COMMAND: npm run check:language
DATABASE_URL_IN_CHILD: not set
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs


STDERR:

COMMAND: npm run build
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0

STDOUT:

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 222ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.0s
  Running TypeScript ...
  Finished TypeScript in 5.7s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 6.1s
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
│ ├ ○ /blog/cach-chon-nhan-cuoi-phu-hop            15m      1y
│ ├ ○ /blog/cac-kieu-giac-cat-kim-cuong            15m      1y
│ └ ◐ [+3 more paths]
├   /c/[slug]                                      15m      1y
│ ├ ◐ /c/[slug]                                    15m      1y
│ ├ ◐ /c/wedding-ring                              15m      1y
│ ├ ◐ /c/engagement-ring                           15m      1y
│ └ ◐ [+2 more paths]
├ ○ /jewelry-care                                  15m      1y
├   /p/[slug]                                      15m      1y
│ ├ ◐ /p/[slug]                                    15m      1y
│ ├ ○ /p/aurora-band                               15m      1y
│ ├ ○ /p/eclipse-pave-band                         15m      1y
│ └ ◐ [+21 more paths]
├ ○ /privacy                                       15m      1y
├ ○ /robots.txt                                    15m      1y
├ ○ /ship                                          15m      1y
├ ○ /sitemap.xml                                   15m      1y
├ ○ /terms                                         15m      1y
└ F /uploads/[...path]


F Proxy (Middleware)

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
F  (Dynamic)            server-rendered on demand


STDERR:

COMMAND: node scripts/detect-pending-migrations.mjs
DATABASE_URL_IN_CHILD: set
EXIT=1

STDOUT:

STDERR:
[detect-pending-migrations] prisma migrate status failed; refusing to continue.
```

## Limitations

- The reviewer worked from a diff package and did not re-run suites; all test claims point to named outputs in the implementer report.
- No production database was available, so the live production status command was not exercised.
- The two Minor findings are scheduled for named follow-up branches; they are not fixed in this PR.
- The final PR body and AI_LOG entry do not exist yet; Task 5 must close the two `lacking evidence` rows.

Link AI_LOG entry: to be added by Task 5.
