# Code review - C2 deploy from Actions and Vercel Git deploy off (2026-11-23)

- **Skill:** requesting-code-review
- **Scope:** `vercel.json`, `.github/workflows/deploy.yml`, `src/test/deploy-workflow.test.ts`, `docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `README.md`, `AI_LOG.md`
- **Base:** `d7a51e7` | **Head:** working tree before commit
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 16:04:27 +07:00 - C2: deploy production từ GitHub Actions sau CI`.

## Method

Loaded the `requesting-code-review` skill by exact id and read its `code-reviewer.md` template. The skill normally dispatches a read-only reviewer subagent, but the orchestrator for this task forbids dispatching any subagent or reviewer, so I applied the template myself: plan alignment, code quality, architecture, testing and production readiness, with the whole source of every touched file re-read rather than a diff snippet. Every consumer of a changed value was checked with `grep` before accepting a finding:

- `grep` for `deploymentEnabled`, `vercel.json`, `deploy.yml` and `needs` across the repository found only `vercel.json`, the guard test, the three live docs (`docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `README.md`) and historical records (`AI_LOG.md`, older reviews).
- `.github/workflows/ci.yml` was re-read to confirm the triggering workflow name is exactly `ci`, the four job ids are `static`, `test`, `build`, `e2e`, and that `ci.yml` does not deploy.
- `package.json` was re-read to confirm `build:production` still contains the migration call, so this PR must not claim migrations are separated yet (C3).
- `docs/DEPLOY.md` was read in full before editing so the A3 decision record, the deployment sequence and the readiness checklist stay consistent.
- `vercel.json` was parsed as JSON and `deploy.yml` was parsed with the `yaml` package already present in `node_modules`, so the contract is not only a string match.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `src/test/deploy-workflow.test.ts:131` | Comment in `.github/workflows/deploy.yml` named the three runtime variables; the guard then failed with `DATABASE_URL belongs to the Vercel project, not to this workflow`. A text guard that forbids the names anywhere also forbids prose, which already produced one false positive. | **Accepted (fixed in this PR)**: reworded the workflow comment to "Application runtime variables" instead of weakening the guard; the guard keeps the stronger "no app-secret names in the workflow" contract. |
| 2 | Important · `.github/workflows/deploy.yml:42` | Brief Step 1 says the guard must assert the workflow does not contain `needs:`, while Step 3 requires `needs: verify-ci`. A whole-file assertion would contradict the required job graph; deleting `needs` would let `deploy` start even when `verify-ci` fails. | **Accepted (fixed in this PR)**: the guard forbids `needs:` only inside the `workflow_run` trigger (the cross-workflow case) and pins `needs: verify-ci` in the `deploy` job. The contradiction is recorded in `AI_LOG.md`. |
| 3 | Minor · `.github/workflows/deploy.yml:18` | The binding text is `concurrency: production`, but Step 3 also requires `cancel-in-progress: false`. The string form `concurrency: production` cannot carry an explicit `cancel-in-progress`. | **Accepted (documented deviation)**: used the equivalent block form `group: production` plus `cancel-in-progress: false`; the guard pins both values. The string literal is not present, which is the only way to keep the explicit no-cancel setting. |
| 4 | Minor · `.github/workflows/deploy.yml:65` | Each Vercel command passes `--token="$VERCEL_TOKEN"`, so the token appears in the command line of the runner process instead of only in the environment. GitHub masks the value in logs and the runner is single-tenant and ephemeral. | **Rejected (documented CLI usage)**: `--token` is the documented CI form and is explicit; relying on the CLI reading `VERCEL_TOKEN` implicitly is unverified for the pinned version, and a live deploy failure is worse than the residual exposure on an ephemeral runner. Revisit if the CLI version is changed. |
| 5 | Minor · `.github/workflows/deploy.yml:26` | The SHA check runs in `verify-ci`; a push that lands after that check but before `deploy` finishes would make the running deploy slightly older than `main`. | **Rejected (control is sufficient)**: the spec's target race is "a newer push lands while CI is running", which the check catches. Re-checking immediately before `vercel deploy` would let an unrelated main commit block a build that already passed CI, and the newer run deploys next because the concurrency group serialises runs. |
| 6 | Minor · `src/test/deploy-workflow.test.ts:12` | The `block()` helper is duplicated from `src/test/ci-workflow.test.ts`. | **Rejected (intentional)**: each guard owns its reader; extracting a shared test util adds coupling between two contracts for about twenty lines and departs from the C1 structure. |
| 7 | Minor · `.github/workflows/deploy.yml:16` | No `timeout-minutes`, so a hung `vercel` call can hold a runner until the default limit. | **Rejected (not this PR's defect)**: matches the C1 decision; bounding a deploy is a cost-control choice for the owner and C4 adds the smoke timeout path. |
| 8 | Minor · `.github/workflows/deploy.yml:55` | Actions use major tags (`actions/checkout@v7`, `actions/setup-node@v7`) rather than commit SHAs. | **Rejected (out of scope)**: the repository convention in `ci.yml` is the same; tightening supply-chain pinning is a repository-wide owner decision. |
| 9 | Minor · `.github/workflows/deploy.yml:65` | Three separate `npx --yes vercel@66.6.0` calls re-resolve the package on each step. | **Rejected (pin requirement)**: the controller requires the pinned `npx --yes vercel@66.6.0` form, and the npx cache makes the later calls cheap. A global install would lose the per-command pin. |
| 10 | Minor · `docs/DEPLOY.md:73` | `build:production` still applies migrations inside `vercel build`, so a deploy can still change the schema before C3 lands. | **Rejected for C2 (assigned to C3)**: the plan explicitly separates migration in Task 3; this PR must not silently change `package.json` or delete the migration script, and the docs still describe the current behaviour honestly. |

## Declined to judge

- **GitHub Environment secrets and live deploy:** controller-owned. No `gh secret set`, no Vercel CLI call and no run link exist from this task; judging them would mean inventing evidence.
- **Required reviewers on Environment `production`:** an owner setting. The workflow honours it (`environment: production`) but whether a pause happens depends on GitHub configuration outside the repo.
- **`npx --yes vercel@66.6.0` runtime behaviour, including whether `--token` and the pulled `.env.production.local` reach `vercel build`:** only a live run can prove it; no credentials were supplied.
- **Branch protection / required checks:** delivered by C1 and already merged; not re-reviewed here.
- **Historical `deploymentEnabled: { main: true, "*": false }` mentions in old `AI_LOG.md` entries:** records of what was true then; rule 9 and rule 10 forbid rewriting historical verbatim content without asking, so only the live docs were updated.
- **PR preview deploys (C5):** explicitly future work, not started.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Vercel Git deployments are off while `buildCommand` stays `npm run build:production` | `src/test/deploy-workflow.test.ts`, test `disables Vercel Git deployments and keeps the production build command`; RED output showed `expected { main: true, '*': false } to be false` | pass |
| `deploy.yml` runs only for a completed `ci` run on `main` | Same file, test `deploys only for a completed CI run on main` (`workflow_run`, `workflows: [ci]`, `types: [completed]`, `branches: [main]`, no `push`, no `pull_request`) | pass |
| No cross-workflow `needs` | Same test, assertion on the `workflow_run` block only | pass |
| Deploy is gated on `conclusion == 'success'` and the current `main` SHA | Same file, test `verifies the run succeeded and that its commit is still the tip of main` (`conclusion == 'success'`, `head_sha`, `commits/main`) | pass |
| Deploy runs the verified SHA in Environment `production` and exposes `deployment_url` | Same file, test `deploys the verified commit inside the production environment` (`needs: verify-ci`, `environment: production`, `ref: ${{ github.event.workflow_run.head_sha }}`, `deployment_url`) | pass |
| The job installs from the lockfile with the npm cache | Same file, test `builds from the lockfile with the npm cache` | pass |
| Production deploys are serialised and an in-flight deploy is not cancelled | Same file, test `serialises deploys in the production group without cancelling the running one` (`group: production`, `cancel-in-progress: false`) | pass |
| The three Vercel commands run with the pinned CLI and the three Environment secrets | Same file, test `runs the three pinned Vercel commands with the environment token secrets`; literal `${{ secrets.VERCEL_TOKEN }}`, `${{ secrets.VERCEL_ORG_ID }}`, `${{ secrets.VERCEL_PROJECT_ID }}` | pass |
| No application secret is added to GitHub | Same file, test `keeps the application secrets in Vercel instead of GitHub` | pass |
| The YAML is syntactically valid | `node -e` with the `yaml` package: `YAML OK [name,on,permissions,concurrency,jobs]`, jobs `[verify-ci, deploy]` | pass |
| The guard really fails when the contract is broken (RED) | `npm test -- src/test/deploy-workflow.test.ts` before the fix: `Tests 8 failed (8)`, first failure `expected { main: true, '*': false } to be false`, others `ENOENT ... deploy.yml` | pass (captured in the task report) |
| The full check set passes | `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`, `npm run check:language`, captured with Node `spawnSync` | pass (output below) |
| A live Actions run shows CI to deploy and the Vercel dashboard shows no Git deployment | Not performed; controller owns the secrets and the live calls | lacking evidence |
| Environment `production` holds the three secrets | Not set in this task; controller-owned | lacking evidence |

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


 Test Files  84 passed (84)
      Tests  404 passed (404)
   Start at  16:09:36
   Duration  139.83s (import 42%, environment 28%, tests 20%, transform 8%, setup 1%, worker 1%)

     Import  207 modules were evaluated 666 times · 34.84s total, 42% of tracked time
             ~24.01s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 497ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 17.6s
  Running TypeScript ...
  Finished TypeScript in 13.9s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 5.9s
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

- No GitHub Actions run, no Environment secret, no Vercel CLI execution and no Vercel dashboard evidence; those need controller credentials and are recorded as lacking evidence above.
- The YAML was validated with a parser and the guard test, not by a runner; the pinned CLI version was not executed.
- `npm run build` and `npm test` ran on Windows locally, not on `ubuntu-latest`.
- The guard test is a text-level contract plus a JSON parse for `vercel.json`; it does not emulate GitHub's event matching.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 16:04:27 +07:00 - C2: deploy production từ GitHub Actions sau CI`.
