# Performance Budget (K1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CI fail when a local production build falls below the documented Lighthouse budget for four storefront pages, and keep the reports out of git.

**Architecture:** Add `@lhci/cli` to the existing `e2e` job so it reuses that job's Chromium install, seeded SQLite database and production build. A root `lighthouserc.json` defines four mobile URLs, three runs, median assertions and a filesystem upload; the workflow uploads that directory as an artifact. Guard tests read the config and workflow text so future edits cannot silently weaken the budget.

**Tech Stack:** Next.js 16.4.5, Node 22, `@lhci/cli` 0.16.1, Playwright Chromium, GitHub Actions, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-25-performance-budget-design.md`

## Global Constraints

- Work on `k1-performance-budget` from `origin/main`; never commit to `main`.
- Only Vietnamese and English letters in written text; `npm run check:language` must stay clean.
- Keep the four required status check names exactly `static`, `test`, `build`, `e2e`.
- Use the exact thresholds: Performance 0.85, Accessibility 0.90, SEO 0.95, CLS 0.1, all median.
- Reports go to `lhci-report/` and are uploaded as an artifact; no report file is committed.
- Capture every check command with Node `spawnSync`, `encoding: 'utf8'`, `NO_COLOR: '1'`; never PowerShell redirection.
- The PR body contains the complete captured check output with every `EXIT=` line.
- Do not silence Prisma `P2021` logs; verify the build exit code and correct stale documentation only.

## Review Focus

- A changed threshold or URL in `lighthouserc.json` that no test notices: `lighthouse-config.test.ts` pins every URL, run count, threshold and aggregation method.
- A report directory committed by accident: the config test and `lighthouse-reports.test.ts` both guard allowed report files, and `.gitignore` carries `/lhci-report/`.
- An artifact upload that only runs on success: the workflow guard asserts `if: always()` and the exact `lhci-report/` path.
- A server that never becomes ready because the Next.js banner changed: verify `startServerReadyPattern` against a real `next start` log before relying on CI.
- Chromium that cannot start on `ubuntu-latest`: `ci.collect.settings.chromeFlags` must include `--no-sandbox`, guarded by `lighthouse-config.test.ts`, or the job fails before reaching the budget assertions.
- A build with no Prisma tables that is assumed broken: capture a real empty-database `npm run build` exit code instead of repeating documentation hearsay.

---

### Task 1: Lighthouse CI configuration and guard test

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `lighthouserc.json`
- Modify: `.gitignore`
- Test: `src/test/lighthouse-config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `lighthouserc.json` with `ci.collect`, `ci.assert`, `ci.upload`; `lhci-report/` as the artifact directory consumed by Task 2; `npm run check:language` still clean.

- [x] **Step 1: Write the failing config guard test**

Create `src/test/lighthouse-config.test.ts` reading `lighthouserc.json` with `JSON.parse` and asserting:
`ci.collect.numberOfRuns === 3`; `ci.collect.url` equals the four exact URLs `http://127.0.0.1:3200/`, `http://127.0.0.1:3200/c/wedding-ring`, `http://127.0.0.1:3200/p/aurora-band`, `http://127.0.0.1:3200/blog/cach-chon-nhan-cuoi-phu-hop`; `settings.formFactor === 'mobile'`; `settings.throttlingMethod === 'simulate'`; `startServerCommand` contains `--port 3200`; the four assertions have minScore/maxNumericValue 0.85/0.90/0.95/0.1 and `aggregationMethod: 'median'`; `ci.upload.target === 'filesystem'` and `outputDir === './lhci-report'`; `.gitignore` contains `/lhci-report/`.

- [x] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/test/lighthouse-config.test.ts`
Expected: FAIL because `lighthouserc.json` does not exist.

- [x] **Step 3: Install the CLI and write the config**

Run `npm install --save-dev @lhci/cli@0.16.1`. Write `lighthouserc.json` with the values pinned above, using `startServerReadyPattern: "Local:\\s+http://127\\.0\\.0\\.1:3200"`, the regex verified against the Next.js 16 banner in Step 5. Add `/lhci-report/` under the testing block in `.gitignore`.

- [x] **Step 4: Run the guard test and language check**

Run: `npx vitest run src/test/lighthouse-config.test.ts && npm run check:language`
Expected: both exit 0.

- [x] **Step 5: Verify the real server banner**

Run the production server on port 3200 with `DATABASE_URL=file:./prisma/e2e.db` after a seeded build, capture its stdout, and confirm the Next.js 16 `Local: http://127.0.0.1:3200` line. The committed pattern is `Local:\\s+http://127\\.0\\.0\\.1:3200`; adjust only if a future banner differs.

