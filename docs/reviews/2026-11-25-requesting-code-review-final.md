# Code review - Final whole-branch review (2026-11-25)

- **Skill:** `requesting-code-review`
- **Scope:** final whole-branch review of the post-2026-11-21 test flow plan, including deferred findings from all task rounds
- **Base:** `eb7e241` | **Head:** `31a4a56`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 12:44:33 +07:00 - Bổ sung coverage và verification cho các cập nhật mới`.

### Spec compliance

**Verdict: đạt/pass.** The whole branch from `eb7e241` to `31a4a56` satisfies the binding spec, the implementation plan and the standing project constraints. No Critical or Important defect remains. The eight coverage bullets required by Task 5 Step 1 map cleanly to the spec sections and to audit rows C-1 through C-8; the separate stale-capture cleanup goal maps to C-9.

| Plan coverage bullet | Audit row | Spec authority | Named evidence | Result |
|---|---|---|---|---|
| Hero slider auto-advance and manual reset | C-1 | `docs/superpowers/specs/2026-11-25-new-update-test-flow-design.md:63-73` | `e2e/hero-slider.spec.ts:13-30,78-94`; E2E cases 1, 4, 6 and 9 | pass |
| Hover and focus pause | C-2 | Spec `:68-70` and Review Focus `:26-27` | `e2e/hero-slider.spec.ts:32-76`, 2-second windows at `:45-47,68-70`, hydration gate at `:38-42,61-65`; E2E cases 2, 3, 7 and 8 | pass |
| Reduced motion | C-3 | Spec `:12-13` and `:21-25` | Pre-existing `e2e/hero-slider-a11y.spec.ts:8-20`; unit coverage at `hero-slider.auto-slide.test.tsx:267-292` | pass as no new gap; runtime `lacking evidence` in this targeted capture |
| Removed pause control | C-4 | Spec `:71` | `e2e/hero-slider.spec.ts:96-105`; E2E cases 5 and 10 | pass |
| CI required checks and deploy trigger | C-5 | Spec `:94-103` | `src/test/deploy-workflow-graph.test.ts:41-84`; existing `ci-workflow.test.ts` and `deploy-workflow.test.ts`; `npm test` 88 files / 445 tests | pass |
| Migration approval detection | C-6 | Spec `:75-92` | `scripts/detect-pending-migrations.mjs:28-65`; `src/test/detect-pending-migrations-cli.test.ts:8-71`; refusal string at script `:44` | pass |
| Alias capture, smoke and rollback | C-7 | Spec `:101-103` pins the real deploy chain; existing alias guard in `deploy-workflow.test.ts` | `src/test/deploy-workflow-graph.test.ts:67-77`; `deploy-workflow.test.ts:40-47,175-271` | pass. The spec does not spell "alias capture" literally, but the plan and audit do, and the existing text guard plus the real `deploy -> smoke -> rollback` edges cover it. |
| Documentation evidence | C-8 | Spec `:105-115` | `docs/DEPLOY.md` evidence retained; full normalized capture embedded in `pr-body-draft.md:24-263` | pass |
| Stale raw capture cleanup | C-9 | Spec Cleanup `:53-61` | `.txt` deleted; two references rewritten; literal grep under `docs/reviews` returns no matches | pass, with historical `.txt` phrases triaged below |

Spec non-goals are respected: no live GitHub Actions deploy, no owner-present rollback drill, no production smoke, and no new YAML parser dependency. The graph test reads the workflow files directly with `node:fs`, as specified.

## Method

- **Skill:** `requesting-code-review`, loaded by exact id before the review; recorded again in the branch verdict.
- **Scope:** final whole-branch review, base `eb7e241`, head `31a4a56`, branch `test/new-update-flow-coverage`.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 12:44:33 +07:00 - Bổ sung coverage và verification cho các cập nhật mới`; verbatim prompt lines: `clean stale report, review docs` / `use superpower to create new test flow (unit, integration, workflow) for all new update` / `review and check relevant changes again`.
- Self-review under that exact skill id. I read the whole plan, the whole binding spec, the ledger, the whole review package, the coverage audit, the first AI_LOG entry, all four task review records, `docs/reviews/TEMPLATE.md`, `final-checks.md`, `final-checks.raw.txt` and `pr-body-draft.md`. I then re-read the whole changed source and test files named in the findings before accepting any claim.
- No git command was re-run to re-derive the diff and the full check set was not re-run. All test claims point to the audited capture or to a named test. Focused checks were executed through Node `spawnSync` with UTF-8 and `NO_COLOR=1`; their complete output is in Verification output.
- The full review was first written to the scratch path requested by the controller and is saved here without changing its findings. No historical verbatim prompt, old plan text or committed review record was rewritten.

