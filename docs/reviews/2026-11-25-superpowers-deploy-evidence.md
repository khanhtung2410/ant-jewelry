# Code review - deploy evidence screenshots (2026-11-25)

- **Skill:** `verification-before-completion`
- **Scope:** docs-only evidence update for C1 (branch protection) and C2 (Vercel deployments created by CLI), plus the readiness-table correction
- **Base:** `649f951` | **Head:** `docs/deploy-evidence-screenshots`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 10:07:17 +07:00 - Bằng chứng ảnh cấu hình branch protection và Vercel deployment`.

## Method

Self-review under the exact skill id `verification-before-completion`. Before editing, I re-read the whole `docs/DEPLOY.md` section that the change touches, the readiness table, and `src/test/deploy-workflow.test.ts` assertions that read `docs/DEPLOY.md`; I also re-ran the live checks that back the two screenshots (`gh api .../branches/main/protection` and `gh run view 45428604255`). The images were extracted byte-for-byte from the user's attachments and checked by magic bytes and dimensions; they were not recreated or edited.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| E1 | Minor · `docs/DEPLOY.md:358` (before) | The A3 readiness row still said `[x] (repo) / [ ] (live)` and asked the owner for evidence, although the Vercel dashboard shows CLI deployments for `649f951`, `d51174b`, `0ae74f6` and run `45428604255` is green. A reader would think live evidence is missing. | **Accepted (fixed in `docs/deploy-evidence-screenshots`)** - the row is now `[x]` with the dashboard screenshot and the run link. |
| E2 | Minor · `docs/DEPLOY.md:155` (before) | Branch protection was enforced but not documented in the deploy runbook; only the workflow chain was described. | **Accepted (fixed in `docs/deploy-evidence-screenshots`)** - new subsection `### Branch protection trên main` with the screenshot and the PR #153 merge-lock evidence. |
| E3 | Minor · `docs/deploy-screenshots/` (new files) | Evidence images can be fabricated or stale if their provenance and capture date are not recorded. | **Accepted (fixed in `docs/deploy-evidence-screenshots`)** - both images carry the capture date 2026-11-25 in the text, and the AI_LOG entry records that they came from the user's attachments unmodified. |

## Declined to judge

- Drill rollback and approval-pause drill: not part of a screenshots-only change; still recorded as missing evidence.
- Vercel "creator" field: the dashboard screenshot does not show it; the CLI origin is established by `vercel.json`, `deploy.yml` and the commit metadata instead.
- The four required checks' names: already pinned by `src/test/ci-workflow.test.ts` and the live API output; the screenshot is corroboration.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Branch protection matches the screenshot | `gh api repos/khanhtung2410/ant-jewelry/branches/main/protection` -> `pr: true`, contexts `static,test,build,e2e`, strict, admins enforced | đạt/pass |
| The screenshot is the user's attachment, unmodified | extracted from `session_message` (`image/jpeg` 1347x2000, `image/png` 1901x869); magic bytes checked | đạt/pass |
| Vercel deployments match merged commits | `gh run view 45428604255` success; commits `649f951`, `d51174b`, `0ae74f6` on `main` | đạt/pass |
| The docs guard that reads `DEPLOY.md` still passes | `src/test/deploy-workflow.test.ts > keeps the Environment secret counts and direct URL rows consistent` | đạt/pass |
| Full check set on the final tree | complete capture below with every `EXIT=` line | đạt/pass |

## Verification output

Full check set on the final tree, captured via Node `spawnSync` in UTF-8 with `NO_COLOR=1` and `DATABASE_URL=file:./prisma/dev.db`. The Next.js legend character U+0192 was replaced by `F`:

```text
$ npm run lint

> ant-jewelry@0.1.0 lint
> eslint

EXIT=0 (17.9s)

$ npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0 (3.6s)

$ npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/ci-deploy-gating


 Test Files  86 passed (86)
      Tests  435 passed (435)
   Start at  10:18:24
   Duration  62.94s (tests 39%, import 36%, environment 16%, transform 5%, setup 2%, worker 2%)

     Import  210 modules were evaluated 673 times · 13.28s total, 36% of tracked time
             ~9.13s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0 (64.2s)

$ npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0 (7.0s)

$ npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0 (0.6s)

$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 115ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 4.7s
  Running TypeScript ...
  Finished TypeScript in 5.9s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 3.8s
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

EXIT=0 (20.4s)

FAILED_COMMANDS=0
```

After this block was pasted into this file, the tree changed only by that pasted text, so the doc-reading suites and the docs gates were re-run on the final tree: `npm run format:check` (EXIT=0), `npm run check:language` (EXIT=0) and `npx vitest run src/test/superpowers-process.test.ts src/test/deploy-workflow.test.ts src/test/ci-workflow.test.ts` (3 files, 35 tests, EXIT=0).

## Limitations

- Screenshots are point-in-time evidence (2026-11-25); later configuration changes are not reflected.
- The Vercel screenshot does not show a "creator" column, so CLI origin is inferred from repo configuration plus commit metadata.
- The branch protection screenshot shows "Require approvals" off; that matches the live API (0 required approvals) and is not a capture defect.
- Rollback drill and approval-pause drill remain unexecuted.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 10:07:17 +07:00 - Bằng chứng ảnh cấu hình branch protection và Vercel deployment`.
