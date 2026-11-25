# Code review - Production Environment guard and drill evidence (2026-11-25)

- **Skill:** `requesting-code-review`
- **Scope:** independent read-only review of the Environment protection and dispatch drill gate, then triage of its findings on the real source
- **Base:** `eeeb94d` | **Head:** `b511ab2` (reviewed commit; accepted fixes applied in this branch afterwards)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 16:00:04 +07:00 - Bảo vệ Environment production và gate drill bằng production-drill`.

## Method

Loaded `requesting-code-review` by its exact id before review. An independent read-only reviewer re-read the whole `.github/workflows/deploy.yml`, `docs/DEPLOY.md`, the three guard tests, and grepped consumers of `concurrency`, `environment` and `oldDeploymentId`; it did not mutate the checkout. I then re-read the whole files myself, grepped every consumer of the changed values, and ran the embedded Node parsers with real payloads through Vitest. The skill id is recorded here as required. No live GitHub Actions run existed at review time; the drill links remain a separate, owner-approved phase.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `.github/workflows/deploy.yml:42-46` (old run-level block) | A `workflow_dispatch` drill waits in `production-drill`; the run-level `concurrency: {group: production, cancel-in-progress: false}` keeps the production lock while waiting, so a later `workflow_run` deploy is queued behind the reviewer and can be cancelled by a third run. This defeats C6's requirement that normal deploys do not wait. | **Accepted (fixed in this branch):** lock moved to `migrate`, `deploy`, `smoke`, `rollback` at lines 119, 160, 254 and 334; `drill-approval` has no lock. Guard: test `serialises production state jobs without holding a lock during drill approval` plus a `js-yaml` parse of the workflow. |
| 2 | Minor · `.github/workflows/deploy.yml:421-428` (old POST parser) | If an actor changes the alias between the before GET and the POST, the POST response can name a different `oldDeploymentId`; the run is green while the pasted before/after evidence claims an untrue transition. | **Accepted (fixed in this branch):** before GET now has `id: before` and exports `deploymentId`; the POST parser compares it via `OLD_ID="${{ steps.before.outputs.deployment_id }}"` at line 452. Guard: test `requires oldDeploymentId in the rollback POST response` runs the exact script with missing and mismatched payloads. |
| 3 | Minor · `docs/DEPLOY.md:379` | The readiness row says "Output đầy đủ ở mục Drill bên dưới", but the Drill section is above the checklist. A reader looking below cannot find the API output. | **Accepted (fixed in this branch):** changed to "mục Drill ở trên"; guard: `documents the live environment rules and the API check` asserts the checklist has no "bên dưới". |
| 4 | Minor · `docs/DEPLOY.md:221` | "Job duy nhất có required reviewer" is globally false because `migration-approval` also has one; the pasted output also shows `can_admins_bypass: true` and `prevent_self_review: false`, so an admin can bypass and the sole reviewer can self-approve. | **Accepted (fixed in this branch):** wording scoped to "trong drill" and the break-glass settings documented explicitly as the owner's configuration. Guard: the same test asserts "trong drill" and the pasted API lines. |
| 5 | Minor · `docs/ARCHITECTURE.md:988-995` | Section 14.2 describes migration approval but not the new dispatch drill or `production-drill`, so architecture docs follow neither the new Environment nor the job-scoped lock. | **Accepted (fixed in this branch):** added the drill bullet at line 995; guard: the doc test requires `production-drill` in `docs/ARCHITECTURE.md`. |
| 6 | Minor · `.github/workflows/deploy.yml:372-392` (old before GET) | An empty `SITE_URL` produced a less precise failure here than in the smoke capture and POST steps, which both guard the alias host explicitly. | **Accepted (fixed in this branch):** added the same `[ -z "$alias_host" ]` guard to the before GET. |
| 7 | Minor · `.github/workflows/deploy.yml:70` (`environment: production-drill`) | `can_admins_bypass: true` and `prevent_self_review: false` mean the gate is not an independent review. | **Rejected:** these are live owner-configured Environment policies, not a workflow defect; changing them is a policy decision outside this approved PR. Documented in `docs/DEPLOY.md:221` and in AI_LOG limitations. |
| 8 | Minor · `docs/DEPLOY.md:237` | No drill run links or before/after alias output yet. | **Rejected:** owner chose "Merge PR trước, rồi drill" and the `production` branch policy requires `main`; the evidence is explicitly deferred to the second PR after merge. |

## Declined to judge

- Live Environment state beyond the pasted `gh api` output: reviewer had read-only access; owner-supplied API output was accepted as C6 evidence and rechecked verbatim in docs.
- Dispatch from a non-`main` ref: blocked intentionally by the `production` branch policy; drills are scheduled on `main` after merge.
- Pre-existing behavior where a failed CI `workflow_run` leaves this workflow green because deploy jobs are skipped: outside this diff and outside C4b/C6.
- Lint, typecheck, test, format and build results during the read-only review: not run there; full capture is attached below.
- A11y behavior: this branch changes no UI, so no accessibility criterion is introduced or closed here.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| A normal deploy is not blocked by the waiting drill reviewer | `npm test -- src/test/deploy-workflow.test.ts`, test `serialises production state jobs without holding a lock during drill approval`; `node check-yaml-concurrency.mjs` printed `top-level concurrency: null`, four job locks `{"group":"production","cancel-in-progress":false}`, `drill-approval null` | đạt/pass |
| An unapproved dispatch drill cannot finish green | tests `fails a dispatch drill whose approval gate never succeeded` in `environment-drill-guard.test.ts` and `leaves the workflow red when smoke failed even after a rollback` in `smoke-rollback.test.ts` | đạt/pass |
| Rollback response has `oldDeploymentId` and it matches the id the alias had before the POST | test `requires oldDeploymentId in the rollback POST response` executes the embedded parser with matching, missing and changed ids | đạt/pass |
| After GET proves the alias points to the requested id | test `verifies the deployment id that crosses from the alias REST response` executes the embedded parser | đạt/pass |
| Environment rules checked by API, not only docs | test `documents the live environment rules and the API check`; `environment-api-evidence.txt` with `EXIT=0` and both `gh api` commands pasted in `docs/DEPLOY.md:223-235` | đạt/pass |
| Full check set on the final source | capture below (`checks-environment-guard-final.txt`), including `npm run build` with `DATABASE_URL=file:./prisma/e2e.db` | đạt/pass |
| Two completed live drills with run links and alias output | no run yet; owner-approved phase two after merge | lacking evidence by design, deferred |

## Verification output

```text
NOTE=Ky hieu legend cua Next.js duoc thay bang F trong ban paste de tuan thu quy tac ngon ngu; khong co thay doi nao khac.
NOTE=npm run build chay voi DATABASE_URL=file:./prisma/e2e.db (SQLite local); cac lenh khac khong can bien nay. Capture sau khi sua cac finding cua review.