- [x] **Step 6: Commit**

```bash
git add package.json package-lock.json lighthouserc.json .gitignore src/test/lighthouse-config.test.ts
git commit -m "chore(ci): add lighthouse ci configuration and guard"
```

---

### Task 2: Run Lighthouse CI inside the e2e job

**Files:**
- Modify: `.github/workflows/ci.yml`
- Test: `src/test/ci-workflow.test.ts`

**Interfaces:**
- Consumes: `lhci-report/` from Task 1; `e2e/reset-database.ts` and `npm run start -- --hostname 127.0.0.1 --port 3200`.
- Produces: an `e2e` job that fails on budget regressions and always uploads `lhci-report/`.

- [x] **Step 1: Write the failing workflow guard test**

Extend `src/test/ci-workflow.test.ts` with a test that reads the `e2e` job block and asserts it contains: a step writing `CHROME_PATH` to `$GITHUB_ENV`; `npx tsx e2e/reset-database.ts && npm run build`; `run: npx lhci autorun`; `actions/upload-artifact@v4`; `if: always()`; `name: lighthouse-report`; `path: lhci-report/`; `retention-days: 7`. Keep the existing four-job and Playwright upload assertions unchanged.

- [x] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/test/ci-workflow.test.ts`
Expected: FAIL on the new Lighthouse assertions.

- [x] **Step 3: Add the workflow steps**

After `npm run test:e2e` in the `e2e` job, add in order: resolve Playwright Chromium into `CHROME_PATH` via `$GITHUB_ENV`; reset the E2E database and rebuild with `DATABASE_URL=file:./prisma/e2e.db`, `AUTH_SECRET: e2e-only-auth-secret-not-for-production` and `NEXT_TELEMETRY_DISABLED: '1'`; run `npx lhci autorun` with the same env; upload `lhci-report/` with `if: always()` and 7-day retention. Do not add `continue-on-error`.

- [x] **Step 4: Run the guard test**

Run: `npx vitest run src/test/ci-workflow.test.ts`
Expected: PASS, including the pre-existing workflow tests.

- [x] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml src/test/ci-workflow.test.ts
git commit -m "chore(ci): gate storefront pages with lighthouse ci"
```

---

### Task 3: Documentation, empty-database verification and PR record

**Files:**
- Modify: `docs/PERFORMANCE.md`, `docs/DEPLOY.md`, `AI_LOG.md`
- Create: `docs/reviews/2026-11-25-requesting-code-review-performance-budget.md`

**Interfaces:**
- Consumes: passing guard tests from Tasks 1 and 2; the verbatim owner prompt in the attached session export.
- Produces: documentation consistent with the workflow, an AI_LOG entry, a review record, and a PR body with full check output.

- [x] **Step 1: Verify build without Prisma tables**

Create a temporary empty SQLite file outside git, run `DATABASE_URL=<absolute file url> npm run build`, record the full output and `EXIT=`, then delete the temporary file. Expected: exit 0 with `prisma:error` lines; do not change application logging.

- [x] **Step 2: Update the stale deployment sentence**

In `docs/DEPLOY.md`, replace the claim that `generateStaticParams` returns empty params on `P2021` with the current `__empty__` placeholder behavior, and link to the verified build output recorded in AI_LOG.

- [x] **Step 3: Document the CI budget**

Add a section to `docs/PERFORMANCE.md` naming the four pages, three mobile runs, median thresholds and the `lighthouse-report` artifact. Link to the workflow rather than pasting numbers from any single run.

- [x] **Step 4: Capture the full check set**

Using Node `spawnSync` with `encoding: 'utf8'` and `NO_COLOR: '1'`, run `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`, `npm run check:language`, and `npx vitest run src/test/lighthouse-config.test.ts src/test/ci-workflow.test.ts`. Set `DATABASE_URL=file:./prisma/e2e.db` for `npm run build`. Save stdout, stderr and `EXIT=` for each. Replace any Next.js legend character `F` made from U+0192 and note the substitution in the record.

- [x] **Step 5: Review, record and prepend AI_LOG**

Load the exact skill id `requesting-code-review`, re-read every touched file and grep every consumer of the changed values, then save the complete review in `docs/reviews/2026-11-25-requesting-code-review-performance-budget.md` using `docs/reviews/TEMPLATE.md`. Prepend an `AI_LOG.md` entry with the verbatim prompt, accepted and rejected findings, `AI sai ở đâu` with concrete examples, and limitations. Verify the previous `##` header immediately follows the new `---`.

