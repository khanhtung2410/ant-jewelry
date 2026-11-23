# CI Deploy Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make only CI-green code deployable, move production migration into a controlled approved step, and add post-deploy smoke with rollback.

**Architecture:** Four sequential PRs from fresh `origin/main` branches. C1 renames and completes CI, then branch protection is applied with `gh api`. C2 disables Vercel Git integration and adds a `workflow_run`-gated CLI deploy. C3 removes migration from the build and adds a status/approval/apply chain before deploy. C4 adds smoke against the production origin, rollback on failure, artifact upload and DEPLOY.md documentation. C5 stays future work.

**Tech Stack:** GitHub Actions YAML, `gh` CLI, Vercel CLI (pinned `npx vercel@66.6.0`), Prisma 7, Vitest + Node `fs` guard tests, Playwright smoke suite.

**Spec:** `docs/superpowers/specs/2026-11-23-ci-deploy-gating-design.md`

## Global Constraints

- Pull latest `origin/main` first and create a new branch for each PR; never stack the four PRs on one branch.
- Do not start C2 before C1 is merged, C3 before C2, C4 before C3.
- The workflow `name:` must be exactly `ci`; required status check names are exactly `static`, `test`, `build`, `e2e`.
- Use `DATABASE_URL` as the direct `db.prisma.io` string for migrations; do not reintroduce `DIRECT_URL`.
- GitHub Environment `production` holds `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and `MIGRATION_DATABASE_URL`; `SITE_URL` is an Environment variable there. App env stays in Vercel and is pulled with `vercel pull --environment=production`.
- Live external writes (branch protection, Environment secrets/reviewers, real deploy and rollback) require owner-supplied credentials and explicit authorization. Request them; never fabricate run links, screenshots or "pass" claims.
- Every PR body carries the complete stdout/stderr of the full check set with `EXIT=` lines, captured via Node `spawnSync` in UTF-8 with `NO_COLOR=1`.
- Every PR adds an `AI_LOG.md` entry and a review record using a concrete skill id, and ends with a `gh` PR link in the final answer.
- Only Vietnamese and English letters in written text; `npm run check:language` must be clean.

## Review Focus

- A push to `main` with red `npm test` must not deploy -> C1 guard test pins `test` as a job and C2 pins `workflow_run` conclusion gating; C1 branch protection GET pins the four required contexts.
- A PR run of CI triggering a production deploy -> C1 restricts `push` to `main`; C2 guard test asserts `branches: [main]` on `workflow_run`.
- A deploy started while a newer commit is still in CI -> C2 guard job compares the triggering run's head SHA with current `main` SHA.
- A build that silently applies a pending migration -> C3 guard test asserts `build:production` contains no migration command and C3 unit test pins pending-detection on real `migrate status` output.
- A smoke failure that leaves broken code live or an artifact step that uploads nothing -> C4 guard test pins rollback + `if: always()` artifact and the html reporter in `playwright.production.config.ts`.

---

### Task 1 (PR C1): Complete CI, rename to ci.yml, enforce branch protection

**Files:**
- Rename: `.github/workflows/npm-ci.yml` -> `.github/workflows/ci.yml`
- Modify: `docs/PERFORMANCE.md:132`, `docs/DEPLOY.md` checklist row referencing the old workflow
- Create: `src/test/ci-workflow.test.ts`
- Modify: `AI_LOG.md`, create `docs/reviews/2026-11-23-requesting-code-review-c1.md`

**Interfaces:**
- Consumes: existing workflow steps (`npm ci`, `npm run db:generate`, `npx next typegen`, Playwright install), existing check scripts in `package.json`.
- Produces: four required status check contexts `static`, `test`, `build`, `e2e`; workflow name `ci`; exact commands `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run check:language`, `npm test`, `npm run build`, `npm run test:e2e`.

- [ ] **Step 1: Write the failing guard test**

Create `src/test/ci-workflow.test.ts` using `readFileSync` on `process.cwd()`. Assert: `.github/workflows/ci.yml` exists and `.github/workflows/npm-ci.yml` does not; content contains `name: ci`, `push:` with `branches: [main]`, `pull_request:`, job keys `static:`, `test:`, `build:`, `e2e:`; each of the seven exact command strings above; `actions/cache@v4` with `ms-playwright` in the `e2e` job; and no `npm run build:production` in any job.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/test/ci-workflow.test.ts`
Expected: FAIL because `ci.yml` does not exist.

