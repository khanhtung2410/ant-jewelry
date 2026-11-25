# Code review - Live alias rollback drill evidence (2026-11-25)

- **Skill:** `requesting-code-review`
- **Scope:** read-only review of the documentation commit that records four live GitHub Actions runs and Vercel alias GET/POST evidence, then triage of every finding against the real source before the follow-up PR
- **Base:** `e12662e3ba50e00c1f28ee5ea1b2141704ac2186` | **Head:** `2c131bd168cefd7644f9b5c87b58147831bfbc21`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 16:42:28 +07:00 - Ghi bằng chứng drill rollback alias thật vào DEPLOY.md`.

## Method

Loaded `requesting-code-review` by its exact id before requesting the review. An independent read-only reviewer read the whole `docs/DEPLOY.md` at HEAD, inspected `git diff e12662e..2c131bd`, rebuilt all 22 pasted evidence lines from the raw captures in the temporary directory, and grepped the repo for the two `dpl_` ids, four run ids and the old placeholder; it did not mutate this checkout. After the report I re-read the whole `docs/DEPLOY.md`, `AI_LOG.md` and `docs/reviews/TEMPLATE.md`, grepped every changed value and its consumers, and re-fetched the drill 1 job conclusions and the four run timestamps from the GitHub API before accepting the findings. No drill was re-run in this round; the review compares documentation with evidence already captured from `main`.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `docs/DEPLOY.md:253` (before fix) | The discovery GET pasted `"projectId":"prj_KP5xOPzi47p4b5JAGQO8TgqSmQpZ"` in clear text, unlike every other pasted GET where the field was `***`, while `docs/DEPLOY.md:82` treats `VERCEL_PROJECT_ID` as a secret. Reproduce: compare the old line 253 with old line 259, or raw `drill-discovery.txt:40` with raw `drill1-current.txt:92`. | **Accepted (fixed in this PR)**: replaced with `"projectId":"***"` and added one note at line 239 that `***` is editorial redaction, not a value returned by GitHub masking. |
| 2 | Important · `AI_LOG.md:36-42` (before fix) | `git diff e12662e..2c131bd --stat` changed only `docs/DEPLOY.md`; the top AI_LOG entry still said the two live drills had not run. Reproduce: read old `AI_LOG.md:38` next to the new Drill section. | **Accepted (fixed in this PR)**: prepended a new entry with the verbatim prompt, self-verification, accepted/rejected findings, mistakes and limitations; verified the previous `##` header still follows the new `---` at `AI_LOG.md:48`. |
| 3 | Minor · `docs/DEPLOY.md:294` (before fix) | "Trong các run này" could include discovery, which ran with `simulate_failure=false` and concluded `success`; it would falsely attribute red smoke to that run. Reproduce: compare old line 243 with old line 294 and raw `drill-discovery.txt:2,8`. | **Accepted (fixed in this PR)**: now `docs/DEPLOY.md:300` limits the claim to the three runs with `simulate_failure=true` and states discovery stayed green. |
| 4 | Minor · `docs/DEPLOY.md:243-246` (before fix) | The time column mixed local dispatch times, watcher finish times and the GitHub run `updatedAt`, so the numbers did not all reconcile with the linked runs. Reproduce: compare the old table with raw `drill-discovery.txt:8,43` and the other three watch files. | **Accepted (fixed in this PR)**: fetched `created_at` / `updated_at` of all four runs from `gh api repos/khanhtung2410/ant-jewelry/actions/runs/<id>` and rewrote the table plus the source note at `docs/DEPLOY.md:239`. |
| 5 | Minor · `docs/DEPLOY.md:244,294` (before fix) | Drill 1 claimed `rollback success` but its raw capture lacked a job conclusion line, unlike drill 2 and restore. Reproduce: grep `drill1-current.txt` for `"name":"rollback"` (no match), then compare with `drill2-previous-watch.txt:10`. | **Accepted (fixed in this PR)**: called `gh api .../runs/45585112647/jobs`, captured `{"completed_at":"2026-11-25T09:25:57Z","conclusion":"success","name":"rollback","started_at":"2026-11-25T09:25:46Z"}` and pasted it at `docs/DEPLOY.md:274-278`. |
| 6 | Minor · `docs/DEPLOY.md:444` (before fix) | "mục Drill ở trên" became ambiguous once a second Drill subsection was added; the environment API output lives only in the first one. Reproduce: read old lines 219-235, 237-302 and 444. | **Accepted (fixed in this PR)**: changed to `mục \`Drill: smoke fail co y\` ở trên` at `docs/DEPLOY.md:450`. |

