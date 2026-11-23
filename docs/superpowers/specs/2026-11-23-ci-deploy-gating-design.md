# Design: gate production deploy on CI and separate migrations

## Intent

Today CI and deploy are decoupled in an unsafe way. `.github/workflows/npm-ci.yml` runs only lint, typecheck and E2E; it omits `npm test`, `format:check` and `check:language`. `vercel.json` enables Git integration for `main`, so every push deploys without waiting for CI. `build:production` calls `scripts/migrate-production.mjs`, so a Vercel Production build applies database migrations before `next build`. A red commit can therefore reach Production and change the database schema at the same time. The owner wants only CI-green code to be deployable, migrations to be a controlled step, and a post-deploy check with a rollback path.

## Goals

- C1: one CI workflow named `ci.yml` with separate jobs for lint/typecheck/format:check/check:language, `npm test`, `npm run build`, and `test:e2e`; npm cache plus Playwright browser cache; branch protection on `main` requiring a PR and the named jobs, with no direct push.
- C2: turn off Vercel Git auto-deploy, deploy from GitHub Actions with Vercel CLI using `vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`; tokens live in a GitHub Environment named `production`, not at repo level; concurrent deploys are prevented.
- C3: remove migration from `build:production`; add a migration job before deploy that runs `prisma migrate status`, pauses for approval when a new migration is pending, then applies with `DIRECT_URL`. The PR must explain why migration runs first and why migrations must be backward compatible so rollback cannot corrupt data.
- C4: after deploy run `BASE_URL=<new url> npm run test:smoke:production`; on failure roll back to the previous production deployment and leave the workflow red; upload the Playwright report as an artifact; document the whole flow and manual rollback in `docs/DEPLOY.md`.
- C5 (optional): PR preview deploys with a separate preview database, PR comment and teardown, only after proving Preview cannot write to the Production database.

## Non-goals

- No change to application runtime behaviour, schema, or seed scripts.
- No change to the local/SQLite test workflow.
- No re-enabling of Vercel Git deployments in any form.
- No automatic schema rollback: rolling back code must not require reversing a migration.

## Constraints

- One numbered PR per item, in order C1, C2, C3, C4, then C5 only if approved. Each starts from the latest `origin/main` on its own branch.
- Every PR follows the standing agreement in `AGENTS.md`: full check set with complete stdout/stderr and `EXIT=` lines in the PR body, review record using a concrete skill id, AI_LOG entry, Conventional Commits title, `gh` PR link in the final answer.
- Spec and plan live under `docs/superpowers/` using the existing `docs/superpowers/specs/` and `docs/superpowers/plans/` layout.
- Only Vietnamese and English letters in written text; check with `npm run check:language`.
- External configuration (branch protection, GitHub Environment secrets and required reviewers) is not stored in the repo and needs owner action or owner-approved API calls.

## Approaches considered

- **A - one PR per item, sequential (chosen).** Matches the owner's instruction. C1 makes CI trustworthy before any deploy gate exists; C2 removes the unsafe Git deploy; C3 removes the hidden schema change; C4 closes the loop with smoke and rollback. Each step is independently reviewable and revertible. Cost: five review cycles and five sets of evidence.
- **B - one large PR for C1-C4.** Fewer reviews, but mixes workflow, Vercel configuration, migration policy and rollback into one diff; a single failure blocks everything and the evidence cannot be attributed to a specific control. Rejected.
- **C - keep Vercel Git integration and gate it with deployment protection / required CI check.** Fewer workflow files, but Vercel still owns the trigger and the owner explicitly asked for deploy from GitHub Actions with rollback control. Rejected.
- **D - keep migration inside `build:production` but guard it with an environment variable.** Simpler, but a build-time schema change remains implicit and unreviewable, which is the core defect. Rejected.

## Decisions and important corrections to the literal brief

