# Code review - Performance budget K1 Home loading boundary (2026-11-26)

- **Skill:** requesting-code-review
- **Scope:** final Home CLS fix on PR 166 after the rejected `content-visibility` attempt.
- **Base:** `36e53bf261672ddaf3f8f730ec61bcc6d7af116b` | **Head:** `fa95cb6dc268ff83979a31f4156449377fb0dc28`, then hardened in the working tree before the final push.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-26 02:42:44 +07:00 - Sửa CLS Home do fallback loading của segment public`.

## Method

The exact skill id `requesting-code-review` was loaded and one read-only reviewer subagent was
dispatched with the complete diff package `36e53bf..fa95cb6`, the plan Task 7, the spec, the RED and
GREEN captures, and the full reviewer template. The coordinator re-read the whole source of
`src/app/(public)/page.tsx`, `src/app/(public)/layout.tsx`, `src/app/layout.tsx`,
`src/app/loading.tsx`, `src/test/public-loading-boundary.test.ts`, `docs/PERFORMANCE.md`, the K1 spec
and plan, and the installed `loading.md` guide before accepting or rejecting a finding. Every
consumer of the deleted `src/app/(public)/loading.tsx` was grepped; only historical documentation and
the new guard refer to it. The reviewer did not mutate the checkout.

This round adds concrete work beyond the mentor checklist: the guard now covers every supported
loading-file extension under the public segment and resolves its path from the test file, the red-log
exit marker is qualified, and the missing Task 7 records are added. Those are review findings, not a
restatement of the checklist.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| LR-1 | Important · `src/test/public-loading-boundary.test.ts:7-17` | With the first guard, adding `src/app/(public)/loading.js`, `loading.jsx` or `loading.ts` would pass CI and restore the placeholder-swap mechanism; the guard also promised no broad fallback while `src/app/loading.tsx` still exists. | **Accepted in part (fixed in PR 166 branch):** the guard now scans `loading.{js,jsx,ts,tsx}` under `src/app/(public)` and resolves the directory from `import.meta.url`. The rendered-behavior flow test remains the hosted LHCI CLS assertion on all four URLs. |
| LR-1-alt | Important · `src/app/loading.tsx:1-15` | Reviewer proposed also removing or guarding the root fallback. It is still present in the initial HTML after deleting the public fallback. | **Rejected:** the root fallback wraps the whole route, so the footer is absent while it streams; the corrected CPU-throttle-4 probe recorded zero shifts after the public deletion. Deleting it would affect all routes and is outside the four K1 URLs. |
| LR-2 | Important · `docs/PERFORMANCE.md`, `docs/superpowers/plans/2026-11-25-performance-budget.md`, `docs/superpowers/specs/2026-11-25-performance-budget-design.md`, `AI_LOG.md`, `docs/reviews/` | Before this round, the three documentation edits were uncommitted, AI_LOG had no Task 7 entry, no review record existed, and plan Task 7 Step 4 was unchecked. | **Accepted (fixed in PR 166 branch):** the records now describe both red runs, the rejected hypothesis, the reproduced mechanism, the root-fallback decision and the final check output; all are committed on the K1 branch. |
| LR-3 | Minor · `.superpowers/sdd/2026-11-25-performance-budget/home-fix-red-log.md:187-189` | The captured file ended with `EXIT=0` from `gh run view`, while the quoted `e2e` log lines said the job exited 1; a skimmer could confuse them. | **Accepted (fixed in PR 166 branch):** a note now states that `EXIT=0` belongs only to the log-fetch command and points to the three lines proving the job exit code 1. |
| LR-4 | Minor · `src/test/public-loading-boundary.test.ts:7` | `path.resolve(process.cwd(), ...)` would pass when Vitest was started from a nested directory even if the fallback file existed. | **Accepted (fixed in PR 166 branch):** the directory is derived from `fileURLToPath(import.meta.url)`, so the guard is independent of the caller's working directory. |

## Declined to judge

- Hosted verification at the final head: owned by the controller; recorded in the PR body after the run completes.
- The earlier owner ruling to keep `content-visibility` on Home: accepted as context, not reopened; the head diff for `page.tsx` is empty.
- Admin loading boundary and `/admin` routes: outside the four public URLs in K1.
- Desktop Lighthouse profiles and other pages: explicit spec non-goal.
- Threshold, URL and required-check-name changes: explicitly out of scope and verified unchanged.
- The deliberate negative-evidence pull request from Task 4: separate task and branch.
- K2 dependency automation and security scanning: separate PR 168.
- Merge timing and PR body contents: controller-owned.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| The first fix hypothesis was disproved | `home-fix-red-log.md`: run `45682997369` reported `found: 0.5164034021871203` for CLS and `found: 0.67` for Performance after `d3f5797` | đạt/pass |
| The real mechanism was reproduced | corrected local build at `412x823`, CPU throttle 4: fallback main ~214 px and footer `top=398`, streamed main ~3252 px and footer `top=3351`, shift `0,52`; documented in plan Step 2 | đạt/pass |
| Removing the public fallback removes the shift | same probe after deletion: `shifts=0`; `cls3-B_cpuThrottle4.json` timeline shows footer only with the streamed page | đạt/pass |
| The guard fails for the right reason | `public-loading-red-checks.md`: `AssertionError: expected [ 'loading.tsx' ] to deeply equal []`, `EXIT=1` | đạt/pass |
| The guard passes with the fix and all extensions are covered | focused guard tests in the final capture: 3 files and 13 tests passed, `EXIT=0`; guard source lists `js`, `jsx`, `ts`, `tsx` | đạt/pass |
| No threshold, URL or check name changed | `git diff 36e53bf..HEAD -- .github/workflows/ci.yml lighthouserc.json src/test/lighthouse-config.test.ts src/test/ci-workflow.test.ts` is empty | đạt/pass |
| Public data still caches and pages prerender | `getSettings`, `getHeroSlides`, `getBlogPosts` and category queries use `'use cache'`; final build table marks `/` and `/p/aurora-band` static and `/c/wedding-ring` partial prerender | đạt/pass |
| Full check set passes for the final tree | final capture: seven `EXIT=0` lines | đạt/pass |
| Hosted run at the reviewed fix head passes all four checks | `final-hosted-green.md`: `gh run view 45686913214 --json databaseId,name,headSha,status,conclusion,url,createdAt,updatedAt,jobs` returned `conclusion=success`, `headSha=fa95cb6dc268ff83979a31f4156449377fb0dc28`, jobs `test:success, e2e:success, build:success, static:success`, `EXIT=0`; the `e2e` log records 4 URLs, 12 Lighthouse runs and no assertion failure, `EXIT=0` | đạt/pass |
| Hosted rerun at the final hardened head passes all four checks | link and conclusion in PR 166 after the hardened guard is pushed | lacking evidence until that run finishes |

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


 Test Files  91 passed (91)
      Tests  462 passed (462)
   Start at  02:51:09
   Duration  51.69s (tests 50%, import 31%, environment 10%, transform 5%, setup 2%, worker 2%)

     Import  215 modules were evaluated 684 times · 9.27s total, 31% of tracked time
             ~6.36s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 39ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.2s
  Running TypeScript ...
  Finished TypeScript in 5.3s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 8.6s
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
$ npx vitest run src/test/lighthouse-config.test.ts src/test/ci-workflow.test.ts src/test/public-loading-boundary.test.ts

 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  02:52:32
   Duration  7.62s (import 22%, setup 22%, transform 21%, tests 19%, worker 15%, environment 1%)



EXIT=0
```

## Limitations

- No GitHub runner is available locally; the authoritative assertion comes from the hosted run linked in PR 166.
- The local observer is a diagnostic probe outside git, not a committed CI test; CI's rendered-behavior check is the Lighthouse CLS assertion on four URLs.
- `npm run check:language` exits 0 but prints no success line on Windows; `EXIT=0` plus a direct letter scan is the evidence.
- The root `src/app/loading.tsx` was not changed; its behavior was checked only for the four public URLs and the observer case described above.
- K2 is handled in PR 168 and is not reviewed in this round.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-26 02:42:44 +07:00 - Sửa CLS Home do fallback loading của segment public`.