No finding was rejected. The reviewer set six additional behaviors aside; they are listed below rather than silently dropped.

## Declined to judge

- Smoke during the 2 minute 22 second old-alias window: outside the three owner requirements, which asked for the alias change and restoration; the GET before/after is the requested evidence.
- Independent proof that `dpl_HRwW7LA6RqDKRTcwwZGKGrRZB9f3` is the immediately previous deployment in Vercel ordering: the owner supplied it and no deployment-list capture exists, so the reviewer set it aside instead of calling it an error.
- Reviewer identity for drill 2 and restore: watch files prove `drill-approval` success but not the login; the Environment has one configured reviewer, so there is no concrete contradiction.
- Per-test smoke names omitted from the pasted summaries: raw files confirm 8 passed and `EXIT=0`, and the plan asked for green manual smoke, not the full report.
- A new readiness-checklist row for drill evidence: outside the plan; the requested Drill section already exists.
- Full check-set output and PR body capture: controller responsibility for this commit, not part of the reviewed diff.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Drill 1 used `simulate_failure=true` with the current deployment id | Run `45585112647` plus POST and GET lines at `docs/DEPLOY.md:256-264`, matched to raw `drill1-current.txt` | đạt/pass |
| Drill 1 `rollback` green, response has `oldDeploymentId`, alias unchanged, manual smoke green | `gh api .../runs/45585112647/jobs` output pasted at `docs/DEPLOY.md:274-278`; POST at line 261; GET before/after at lines 259 and 262; `manual-smoke-after-drill1.txt` 8 passed, `EXIT=0` at `docs/DEPLOY.md:267-272` | đạt/pass |
| Drill 2 pointed at the previous deployment and really changed the alias, then the alias was restored | Runs `45585601527` and `45586030821`; GET before/after at lines 283/286 and 293/296; raw `drill2-previous-watch.txt` and `drill2-restore-watch.txt` | đạt/pass |
| Two drill run links, GET before/after, run times and old-version window recorded in the Drill section | `docs/DEPLOY.md:237-300`; window arithmetic `1795599119062 - 1795598976980 = 142082` ms | đạt/pass |
| Environment configuration checked by API, not only docs | `environment-api-evidence.txt` with `branch_policy` for `production` and `required_reviewers` for `production-drill`, as described at `docs/DEPLOY.md:450` | đạt/pass |
| Fresh full check set on the final tree | `checks-drill-evidence-final-pr.txt`, produced by Node `spawnSync` with `encoding: 'utf8'`, `NO_COLOR: '1'` and `DATABASE_URL=file:./prisma/e2e.db` for build | đạt/pass |
| Only Vietnamese and English letters in written output | `npm run check:language` inside the same capture, `EXIT=0`; Next.js legend replaced by `F` in the PR-safe paste | đạt/pass |

## Verification output

```text
NOTE=Ky hieu legend cua Next.js duoc thay bang F trong ban paste de tuan thu quy tac ngon ngu; khong co thay doi nao khac.
NOTE=npm run build chay voi DATABASE_URL=file:./prisma/e2e.db (SQLite local); cac lenh khac khong can bien nay.
NOTE=Full check set after accepted review fixes, AI_LOG entry and review record, DATABASE_URL=file:./prisma/e2e.db for build.

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
   Start at  16:44:27
   Duration  65.38s (tests 50%, import 29%, environment 13%, transform 5%, setup 2%, worker 1%)

     Import  213 modules were evaluated 680 times · 11.00s total, 29% of tracked time
             ~7.55s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 201ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 2.7s
  Running TypeScript ...
  Finished TypeScript in 4.6s ...
  Collecting page data using 7 workers ...
prisma:error 
Invalid `prisma.category.findMany()` invocation:


The table `main.Category` does not exist in the current database.
prisma:error 
Invalid `prisma.blogPost.findMany()` invocation:


The table `main.BlogPost` does not exist in the current database.
prisma:error 
Invalid `prisma.product.findMany()` invocation:


The table `main.Product` does not exist in the current database.
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

- The live drill runs were executed before this documentation round; this review did not replay them and cannot prove that Vercel ordering made `dpl_HRwW7LA6RqDKRTcwwZGKGrRZB9f3` the immediately previous deployment.
- No local Vercel credentials, so alias GET output comes only from GitHub Actions logs captured in the four runs.
- No PostgreSQL production credentials, so `db:migrate:status:production` was not run.
- No Figma source in the repo, so no pixel comparison was made.
- `production-drill` still permits admin bypass and self-review under the owner's policy; this round records that fact without changing it.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 16:42:28 +07:00 - Ghi bằng chứng drill rollback alias thật vào DEPLOY.md`.