### Deferred finding triage

| # | Severity · file:line | Reproduction / effect | Decision | Merge impact |
|---|---|---|---|---|
| D-1 | Minor · `docs/reviews/2026-11-23-systematic-debugging-pr154.md:25,244` | Finding 1 and Limitations still say the `.txt` capture is kept, while `:32` now says it was removed as a duplicate on 2026-11-25. One historical record shows two states. | **Accepted as historical, not a defect** - rule 9 forbids rewriting historical verbatim records and the task brief named only `:32`. The later note at `:32` is the authoritative cleanup record; C-9 carried these to final review. | None |
| D-2 | Minor · Task 1 capture command | The Task 1 capture used `npx --no-install prisma db push` instead of the canonical npm script. | **Accepted and closed** - the final capture uses `npm run db:push` at `final-checks.md:16`, with the child environment recorded. | None |
| D-3 | Minor · `.superpowers/sdd/.../task-2-report.md:19-22` | Scratch deliverable summary still said timeout values were verbatim after the 2-second windows and hydration gate were added. | **Accepted and closed** - the scratch report is not committed; the audit C-2 and `pr-body-draft.md:12` state the exact departures. | None |
| D-4 | Minor · `e2e/hero-slider.spec.ts:96-105`; task review T2-2 | The browser test asserts `aria-live="off"` at load; the paused state is not asserted in a browser. | **Rejected as a defect** - the brief mandated exactly this load-time assertion and the spec's advancing-state requirement is met. A paused-state test is a new requirement, not a regression in this branch. | None |
| D-5 | Minor · `final-checks.md:209-238` | Playwright child processes emit `NO_COLOR is ignored due to FORCE_COLOR` warnings. | **Accepted as environmental noise** - warnings are retained verbatim, command `EXIT=0`; ledger ruling `:30` records why no task code changed. | None |
| D-6 | Minor · `src/test/detect-pending-migrations-cli.test.ts:52-70`, T3-1 | Injected runner is cast `as never` and does not assert `encoding: 'utf8'`. | **Accepted in `follow-up/cli-runner-contract`** - the brief mandated this exact stub shape; the typed runner and encoding assertion belong in the named follow-up branch. | None |
| D-7 | Minor · `scripts/detect-pending-migrations.mjs:71-74`, T3-2 | `process.exit(exitCode)` can truncate a piped refusal line before the stream drains. | **Accepted in `follow-up/cli-output-flush`** - pre-existing behavior-preserving pattern; switch to `process.exitCode` in the named follow-up. | None |
| D-8 | Minor · task review T3-3 | First Task 3 `format:check` failed before the two changed files were formatted. | **Rejected as a defect** - final captured `format:check` is `EXIT=0`; the only fix was formatting. | None |
| D-9 | Minor · `src/test/deploy-workflow-graph.test.ts:25-39,86-94`, T4-1 to T4-4 | Parser accepts only inline `needs:` text and two-space unquoted job ids; CI test has no non-vacuity guard; cycle walk runs only on `deploy.yml`. | **Accepted in `follow-up/workflow-graph-parser-hardening`** - plan-mandated helper and current YAML shape; named follow-up will harden both workflows and add the expected job count. | None |
| D-10 | Minor · T4-5 and T4-6 | Git LF-to-CRLF warning and Vitest `isolate: false` performance hint. | **Rejected as defects** - expected Windows normalization and a non-actionable tooling hint; `format:check` is green and the checkout is clean. | None |
| D-11 | Minor · C-3 and audit `:41,299-301` | Reduced-motion runtime is `lacking evidence` because the targeted E2E command runs only `e2e/hero-slider.spec.ts`. | **Accepted as an explicit limitation** - the a11y behavior is not a non-goal; the pre-existing reduced-motion browser test is retained, unit coverage exists, and this branch adds no new gap. | None |
| D-12 | Declined · audit `:28`, spec Non-goals `:32` | No production PostgreSQL status command, live deploy, production smoke or rollback drill was run. | **Accepted by design** - spec non-goal and no live target in this environment; local wrapper probe is recorded in Task 3. | None |
| D-13 | Declined · audit `:29` | No Figma pixel diff attempted. | **Accepted** - the Figma source file is not stored in the repository; comparison remains by link or screenshot, not pixel diff. | None |
| D-14 | Limitation · audit `:301`, AI_LOG `:38` | Browser evidence is Playwright output on `desktop-chrome` and `pixel-7` only. | **Accepted** - those are the two configured projects required by the plan; no manual or extra-project claim is made. | None |
| D-15 | Declined · audit `:31` | Historical verbatim prompt text in `AI_LOG.md` and old plans was not rewritten. | **Accepted** - global constraint; the new AI_LOG entry records the cleanup instead. | None |
| D-16 | Minor · `pr-body-draft.md:278` | PR body draft still contains literal `LINK_FINAL_REVIEW`. | **Verified and accepted as a controller step** - the placeholder is required to be present at this stage; replace it with the final review link when opening the PR. | None for branch code; one pre-PR documentation substitution remains |

