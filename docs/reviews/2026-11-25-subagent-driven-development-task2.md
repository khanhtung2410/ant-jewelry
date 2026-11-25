# Code review - Task 2 hero slider browser workflow (2026-11-25)

- **Skill:** `subagent-driven-development` (controller) + `requesting-code-review` (exact id loaded by the reviewer)
- **Scope:** Task 2 of `docs/superpowers/plans/2026-11-25-new-update-test-flow.md` - create the browser workflow spec for hero slider auto-advance, pause, manual reset, live region and the removed pause control
- **Base:** `8514628` | **Head:** `670ab507`
- **Prompt nguyên văn:** the driving request was `clean stale report, review docs / use superpower to create new test flow (unit, integration, workflow) for all new update / review and check relevant changes again`; the AI_LOG entry for this work is added in Task 5.

## Method

Fresh-context read-only reviewer dispatched under the exact skill ids above. It read the task brief, the design spec's Review Focus, the ledger rulings at `.superpowers/sdd/2026-11-25-new-update-test-flow/progress.md:28-31`, the implementer report, and one review package containing the commit list, stat summary and full `-U10` diff (`review-8514628..670ab50.diff`). It did not re-run the suite. It checked the named hydration risk against the source at `src/features/layout/components/hero-slider.tsx:68-75` and confirmed the second `releasePointerAndFocus` leaves only the intended hover or focus cause. The controller separately verified branch provenance from `git log -1 main`, `git branch -a --contains 670ab507` and `git status -sb`.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T2-1 | Minor · `.superpowers/sdd/2026-11-25-new-update-test-flow/task-2-report.md:19-22` | The deliverable summary still says timeout values are verbatim, although Rounds 2 and 3 added 2s windows and hydration gates. | **Accepted (fixed in Task 5)** - the final audit and PR body will describe the exact departures; the scratch report is not part of the commit. |
| T2-2 | Minor · `e2e/hero-slider.spec.ts:119-123` with `src/features/layout/components/hero-slider.tsx:90` | The live-region test asserts `aria-live="off"` at load; source flips it to `polite` when pause occurs, so the paused state is not covered. | **Rejected** - `task-2-brief.md:69-73` mandates this exact load-time assertion, and the spec's phrase is about the advancing state. A separate paused-state test would be a new requirement, not a defect in this task. |
| T2-3 | Minor · `.superpowers/sdd/2026-11-25-new-update-test-flow/task-2-report.md:1587-1616` | Final E2E output still contains `NO_COLOR is ignored due to FORCE_COLOR` warnings. | **Accepted (recorded in Task 5)** - they are Playwright child-process noise with `EXIT=0`; no task-code change. |

## Declined to judge

- Production or deploy execution: out of scope for a browser test addition; no deploy target was exercised.
- Full check output in the final PR body and the AI_LOG entry: controller-owned Task 5 work, not visible in this diff; tracked below as lacking evidence until Task 5 lands.
- Branch provenance from the diff alone: verified by the controller as recorded in Method.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Five tests, exact names and `@storefront` tags | `review-8514628..670ab50.diff` hunks; Playwright run `task-2-report.md:1513-1522` and `:1575-1584` | pass |
| Locators and helper match the brief | `e2e/hero-slider.spec.ts:22-30` in the diff | pass |
| Two 2s pause windows present | `e2e/hero-slider.spec.ts:64-66` and `:87-89` in the diff | pass |
| Hydration gate present in both pause tests | `e2e/hero-slider.spec.ts:57-62` and `:80-85` in the diff; source check at `hero-slider.tsx:68-75` | pass |
| Pause assertions fail without hover and focus guards | mutation run `task-2-report.md:1305-1455`, 4/4 fail | pass |
| Full spec green twice after restore | `npm run test:e2e -- e2e/hero-slider.spec.ts`, `task-2-report.md:1513-1555` and `:1575-1617`, both 10/10 `EXIT=0` | pass |
| Lint, typecheck, unit tests, format and language green | captured check set below, all `EXIT=0` | pass |
| Build green with the E2E database variable | captured build below, `EXIT=0`; plain command needs `DATABASE_URL` as ruled at `progress.md:29` | pass |
| Branch based on `origin/main`, `main` untouched | `git log -1 main` = `86f286b`; only this branch contains `670ab507` | pass |
| Worktree contains only the unrelated untracked Task 1 review record | `git status -sb` | pass |
| Full check output in PR body | not created until Task 5 | lacking evidence |
| AI_LOG entry | not created until Task 5 | lacking evidence |

## Verification output

The implementer's final captured check set is reproduced below. The Next.js legend character U+0192 is replaced by `F` as required by rule 12.

```text
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


 Test Files  86 passed (86)
      Tests  435 passed (435)
   Start at  12:04:08
   Duration  58.82s (tests 35%, import 33%, environment 22%, transform 6%, setup 2%, worker 2%)

     Import  210 modules were evaluated 673 times · 12.16s total, 33% of tracked time
             ~8.37s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
```

Build with the E2E database variable, because the plain command needs `DATABASE_URL` in this clean clone:

```text
DATABASE_URL=file:./prisma/e2e.db npm run build

$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 186ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.3s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.3s
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

The two full E2E runs are captured at `.superpowers/sdd/2026-11-25-new-update-test-flow/task-2-report.md:1505-1556` and `:1567-1618`; both ended `10 passed`, `EXIT=0`. Their `NO_COLOR` / `FORCE_COLOR` warnings are retained in that report and noted as T2-3 above.

## Limitations

- The reviewer worked from a diff package and did not re-run suites; all test claims point to named outputs in the implementer report.
- The final PR body and AI_LOG entry do not exist yet; Task 5 must carry the full output and close the two `lacking evidence` rows.
- No production check was available or required for a test-only change.

Link AI_LOG entry: to be added by Task 5.
