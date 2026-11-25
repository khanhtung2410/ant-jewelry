# Code review - Performance budget K1 blog CLS fix (2026-11-25)

- **Skill:** requesting-code-review
- **Scope:** layout shift found by the new Lighthouse budget on PR 166 and its source fix.
- **Base:** `58ace2f` | **Head:** `cfd291f`, refined in the working tree before the final push.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 23:55:00 +07:00 - Sửa CLS ảnh bìa blog do CI ngân sách phát hiện`.

## Method

The exact skill id `requesting-code-review` was loaded and one read-only reviewer subagent was
dispatched with the diff `58ace2f..cfd291f`, the plan, the spec, the artifact evidence and the full
template. The coordinator re-read the whole source of `blog-detail.tsx`, `blog-detail.test.tsx`,
`blog-form-schema.ts`, the cover field in `blog-post-form-dialog.tsx`, `docs/PERFORMANCE.md`, the K1
spec and plan, and grepped every consumer of `1200`, `630` and `cover-wedding-band` before accepting
or rejecting any finding. No finding was accepted from the subagent report alone.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| CF-1 | Important · `src/features/blog/components/blog-detail.tsx:31-33` | With `width`/`height` attributes and `className="h-auto w-full object-cover"`, the presentational hint is `aspect-ratio: auto 1200 / 630`; the browser replaces it with the natural ratio once an arbitrary admin cover loads, so a 4:3 or portrait image still shifts the footer. The admin form accepts any site path or http(s) URL with no dimension constraint. | **Accepted (fixed in PR 166 branch):** wrap the image in a fixed `aspect-[1200/630]` box and use `absolute inset-0 h-full w-full object-cover`, so arbitrary covers are cropped and the box height cannot change. Shared dimension constants and a guard reading the seed asset `viewBox` keep the values honest. |
| CF-2 | Important · `docs/superpowers/plans/2026-11-25-performance-budget.md:215-217`, `AI_LOG.md:38` | Task 6 Step 3 was unchecked and AI_LOG said the hosted confirmation was pending; the first fix commit had no green CI run proving both the CLS and the Performance assertions cleared. | **Accepted (fixed in PR 166 branch):** run `45658516997` on intermediate commit `cfd291f` passed all four checks; after the CF-1 refinement, run `45660888483` on final head `f0fe22a` passed `static`, `test`, `build` and `e2e` with `e2e` completing 12 Lighthouse runs in 6m27s. Task 6 Step 3 is ticked and both links are recorded in the PR description. |
| CF-3 | Minor · `src/features/blog/components/blog-detail.test.tsx:43-49` | The old case name claimed "cannot shift the footer" while it only checked two emitted attributes, and hard-coded numbers could drift from the seeded asset. | **Accepted (fixed in PR 166 branch):** rename the case to describe the emitted box, assert the fixed aspect class and absolute image classes, export `BLOG_COVER_WIDTH`/`BLOG_COVER_HEIGHT` from the component, and add a case reading `cover-wedding-band.svg` `viewBox`. The hosted Lighthouse run remains the authoritative CLS proof. |
| CF-4 | Minor · `docs/PERFORMANCE.md:141` | The exact Home CLS `0,5164` was read from an artifact that is deliberately not committed, so a reader of the repository cannot reproduce the figure. | **Accepted (fixed in PR 166 branch):** qualify the sentence with the run id `45655992481` and state that the artifact is not in the repository. |
| CF-1-alt | Important · alternative to CF-1 in `blog-post-form-schema.ts` and the admin hint | The reviewer proposed requiring every cover to be exactly 1200x630 in validation, the form hint and the docs. | **Rejected:** it restricts editors and cannot fix existing stored URLs that already point elsewhere; the fixed CSS box handles every input without a migration and matches the cropping pattern already used by `BlogRow`. |

## Declined to judge

- Desktop Lighthouse profiles and pages outside the four named routes: explicit K1 non-goals.
- Vercel preview measurement, hosted LHCI server and public temporary storage: rejected approaches recorded in the spec.
- Prisma `P2021` logging: explicit non-goal settled in Task 3; unchanged here.
- K2 dependency automation: separate PR, outside this range.
- Root cause of the single Home CLS outlier: the element was not identified in the artifact and the median did not fail; only its documentation was reviewed.
- Draft PR 167 and green run `45651127274`: established evidence from earlier tasks, not changed here.
- Figma visual fidelity: no Figma asset in the repo; the diff changes only the cover box and two attributes.
- Migrating the plain `<img>` to `next/image`: deliberate existing choice, outside Task 6.
- Review records and AI_LOG: reviewed for truthfulness; their edits are recorded by the coordinator, not hidden.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| The failed run failed on real budget assertions | run `45655992481` log: `expected: <=0.1`, `found: 0.2515188335358445`, `expected: >=0.85`, `found: 0.76` | đạt/pass |
| The artifact identifies the cause | `lighthouse-report` artifact from that run: `Unsized image element` on the blog cover, footer shift 0.2515 | đạt/pass |
| The guard fails without the fix | `cls-red-checks.md` (`EXIT=1`) and `cls-aspect-red-checks.md` (`EXIT=1`, two cases) | đạt/pass |
| The guard passes with the fix | `npx vitest run src/features/blog/components/blog-detail.test.tsx`: `EXIT=0`, 4/4 tests | đạt/pass |
| Thresholds were not weakened | `git diff 58ace2f..cfd291f -- lighthouserc.json` is empty; `src/test/lighthouse-config.test.ts` still pins 0.85/0.9/0.95/0.1 | đạt/pass |
| The intermediate fix passed hosted CI | run `45658516997`, `e2e` pass in 6m26s, four required checks pass | đạt/pass |
| The final refined fix passed hosted CI | run `45660888483` on head `f0fe22a`: `static`, `test`, `build`, `e2e` all pass; `e2e` 6m27s with 12 Lighthouse runs | đạt/pass |
| Full check set passes for the final tree | fresh `final-checks.md`: seven `EXIT=0` lines | đạt/pass |

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
   Start at  00:14:44
   Duration  58.79s (tests 47%, import 33%, environment 12%, transform 4%, setup 2%, worker 2%)

     Import  214 modules were evaluated 682 times · 10.67s total, 33% of tracked time
             ~7.32s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 282ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.8s
  Running TypeScript ...
  Finished TypeScript in 5.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 7.1s
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
   Start at  00:16:14
   Duration  8.35s (tests 22%, import 21%, worker 20%, transform 19%, setup 17%, environment 1%)



EXIT=0
```

## Limitations

- No hosted runner locally; each hosted run is recorded by its id and link, and the final refined head passed in run `45660888483`.
- One Home measurement in the failed run had CLS 0.5164 but the median was 0; the culprit element was not identified and the artifact is not committed, so the figure is qualified in the docs.
- The reviewer was read-only; all fixes and re-verification were applied by the coordinator.
- Widening thresholds or retrying the run was rejected because the artifact identified a real layout defect.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 23:55:00 +07:00 - Sửa CLS ảnh bìa blog do CI ngân sách phát hiện`.