### Strengths

- Capture integrity is proven: after dropping the normalization note and its blank line, the normalized capture matches the raw file exactly with four U+0192-to-F replacements, nine `EXIT=0` lines, and no diff.
- The pending-migration seam is behavior-preserving: pending banner wins before failure, empty or unknown output stays fail-closed, the refusal string and npm arguments are unchanged, and all consumers of both exports were grepped.
- The browser tests assert the real active dot after real hover and focus, use a 2-second window that was proved RED by mutation, and add a hydration gate that removed the observed `pixel-7` race.
- The workflow graph test resolves real `needs:` edges and pins the full deploy chain without adding a YAML dependency.
- Historical cleanup preserved the embedded output and did not rewrite old prompts; the dangling path is gone from `docs/reviews` while the one AI_LOG phrase remains correctly classified as historical.

### Issues

#### Critical

None. No source behavior was changed outside the tested, behavior-preserving CLI seam, and no production path was touched.

#### Important

None uncovered in this final round. Every Important gap recorded in C-1, C-2, C-4, C-5, C-6 and C-7 has a named test and captured evidence.

#### Minor

- D-1: the historical `.txt` claims at `docs/reviews/2026-11-23-systematic-debugging-pr154.md:25,244` still describe an earlier state. Accepted as historical, not merge-blocking.
- D-5: `NO_COLOR` / `FORCE_COLOR` warnings remain in the E2E capture. Accepted as environmental noise, not merge-blocking.
- D-6, D-7, D-9: three named follow-up branches carry runner typing, output flushing and parser hardening. Accepted as scheduled, not merge-blocking.
- D-11: reduced-motion runtime has no captured pass in this targeted check set. Explicitly `lacking evidence`, not a new gap and not merge-blocking.
- D-16: the PR body draft intentionally retains `LINK_FINAL_REVIEW` until the controller opens the PR. Not a branch defect.