- [x] **Step 6: Commit and open the PR**

Commit docs and records with a Conventional Commits `docs(ci)` or `chore(ci)` title. Push `k1-performance-budget`, open the PR with the full captured check output in the body, and report the link: https://github.com/khanhtung2410/ant-jewelry/pull/166.

---

### Task 4: Deliberate failing evidence pull request

**Files:**
- Create a throwaway branch only; no permanent repository file from this task.

**Interfaces:**
- Consumes: merged or pushed K1 workflow from Task 3.
- Produces: a link to a red `e2e` run whose Lighthouse assertion failed on Performance.

- [x] **Step 1: Create the throwaway branch**

From the K1 branch, create `perf/negative-lighthouse-evidence`. Add one large unoptimized image reference on Home that raises the rendered image payload without using the optimizer. Do not merge the branch. Commit `3afec1d` added a 13,060,440-byte WebP through a plain `<img>` on Home; it was never merged.

- [x] **Step 2: Capture the red run**

Push the branch, open a draft PR, wait for the `e2e` job, and save the run link plus the Lighthouse assertion lines proving Performance fell below 0.85. Close the draft PR and delete the branch afterward. Run: https://github.com/khanhtung2410/ant-jewelry/actions/runs/45652227977; draft PR: https://github.com/khanhtung2410/ant-jewelry/pull/167 (closed, never merged); branch deleted.

- [x] **Step 3: Record the evidence**

Add the run link and the observed assertion output to the K1 PR description or the review record. Mark clearly that this branch was intentionally never merged. The output is in PR 166 and `docs/reviews/2026-11-25-requesting-code-review-sandbox-fix.md`: `categories.performance failure for minScore assertion`, `expected: >=0.85`, `found: 0.72`, `all values: 0.63, 0.72, 0.73`.

---

### Task 5: Hosted-runner Chromium fix (2026-11-25, after the first CI runs)

**Files:**
- Modify: `lighthouserc.json`, `src/test/lighthouse-config.test.ts`, `docs/PERFORMANCE.md`, this plan and its spec.

**Interfaces:**
- Consumes: the two red `ci` runs on PR 166 and the throwaway PR 167, both failing in `ChromeLauncher` with `No usable sandbox!`.
- Produces: an `e2e` job that reaches the Lighthouse assertions on `ubuntu-latest`; the guard test must fail before the config change.

- [x] **Step 1: Write the failing guard test**

Add a case to `src/test/lighthouse-config.test.ts` asserting `ci.collect.settings.chromeFlags` contains `--no-sandbox`. Capture the RED output with the required `spawnSync` helper before editing the config.

- [x] **Step 2: Add the minimal config and documentation fix**

Set `ci.collect.settings.chromeFlags` to `--no-sandbox` in `lighthouserc.json`. Document the runner restriction in `docs/PERFORMANCE.md` and reconcile the spec and plan with the new setting.

- [x] **Step 3: Verify and record**

Run the focused guards, the full check set and a fresh CI run on the K1 branch before treating the red Performance evidence as valid. Record the original sandbox failure and the fix in AI_LOG and `docs/reviews/2026-11-25-requesting-code-review-sandbox-fix.md`. Green CI run: https://github.com/khanhtung2410/ant-jewelry/actions/runs/45651127274. The first 167 run (`45649277989`) was invalid because it stopped at `No usable sandbox!`; that error is recorded in AI_LOG and was corrected before the valid red run above.

---

### Task 6: Fix the layout shift found by the new budget (2026-11-25, after PR 166 was opened)

**Files:**
- Modify: `src/features/blog/components/blog-detail.tsx`, `src/features/blog/components/blog-detail.test.tsx`, `docs/PERFORMANCE.md`, this plan and its spec.

**Interfaces:**
- Consumes: run `45655992481` and its `lighthouse-report` artifact, where the blog detail page had median CLS 0.2515 and Performance 0.76 against the 0.85 budget.
- Produces: explicit cover dimensions so the browser reserves space before a late image loads, with a test that fails without them.

- [x] **Step 1: Write the failing test**

Add a case to `src/features/blog/components/blog-detail.test.tsx` asserting the cover `<img>` carries `width="1200"` and `height="630"`. Capture the RED output in `.superpowers/sdd/2026-11-25-performance-budget/cls-red-checks.md` (`EXIT=1`) before touching the component.

- [x] **Step 2: Fix the source**

