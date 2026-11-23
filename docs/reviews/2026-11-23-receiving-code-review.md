# Code review - owner feedback H1 on hero slider a11y (2026-11-23)

- **Skill:** receiving-code-review
- **Scope:** owner feedback H1 on hero slider a11y and the rule that a mandatory a11y requirement cannot be dismissed as a non-goal; branch `fix/hero-slider-a11y-pause-controls`
- **Base:** `78b22a8` | **Head:** working tree of `fix/hero-slider-a11y-pause-controls`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 14:05:59 +07:00 - Thêm rule a11y và sửa hero slider có nút dừng`.

## Method

Loaded `receiving-code-review`, `systematic-debugging` and `test-driven-development` by exact id. Re-read the whole source of `hero-slider.tsx`, both hero-slider test files, `AGENTS.md`, `docs/reviews/2026-11-23-requesting-code-review.md`, `docs/reviews/TEMPLATE.md`, `docs/CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, the local Next.js client component guide and the new E2E spec before accepting any finding. Grepped every `aria-live` and `HeroSlider` consumer in `src` and `e2e` to confirm the changed values only affect the home carousel. Treated the owner feedback as trusted after verifying it against the real source: the timer effect at the old `hero-slider.tsx:22-30` had no stop condition. Wrote five fake-timer unit tests and two Playwright tests first, watched them fail, then implemented the fix and watched them pass.

This round adds no independent finding beyond the owner feedback and the mentor checklist already recorded in `AGENTS.md`; the tables below are evidence for those items, not a new review result.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| H1 | Critical · `src/features/layout/components/hero-slider.tsx:22-30` (before fix) | Open `/` and wait 5 seconds without interacting: the slide changes and keeps looping forever. There is no Pause control, no pause on hover or focus, and no `prefers-reduced-motion` handling. This violates WCAG 2.2.2 (Pause, Stop, Hide) and the WAI-ARIA APG carousel pattern. axe and the existing E2E suite still pass because axe does not detect this failure. | **Accepted (fixed in `fix/hero-slider-a11y-pause-controls`)** |
| H2 | Important · `docs/reviews/2026-11-23-requesting-code-review.md:24,37-38` and `AGENTS.md` standing rules | A reviewer closed pause-on-hover/focus as an explicit non-goal and reduced motion as silent in the spec, without asking the project owner. A mandatory a11y requirement was dropped without authorization. | **Accepted (fixed in `fix/hero-slider-a11y-pause-controls`)** |

## Declined to judge

- Production smoke on the deployed site: no access or credentials in this task.
- Accessibility defects outside the hero slider: not raised by the owner feedback and not found while reading the touched files.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Pause/Play control with an aria-label that follows the state | Unit test `pauses and resumes from the Pause/Play button and updates the live region`; E2E test `hero slider pause control stops auto advance and play resumes it` in `e2e/hero-slider-a11y.spec.ts` | đạt/pass |
| Auto advance pauses on hover | Unit test `pauses auto slide while the pointer is over the slider` | đạt/pass |
| Auto advance pauses while focus is inside the slider and resumes when focus leaves | Unit test `pauses auto slide while focus is inside the slider and resumes when focus leaves` | đạt/pass |
| `prefers-reduced-motion: reduce` disables auto advance, including a preference change after load | Unit tests `never auto slides when the user prefers reduced motion` and `stops auto advancing when the reduced motion preference changes`; E2E test `hero slider does not auto advance when reduced motion is preferred` using `page.emulateMedia` | đạt/pass |
| Live region is `off` while auto advancing and `polite` when stopped | Unit test `pauses and resumes from the Pause/Play button and updates the live region`; both E2E tests | đạt/pass |
| Flow test across the browser-to-component boundary, not unit RED→GREEN alone | `e2e/hero-slider-a11y.spec.ts`, 4 passed across `desktop-chrome` and `pixel-7` | đạt/pass |
| Pre-existing auto slide behavior is preserved | Five original fake-timer tests plus static markup tests; 16 passed in the two hero-slider unit test files | đạt/pass |
| New rule and documentation in place | `AGENTS.md` rule 11, `docs/ARCHITECTURE.md:72`, and `keeps an AI_LOG header directly above every verbatim-prompt heading it owns` in `src/test/superpowers-process.test.ts` | đạt/pass |
| Previous AI_LOG header survives the prepend | Manual check of the `##` line directly below the new `---`, plus `keeps an AI_LOG header directly above every verbatim-prompt heading it owns` in `src/test/superpowers-process.test.ts` | đạt/pass |
| Full check set green with complete output | Attached stdout/stderr below: lint, typecheck, test, format:check, build, check:language all `EXIT=0` | đạt/pass |
| Language-clean documentation | `npm run check:language` `EXIT=0` in the attached output | đạt/pass |

## Verification output

Captured with Node `spawnSync`, UTF-8, `NO_COLOR=1`. Full stdout/stderr, verbatim:

```text
Verification run at 2026-11-23T07:10:58.847Z

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
      Tests  388 passed (388)
   Start at  14:11:18
   Duration  44.93s (tests 49%, import 33%, environment 11%, transform 4%, setup 2%, worker 2%)

     Import  205 modules were evaluated 662 times · 8.45s total, 33% of tracked time
             ~5.83s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
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
✓ Running next.config.ts took 36ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 2.4s
  Running TypeScript ...
  Finished TypeScript in 4.3s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.1s
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

Ghi chú: trong bản ghi output `next build` ở trên, ký hiệu legend `F` thay cho ký tự gốc U+0192 (LATIN SMALL LETTER F WITH HOOK) để tuân quy tắc chỉ dùng chữ cái tiếng Việt và tiếng Anh. Các dòng khác được giữ nguyên.

## Limitations

- The reviewer did not re-run suites independently; the controller attached the captured full check-set output above as evidence.
- No production smoke check was run against the deployed site; no access or credentials were available in this task.
- Reduced-motion detection depends on the browser `window.matchMedia`; unit tests use a stub and E2E uses `page.emulateMedia`.
- This round contains no independent findings beyond the owner feedback and the existing mentor checklist.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 14:05:59 +07:00 - Thêm rule a11y và sửa hero slider có nút dừng`.