## Findings and decisions

All findings from earlier rounds are decided in the triage table above with file:line, severity, reproduction and an explicit Accepted or Rejected decision. This final round adds no new finding. The only remaining action is documentation publication, not a code change.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Full check set green | `final-checks.md`: nine commands, nine `EXIT=0`, `npm test` 88 files / 445 tests, `npm run build` `EXIT=0` | pass |
| Raw and normalized captures agree | `FIRST_DIFF_AFTER_NORMALIZATION=NONE`, four U+0192 replacements | pass |
| PR body contains complete normalized output | `PR_BODY_EMBEDS_FULL_NORMALIZED_CAPTURE=true`, nine `EXIT=` lines, U+0192 note present | pass |
| CLI exports and consumers checked | Focused checks 1 and 2; `scripts/detect-pending-migrations.mjs:28,56,64,71`; `src/test/detect-pending-migrations-cli.test.ts:3-5,9-70` | pass |
| Browser pause behavior | E2E cases 2, 3, 7 and 8; 2-second windows and hydration gate in `e2e/hero-slider.spec.ts` | pass |
| Removed pause control guarded | E2E cases 5 and 10 | pass |
| Workflow graph resolved and acyclic | `src/test/deploy-workflow-graph.test.ts:41-95`; `npm test` 445 tests | pass |
| Language rule clean | `npm run check:language` `EXIT=0`; `PR_BODY_HAS_FORBIDDEN_U0192_CHARACTER=false` | pass |
| No dangling deleted path in reviews | `FOCUSED CHECK 3`: no matches under `docs/reviews`; one historical AI_LOG phrase at `:928` | pass with historical note |
| Reduced-motion runtime | Pre-existing file named; no runtime output in targeted capture | `lacking evidence` |
| Production live check | No target available, spec non-goal | `lacking evidence` by design |
| Final review | This file, exact skill id recorded | pass |
| PR link | Not created in this review; draft placeholder verified | `lacking evidence` until controller |

## Verification output

Focused checks were run through Node `spawnSync` with UTF-8 and `NO_COLOR=1`. Complete output:

```text
FOCUSED CHECK 1: literal classifyStatusCommand
.superpowers/sdd/2026-11-25-new-update-test-flow/pr-body-draft.md:13:- Export `classifyStatusCommand` and `runStatusCommand` from `scripts/detect-pending-migrations.mjs` without changing output or exit codes, then cover pending-first classification, refusal, spawn error and exact npm arguments.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:10:`classifyStatusCommand(result: { stdout?: string | null; stderr?: string | null; status?: number | null; error?: unknown }): { exitCode: number; stdout: string; stderr: string }`
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:20:import { classifyStatusCommand, runStatusCommand } from '../../scripts/detect-pending-migrations.mjs';
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:24:const result = classifyStatusCommand({
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:33:const result = classifyStatusCommand({ stdout: 'Database schema is up to date', stderr: '', status: 0 });
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:38:expect(classifyStatusCommand({ stdout: '', stderr: '', status: 0 }).stdout).toBe('true\n');
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:39:expect(classifyStatusCommand({ stdout: 'unknown wording', stderr: '', status: 0 }).stdout).toBe('true\n');
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:43:const result = classifyStatusCommand({ stdout: '', stderr: 'P1001', status: 1 });
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:50:const result = classifyStatusCommand({ stdout: '', stderr: '', status: null, error: new Error('spawn failed') });
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:77:Expected: FAIL because `classifyStatusCommand` and `runStatusCommand` are not exported.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:15:`classifyStatusCommand is not a function` va `runStatusCommand is not a function`.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:17:3. GREEN: them hai export, tach logic thanh `classifyStatusCommand` va `runStatusCommand`,
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:68:TypeError: classifyStatusCommand is not a function
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:72:6|     const result = classifyStatusCommand({
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:80:TypeError: classifyStatusCommand is not a function
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:84:15|     const result = classifyStatusCommand({ stdout: 'Database schema is…
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:92:TypeError: classifyStatusCommand is not a function
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:96:20|     expect(classifyStatusCommand({ stdout: '', stderr: '', status: 0 }…
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:98:21|     expect(classifyStatusCommand({ stdout: 'unknown wording', stderr: …
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:104:TypeError: classifyStatusCommand is not a function
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:108:25|     const result = classifyStatusCommand({ stdout: '', stderr: 'P1001'…
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:116:TypeError: classifyStatusCommand is not a function
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:120:32|     const result = classifyStatusCommand({ stdout: '', stderr: '', sta…
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-review.md:2:- ✅ Spec compliant: `scripts/detect-pending-migrations.mjs:28` exports `classifyStatusCommand(result)` and `:56` exports `runStatusCommand(options = {})`; both return `{ exitCode, stdout, stderr }` as required by `task-3-brief.md:9-12`.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-5-brief.md:59:consumer of `runStatusCommand`, `classifyStatusCommand`, and the deleted capture path. Write
docs/reviews/2026-11-25-requesting-code-review-test-coverage.md:21:| C-6 | Important · `src/test/detect-pending-migrations-cli.test.ts:8-71`; `src/test/detect-pending-migrations.test.ts:5-40` | At `eb7e241`, only classifier unit tests existed; the wrapper's exit codes, refusal message and exact npm arguments were untested. Run `npm test`; the captured suite passes the six new CLI cases together with the existing classifier cases. | **Accepted (fixed in `test/new-update-flow-coverage`)** - `runStatusCommand` and `classifyStatusCommand` are covered for pending banner precedence, up-to-date output, empty or unknown output, failed status, spawn error and injected environment. |
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:186:`classifyStatusCommand(result: { stdout?: string | null; stderr?: string | null; status?: number | null; error?: unknown }): { exitCode: number; stdout: string; stderr: string }`
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:196:import { classifyStatusCommand, runStatusCommand } from '../../scripts/detect-pending-migrations.mjs';
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:200:const result = classifyStatusCommand({
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:209:const result = classifyStatusCommand({ stdout: 'Database schema is up to date', stderr: '', status: 0 });
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:214:expect(classifyStatusCommand({ stdout: '', stderr: '', status: 0 }).stdout).toBe('true\n');
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:215:expect(classifyStatusCommand({ stdout: 'unknown wording', stderr: '', status: 0 }).stdout).toBe('true\n');
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:219:const result = classifyStatusCommand({ stdout: '', stderr: 'P1001', status: 1 });
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:226:const result = classifyStatusCommand({ stdout: '', stderr: '', status: null, error: new Error('spawn failed') });
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:253:Expected: FAIL because `classifyStatusCommand` and `runStatusCommand` are not exported.
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:463:consumer of `runStatusCommand`, `classifyStatusCommand`, and the deleted capture path. Write
docs/superpowers/specs/2026-11-25-new-update-test-flow-design.md:79:- export `classifyStatusCommand(result)` for the pending-first, failure-second, classifier-last
scripts/detect-pending-migrations.mjs:28:export function classifyStatusCommand(result) {
scripts/detect-pending-migrations.mjs:64:return classifyStatusCommand(result);
src/test/detect-pending-migrations-cli.test.ts:3:classifyStatusCommand,
src/test/detect-pending-migrations-cli.test.ts:9:const result = classifyStatusCommand({
src/test/detect-pending-migrations-cli.test.ts:19:const result = classifyStatusCommand({
src/test/detect-pending-migrations-cli.test.ts:28:expect(classifyStatusCommand({ stdout: '', stderr: '', status: 0 }).stdout).toBe('true\n');
src/test/detect-pending-migrations-cli.test.ts:29:expect(classifyStatusCommand({ stdout: 'unknown wording', stderr: '', status: 0 }).stdout).toBe(
src/test/detect-pending-migrations-cli.test.ts:35:const result = classifyStatusCommand({ stdout: '', stderr: 'P1001', status: 1 });
src/test/detect-pending-migrations-cli.test.ts:42:const result = classifyStatusCommand({
MATCH_COUNT=46
FOCUSED CHECK 2: literal runStatusCommand
.superpowers/sdd/2026-11-25-new-update-test-flow/pr-body-draft.md:13:- Export `classifyStatusCommand` and `runStatusCommand` from `scripts/detect-pending-migrations.mjs` without changing output or exit codes, then cover pending-first classification, refusal, spawn error and exact npm arguments.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:12:`runStatusCommand(options?: { spawn?: typeof spawnSync; npm?: string; env?: NodeJS.ProcessEnv }): { exitCode: number; stdout: string; stderr: string }`.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:20:import { classifyStatusCommand, runStatusCommand } from '../../scripts/detect-pending-migrations.mjs';
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:57:const result = runStatusCommand({
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-brief.md:77:Expected: FAIL because `classifyStatusCommand` and `runStatusCommand` are not exported.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:15:`classifyStatusCommand is not a function` va `runStatusCommand is not a function`.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:17:3. GREEN: them hai export, tach logic thanh `classifyStatusCommand` va `runStatusCommand`,
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:128:TypeError: runStatusCommand is not a function
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-report.md:132:39|     const result = runStatusCommand({
.superpowers/sdd/2026-11-25-new-update-test-flow/task-3-review.md:2:- ✅ Spec compliant: `scripts/detect-pending-migrations.mjs:28` exports `classifyStatusCommand(result)` and `:56` exports `runStatusCommand(options = {})`; both return `{ exitCode, stdout, stderr }` as required by `task-3-brief.md:9-12`.
.superpowers/sdd/2026-11-25-new-update-test-flow/task-5-brief.md:59:consumer of `runStatusCommand`, `classifyStatusCommand`, and the deleted capture path. Write
docs/reviews/2026-11-25-requesting-code-review-test-coverage.md:21:| C-6 | Important · `src/test/detect-pending-migrations-cli.test.ts:8-71`; `src/test/detect-pending-migrations.test.ts:5-40` | At `eb7e241`, only classifier unit tests existed; the wrapper's exit codes, refusal message and exact npm arguments were untested. Run `npm test`; the captured suite passes the six new CLI cases together with the existing classifier cases. | **Accepted (fixed in `test/new-update-flow-coverage`)** - `runStatusCommand` and `classifyStatusCommand` are covered for pending banner precedence, up-to-date output, empty or unknown output, failed status, spawn error and injected environment. |
docs/reviews/2026-11-25-subagent-driven-development-task3.md:16:| T3-1 | Minor · `src/test/detect-pending-migrations-cli.test.ts:52-70` | The injected runner is cast `as never` and does not assert `encoding: 'utf8'` passed by `runStatusCommand`. | **Accepted (scheduled in `follow-up/cli-runner-contract`)** - the brief mandates this exact stub shape, so changing it here would depart from the required test code; strengthen the runner contract in a named follow-up branch. |
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:188:`runStatusCommand(options?: { spawn?: typeof spawnSync; npm?: string; env?: NodeJS.ProcessEnv }): { exitCode: number; stdout: string; stderr: string }`.
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:196:import { classifyStatusCommand, runStatusCommand } from '../../scripts/detect-pending-migrations.mjs';
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:233:const result = runStatusCommand({
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:253:Expected: FAIL because `classifyStatusCommand` and `runStatusCommand` are not exported.
docs/superpowers/plans/2026-11-25-new-update-test-flow.md:463:consumer of `runStatusCommand`, `classifyStatusCommand`, and the deleted capture path. Write
docs/superpowers/specs/2026-11-25-new-update-test-flow-design.md:81:- export `runStatusCommand({ spawn, npm, env })` that runs
scripts/detect-pending-migrations.mjs:56:export function runStatusCommand(options = {}) {
scripts/detect-pending-migrations.mjs:71:const { exitCode, stdout, stderr } = runStatusCommand();
src/test/detect-pending-migrations-cli.test.ts:4:runStatusCommand,
src/test/detect-pending-migrations-cli.test.ts:54:const result = runStatusCommand({
MATCH_COUNT=23
FOCUSED CHECK 3: literal remove-hero-pause-button-checks under docs/reviews
NO MATCHES
MATCH_COUNT=0
FOCUSED CHECK 3b: literal remove-hero-pause-button-checks in AI_LOG.md
AI_LOG.md:928:- **Rejected:** viết lại bản capture `docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt`; rule 9 cấm sửa nội dung verbatim lịch sử và file `.txt` không nằm trong `SCAN_EXTENSIONS`.
MATCH_COUNT=1
FOCUSED CHECK 4: normalized versus raw capture
NORMALIZED_LINES_DROPPED=["Normalization note: U+0192 in the Next.js route legend is replaced by F to satisfy rule 12; all other captured output is verbatim.",""]
U0192_REPLACEMENTS_IN_RAW=4
FIRST_DIFF_AFTER_NORMALIZATION=NONE
NORMALIZED_EXIT_COUNT=9 VALUES=EXIT=0
RAW_EXIT_COUNT=9 VALUES=EXIT=0
FOCUSED CHECK 5: PR body draft completeness
PR_BODY_EMBEDS_FULL_NORMALIZED_CAPTURE=true
PR_BODY_EXIT_COUNT=9 VALUES=EXIT=0
PR_BODY_HAS_U0192_NOTE=true
PR_BODY_HAS_FORBIDDEN_U0192_CHARACTER=false
PR_BODY_HAS_AUDIT_LINK=true
PR_BODY_TASK_LINKS=4/4
PR_BODY_HAS_LITERAL_LINK_FINAL_REVIEW=true
FOCUSED CHECK 6: audit rows versus final spec
SPEC_HEADINGS_PRESENT=6/6
AUDIT_ROWS=C-1,C-2,C-3,C-4,C-5,C-6,C-7,C-8,C-9
SPEC_KEYWORDS=auto-advance=true pointer is over=true focus is inside=true reduced motion=true required checks=true migration approval=true alias capture=false smoke=true rollback=true
AUDIT_KEYWORDS=auto-advance=true pointer is over=true focus is inside=true reduced motion=true required checks=true migration approval=true alias capture=true smoke=true rollback=true
EXIT=0
```

