# Code review - Performance budget K1 sandbox fix (2026-11-25)

- **Skill:** requesting-code-review
- **Scope:** hosted-runner Chromium fix and its evidence on `k1-performance-budget`, including the
  deliberately failing PR that was closed and never merged.
- **Base:** `c245bdb` | **Head:** `f451e67`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 23:10:00 +07:00 - Sửa lỗi Chrome sandbox trong ngân sách hiệu năng K1`.

## Method

The exact skill id `requesting-code-review` was loaded before dispatching one read-only reviewer
subagent with the full template and the diff `c245bdb..f451e67`. The coordinator then re-read the
whole source of every touched file (`docs/PERFORMANCE.md`, `src/test/lighthouse-config.test.ts`,
`lighthouserc.json`, `AI_LOG.md`, the K1 plan and spec, `docs/reviews/TEMPLATE.md`) and grepped every
consumer of `chromeFlags`, the stale test counts and the CI run links before accepting or rejecting
any finding. No finding was accepted from the subagent report alone. The reviewer set aside the
items listed below; the coordinator rules on each line explicitly.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| SR-1 | Important · `docs/PERFORMANCE.md:141` | Read the sentence claiming the flag is enabled only in the isolated `e2e` CI job, then run `npx lhci autorun` locally: `@lhci/cli` reads `ci.collect.settings.chromeFlags` from the shared JSON with no environment check, so a developer's local Chrome also loses its sandbox while the docs promise otherwise. | **Accepted (fixed in PR 166 branch):** rewrite the sentence to state plainly that the flag applies to every LHCI run reading this config, including local runs against the LHCI-started local server. |
| SR-2 | Important · PR 166 description and `AI_LOG.md:24` | Compare the PR body test block with `.superpowers/sdd/2026-11-25-performance-budget/final-checks.md`: the body still showed 458 tests, 11 focused guards and timestamps `22:37:22` / `22:38:52`, while the authoritative capture for the reviewed head shows 459 tests, 12 guards and `23:03:27` / `23:04:50`. A reader could not verify the new guard from the PR. | **Accepted (fixed in PR 166 branch):** sync the complete fresh capture into PR 166 and correct the count in AI_LOG; every `EXIT=` line is preserved. |
| SR-3 | Important · `AI_LOG.md:34,37` and `docs/superpowers/plans/2026-11-25-performance-budget.md:171,194` | Grep the tracked tree for the two CI run ids: before the fix they existed only in ignored SDD files; PR 166 still had the unchecked Task 4 evidence item, and no review record covered this fix round. | **Accepted (fixed in PR 166 branch):** PR 166, AI_LOG and this record now carry green run `45651127274`, red run `45652227977` and the assertion snippet; the plan boxes are marked complete with links. |
| SR-4 | Minor · `src/test/lighthouse-config.test.ts:54` | Set `chromeFlags` to `--no-sandbox-disabled`; `toContain('--no-sandbox')` still passes even though Chrome would fail to launch as intended, recreating the original CI red run with a green guard. | **Accepted (fixed in PR 166 branch):** assert the exact whitespace-separated token with `settings.chromeFlags?.split(/\s+/)).toContain('--no-sandbox')`. |
| SR-5 | Minor · `docs/superpowers/plans/2026-11-25-performance-budget.md:146,161-171` | Read the plan while PR 166 is open and the red run has been captured: Task 3 Step 6 and all Task 4 boxes were still unchecked. | **Accepted (fixed in PR 166 branch):** mark them complete and attach the PR and run links. |
| SR-1-alt | Important · proposed alternative to SR-1 in `.lighthouserc.cjs` | The reviewer proposed a conditional rc file that adds the flag only under `CI`. Precedence details in `@lhci/utils/src/lighthouserc.js:20-33` mean the guard must be rewritten for the new file, and two code paths would be maintained. | **Rejected:** the observed behavior is a developer-initiated local tool that opens only the server LHCI starts; there is no evidence of harm, and documenting the real scope is smaller and verifiable. The original false claim is fixed instead. |

## Declined to judge

- K2 dependency automation: explicitly reserved for a separate PR; no files in `c245bdb..f451e67`.
- Manual Lighthouse baseline tables: spec non-goal; CI numbers must not replace them.
- Desktop profiles and URLs outside the four configured pages: spec non-goal; unchanged.
- Hosted Lighthouse CI server or public report storage: spec non-goal; filesystem artifact unchanged.
- Empty-database build on PostgreSQL: no credentials available; the recorded SQLite `EXIT=0` experiment is accepted by the plan and no application logging changed.
- `CHROME_PATH` resolution through the transitive `playwright` package: pre-existing and unchanged.
- Silent success of `check:language` on Windows: pre-existing, documented as a limitation.
- The throwaway image and `page.tsx` commit: inspected only as evidence; PR 167 closed, branch deleted, nothing merged.
- Untracked K2 spec at review time: outside this range.
- UI and accessibility behavior: no UI or a11y code in this range, so no behavior was closed as a non-goal.
- Figma visual comparison: no visual change in this range.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| The flag is scoped as documented | `docs/PERFORMANCE.md:141` now describes the shared-config scope; `lighthouserc.json:14` and `node_modules/@lhci/cli/src/collect/node-runner.js:44-49` were read before ruling | đạt/pass after fix, lacking evidence before |
| Removing or invalidating the flag turns a guard red | `sandbox-red-checks.md` (`EXIT=1`, `expected '' to contain '--no-sandbox'`) and `sandbox-green-checks.md` (`EXIT=0`); `sandbox-token-check.md` shows the tightened assertion rejects `--no-sandbox-disabled` with `EXIT=1` and restores the config byte-for-byte; the assertion is included in the fresh `npm test` and focused guard runs | đạt/pass |
| Green CI run belongs to the reviewed head | `gh run view 45651127274`, head `f451e67`, `baseline-ci-evidence.md`: 4 URLs, 12 runs, `All results processed!`, four required checks successful | đạt/pass |
| Red CI run failed because of Performance, not infrastructure | `negative-ci-evidence.md` from run `45652227977`: `categories.performance failure for minScore assertion`, `expected: >=0.85`, `found: 0.72`, `all values: 0.63, 0.72, 0.73`, `Assertion failed. Exiting with status code 1.`; PR 167 closed, never merged | đạt/pass |
| Full check set passes for the final tree | fresh `final-checks.md`: lint, typecheck, 459 tests, format, build, language, focused guards, seven `EXIT=0` lines | đạt/pass |
| PR body carries the complete captured output | `node .superpowers/sdd/2026-11-25-performance-budget/verify-sync.mjs` -> `ALL_OK=true` after syncing all targets | đạt/pass |
| AI_LOG entry keeps the previous header after its new `---` | `AI_LOG.md` lines around the top entry: `---` followed by `## 2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1` | đạt/pass |
| Written text uses only Vietnamese and English letters | `npm run check:language` with `EXIT=0` plus an explicit non-Vietnamese/non-English letter scan; silent success on Windows noted | đạt/pass |