- [ ] **Step 3: Rename and rewrite the workflow**

`git mv .github/workflows/npm-ci.yml .github/workflows/ci.yml`. Set `name: ci`, `on: push: branches: [main]` plus `pull_request:`. Keep one shared env `DATABASE_URL: file:./prisma/dev.db`. Jobs:
- `static`: checkout, setup-node 22 with `cache: npm`, `npm ci`, `npm run db:generate`, `npx --no-install next typegen`, then lint, typecheck, format:check, check:language.
- `test`: same install steps, then `npm test`.
- `build`: same install steps, then `npm run build`.
- `e2e`: same install steps, `actions/cache@v4` for `~/.cache/ms-playwright` keyed by `hashFiles('package-lock.json')`, `npx playwright install --with-deps chromium`, `npm run test:e2e`, upload `playwright-report/` and `test-results/` with `if: failure()`.

- [ ] **Step 4: Run the guard test and full check set**

Run: `npm test -- src/test/ci-workflow.test.ts` (PASS), then the full check set via the spawnSync capture script. Expected: all six commands `EXIT=0`.

- [ ] **Step 5: Apply branch protection with gh api**

Run `gh api PUT repos/khanhtung2410/ant-jewelry/branches/main/protection` with `required_pull_request_reviews`, `required_status_checks.strict=true` and contexts `["static","test","build","e2e"]`, `enforce_admins=true`, `restrictions=null`. Verify with `gh api GET .../protection`. Save both outputs as evidence. Note in the PR that the owner must capture the UI screenshot.

- [ ] **Step 6: Update docs, AI_LOG, review, commit and open PR**

Update references to the old filename. Prepend the AI_LOG entry and save the review file with exact skill id `requesting-code-review`. Commit with `ci: complete checks and gate main on required jobs`, push, open PR with full output, and give the link.

### Task 2 (PR C2): Deploy from Actions after CI, disable Vercel Git deploy

**Files:**
- Modify: `vercel.json`
- Create: `.github/workflows/deploy.yml`
- Create: `src/test/deploy-workflow.test.ts`
- Modify: `docs/DEPLOY.md` (deployment sequence and A3 note), `docs/ARCHITECTURE.md` Vercel build line
- Modify: `AI_LOG.md`, create `docs/reviews/2026-11-23-requesting-code-review-c2.md`

**Interfaces:**
- Consumes: C1 workflow name `ci` and check contexts `static`, `test`, `build`, `e2e`.
- Produces: workflow `deploy.yml` with jobs `verify-ci`, `deploy`; job output `deploy.deployment_url`; Environment `production` with three Vercel token secrets.

- [ ] **Step 1: Write the failing guard test**

Create `src/test/deploy-workflow.test.ts`. Assert: `vercel.json` parses and has `git.deploymentEnabled === false` while keeping `buildCommand: "npm run build:production"`; `deploy.yml` contains `workflow_run:`, `workflows: [ci]`, `types: [completed]`, `branches: [main]`, `conclusion == 'success'`, `concurrency: production`, `environment: production`, the three commands `vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`, and `${{ secrets.VERCEL_TOKEN }}`, `${{ secrets.VERCEL_ORG_ID }}`, `${{ secrets.VERCEL_PROJECT_ID }}`. Assert it does **not** contain `needs:` (cross-workflow `needs` is invalid).

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/test/deploy-workflow.test.ts`
Expected: FAIL because `deploy.yml` does not exist and `deploymentEnabled` is not false.

- [ ] **Step 3: Change vercel.json and create deploy.yml**

Set `"git": { "deploymentEnabled": false }`, keeping `buildCommand`. In `deploy.yml` set `on: workflow_run` as above; `verify-ci` job checks `github.event.workflow_run.conclusion == 'success'` and compares `github.event.workflow_run.head_sha` to the current `main` SHA (fail if different). `deploy` job: `needs: verify-ci`, `environment: production`, `concurrency: production`, `cancel-in-progress: false`; checkout the verified SHA; setup-node 22 with npm cache; `npm ci`; run the three Vercel commands with `npx --yes vercel@66.6.0`, passing tokens from secrets; expose the deployment URL as a job output.

- [ ] **Step 4: Request credentials and configure the Environment**

Ask the owner for `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Set them as Environment secrets with `gh secret set --env production`, then verify names with `gh api repos/.../environments/production/secrets`. Do not guess or reuse values. If credentials are not supplied, record this step as blocked and keep the PR repo-side only.