Full normalized final check set, not re-run in this review and reproduced from `final-checks.md`:

```text
Normalization note: U+0192 in the Next.js route legend is replaced by F to satisfy rule 12; all other captured output is verbatim.

DATABASE_URL note: db:push, build and E2E used DATABASE_URL=file:./prisma/e2e.db in the child environment because this clean clone needs it.
Capture method: Node spawnSync with shell true, encoding utf8 and NO_COLOR=1 for every command.

COMMAND: npx --no-install next typegen
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---
Generating route types...
✓ Types generated successfully

--- STDERR ---


COMMAND: npm run db:push
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "e2e.db" at "file:./prisma/e2e.db"

The database is already in sync with the Prisma schema.


--- STDERR ---
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.


COMMAND: npm run lint
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 lint
> eslint


--- STDERR ---


COMMAND: npm run typecheck
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit


--- STDERR ---


COMMAND: npm test
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/clever-pixel


 Test Files  88 passed (88)
      Tests  445 passed (445)
   Start at  12:47:06
   Duration  51.02s (tests 43%, import 34%, environment 14%, transform 5%, setup 2%, worker 2%)

     Import  212 modules were evaluated 678 times · 9.81s total, 34% of tracked time
             ~6.74s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation


--- STDERR ---


COMMAND: npm run format:check
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

--- STDERR ---


COMMAND: npm run check:language
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs


--- STDERR ---


COMMAND: npm run build
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 193ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 2.9s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.6s
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


--- STDERR ---


COMMAND: npm run test:e2e -- e2e/hero-slider.spec.ts
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 test:e2e
> playwright test e2e/hero-slider.spec.ts


Running 10 tests using 1 worker

  ok  1 [desktop-chrome] › e2e\hero-slider.spec.ts:13:1 › hero slider advances one slide after five seconds and loops @storefront (16.5s)
  ok  2 [desktop-chrome] › e2e\hero-slider.spec.ts:32:1 › hero slider pauses while the pointer is over it and resumes after the pointer leaves @storefront (16.8s)
  ok  3 [desktop-chrome] › e2e\hero-slider.spec.ts:55:1 › hero slider pauses while focus is inside it and resumes after focus leaves @storefront (17.5s)
  ok  4 [desktop-chrome] › e2e\hero-slider.spec.ts:78:1 › choosing a slide restarts the five second countdown @storefront (9.2s)
  ok  5 [desktop-chrome] › e2e\hero-slider.spec.ts:96:1 › hero slider renders no pause control and keeps the live region quiet while advancing @storefront (457ms)
  ok  6 [pixel-7] › e2e\hero-slider.spec.ts:13:1 › hero slider advances one slide after five seconds and loops @storefront (16.2s)
  ok  7 [pixel-7] › e2e\hero-slider.spec.ts:32:1 › hero slider pauses while the pointer is over it and resumes after the pointer leaves @storefront (16.9s)
  ok  8 [pixel-7] › e2e\hero-slider.spec.ts:55:1 › hero slider pauses while focus is inside it and resumes after focus leaves @storefront (17.2s)
  ok  9 [pixel-7] › e2e\hero-slider.spec.ts:78:1 › choosing a slide restarts the five second countdown @storefront (9.0s)
  ok 10 [pixel-7] › e2e\hero-slider.spec.ts:96:1 › hero slider renders no pause control and keeps the live region quiet while advancing @storefront (465ms)

  10 passed (2.5m)

--- STDERR ---
[WebServer] (node:14460) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:21820) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:21880) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:16876) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:13140) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:1424) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:4384) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:10144) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:2012) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:10444) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:21720) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:6052) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:17816) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
(node:11392) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:17992) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


```

