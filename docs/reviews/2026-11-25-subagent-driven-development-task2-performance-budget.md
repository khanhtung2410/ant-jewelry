# Code review - Task 2 Lighthouse CI in the e2e job (2026-11-25)

- **Skill:** subagent-driven-development
- **Scope:** Task 2 of `docs/superpowers/plans/2026-11-25-performance-budget.md`: the `e2e` job in
  `.github/workflows/ci.yml` and its workflow guard test.
- **Base:** `87fc30b` | **Head:** `2813873`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.

## Method

Read-only reviewer round run under the exact skill id `subagent-driven-development`, transcribed from
`.superpowers/sdd/2026-11-25-performance-budget/task-2-review-result.txt` without changing its
rulings. Task 3 re-read the whole source of `.github/workflows/ci.yml` and
`src/test/ci-workflow.test.ts`, then grepped every consumer of `CHROME_PATH`, `lighthouse-report`,
`lhci-report`, `lhci autorun` and the E2E auth secret. The controller confirmed branch provenance
from `git log` and `git status` and re-ran the checks in Task 3 instead of trusting the report text.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T2-1 | Minor · `src/test/ci-workflow.test.ts:110-131` | The new guard asserts substring presence only. Move `run: npx lhci autorun` above the reset-and-build step and the test still passes while the audit reads stale data. | **Rejected** (controller ruling). The real order was verified directly in `.github/workflows/ci.yml:102-124`, and the brief pins substring assertions. A second YAML-order parser would be polish outside scope, not a behavior fix. |
| T2-2 | Minor · `.github/workflows/ci.yml:118-124` | With `if: always()`, a failure before LHCI produces no `lhci-report/`, so `upload-artifact@v4` emits a warning on every such run. | **Rejected** (controller ruling). `if: always()` is mandatory, and the warning is accurate evidence that LHCI never ran. Adding `if-no-files-found: ignore` would hide a useful failure signal. |
| T2-3 | Minor · `task-2-report.md:7`, branch provenance | Diff alone cannot show that `k1-performance-budget` was created from `origin/main` and that nothing landed on `main`. | **Accepted as verified outside the diff.** `git log` and `git status` show `2813873` on `k1-performance-budget` with `b91f7a9` (`origin/main`) beneath it; no commit on `main`. |
| T2-4 | Minor · `task-2-report.md:70-88`, check exit codes | Diff alone cannot prove that lint, typecheck, `npm test`, format:check, `check:language` and build exited 0. | **Accepted as Task 3 verification.** The full check set was re-captured with Node `spawnSync`, `utf8`, `NO_COLOR=1` and every `EXIT=` line is in `final-checks.md` and the PR body. |
| T2-5 | Minor · `task-2-report.md:26`, PR body | Diff alone cannot prove the `spawnSync` capture mechanism or that the PR body carries the complete output. | **Accepted as Task 3 responsibility.** `capture-checks.mjs` and `checks-config.json` were prepared in the SDD workspace and `pr-body.md` contains the captured output. |
| T2-6 | Minor · `lighthouserc.json:20-26`, Task 1 values | Diff alone cannot prove the 0.85/0.90/0.95/0.1 median thresholds, report path and ready pattern. | **Accepted as already reviewed.** These are Task 1 outputs, re-read in full by Task 3 and recorded in the Task 1 review record; the plan text was reconciled by the controller. |
| T2-7 | Minor · `.github/workflows/ci.yml:102-124`, runtime handoff | Diff alone cannot prove `npx lhci autorun`, the port 3200 server handoff or the nested-quote bash line on a runner. | **Accepted as runtime evidence.** Pushed CI and Task 4 own the live run; this host has no working bash distribution for that exact line. |

No Critical or Important issue was found. The reviewer marked the change Approved and verified the
named risks: the `E2E_DATABASE_URL` value matches the hardcoded `DATABASE_URL`, `playwright` resolves
through the direct `@playwright/test` dependency, and the `block()` helper collects 6-space steps.

## Declined to judge

- Whether the deliberately failing Performance evidence run exists: Task 4 owns that throwaway
  branch; no report or image belongs in this PR.
- Runtime Lighthouse scores: the job text is guard-tested, but a score needs a real runner.
- Host-specific `CHROME_PATH` resolution: verified by YAML parse and local Node resolution only.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Four required status checks keep their names | `src/test/ci-workflow.test.ts:52-73` unchanged in the diff | đạt/pass |
| Chromium, reset/build, LHCI and upload appear in order | `.github/workflows/ci.yml:102-124`; `src/test/ci-workflow.test.ts:110-131` focused run `EXIT=0` | đạt/pass |
| Exact env trio on build and LHCI | `.github/workflows/ci.yml:107-110,114-117`; guard at `src/test/ci-workflow.test.ts:120-122` | đạt/pass |
| Report always uploads with the pinned name and retention | `.github/workflows/ci.yml:118-124`; guard at `src/test/ci-workflow.test.ts:123-130` | đạt/pass |
| No second server, no new dependency, no committed report | Diff of the two permitted files; `package.json` not in the Task 2 diff | đạt/pass |

## Verification output

This reviewer round was read-only and did not re-run the full check set. The implementation output is
in `.superpowers/sdd/2026-11-25-performance-budget/task-2-report.md`; the final Task 3 capture,
with every `EXIT=` line, is in `.superpowers/sdd/2026-11-25-performance-budget/final-checks.md` and
is pasted verbatim into `pr-body.md`.

## Limitations

- The review is transcribed from the completed round; no second reviewer agent was dispatched.
- No GitHub runner was available, so the live `lhci autorun` step remains runtime evidence.
- The workflow guard checks text, not a real Lighthouse assertion failure; Task 4 covers the red run.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.