Add `width={1200}` and `height={630}` to the cover image in `src/features/blog/components/blog-detail.tsx`. Do not change the 0.1 CLS threshold or the 0.85 Performance threshold. Record the artifact evidence in `docs/PERFORMANCE.md` and reconcile the spec. Review refinement: attributes alone are not enough when the real cover has a different ratio, so the image now sits in a fixed `aspect-[1200/630]` box with `absolute inset-0 h-full w-full object-cover`; arbitrary covers are cropped. The guard reads the seed asset `viewBox` and uses shared dimension constants.

- [x] **Step 3: Verify and record**

Run the focused guard and the full check set, push the fix, confirm a green CI run on PR 166, and save a review record plus an AI_LOG entry that states the artifact evidence and the rejected option of widening thresholds. Run `45658516997` was green for the intermediate attributes-only commit `cfd291f`; the final fixed-box head `f0fe22a` passed all four checks in run `45660888483` (`e2e` in 6m27s). The review record and AI_LOG link both runs and reject widening the thresholds.

---

### Task 7: Fix the Home layout shift caused by the public loading fallback (2026-11-26)

**Files:**
- Delete: `src/app/(public)/loading.tsx`, `src/test/home-layout-shift.test.tsx`
- Modify: `src/app/(public)/page.tsx` (restore the original `content-visibility` styles), `docs/PERFORMANCE.md`, this plan and its spec, `AI_LOG.md`
- Create: `src/test/public-loading-boundary.test.ts`, `docs/reviews/2026-11-26-requesting-code-review-home-cls.md`

**Interfaces:**
- Consumes: red runs `45663125186` (docs-only head, Home Performance `0,68`, CLS `0,5164` in all three runs) and `45682997369` (first attempted fix, CLS `0,5164` in two runs), plus their `lighthouse-report` artifacts.
- Produces: a public segment with no broad loading fallback, so streamed Home content cannot push the footer down after first paint; thresholds and URLs stay unchanged.

- [x] **Step 1: Reject the first hypothesis with hosted evidence**

  Compare the Home reports of `45663125186` and `45682997369`. Both show the same footer shift and the same CLS `0.5164034021871203`, even though `d3f5797` removed `content-visibility` from Home. Performance did not improve (`0,67` median). Removing that defer is therefore not the fix; restore `src/app/(public)/page.tsx` to `36e53bf` and delete the guard that encoded the wrong hypothesis.

- [x] **Step 2: Reproduce the real mechanism with a correct local build**

  The earlier probe server was serving a stale CSS file without Tailwind utilities (footer height ~1818 px), unlike the hosted footer height of 425 px. Restart `next start` from the current build, then rerun the Playwright `layout-shift` observer at `412x823` with CPU throttling rate 4. The initial HTML contains the `(public)/loading.tsx` fallback (`Loading page...`, main ~214 px, footer `top=398`); the streamed Home content (~3252 px) replaces it and moves the footer to `top=3351`, producing a shift of `0,52`. Removing the `loading.tsx` file from a local build removes every observed shift while keeping all four pages cached and prerendered. Save the diagnosis outside git.

- [x] **Step 3: Write the failing guard and apply the fix**

  Create `src/test/public-loading-boundary.test.ts` resolving its directory from `import.meta.url` and scanning for any `loading.{js,jsx,ts,tsx}` under `src/app/(public)`. Capture `EXIT=1` while `src/app/(public)/loading.tsx` exists in `.superpowers/sdd/2026-11-25-performance-budget/public-loading-red-checks.md`. Delete the file; the guard passes and the full check set in `loading-boundary-green-checks.md` is all `EXIT=0`. The root `src/app/loading.tsx` stays because its fallback replaces the whole route and produced zero observed shifts. No threshold, URL or check name is changed.

- [x] **Step 4: Confirm on the hosted runner and reconcile records**

  Push the fix, require a fresh run with all four checks green, then update `docs/PERFORMANCE.md`, this plan, the spec, `AI_LOG.md`, the review record and the PR body with both red runs and the green run. Run `45686913214` at `fa95cb6` passed `static`, `test`, `build` and `e2e` (`conclusion=success`, `e2e` in 7m10s, 12 Lighthouse runs, no failed assertion); JSON and log are in `final-hosted-green.md`. The PR body also links the rerun at the final hardened head.

- [x] **Step 5: Apply the review round**

  Load the exact skill id `requesting-code-review`, save `docs/reviews/2026-11-26-requesting-code-review-home-cls.md`, and record accepted and rejected findings in `AI_LOG.md`. Accept the broader public-segment guard and the missing-record finding; reject removing the root fallback because it replaces the whole route and the corrected probe recorded zero shifts.