COMMAND=npm run lint

> ant-jewelry@0.1.0 lint
> eslint

EXIT=0

COMMAND=npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0

COMMAND=npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/calm-cactus


 Test Files  89 passed (89)
      Tests  454 passed (454)
   Start at  16:02:10
   Duration  52.95s (tests 44%, import 34%, environment 14%, transform 5%, setup 2%, worker 2%)

     Import  213 modules were evaluated 680 times · 10.16s total, 34% of tracked time
             ~6.98s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

COMMAND=npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

COMMAND=npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0

COMMAND=npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 206ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.3s
  Running TypeScript ...
  Finished TypeScript in 4.9s ...
  Collecting page data using 7 workers ...
prisma:error 
Invalid `prisma.product.findMany()` invocation:


The table `main.Product` does not exist in the current database.
prisma:error 
Invalid `prisma.blogPost.findMany()` invocation:


The table `main.BlogPost` does not exist in the current database.
prisma:error 
Invalid `prisma.category.findMany()` invocation:


The table `main.Category` does not exist in the current database.
  Generating static pages using 7 workers (0/24) ...
prisma:error 
Invalid `prisma.category.findMany()` invocation:


The table `main.Category` does not exist in the current database.
prisma:error 
Invalid `prisma.setting.findFirst()` invocation:


The table `main.Setting` does not exist in the current database.
prisma:error 
Invalid `prisma.blogPost.findFirst()` invocation:


The table `main.BlogPost` does not exist in the current database.
prisma:error 
Invalid `prisma.category.findFirst()` invocation:


The table `main.Category` does not exist in the current database.
prisma:error 
Invalid `prisma.blogPost.findMany()` invocation:


The table `main.BlogPost` does not exist in the current database.
prisma:error 
Invalid `prisma.product.findFirst()` invocation:


The table `main.Product` does not exist in the current database.
prisma:error 
Invalid `prisma.heroSlide.findMany()` invocation:


The table `main.HeroSlide` does not exist in the current database.
prisma:error 
Invalid `prisma.blogPost.findMany()` invocation:


The table `main.BlogPost` does not exist in the current database.
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
prisma:error 
Invalid `prisma.product.findMany()` invocation:


The table `main.Product` does not exist in the current database.
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
```

## Limitations

- Two live drills, their timestamps, alias window and run links are still pending merge; this record does not claim they happened.
- The agent has no Vercel credentials locally, so alias GET output will come from GitHub Actions logs, not a local API call.
- No PostgreSQL production access, so migration status was not checked against the production database.
- `production-drill` currently allows admin bypass and self-review; this record reports that fact and does not claim independent review.
- The verification output below was captured after the workflow, tests and AI_LOG edits; the only later documentation change was pasting that same output into this section, followed by a clean `npm run format:check` and `npm run check:language` on the final tree.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 16:00:04 +07:00 - Bảo vệ Environment production và gate drill bằng production-drill`.
