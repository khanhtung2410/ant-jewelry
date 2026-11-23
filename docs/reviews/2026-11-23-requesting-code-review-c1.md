# Code review - C1 CI workflow and branch-protection prerequisites (2026-11-23)

- **Skill:** requesting-code-review
- **Scope:** `.github/workflows/ci.yml` (renamed from `npm-ci.yml`), `src/test/ci-workflow.test.ts`, `docs/PERFORMANCE.md`, `docs/DEPLOY.md`, `AI_LOG.md`
- **Base:** `86f286b` | **Head:** working tree before commit
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 15:11:05 +07:00 - C1: CI chạy đủ bộ kiểm tra và đổi tên workflow`.

## Method

Loaded the `requesting-code-review` skill by exact id and read its `code-reviewer.md` template. The skill normally dispatches a read-only reviewer subagent, but the orchestrator for this task forbids dispatching any subagent or reviewer, so I applied the template myself: plan alignment, code quality, architecture, testing and production readiness, with the whole source of every touched file re-read rather than a diff snippet. Every consumer of the changed values was checked with `grep` before accepting a finding:

- `grep` for `npm-ci.yml` across the repository found only historical records (`AI_LOG.md` older entries, `docs/reviews/2026-11-19-*.md`, the spec and plan) plus the two live docs that this PR updates. Historical entries were left verbatim on purpose.
- `playwright.config.ts` was re-read to confirm the `e2e` job needs `npm ci`, `db:generate`, `typegen` and a production build before `npm run test:e2e`, and that it overrides `DATABASE_URL` with `e2e.db`.
- `vitest.global-setup.ts` and `e2e/reset-database.ts` were re-read to confirm the `test` and `e2e` jobs create their own schema (`test.db`, `e2e.db`), while the `build` job had no equivalent provisioning step.
- `package.json` was re-read to confirm all seven command strings exist as scripts and that `build:production` still contains the migration call, so the guard must forbid it.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `.github/workflows/ci.yml:8` | Remove the `permissions:` block from `.github/workflows/ci.yml`; the workflow then relies on the repository default token permissions, which may be read/write on push, so a compromised `run:` step gets more access than the read-only install and test steps need. The first draft, before this fix, had no such block. | **Accepted (fixed in this PR)**: added `permissions: contents: read`. |
| 2 | Important · `src/test/ci-workflow.test.ts:52` | Delete the `npm ci`, `npm run db:generate`, or `npx --no-install next typegen` line from any job, or remove `playwright install`, `if: failure()`, `playwright-report/` or `test-results/` from `e2e`, then run the guard. The first 6-test guard stayed green; the current guard fails. A broken install chain would otherwise fail in CI rather than in the guard, and the artifact paths could silently break the failure evidence. | **Accepted (fixed in this PR)**: added the install-chain test and the Playwright install/artifact assertions. |
| 3 | Important · `src/test/ci-workflow.test.ts:47` | The constraint is "`pull_request` for all PRs". Add `branches: [main]` under `pull_request:` and run the guard: the first 6-test version still passed because it only checked that the key existed, while the current guard fails. That filter would stop CI from running on PRs targeting any other branch. | **Accepted (fixed in this PR)**: the guard now rejects any `branches:` key inside the `pull_request` block. |
| 4 | Minor · `.github/workflows/ci.yml:18` | The four jobs repeat checkout, setup-node, `npm ci`, `db:generate` and `typegen`. Reproduction: count the repeated blocks. YAML anchors or a composite action could deduplicate. | **Rejected (intentional)**: spec decision 8 requires four independent job ids because `static`, `test`, `build`, `e2e` are the exact required status check contexts. An anchor-based template would hide that mapping and make the required checks harder to audit; the duplication is the cost of four independent contexts. No follow-up planned. |
| 5 | Minor · `.github/workflows/ci.yml:21` | Actions are pinned to major tags (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/cache@v4`, `actions/upload-artifact@v4`) instead of full commit SHAs, so a retagged action could change behaviour. Reproduction: read the `uses:` lines. | **Rejected (out of scope)**: this matches the existing repository convention before the rename (the previous workflow used the same style). Tightening supply-chain policy needs an owner decision and applies to every workflow; it is not C1 behaviour. |
| 6 | Minor · `.github/workflows/ci.yml:19` | No `timeout-minutes`, so a hung step can hold a runner until the 360-minute default. Reproduction: inspect the job keys; none sets a timeout. | **Rejected (not justified yet)**: `playwright.config.ts` already sets a 300 s webServer timeout and 60 s test timeout, so a hang is bounded by the test runner. Adding job timeouts is a cost-control choice for the owner, not a defect this PR introduces. |
| 7 | Minor · `src/test/ci-workflow.test.ts:16` | `block()` interpolates `key` into a `RegExp` without escaping, so a future key containing regex characters would mis-match. Reproduction: call `block(content, 'a.b')`; the dot matches any character. | **Rejected (no current hazard)**: every call site passes a literal job or event name (`jobs`, `static`, `test`, `build`, `e2e`, `push`, `pull_request`). Escaping now would add code with no behaviour to protect; revisit if a dynamic key is ever introduced. |
| 8 | Minor · `src/test/ci-workflow.test.ts:45` | The `branches: [main]` assertion only accepts flow style. Reproduction: rewrite the push filter in block style (`branches:` then `- main`); the guard fails although GitHub treats both forms the same. | **Rejected (brief pins the text)**: brief Step 1 requires the content `push:` with `branches: [main]`, and Prettier keeps the flow style. The stricter assertion is deliberate. |
| 9 | Important · `.github/workflows/ci.yml:72` | Delete `prisma/dev.db`, then run `DATABASE_URL=file:./prisma/dev.db npm run build` on the pre-fix workflow (no `npm run db:push`). Reproduction output: several `prisma:error ... The table main.Product does not exist in the current database` lines while the build still exits 0. The `build` status check would therefore pass against an empty SQLite file, log noisy database errors, and stop being evidence that the build can read the real schema. | **Accepted (fixed in this PR)**: added a `Create the SQLite schema ... run: npm run db:push` step before `npm run build`, matching the local README setup. This is a small, documented deviation from the literal brief job list, needed to make the new check meaningful. |