---

### Task 8: Fix the blog body layout shift after the merge with main (2026-11-26)

**Files:**
- Modify: `src/features/shared/lib/markdown.tsx`, `src/features/shared/lib/markdown.test.tsx`, `src/features/blog/components/blog-detail.tsx`, `src/features/blog/components/blog-detail.test.tsx`
- Modify: `src/app/layout.tsx`, create `src/test/font-preload.test.ts`
- Modify: `docs/PERFORMANCE.md`, this plan and its spec, `AI_LOG.md`
- Create: `docs/reviews/2026-11-26-requesting-code-review-inline-blog-image.md`

**Interfaces:**
- Consumes: red run `45734845362` at head `d6c23dc` and its `lighthouse-report` artifact, where the blog detail page had Performance median `0.75` and CLS median `0.2515188335358445` in two of three runs.
- Produces: reserved dimensions for inline Markdown images so a late load cannot shift the footer; thresholds, URLs and required check names stay unchanged.

- [x] **Step 1: Find the root cause before editing**

  Load `systematic-debugging`. Read the failed `e2e` log and compare the artifact of `45734845362` with green run `45689666414`. The failures name the blog URL, not Home; the shift subitem points to `/mock/blog/cover-wedding-band.svg` with `cause = Media element lacking an explicit size`. The changed source between the green head and the failed head is only the PR 168 merge into `main`; the blog cover component is unchanged. Grep the image class and find `renderMarkdown` in `src/features/shared/lib/markdown.tsx`, which emits inline `<img>` with no width/height. Reject "retry the run" and "widen the threshold" because the artifact proves a real layout defect.

- [x] **Step 2: Write the RED test and apply the minimal fix**

  Load `test-driven-development`. Add a case to `markdown.test.tsx` asserting the emitted image carries `width="1200"` and `height="630"`; capture RED (`markdown-image-red-checks.md`, `EXIT=1`) before touching source. Export `BLOG_IMAGE_WIDTH`/`BLOG_IMAGE_HEIGHT` from `markdown.tsx`, use them on the inline image, and make `blog-detail.tsx` re-export them as its cover constants to remove duplicated literals. Re-run the focused tests for Markdown and `BlogDetail` (`markdown-image-green-checks.md`, `EXIT=0`). Read every touched file in full and grep every consumer of the constants before accepting the result.

- [x] **Step 3: Verify the rendered behavior locally**

  Run `npm run build` (`build-after-markdown-fix.md`, `EXIT=0`). Run Lighthouse locally against only the blog URL with the same mobile/simulate settings, three passes, and the committed thresholds (`lhci-local-blog-after-markdown-fix.md`, `EXIT=0`). Inspect the raw reports: CLS `0` in all three passes, `unsized-images.score = 1`, Performance `0.92 / 0.86 / 0.83` (median `0.86`). Keep the reports outside git. This evidence was later superseded: the review found the arbitrary-ratio path and a separate font-swap shift.

- [x] **Step 3b: Fix the remaining font swap**

  Load `test-driven-development` again. Trace the second local CLS cause to a late Montserrat Latin-ext font; inspect the generated CSS and the Next.js font guide. Write `src/test/font-preload.test.ts` RED (`font-optional-red-checks.md`, `EXIT=1`), set `display: 'optional'` on both fonts in `src/app/layout.tsx`, and keep the original subsets after the extra `latin-ext` preload lowered Performance (`font-no-extra-preload-green-checks.md`, `EXIT=0`, `font-optional-flow.md`, `EXIT=0`). Rebuild (`build-after-font-optional.md`, `EXIT=0`) and rerun the blog-only LHCI (`lhci-local-blog-after-font-optional.md`): CLS `0` in all three passes, Performance `0.6 / 0.75 / 0.76`. Do not claim the budget is met from this local result.

- [ ] **Step 4: Review, record and get a fresh hosted green run**

  Load `requesting-code-review` and save a review record using `docs/reviews/TEMPLATE.md` with every finding, severity, reproduction and decision; load `verification-before-completion` before claiming a pass. Run the full check set and capture all output with `EXIT=` lines. Prepend the new `AI_LOG.md` entry with the verbatim prompt, self-verification, concrete AI mistakes, limitations and accepted/rejected findings. Push the final head, wait for a hosted run where `static`, `test`, `build` and `e2e` all pass, then replace the PR body with the full captured output, the red and green run links, and report both PR links.