- [ ] **Step 5: Run guard test and full check set**

Run `npm test -- src/test/deploy-workflow.test.ts` (PASS) and the full check set with the spawnSync capture described in Global Constraints. All six `EXIT=0`.

- [ ] **Step 6: Docs, AI_LOG, review, commit and open PR**

Document that Git integration is off and deploys come from Actions. Commit `ci: deploy production from GitHub Actions after CI`, push, open PR with full output and link.

### Task 3 (PR C3): Separate migration from build and gate it on approval

**Files:**
- Modify: `package.json` (`build:production`)
- Delete: `scripts/migrate-production.mjs` (after `grep` confirms no other consumer)
- Create: `scripts/detect-pending-migrations.mjs`, `src/test/detect-pending-migrations.test.ts` (Vitest only includes `src/**`)
- Modify: `.github/workflows/deploy.yml` (add `check-migrations`, `approval`, `migrate` jobs)
- Modify: `docs/DEPLOY.md`, `README.md:266`, `docs/ARCHITECTURE.md:992`
- Modify: `AI_LOG.md`, create `docs/reviews/2026-11-23-requesting-code-review-c3.md`

**Interfaces:**
- Consumes: C2 `deploy` job; Environment `production` secret `MIGRATION_DATABASE_URL` (direct connection).
- Produces: `check-migrations` output `pending`; job `migrate` that must succeed before `deploy`; Environment `migration-approval` with required reviewers.

- [ ] **Step 1: Write the failing unit test for pending detection**

Create `scripts/detect-pending-migrations.mjs` exporting `hasPendingMigrations(output: string): boolean` plus a CLI wrapper that runs `npm run db:migrate:status:production` and prints `true`/`false`. Create `src/test/detect-pending-migrations.test.ts` importing from `../../scripts/detect-pending-migrations.mjs` with cases: real Prisma phrase `Following migration have not yet been applied:` -> true; `Database schema is up to date` -> false; `No pending migrations` -> false; empty output -> false (fail closed only on command error, handled in the CLI).

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/test/detect-pending-migrations.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement detection and remove migration from the build**

Implement `hasPendingMigrations` as a string check. Change `build:production` to `npm run db:generate:production && next build`. Grep `migrate-production` across the repo; delete the script only when no consumer remains.

- [ ] **Step 4: Verify the unit test and full check set**

Run the focused test (PASS), then the full check set with the spawnSync capture described in Global Constraints. All six `EXIT=0`.

- [ ] **Step 5: Extend deploy.yml**

Add `check-migrations` (after `verify-ci`, Environment `production`, `DATABASE_URL: ${{ secrets.MIGRATION_DATABASE_URL }}`) that runs the CLI wrapper and sets `pending`. Add `approval` job `if: needs.check-migrations.outputs.pending == 'true'` with `environment: migration-approval`. Add `migrate` job `if: always() && (needs.approval.result == 'success' || needs.approval.result == 'skipped')`, `needs: [check-migrations, approval]`, that prints the commit SHA and the snapshot reminder, then runs `npm run db:migrate:production` with the direct URL. Make `deploy` depend on `migrate`.

- [ ] **Step 6: Configure the approval environment**

Ask the owner for the reviewer list, create Environment `migration-approval` with required reviewers via `gh api`, and set `MIGRATION_DATABASE_URL` in Environment `production`. Save API output. If unavailable, mark blocked; do not claim the approval gate is live.

