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

- [ ] **Step 6: Commit and open the PR**

Commit docs and records with a Conventional Commits `docs(ci)` or `chore(ci)` title. Push `k1-performance-budget`, open the PR with the full captured check output in the body, and report the link.

---

### Task 4: Deliberate failing evidence pull request

**Files:**
- Create a throwaway branch only; no permanent repository file from this task.

**Interfaces:**
- Consumes: merged or pushed K1 workflow from Task 3.
- Produces: a link to a red `e2e` run whose Lighthouse assertion failed on Performance.

- [ ] **Step 1: Create the throwaway branch**

From the K1 branch, create `perf/negative-lighthouse-evidence`. Add one large unoptimized image reference on Home that raises the rendered image payload without using the optimizer. Do not merge the branch.

- [ ] **Step 2: Capture the red run**

Push the branch, open a draft PR, wait for the `e2e` job, and save the run link plus the Lighthouse assertion lines proving Performance fell below 0.85. Close the draft PR and delete the branch afterward.

- [ ] **Step 3: Record the evidence**

Add the run link and the observed assertion output to the K1 PR description or the review record. Mark clearly that this branch was intentionally never merged.

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

Run the focused guards, the full check set and a fresh CI run on the K1 branch before treating the red Performance evidence as valid. Record the original sandbox failure and the fix in AI_LOG and a review record.