1. **`needs` cannot cross workflows.** GitHub Actions `needs` only works between jobs in the same workflow. The literal C2 wording ("deploy.yml chạy khi push vào main, needs các job của C1") is not valid. Chosen equivalent: `ci.yml` keeps `push` and `pull_request`; `deploy.yml` uses `on: workflow_run` with `workflows: [ci]`, `types: [completed]`, `branches: [main]`, plus a guard job that requires `github.event.workflow_run.conclusion == 'success'` and verifies the run's head SHA equals the current `main` SHA. This prevents deploying a stale commit when a newer push lands while CI is running.
2. **Required reviewers pause before a job, not in the middle.** A GitHub Environment with required reviewers cannot stop a running job when it discovers a pending migration. Chosen shape: a `check-migrations` job computes `pending`; an `approval` job with `environment: migration-approval` (required reviewers configured outside the repo) `if: pending == 'true'`; then `migrate` applies the migration; then `deploy`. The `production` environment holds the Vercel tokens for deploy, smoke and rollback. **Owner decision:** do not reintroduce `DIRECT_URL`; the migration job uses `DATABASE_URL` set to the direct `db.prisma.io` connection, so no schema, config, `.env.example`, or four-file doc change is needed.
3. **C5 is deferred by my call.** It needs a separate database, extra secrets and teardown automation, and the owner marked it optional. It will appear as a "future work" section in the plan, not as a numbered task, unless the owner asks for it.
4. **Vercel CLI version.** The CLI is not installed locally. Pin a version as a dev dependency or in the workflow (`npx vercel@<pinned>`) so CI and local checks agree; decide in C2 implementation and record the choice.
5. **Previous deployment for rollback.** `vercel rollback` without an explicit target is documented to roll back to the previous deployment. C4 must verify this against the pinned CLI version and, if ambiguous, capture the previous deployment URL before deploying and pass it explicitly.
6. **Application env stays in Vercel (my call).** `vercel pull --environment=production` supplies `DATABASE_URL`, `AUTH_SECRET` and `SITE_URL` to the build/deploy. The GitHub `production` Environment holds only `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and the migration database URL if a separate direct connection is chosen. Mirroring every app variable into GitHub would duplicate secrets and create drift; no need for it.
7. **Smoke targets the production origin, not the per-deployment URL (my call).** `e2e/production.smoke.spec.ts` asserts `canonical === BASE_URL + path`, and canonical comes from `SITE_URL` (currently `https://ant-jewelry.vercel.app`). Pointing smoke at a `*.vercel.app` deployment URL would fail canonical on every deploy and roll back a healthy release. C4 therefore runs smoke against the `SITE_URL` origin, and captures the deployment URL/id separately for rollback. `vercel deploy --prebuilt --prod` promotes the alias immediately, so smoke is necessarily post-promotion; the rollback path is part of the control, not an afterthought.
8. **Exact workflow and job names (my call).** The workflow `name:` must be literally `ci` (the `workflow_run.workflows` filter matches the name, not the filename). C1 produces four jobs: `static` (lint, typecheck, format:check, check:language in one checkout), `test`, `build`, `e2e`. These four are the exact required status checks the owner registers in branch protection. Four separate lint/typecheck jobs would add three extra checkouts and three extra required checks for no safety gain.
9. **Smoke artifact (my call).** `playwright.production.config.ts` currently uses only the `list` reporter, so no report directory exists. C4 adds an `html` reporter (`open: 'never'`) to that config and uploads `playwright-report/` plus `test-results/`.
10. **Snapshot before migration (my call).** `docs/DEPLOY.md` requires a snapshot/PITR checkpoint before each migration. Automating provider snapshots needs credentials this workflow does not have, so the migration job prints the current commit SHA and a reminder, and the required reviewer must confirm a checkpoint exists before approving. C3 documents this as a manual gate, not a fake automated step.

## Owner decisions

1. **DIRECT_URL: keep the direct connection in `DATABASE_URL`.** The repo deliberately removed `directUrl = env("DIRECT_URL")` from `prisma/postgresql/schema.prisma` because a missing value broke Vercel builds; `prisma.postgresql.config.ts` now uses only `DATABASE_URL`, and `docs/DEPLOY.md:97` already says to run migrations with `DATABASE_URL` set to the direct `db.prisma.io` string. No schema, config, `.env.example` or four-file doc change is in scope.
2. **Live actions: I perform them once credentials are supplied.** The owner chose that I apply branch protection, GitHub Environment secrets and required reviewers with `gh api`, and run the real deploy/smoke/rollback checks. Credentials are not yet available: I must request `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (and the direct database URL where needed) before those live tasks. Until then I can only produce repo-side configuration and local verification; I will not invent run links or screenshots.

## Evidence and access limits

The owner asked for concrete proof: a branch protection screenshot, a deliberately failing PR with Merge locked, an Actions run showing CI to deploy, a Vercel dashboard without Git deployments, `migrate status` output, a migration paused at approval, and a smoke-failure rollback run. I can produce the repository-side configuration and the code, and I can verify the workflows syntactically and via local checks. I cannot create screenshots of GitHub or Vercel settings, set Vercel secrets, or trigger real production deploys/rollbacks without credentials and owner action. The plan will state exactly which evidence each PR can produce locally and which items the owner must capture. If the owner supplies `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` and authorizes the calls, I can also apply branch protection and Environment settings with `gh api` and run the live checks.

## What is left to the builder

- Write the implementation plan with one task group per PR in the order above, each with RED/guard tests where the behaviour is testable and a complete verification step.
- Get design approval before implementation.
- Do not start C2 until C1 is merged; do not start C3 until C2 is merged; and so on.