## Verification output

```text
## lint
$ npm run lint

> ant-jewelry@0.1.0 lint
> eslint



EXIT=0

## typecheck
$ npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit



EXIT=0

## test
$ npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  90 passed (90)
      Tests  461 passed (461)
   Start at  00:01:45
   Duration  68.58s (tests 48%, import 33%, environment 11%, transform 4%, setup 2%, worker 2%)

     Import  214 modules were evaluated 682 times · 12.41s total, 33% of tracked time
             ~8.52s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation



EXIT=0

## format:check
$ npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!


EXIT=0

## build
$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
- Environments: .env.production.local, .env.local, .env
✓ Running next.config.ts took 206ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 4.0s
  Running TypeScript ...
  Finished TypeScript in 9.9s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 8.1s
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

## check:language
$ npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs



EXIT=0

## focused guard tests
$ npx vitest run src/test/lighthouse-config.test.ts src/test/ci-workflow.test.ts

 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  2 passed (2)
      Tests  12 passed (12)
   Start at  00:03:32
   Duration  9.84s (tests 28%, import 24%, setup 17%, worker 16%, transform 14%)



EXIT=0
```

## Limitations

- No hosted runner locally: the Lighthouse assertions were verified from GitHub Actions logs only.
- No PostgreSQL production credentials: the empty-database experiment used SQLite outside git.
- The reviewer was read-only; all fixes were applied and verified by the coordinator on the same branch.
- K2 (Dependabot, CodeQL, production audit) is out of scope for this round.
- The invalid first PR 167 run is evidence of the sandbox bug, not of Performance, and is never cited as budget evidence.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 23:10:00 +07:00 - Sửa lỗi Chrome sandbox trong ngân sách hiệu năng K1`.
