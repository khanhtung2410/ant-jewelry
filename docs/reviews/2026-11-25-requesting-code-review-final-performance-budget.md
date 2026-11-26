# Code review - Performance budget K1 final fix round (2026-11-25)

- **Skill:** requesting-code-review
- **Scope:** findings FR-1 to FR-5 from the whole-branch review of `k1-performance-budget`, plus the
  documentation fix round on the same branch.
- **Base:** `ed10d02` | **Head:** `k1-performance-budget` fix round; the exact commit SHA is recorded
  in `.superpowers/sdd/2026-11-25-performance-budget/task-3-report.md`.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.

## Method

Loaded the exact skill id `requesting-code-review`. The controller supplied the complete final review
and ruling in `.superpowers/sdd/2026-11-25-performance-budget/final-review-result.txt`; I read that
file in full, together with `docs/reviews/TEMPLATE.md` and the whole source of every file edited in
this round: `AI_LOG.md`, the K1 review record, the Task 1 review record, `pr-body.md`,
`task-3-report.md` and the capture helper `capture-checks.mjs`. I also grepped the repository for
`U+0192`, `capture raw`, `bản capture raw`, `package-lock.json` and `final-checks.md` before writing
any change. No reviewer subagent was dispatched: this harness implements the no-subagent contract,
so the review is a read-only self-review transcribed from the controller's final review, and the
controller ruling is recorded below. The fix round re-ran the full check set with the
prepared helper before synchronizing the evidence files.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| FR-1 | Important · `docs/reviews/2026-11-25-requesting-code-review-performance-budget.md:21-22,62-64,66-221` | The review record pasted an earlier check run (`Start at 21:38:29`, focused `21:39:52`) while its Method and checklist called `final-checks.md` authoritative. Open both files and compare the timestamps: the record did not prove the final committed state. | **Accepted (fixed in branch `k1-performance-budget`).** The full check set was re-run through `capture-checks.mjs`, and the `## Verification output` block now matches the fresh `final-checks.md` exactly. Method and checklist name one authoritative capture. |
| FR-2 | Important · `AI_LOG.md:176-177` and `:34-35`, `docs/reviews/2026-11-25-requesting-code-review-performance-budget.md:223-224`, `.superpowers/sdd/2026-11-25-performance-budget/pr-body.md:184`, `.superpowers/sdd/2026-11-25-performance-budget/task-3-report.md:51-52` | The text claimed a workspace file preserved the original U+0192 character. Reading `capture-checks.mjs:21,26-28` shows the helper substitutes U+0192 before writing, and listing the SDD directory shows no such file. The PR body therefore made a verifiably false evidence claim. | **Accepted (fixed in branch `k1-performance-budget`).** All four locations now state that the helper substitutes U+0192 and only the cleaned output is retained. The required note that U+0192 was replaced by `F` is preserved. |
| FR-3 | Minor · `src/test/lighthouse-config.test.ts:47`, `src/test/ci-workflow.test.ts:110-131` | The guards use substring checks: a future edit could switch `startServerCommand` to `npm run dev` or detach upload conditions while keeping the searched fragments, weakening the production-build guarantee or artifact upload. Suggested fix was exact command matching plus parsing the upload step. | **Rejected.** The controller ruled that Task 2's brief pinned substring assertions and an index-order parser had already been rejected, so changing the guard contract here would contradict a settled ruling; no later task depends on those tests. Both guard files were left untouched. |
| FR-4 | Minor · `docs/reviews/2026-11-25-subagent-driven-development-task1-performance-budget.md:25` | Finding T1-2 named `package-lock.json` without a line, while `docs/reviews/TEMPLATE.md:14-16` requires `file:line`, and `pr-body.md:190` claimed every finding has one. | **Accepted (fixed in branch `k1-performance-budget`).** The cell now uses `package-lock.json:13327`, verified as the current `tldts-core` entry. The Accepted ruling and its wording are unchanged. |
| FR-5 | Minor · `package.json:51` | The dependency is `^0.16.1` while the brief asked for `@lhci/cli@0.16.1`. The lockfile pins 0.16.1, so there is no present defect; only a future reinstall could move within 0.16.x. | **Rejected.** The controller verified that `npm install --save-dev @lhci/cli@0.16.1` produced the caret range with a pinned lockfile, and that reinstall churn is outside this evidence fix. `package.json` was left untouched. |