- [ ] **Step 7: Guard test, docs, PR**

Extend `src/test/deploy-workflow.test.ts` with assertions that `deploy.yml` has `migration-approval`, `db:migrate:status:production`, `db:migrate:production`, and that `package.json` `build:production` has no `migrate` token. Rewrite the migration section of `docs/DEPLOY.md` and document why migration precedes deploy and why migrations must be backward compatible so a code rollback cannot corrupt data. Commit `ci: separate migration from production build`, push, open PR with full output and link.

### Task 4 (PR C4): Smoke after deploy, rollback on failure, documented recovery

**Files:**
- Modify: `playwright.production.config.ts`
- Modify: `.github/workflows/deploy.yml` (`deploy` outputs, `smoke`, `rollback`, `finalize` jobs)
- Create: `src/test/smoke-rollback.test.ts`
- Modify: `docs/DEPLOY.md` new section "Deploy & rollback"
- Modify: `AI_LOG.md`, create `docs/reviews/2026-11-23-requesting-code-review-c4.md`

**Interfaces:**
- Consumes: C2 `deploy.deployment_url`; Environment variable `SITE_URL`; `npm run test:smoke:production`.
- Produces: `smoke` result used by `rollback` and `finalize`; artifact `playwright-report-smoke`.

- [ ] **Step 1: Write the failing guard test**

Create `src/test/smoke-rollback.test.ts`. Assert: `playwright.production.config.ts` contains `html` and `open: 'never'`; `deploy.yml` contains a `smoke` job with `BASE_URL: ${{ vars.SITE_URL }}` and `npm run test:smoke:production`, a `rollback` job with `if: failure()` and `vercel rollback`, an `upload-artifact@v4` step with `if: always()` and `playwright-report/`, and a `finalize` job named `finalize` that fails when smoke failed. Assert smoke does not use `needs.deploy.outputs.deployment_url` as `BASE_URL`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/test/smoke-rollback.test.ts`
Expected: FAIL because the config and jobs are missing.

- [ ] **Step 3: Add the html reporter and smoke jobs**

Add `['html', { open: 'never' }]` to the existing `list` reporter. In `deploy.yml`: before deploy, capture the current production URL into output `previous_url`; after deploy set `deployment_url`. `smoke` needs `deploy`, runs with `BASE_URL: ${{ vars.SITE_URL }}`, uploads `playwright-report/` and `test-results/` with `if: always()` and name `playwright-report-smoke`. `rollback` needs `[deploy, smoke]`, `if: failure()`, runs `npx --yes vercel@66.6.0 rollback <previous_url> --yes` using the captured value. `finalize` needs `[smoke, rollback]`, `if: always()`, fails if `needs.smoke.result != 'success'`.

- [ ] **Step 4: Add a drill trigger**

Add `workflow_dispatch` inputs `base_url`, `previous_deployment_url` and `simulate_failure`. In drill mode skip deploy, run smoke against the given `base_url`, and roll back only the given `previous_deployment_url`, gated by Environment `production` approval. This is the owner's requested "smoke co y fail" rehearsal; it must never be run without the owner present.

- [ ] **Step 5: Run guard test and full check set**

Run `npm test -- src/test/smoke-rollback.test.ts` (PASS), then the full check set with the spawnSync capture described in Global Constraints. All six `EXIT=0`.

- [ ] **Step 6: Document and open PR**

Add "Deploy & rollback" to `docs/DEPLOY.md`: full chain, what triggers rollback, how to inspect the artifact, and manual rollback commands (`vercel ls --prod`, `vercel rollback <url>`). Commit `ci: smoke and rollback production deploys`, push, open PR with full output and link.

## Future work (C5, not numbered)

PR preview deploys with a separate database, PR comment and teardown. Condition: prove Preview `DATABASE_URL` differs from Production with configuration evidence before enabling. Only start after C4 is merged and the owner explicitly asks.

## Execution note

Live verification for C1-C4 (branch protection API output, Actions run links, Vercel dashboard, migration approval pause, rollback drill) depends on credentials and merge order. Request them at the start of the relevant task; record blocks honestly instead of inventing evidence.
