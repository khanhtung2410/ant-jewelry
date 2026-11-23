# Code review - whole branch feat/hero-slider-auto-slide (2026-11-23)

- **Skill:** requesting-code-review
- **Scope:** whole branch `feat/hero-slider-auto-slide`
- **Base:** `e48f27c5eb0987a8f0c9c038b206bf85db977d91` | **Head:** `27cb76c`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 10:37:48 +07:00 - Ghi nhận hành vi tự động chuyển slide của hero slider`.

## Method

Fresh-context read-only reviewer dispatched with the exact skill id `requesting-code-review`; it read the spec, plan, ledger, full diff, entire `hero-slider.tsx`, both test files, the home page consumer and the state of the referenced review files; it did not re-run suites or mutate files.

## Findings and decisions

Review result, verbatim:

> Strengths: correct timer architecture at hero-slider.tsx:22-30; shrink-safe arrow-consistent wrap-around at :27 with real production reachability from src/app/(public)/page.tsx:31-40; tests assert real DOM behavior not mocks; documentation accurate at docs/ARCHITECTURE.md:72 and AI_LOG.md:1-36; review discipline with exact skill ids and file:line evidence.
>
> Critical: None. Important: None in feature code or tests.
>
> Minor 1: dangling review link at AI_LOG.md:8 and the three task review files; fix is to add docs/reviews/2026-11-23-requesting-code-review.md before merge. Minor 2: wrong line citation at docs/reviews/2026-11-23-subagent-driven-development-task2.md:183 (82 should be 72).
>
> Recommendations: no deferred or parked ledger item must be fixed before merge; the Vitest isolate:false tip is pre-existing and the bare return is behaviorally identical to return undefined; clicking the active dot does not restart the countdown but that is a no-op with no reasonable expectation of restart.
>
> Declined to judge: pause-on-hover/focus (explicit non-goal), prefers-reduced-motion (spec silent), screen reader live announcements (spec silent), countdown reset on unchanged index, clicking current dot, growth from one to two slides (judged by source), background-tab throttling, SSR first paint, git operations, and rewriting historical verbatim text.
>
> Assessment: Ready to merge? With fixes. Reasoning: implementation is correct, clamp-safe, well-tested against real rendered behavior and language-clean; only two Minor documentation items remain and both are resolvable without touching feature code.

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Minor · `AI_LOG.md:8`, `docs/reviews/2026-11-23-subagent-driven-development.md:242`, `docs/reviews/2026-11-23-subagent-driven-development-task2.md:188,192`, `docs/reviews/2026-11-23-subagent-driven-development-fix1.md:141,146` | The listed references point to `docs/reviews/2026-11-23-requesting-code-review.md`, which did not exist, so the links were dangling. | **Accepted (fixed in this commit)** |
| 2 | Minor · `docs/reviews/2026-11-23-subagent-driven-development-task2.md:183` (reviewer line; actual line `:29`) | The checklist row cites `docs/ARCHITECTURE.md:82`, while the architecture note is at `docs/ARCHITECTURE.md:72`. | **Accepted (fixed in this commit)** |

No Critical or Important findings. Both Minor findings are documentation-only and are resolved in this commit; feature code and tests are unchanged.

## Declined to judge

- Pause-on-hover/focus: explicit non-goal in the task brief.
- Prefers-reduced-motion: the spec is silent.
- Screen reader live announcements: the spec is silent.
- Countdown reset on unchanged index: no behavior change to judge.
- Clicking the current dot: a no-op with no reasonable expectation of restart.
- Growth from one to two slides: already judged by source.
- Background-tab throttling: outside the reviewed behavior.
- SSR first paint: outside the reviewed behavior.
- Git operations: out of scope for a read-only reviewer.
- Rewriting historical verbatim text: out of scope for this fix wave.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Correct 5000 ms timer architecture with cleanup and rescheduling | `src/features/layout/components/hero-slider.tsx:22-30`; `stays on slide 1 until 5000 ms, then advances one slide every 5000 ms and loops` in `hero-slider.auto-slide.test.tsx:115` | đạt/pass |
| Shrink-safe arrow-consistent wrap-around | `hero-slider.tsx:27`; `keeps advancing when the slides prop shrinks while mounted` in `hero-slider.auto-slide.test.tsx:181-205` | đạt/pass |
| Real production reachability of the slider | Home page consumer at `src/app/(public)/page.tsx:31-40`; build output lists `/` as a prerendered static route in the attached check output | đạt/pass |
| Tests assert real rendered DOM behavior, not mocks | Both `hero-slider.auto-slide.test.tsx` and `hero-slider.test.tsx`; `npm test` in the attached output: 82 files / 383 tests passed | đạt/pass |
| Documentation accurate | `docs/ARCHITECTURE.md:72` and `AI_LOG.md:1-36`; the two Minor documentation defects are fixed in this commit | đạt/pass |
| Review discipline with exact skill ids and file:line evidence | `requires every review file to declare a concrete skill id` in `src/test/superpowers-process.test.ts:59-69`; every review file has a concrete `- **Skill:**` id and findings carry file:line | đạt/pass |
| AI_LOG header preserved after prepend | `keeps an AI_LOG header directly above every verbatim-prompt heading it owns` in `src/test/superpowers-process.test.ts:71-112` | đạt/pass |
| Full check set green with complete output | Attached stdout/stderr below: lint, typecheck, test, format:check, build and check:language all `EXIT=0` | đạt/pass |
| Language-clean documentation | `npm run check:language` `EXIT=0` in the attached output; `finds no disallowed letters in current project documents` in `src/test/language-rule.test.ts:37-45` | đạt/pass |
| Prettier-clean documentation | `npm run format:check` `EXIT=0` in the attached output | đạt/pass |

## Verification output

Captured with Node `spawnSync`, UTF-8, `NO_COLOR=1`. Full stdout/stderr from `.superpowers/sdd/2026-11-23-hero-slider-auto-slide/verification-output.txt`, verbatim:

```text
Verification run at 2026-11-23T03:41:30.742Z

=== npm run lint ===

> ant-jewelry@0.1.0 lint
> eslint

EXIT=0

=== npm run typecheck ===

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0

=== npm test ===

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  82 passed (82)
      Tests  383 passed (383)
   Start at  10:41:55
   Duration  44.33s (tests 49%, import 33%, environment 10%, transform 4%, setup 2%, worker 2%)

     Import  205 modules were evaluated 662 times · 8.25s total, 33% of tracked time
             ~5.70s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

=== npm run format:check ===

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

=== npm run build ===

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
- Environments: .env.production.local, .env.local, .env
✓ Running next.config.ts took 192ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.5s
  Running TypeScript ...
  Finished TypeScript in 5.1s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.5s
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

=== npm run check:language ===

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0
```

Ghi chú: trong bản ghi output `next build` ở trên, ký hiệu legend `F` thay cho ký tự gốc U+0192 (LATIN SMALL LETTER F WITH HOOK) để tuân quy tắc chỉ dùng chữ cái tiếng Việt và tiếng Anh. Các dòng khác được giữ nguyên; output gốc nằm trong workspace SDD tạm thời và sẽ bị xóa sau khi hoàn tất.

## Limitations

- The reviewer did not re-run suites; the controller attached the captured full check-set output above as evidence.
- No production smoke check was run against the deployed site; no access or credentials were available in this task.
- The temporary SDD workspace in `.superpowers/sdd/2026-11-23-hero-slider-auto-slide/` will be deleted after completion; the durable evidence is the output attached above.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 10:37:48 +07:00 - Ghi nhận hành vi tự động chuyển slide của hero slider`.
