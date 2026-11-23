# Code review - Task 1 hero slider auto slide (2026-11-23)

- **Skill:** subagent-driven-development
- **Scope:** Task 1 of `docs/superpowers/plans/2026-11-23-hero-slider-auto-slide.md`: auto-advance effect in `hero-slider.tsx` and the new fake-timer test file.
- **Base:** `e48f27c` | **Head:** `a3c7207`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 10:37:48 +07:00 - Ghi nhận hành vi tự động chuyển slide của hero slider`.

## Method

Task reviewer fresh-context, read-only, dispatched by the exact skill id `subagent-driven-development`. The reviewer read the task brief, the implementer report and the review package `review-task1.diff`, and verified spec compliance and code quality against the diff. The controller re-read the whole of `src/features/layout/components/hero-slider.tsx`, grepped every `HeroSlider` consumer and read `src/app/(public)/page.tsx` before accepting the finding. `test-driven-development` was loaded by exact id for the implementation round.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `src/features/layout/components/hero-slider.tsx:27` | With six slides at index 4, a server refresh shrinks the prop to three slides. The display clamps to index 2, but the timeout computes `(4 + 1) % 3 = 2`, so the slide does not visibly change and the effect does not re-run; auto-advance stalls. Labeled plan-mandated because the brief contained the unclamped snippet. | **Accepted (fixed in `feat/hero-slider-auto-slide`, commit `646df7d`)** — clamped updater plus a flow test for the shrink-while-mounted case. |
| 2 | Minor · `task-1-report.md:219-221` | Vitest prints an informational `isolate: false` performance tip in the full-suite output. It is pre-existing and not a failure. | **Rejected (informational output, unrelated to this change and not actionable here)** |
| 3 | Minor · `src/features/layout/components/hero-slider.tsx:22` | The effect's `< 2` slides branch uses bare `return;` rather than `return undefined;`. Type-correct and behaviorally identical. | **Rejected (purely cosmetic; no behavior or type impact)** |

## Declined to judge

- The six verification commands: the reviewer did not re-run them because the implementer's report carries full output for exactly this code. Controller re-runs the full set at final verification.
- `AGENTS.md` standing-agreement items (`AI_LOG.md`, docs update, PR): outside Task 1's two-file brief; the controller owns them.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Auto-advance fires exactly at 5000 ms and loops | `stays on slide 1 until 5000 ms, then advances one slide every 5000 ms and loops` in `hero-slider.auto-slide.test.tsx`; RED at `task-1-report.md:50-64`, GREEN at `task-1-report.md:118-129` | đạt/pass |
| Manual navigation restarts the countdown | `restarts the countdown when the user selects a slide`, `task-1-report.md:66-80` | đạt/pass |
| No timer for fewer than two slides | `does not schedule a timer for fewer than two slides`, `task-1-report.md:105` | đạt/pass |
| Timer cleared on unmount | `clears the timer on unmount`, `task-1-report.md:82-99` | đạt/pass |
| Existing static markup unchanged | `npx vitest run src/features/layout/components/hero-slider.test.tsx`, 6/6 at `task-1-report.md:133-147` | đạt/pass |
| Full suite and build | `npm test` 82 files / 382 tests and `npm run build`, `task-1-report.md:204-302` | đạt/pass |

## Verification output

Full command outputs with exit codes are attached verbatim in `.superpowers/sdd/2026-11-23-hero-slider-auto-slide/task-1-report.md`, sections "TDD evidence", "Full verification (all before commit)" and "Production build"; every command shows `EXIT=0` except the expected RED run with `EXIT=1`. The controller re-ran the full check set before the PR; see `docs/reviews/2026-11-23-requesting-code-review.md`.

## Limitations

- The reviewer did not re-run tests per the task-review contract; evidence is the implementer's captured output.
- The shrink-while-mounted scenario was found during review and fixed in a later round, recorded in `2026-11-23-subagent-driven-development-fix1.md`.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 10:37:48 +07:00 - Ghi nhận hành vi tự động chuyển slide của hero slider`.