## Limitations

- Read-only review: no git command was re-run to re-derive the diff and the full check set was not re-run; the captured output is treated as evidence after the raw and normalized comparison.
- No production database, live deploy, production smoke or rollback drill was available or required by the spec.
- No Figma pixel diff was attempted because the design file is not in the repository.
- Browser evidence is limited to the configured `desktop-chrome` and `pixel-7` Playwright projects.
- The review was first written to the controller scratch path and is now saved at `docs/reviews/2026-11-25-requesting-code-review-final.md`.
- PR creation and the final link are controller-owned; `LINK_FINAL_REVIEW` was verified as an intentional placeholder, not replaced here.

### Branch verdict

Ready to merge: **Yes.** The branch is code-complete and spec-compliant, with no Critical or Important finding. All carried Minor findings are explicitly accepted, rejected or scheduled above and none blocks integration. Before PR creation, replace the literal `LINK_FINAL_REVIEW` in `pr-body-draft.md:278` with the final review link; the complete normalized check output, every `EXIT=` line, the U+0192-to-F note, the coverage audit link and all four task review links are already present.

Reasoning: the named tests and captured output support every pass claim; the raw and normalized captures agree; the deleted capture path has no live reference in `docs/reviews`; both exported CLI symbols and all their consumers were grepped and read; reduced-motion, production, Figma and browser-scope limitations are stated rather than hidden.

Skill recorded: `requesting-code-review`
Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 12:44:33 +07:00 - Bổ sung coverage và verification cho các cập nhật mới`.
