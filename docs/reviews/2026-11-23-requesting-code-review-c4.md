# Code review - C4 smoke, rollback and recovery (2026-11-23)

- **Skill:** requesting-code-review
- **Scope:** `playwright.production.config.ts`, `.github/workflows/deploy.yml`, `src/test/smoke-rollback.test.ts`, `src/test/deploy-workflow.test.ts`, `docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `AI_LOG.md`
- **Base:** `091c6be` | **Head:** working tree before commit
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 16:13:16 +07:00 - C4: smoke sau deploy, rollback va tai lieu khoi phuc`.

> The brief named this file `2026-11-23-...`, so the filename is kept verbatim. The review itself ran on 2026-11-24 in local time, per AGENTS.md rule 10.

## Method

Loaded the `requesting-code-review` skill by exact id and read `code-reviewer.md`. The controller explicitly forbids dispatching a subagent or reviewer, so I applied the template myself in passes: brief alignment, workflow semantics, CLI contract, testing and documentation. I re-read the whole source of every touched file before ruling on a finding. Changed values were followed through `grep` first:

- `grep BASE_URL|SITE_URL` found the smoke job, the drill step, `playwright.production.config.ts`, `e2e/production.smoke.spec.ts`, and the living docs. The old app-secret guard had to change because `vars.SITE_URL` is a variable, not a secret.
- `grep previous_url|simulate_failure|playwright-report-smoke` found the deploy outputs, rollback input chain, drill smoke step, artifact name, the guard tests and the new docs section.
- The pinned CLI was queried read-only: `npx --yes vercel@66.6.0 rollback --help` confirms `rollback <deployment> --yes`; `npx --yes vercel@66.6.0 ls --prod --json` confirms `--prod` works but the JSON is an object with a `deployments` array. No deploy, rollback or drill was run.
- `deploy.yml` was parsed with the `yaml` package: all eight jobs, both triggers and all three dispatch inputs are present.

## Strengths

- Smoke targets the canonical origin via `vars.SITE_URL`, not the promotion URL; the flow test follows the value through the Playwright config into the canonical assertions.
- Rollback uses an explicit URL captured before promotion, and `finalize` keeps the run red after a rollback so a failed smoke cannot be read as success.
- The artifact upload runs with `if: always()`, so a red smoke still leaves a report to inspect.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Critical · `.github/workflows/deploy.yml:175-184` (first draft) | The pinned `vercel ls --prod --json` returns `{"deployments":[...],"pagination":{...}}`, not an array. Calling `rows.find(...)` on the object throws, so the deploy fails before promotion and no rollback target is captured. | **Accepted (fixed in this branch)**: parse `data.deployments` with an array fallback, require `state === 'READY'` and `target === 'production'`, and pin the shape with the `the pinned CLI returns an object with a deployments array` guard. Reproduction was read-only CLI output; no deployment was changed. |
| 2 | Important · `.github/workflows/deploy.yml:218-220` (first draft) | The drill wrote `BASE_URL` to `GITHUB_ENV` in an earlier step while the job-level `env` already defined `BASE_URL`; if job-level env wins, a drill would smoke the real `SITE_URL` instead of the given `base_url`. | **Accepted (fixed in this branch)**: removed the `GITHUB_ENV` override and added a dedicated drill smoke step with `BASE_URL: ${{ inputs.base_url }}` and `SIMULATE_FAILURE: ${{ inputs.simulate_failure }}`. The normal step still uses the job-level `BASE_URL: ${{ vars.SITE_URL }}`. Guard asserts the literal drill env. |
| 3 | Important · `.github/workflows/deploy.yml:261-267` (first draft) | The rollback selector wrote `PREVIOUS_URL` to `GITHUB_ENV` and then tested `$PREVIOUS_URL` in the same shell, where it is still unset, so every rollback would abort before calling the CLI. | **Accepted (fixed in this branch)**: assign a local shell variable first, check `-z "$PREVIOUS_URL"`, then export it to `GITHUB_ENV` for the CLI step. Guard asserts the empty-target check. |
| 4 | Important · `src/test/deploy-workflow.test.ts:199` (old guard) | The C2/C3 guard forbade the string `SITE_URL` anywhere in `deploy.yml`, while C4 must use `vars.SITE_URL` for smoke; leaving it unchanged makes the suite red for a required change. | **Accepted (fixed in this branch)**: keep the ban on `AUTH_SECRET`, `DIRECT_URL` and add a ban on `secrets.SITE_URL`, plus a positive assertion for `vars.SITE_URL`. This is an intentional guard narrowing, not a silent weakening. |
| 5 | Minor · `docs/DEPLOY.md:85` | The living prerequisites text still said `SITE_URL` lives only in Vercel, while smoke now reads it as a GitHub Environment variable. | **Accepted (fixed in this branch)**: document `gh variable set SITE_URL --env production` and keep `AUTH_SECRET` as the secret that stays only in Vercel. |
| 6 | Important · spec line 12 and plan Step 3 | The literal early wording said `BASE_URL=<new url>` for smoke, but spec decision 7 and the controller brief require the `SITE_URL` origin because canonical assertions compare against it. | **Rejected for this branch**: using the per-deployment URL would fail canonical on every deploy and roll back a healthy release. The brief and decision 7 win; `deployment_url` is retained only for traceability and rollback. |
| 7 | Important · brief Step 4 and owner decision | A real drill ("smoke co y fail") would perform a live rollback, and the live deploy is blocked because the GitHub Environment secret `DATABASE_URL` is empty. | **Rejected for this branch**: the controller owns live deploys, drills, Environment variables and reviewers. Repo-side wiring and docs only; the empty secret is a known live blocker, not a code defect. |
| 8 | Minor · `vercel ls --prod` | `--prod` is not shown in `ls --help` (which lists `--environment`), so a reader may think the workflow uses an unknown flag. | **Rejected for this branch**: the pinned CLI accepted `ls --prod --json` in a read-only check, and the brief requires this exact manual command. The documented manual command stays as required. |
| 9 | Minor · `.github/workflows/deploy.yml:231-239` | In a drill with `simulate_failure: true`, the smoke step exits before Playwright creates `playwright-report/`, so the artifact may contain only `test-results/` or warn about missing files. | **Rejected for this branch**: `actions/upload-artifact@v4` defaults to `warn` for missing paths and does not fail the job; a drill deliberately has no real report. Adding `if-no-files-found: ignore` would hide a genuine upload problem in a real deploy. |

