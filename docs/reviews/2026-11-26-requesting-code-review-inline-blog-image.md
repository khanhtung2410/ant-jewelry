# Code review - inline blog image and font CLS (2026-11-26)

- **Skill:** requesting-code-review
- **Scope:** Review round for run `45734845362`, inline Markdown image dimensions, fixed ratio and font swap CLS on the blog detail page.
- **Base:** d6c23dc | **Head:** working tree before commit
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-26 11:02:52 +07:00 - Sửa CLS blog và đóng PR Dependabot thừa`.

## Method

Read-only reviewer with the exact skill id `requesting-code-review`, followed by self-verification with `systematic-debugging` and `test-driven-development`. Before accepting a finding I re-read `src/features/shared/lib/markdown.tsx`, `markdown.test.tsx`, `src/features/blog/components/blog-detail.tsx`, `blog-detail.test.tsx`, `src/app/layout.tsx`, `src/test/font-preload.test.ts`, `src/features/blog/components/blog-post-form-dialog.tsx`, `src/features/shared/lib/safe-url.ts`, `docs/reviews/TEMPLATE.md` and the Next.js font guide in `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`. I grepped every consumer of `BLOG_IMAGE_WIDTH`, `BLOG_IMAGE_HEIGHT`, `BLOG_COVER_WIDTH`, `BLOG_COVER_HEIGHT` and `renderMarkdown`.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| LR1 | Important · `src/features/shared/lib/markdown.tsx:36` | An admin can insert a Markdown image with a natural ratio other than 1200x630. With `h-auto` the browser replaces the declared ratio after load and shifts the footer. Reproduce by inserting a tall image through `blog-post-form-dialog.tsx` and loading a blog detail page. | **Accepted (fixed in branch `k1-performance-budget` / PR 166)**: use `aspect-[1200/630]` with `object-cover`, so the reserved height cannot change. |
| LR2 | Important · hosted run `45734845362` | The original failure was hosted and intermittent, two of three blog runs. A local run alone cannot prove the flake is gone. | **Accepted (fixed in branch `k1-performance-budget` / PR 166)**: the fixed-ratio guard and font guard were added; the hosted rerun at the final head is still required before merge. |
| LR3 | Minor · `src/features/shared/lib/markdown.test.tsx:23` | The case name claimed layout behavior while it only asserted emitted markup. | **Accepted (fixed in branch `k1-performance-budget` / PR 166)**: renamed to `emits explicit dimensions and a fixed ratio on inline markdown images`. |
| LR4 | Minor · `src/features/blog/components/blog-detail.test.tsx:65` | The seed-ratio guard checked one asset although six seeded inline images exist. | **Accepted (fixed in branch `k1-performance-budget` / PR 166)**: table-driven guard over every Markdown image URL in `blogPosts`. |
| LR5 | Minor · process records | At the reviewed head the docs, AI_LOG and review record did not yet describe this fix. | **Accepted (fixed in branch `k1-performance-budget` / PR 166)**: this record and the new AI_LOG entry. |
| LR6 | Important · `src/app/layout.tsx:14-24` | After LR1 was fixed, three local LHCI runs showed CLS `0.2515188335358445` in two runs; the shift item named the footer and a Montserrat Latin-ext font. Next emits overlapping Vietnamese and Latin-ext faces, and a late font swap changed text height. | **Accepted (fixed in branch `k1-performance-budget` / PR 166)**: keep the intended subsets and set `display: 'optional'` on both fonts; guard the config in `font-preload.test.ts`. |
| LR7 | Important · local LHCI `0.6 / 0.75 / 0.76` | The final local blog-only run still has Performance median `0.75`, below the unchanged `0.85` budget. | **Accepted as pending hosted verification**: no threshold change; the hosted run at the final head is the deciding evidence. |
| RA1 | Rejected approach | Widening thresholds, changing the four URLs or retrying the red run. | **Rejected**: the artifact proved a real layout defect and the budget is the requirement. |
| RA2 | Rejected approach | Keeping the extra `latin-ext` preload from the intermediate fix. | **Rejected**: it raised the preload payload and local Performance median was `0.82`; `display: 'optional'` alone removed the swap. |

## Declined to judge

- Desktop profiles and pages outside the four K1 URLs: explicit non-goals; no config changed here.
- Vercel preview measurement and hosted LHCI server: rejected by the K1 decision record.
- Prisma `P2021` logging and empty-database build: settled in Task 3 and untouched by this range.
- K2 dependency automation: separate PR 168; the seven open Dependabot PRs were closed at the owner request, not changed in code.
- Figma visual fidelity: no committed design source; matching-ratio images render in the same box.
- Admin image dimension validation as a feature: outside the written plan; the fixed box removes the shift without a new form contract.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Inline Markdown images declare and reserve dimensions | `markdown-image-red-checks.md` `EXIT=1`, `markdown-aspect-green-checks.md` `EXIT=0`, named test `emits explicit dimensions and a fixed ratio on inline markdown images` | đạt/pass |
| Every seeded inline image matches the declared ratio | `blog-detail.test.tsx` named test `keeps every seeded body image at the declared inline ratio`, focused guard `EXIT=0` in `final-font-checks.md` | đạt/pass |
| Font config avoids late swap | `font-optional-red-checks.md` `EXIT=1`, `font-no-extra-preload-green-checks.md` `EXIT=0`, `font-optional-flow.md` `EXIT=0` | đạt/pass |
| Full static checks | `final-font-checks.md`: lint, typecheck, test, format:check, build, check:language all `EXIT=0` | đạt/pass |
| Local CLS is zero in three blog passes | `lhci-local-blog-after-font-optional.md` and the three report files with `cls=0`, `shifts=0` | đạt/pass |
| Local Performance median meets 0.85 | `lhci-local-blog-after-font-optional.md` reports `0.6, 0.75, 0.76` | lacking evidence |
| Hosted green run at the final head | no run captured after the final commit | lacking evidence |

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


 Test Files  94 passed (94)
      Tests  494 passed (494)
   Start at  11:00:50
   Duration  61.19s (tests 46%, import 34%, environment 11%, transform 4%, setup 2%, worker 2%)

     Import  220 modules were evaluated 693 times · 10.90s total, 34% of tracked time
             ~7.44s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 216ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.7s
  Running TypeScript ...
  Finished TypeScript in 5.5s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 7.3s
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
$ npx --no-install vitest run src/test/lighthouse-config.test.ts src/test/ci-workflow.test.ts src/test/public-loading-boundary.test.ts src/test/font-preload.test.ts src/features/shared/lib/markdown.test.tsx src/features/blog/components/blog-detail.test.tsx


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  6 passed (6)
      Tests  28 passed (28)
   Start at  11:02:22
   Duration  9.75s (import 35%, tests 23%, transform 19%, setup 14%, worker 9%)

    Isolate  6 workers spawned · ~142ms startup each (spawn + environment, per file)
             at least ~711ms faster with isolate: false — reuses workers across files instead of one per file


EXIT=0
```

## Limitations

- The local blog-only Performance median is `0.75`, so this record does not claim the K1 budget is met.
- The hosted rerun at the final head is still required; no green run id exists yet.
- The font guard reads `layout.tsx` source rather than the rendered font timing; the rendered check is the LHCI CLS assertion captured above.
- `npm run check:language` exits `0` but prints no success line on Windows; the exit code plus direct letter scan are the evidence.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-26 11:02:52 +07:00 - Sửa CLS blog và đóng PR Dependabot thừa`.