## Declined to judge

- **Branch protection API state (brief Step 5):** the controller owns this external call. No `gh api` request was made, so no protection evidence exists from this task; judging it would mean inventing evidence.
- **Whether the four contexts can be registered before the first `ci` run:** GitHub-side behaviour of required check names depends on the repository's existing check history. It is a controller/owner action, not repository code.
- **Runtime behaviour of `actions/cache@v4` and `actions/upload-artifact@v4` under `permissions: contents: read`:** both use the Actions runtime token rather than `GITHUB_TOKEN` scopes, but only a real Actions run can prove it. No run was available locally.
- **Historical `npm-ci.yml` mentions in old `AI_LOG.md` entries, `docs/reviews/2026-11-19-superpowers.md`, the spec and the plan:** these are records of what was true at the time. Rule 9 and rule 10 forbid rewriting historical verbatim content without asking, so only the two live docs were updated.
- **E2E suite duration and flakiness:** `npm run test:e2e` was not part of the required local check set for this task and needs browser binaries; the workflow keeps the exact command and the artifact upload from the previous file.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Exactly one workflow file, named `ci.yml` | `src/test/ci-workflow.test.ts` test `publishes exactly one workflow file named ci.yml`; `git status` shows `R npm-ci.yml -> ci.yml` | pass |
| Workflow name is exactly `ci` | Same file, test `names the workflow ci and runs on main pushes and every pull request` (`/^name: ci$/m`) | pass |
| Push is restricted to `main`; `pull_request` covers all branches | Same test: `branches: [main]` inside the `push` block and no `branches:` inside `pull_request` | pass |
| Jobs are exactly `static`, `test`, `build`, `e2e` | Same file, test `defines the four required status check jobs` | pass |
| The seven required commands run in the matching jobs | Same file, test `runs the complete check set in the matching job` | pass |
| The build job provisions the SQLite schema before building | Same test asserts `run: npm run db:push` in the `build` block; local `npm run build` output has no `prisma:error` lines after the step | pass |
| Install chain is identical in every job | Same file, test `installs dependencies the same way in every job` | pass |
| Playwright browsers are cached in `e2e` and the report uploads on failure | Same file, test `caches the Playwright browsers in the e2e job` | pass |
| No job runs `npm run build:production` | Same file, test `never runs the production build command that applies migrations` | pass |
| The guard really fails when the contract is broken (RED) | `npm test -- src/test/ci-workflow.test.ts` before the rename: `Tests 6 failed (6)`, first failure `.github/workflows/ci.yml must exist: expected false to be true` | pass (captured below in the report) |
| Live docs no longer reference the old filename | `grep npm-ci.yml` returns only historical records, spec and plan | pass |
| Branch protection with the four contexts | Not performed in this task; controller-owned (see Declined to judge) | lacking evidence |
| A deliberately failing PR locks Merge | Not performed; needs a pushed PR and the protection setting | lacking evidence |

## Verification output

Captured with Node `spawnSync` in UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`, after the same `next typegen` and `db:push` preparation that the workflow performs. The block below is the run captured before inserting it here; the final post-insert run on the committed tree is in the task report and will be pasted into the PR body. The Next.js route legend character U+0192 was replaced with `F` so the Vietnamese/English letter rule holds.

```text
$ npx --no-install next typegen
Generating route types...
✓ Types generated successfully

EXIT=0

$ npm run db:push

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

Your database is now in sync with your Prisma schema. Done in 133ms

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


 Test Files  83 passed (83)
      Tests  396 passed (396)
   Start at  15:23:36
   Duration  51.46s (tests 42%, import 36%, environment 13%, transform 5%, setup 2%, worker 2%)

     Import  206 modules were evaluated 664 times · 10.51s total, 36% of tracked time
             ~7.25s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 178ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 2.6s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 3.2s
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
```

## Limitations

- No GitHub Actions run, no branch-protection call and no GitHub UI screenshot were produced. YAML validity was checked by Prettier plus the guard test, not by executing the workflow on a runner.
- `npm run build` and `npm test` ran on Windows locally, not on `ubuntu-latest`.
- `npm run test:e2e` was not run in this task because the check set for C1 does not include it and the local browser binaries would add a long run; the job command is unchanged from the previous workflow.
- The guard test is a text-level contract, not a YAML parser: it pins the required strings and the job blocks that branch protection depends on.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 15:11:05 +07:00 - C1: CI chạy đủ bộ kiểm tra và đổi tên workflow`.