## Controller ruling

- FR-1 and FR-2 were accepted as the two Important MUST FIX items and assigned to one fix round on
  `k1-performance-budget`.
- FR-3 was deferred: the Task 2 brief pinned substring assertions and the controller had already
  rejected an index-order parser, so changing the guard contract would contradict a settled ruling.
- FR-4 was accepted opportunistically because the reviewer verified `package-lock.json:13327` and the
  PR body claims every finding has a line reference.
- FR-5 was rejected: the installed version is pinned in the lockfile, and reinstall churn is outside
  the evidence fixes.
- Existing Task 1, Task 2 and Task 3 results remain authoritative; the workflow, config, guard tests
  and dependency declaration were not changed in this round.

## Declined to judge

- Live `npx lhci autorun` scores and the deliberate red Performance PR: Task 4 owns them and no
  runner was available here.
- Pushing the branch and opening the PR: controller-owned after the final review.
- Dependabot, CodeQL, `npm audit` and `docs/SECURITY.md`: K2 is a separate PR and spec.
- PostgreSQL production build against empty tables: no production credentials; the recorded SQLite
  experiment states its limitation.
- Figma pixel comparison and production smoke: no design source file and outside the K1 file list.
- Rewriting historical AI_LOG entries: verbatim history is protected by the project rules; only the
  top K1 entry was amended in this fix round.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| FR-1 uses one authoritative capture | `node C:/Users/Hello/AppData/Local/Temp/opencode/k1-verify-sync.mjs` against `final-checks.md`, the K1 review record and `pr-body.md`: `K1_MATCH=true`, `PR_MATCH=true`, `EXITS=7` | đạt/pass |
| FR-2 removes every false raw-capture claim | Repository grep for `capture raw`, `bản capture raw` and the targeted `U+0192` notes plus `node C:/Users/Hello/AppData/Local/Temp/opencode/k1-verify-sync.mjs`: `RAW_CLAIM=false`, `NOTE_F=true` | đạt/pass |
| FR-4 line reference is present | `node C:/Users/Hello/AppData/Local/Temp/opencode/k1-verify-sync.mjs`: `FR4_LINE=true`, checked against `package-lock.json:13327` | đạt/pass |
| Full check set on the fix tree | `.superpowers/sdd/2026-11-25-performance-budget/final-checks.md`: seven commands, seven `EXIT=0` lines, `npm test` 90 files / 458 tests, focused guards 2 files / 11 tests | đạt/pass |
| Language rule | `npm run check:language` `EXIT=0` in `final-checks.md` and in the post-edit `spawnSync` capture | đạt/pass |
| Guard tests and dependency declaration unchanged | `git diff --name-only ed10d02` contains no `src/test/`, `package.json`, workflow or config file; focused guard tests pass in `final-checks.md` | đạt/pass |
| Task 4 checkbox stays open | `pr-body.md` Checklist line for the deliberate red evidence remains `- [ ]` | đạt/pass |

## Verification output

The authoritative full check set for this fix round is
`.superpowers/sdd/2026-11-25-performance-budget/final-checks.md`. That file contains the complete
stdout, stderr and `EXIT=` line for each of the seven commands. It is copied verbatim into the K1
review record and `pr-body.md`; no second stale copy is pasted here.

## Limitations

- No GitHub runner, production credentials or Figma source file were available in this round.
- `npm run check:language` exits 0 but prints no success line on this Windows host; the captured
  `EXIT=0` and the explicit letter scan remain the evidence.
- The review file was written before the fix commit, so its Head names the branch and the exact SHA is
  recorded in the task report.
- Push, PR creation and the Task 4 negative evidence run remain controller-owned.
- The fix is documentation and evidence only; no runtime behavior was changed after Task 3.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.
