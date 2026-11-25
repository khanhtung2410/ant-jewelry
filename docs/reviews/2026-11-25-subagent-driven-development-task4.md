# Code review - Task 4 workflow graph structure (2026-11-25)

- **Skill:** `subagent-driven-development` (controller) + `requesting-code-review` (exact id loaded by the reviewer)
- **Scope:** Task 4 of `docs/superpowers/plans/2026-11-25-new-update-test-flow.md` - add a structural test for workflow job graph resolution, cycles and the production deploy chain
- **Base:** `97b457e` | **Head:** `4aff895`
- **Prompt nguyên văn:** the driving request was `clean stale report, review docs / use superpower to create new test flow (unit, integration, workflow) for all new update / review and check relevant changes again`; the AI_LOG entry for this work is added in Task 5.

## Method

Fresh-context read-only reviewer dispatched under the exact skill ids above. It read the task brief, the design spec, the implementer report, and one review package containing the commit list, stat summary and full `-U10` diff (`review-97b457e..4aff895.diff`). It did not re-run the suite. It checked the named parser risk by comparing `block`, `jobNames` and `needsOf` in the new test with the real job blocks in both workflow files. The controller verified the post-restore state with `git diff -- .github/workflows` empty and `git status --short` showing only the three untracked Task 1 to 3 review records, and confirmed `origin/main` is an ancestor of the branch.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T4-1 | Minor · `src/test/deploy-workflow-graph.test.ts:31-39` | `needsOf` parses inline text only; a future block-style `needs:` list or `needs: []` could hide an edge. | **Accepted (scheduled in `follow-up/workflow-graph-parser-hardening`)** - the brief mandates this exact helper and current YAML has no such shape; harden the parser in the named follow-up branch. |
| T4-2 | Minor · `src/test/deploy-workflow-graph.test.ts:25-29` | `jobNames` accepts only unquoted ids at exactly two-space indent; a quoted id or different indent could be dropped. | **Accepted (scheduled in `follow-up/workflow-graph-parser-hardening`)** - plan-mandated exact code; harden and add an expected job count in the follow-up branch. |
| T4-3 | Minor · `src/test/deploy-workflow-graph.test.ts:86-94` | The CI test lacks a non-vacuity guard, so zero parsed jobs would pass. | **Accepted (scheduled in `follow-up/workflow-graph-parser-hardening`)** - add the deploy test's `names.length` guard there. |
| T4-4 | Minor · `src/test/deploy-workflow-graph.test.ts:42-65` | Cycle detection runs only on `deploy.yml`; a future CI cycle would pass. | **Accepted (scheduled in `follow-up/workflow-graph-parser-hardening`)** - extract the walk and run it for both workflows there. |
| T4-5 | Minor · `task-4-report.md:337` | Git warned that LF will become CRLF on the next checkout of the new test file. | **Rejected** - expected line-ending normalization on Windows; the captured `format:check` exits 0 and the checkout is clean for tracked files. |
| T4-6 | Minor · `task-4-report.md:231-233` | Vitest printed an `isolate: false` performance suggestion. | **Rejected** - non-actionable tooling hint, not a failure or a task defect. |

## Declined to judge

- The RED mutation itself and the capture script internals: verified from the implementer's captured output and the controller's empty workflow diff; the session transcript is not part of the repository record.
- PR creation and the full check output in the PR body: deferred to Task 5 by `task-5-brief.md:37-71`.
- AI_LOG entry: deferred to Task 5 by `task-5-brief.md:30-35`.
- Branch integration: `origin/main` is an ancestor of the branch, so no rebase or merge is required before the PR.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Four brief cases present | `src/test/deploy-workflow-graph.test.ts:42-94` in the diff | pass |
| Exact deploy chain pinned | assertions at `src/test/deploy-workflow-graph.test.ts:68-76` versus workflow job blocks | pass |
| CI name and workflow wiring | assertions at `:82-83` versus `ci.yml:1` and `deploy.yml:8-9` | pass |
| Real cycle detection | three-state DFS at `:42-65` | pass |
| GREEN→RED→GREEN | `task-4-report.md:32-43`, `:79-179`, `:366-382` | pass |
| Workflow restored after mutation | controller `git diff -- .github/workflows` empty | pass |
| Full suite green | `npm test`, 88 files / 445 tests, `EXIT=0`, captured below | pass |
| Lint, typecheck, format and language green | captured check set below, every `EXIT=0` | pass |
| Build green with database variable | captured build below, `EXIT=0` | pass |
| Only the one assigned file added | `git status --short`; diff stat at `review-97b457e..4aff895.diff:8-9` | pass |
| AI_LOG entry | deferred to Task 5 | lacking evidence until Task 5 |
| Full check output in PR body | deferred to Task 5 | lacking evidence until Task 5 |

## Verification output

The implementer's final captured check set is reproduced below. The Next.js legend character U+0192 is replaced by `F` as required by rule 12.

```text
$ npx --no-install next typegen
Generating route types...
✓ Types generated successfully
EXIT=0

$ npm run db:push

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "e2e.db" at "file:./prisma/e2e.db"

The database is already in sync with the Prisma schema.

[stderr]
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


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/clever-pixel


 Test Files  88 passed (88)
      Tests  445 passed (445)
   Start at  12:27:37
   Duration  59.76s (tests 41%, import 36%, environment 14%, transform 5%, setup 2%, worker 2%)

     Import  212 modules were evaluated 678 times · 12.47s total, 36% of tracked time
             ~8.57s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

$ npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

$ npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0

$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 187ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.5s
  Running TypeScript ...
  Finished TypeScript in 4.6s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.4s
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

EXIT=0
```

## Limitations

- The reviewer worked from a diff package and did not re-run suites; all test claims point to named outputs in the implementer report.
- The parser hardening findings are scheduled for a follow-up branch; they are not fixed in this PR.
- The final PR body and AI_LOG entry do not exist yet; Task 5 must close the two `lacking evidence` rows.

Link AI_LOG entry: to be added by Task 5.