## Declined to judge

- Live GitHub Actions execution of the `workflow_run` and `workflow_dispatch` paths: no run was triggered and Environment `production` is controller-owned.
- Whether `vercel rollback <url> --yes` succeeds against the real Vercel project: only `--help` was checked; no rollback was performed.
- Required reviewers on Environment `production`: not visible from the repo and not configured here.
- Whether the empty `DATABASE_URL` secret will be filled before the next deploy: controller-owned live blocker.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| HTML report exists and never opens a browser | `src/test/smoke-rollback.test.ts`, `generates a Playwright HTML report without opening a browser`; RED output was the missing `['html', { open: 'never' }]` | pass |
| Smoke runs on the SITE_URL origin after deploy | `smoke-rollback.test.ts`, `feeds SITE_URL through smoke into the canonical assertions`; `smoke` job `env.BASE_URL` parsed as `${{ vars.SITE_URL }}` | pass |
| Previous URL is captured before promotion | `smoke-rollback.test.ts`, `captures the previous production URL before promoting the new deployment` (order assertion plus `data.deployments`) | pass |
| Rollback runs on failure against the captured URL | `smoke-rollback.test.ts`, `rolls back to the captured deployment when the chain fails` | pass |
| Artifact survives a red smoke | `smoke-rollback.test.ts`, `smokes the production origin after deploy and uploads reports always` | pass |
| Finalize keeps the workflow red | `smoke-rollback.test.ts`, `leaves the workflow red when smoke failed even after a rollback` | pass |
| Drill is gated by Environment production and skips real deploy/migration | `smoke-rollback.test.ts`, `gates a dispatch drill behind the production environment`; YAML parse shows `environment: production` on smoke and rollback | pass |
| Application secrets remain in Vercel | `deploy-workflow.test.ts`, `keeps the remaining application secrets in Vercel instead of GitHub` | pass |
| RED verified before implementation | `npx vitest run src/test/smoke-rollback.test.ts` -> `7 failed (7)`; later finding assertions -> `3 failed (3)` before fixes | pass |
| Focused tests green | `npx vitest run src/test/smoke-rollback.test.ts src/test/deploy-workflow.test.ts` -> `19 passed (19)` | pass |
| Full check set green | captured output below: eight commands, all `EXIT=0`, `Tests 421 passed (421)` | pass |
| Language rule clean | `npm run check:language` `EXIT=0`; no disallowed letters in the pasted text after replacing U+0192 | pass |
| Live deploy, smoke and rollback drill | none: controller-owned; `DATABASE_URL` Environment secret is empty | lacking evidence |

## Verification output

Captured with Node `spawnSync` in UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`, after `next typegen` and `db:push` as in `ci.yml`. The Next.js route legend character U+0192 was replaced with `F` in the pasted text so the Vietnamese/English letter rule holds; box-drawing characters are non-letters and are kept verbatim. This is the run captured before inserting this file; the final post-insert run is recorded in the task report outside the repository.

```text
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


 Test Files  86 passed (86)
      Tests  421 passed (421)
   Start at  16:21:45
   Duration  76.11s (tests 57%, import 25%, environment 11%, transform 4%, setup 1%, worker 1%)

    Isolate  86 workers spawned · ~245ms startup each (spawn + environment, per file)
             at least ~20.81s faster with isolate: false — reuses workers across files instead of one per file
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
✓ Running next.config.ts took 275ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.5s
  Running TypeScript ...
  Finished TypeScript in 6.2s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24)
  Generating static pages using 7 workers (12/24)
  Generating static pages using 7 workers (18/24)
✓ Generating static pages using 7 workers (24/24) in 4.0s
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

$ npm.cmd run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs
EXIT=0
```

## Limitations

- No live deploy, smoke run, rollback or dispatch drill was executed: controller-owned, and the GitHub Environment secret `DATABASE_URL` is currently empty.
- No GitHub Environment variable `SITE_URL`, secret or required reviewer was created; the drill gate depends on controller configuration.
- Guard tests inspect YAML text and block structure, not a GitHub runner. A syntax parse and CLI help/output checks were added, but they do not replace a live run.
- Checks ran on Windows with SQLite, not `ubuntu-latest` against PostgreSQL.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 16:13:16 +07:00 - C4: smoke sau deploy, rollback va tai lieu khoi phuc`.
