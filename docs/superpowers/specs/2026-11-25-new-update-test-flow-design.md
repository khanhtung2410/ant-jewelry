# New-update test flow and stale-capture cleanup (2026-11-25)

## Intent and why

The repository has moved from `86f286b` to `eb7e241` with two feature waves that postdate the
2026-11-21 test-coverage audit:

- hero slider auto-advance and the removed visible pause button (#148, #149, #150, #154);
- CI deploy gating: required checks, CLI deploy, migration approval, smoke and rollback
  (#152 to #162).

Both waves have tests, but the layers are uneven. The hero slider has strong unit and action-level
integration coverage and only one browser test (reduced motion). The deploy gate has text-based
workflow guards and a classifier unit test, but no test of the CLI wrapper's exit behavior and no
structural check of the job graph. One raw captured-output report is a duplicate of an embedded
review block and still sits in `docs/reviews/` as a stale artifact.

## Goals

- Remove the duplicated raw capture and fix the review records that point at it.
- Add the missing workflow-level hero slider browser tests.
- Add an integration test for the pending-migration CLI wrapper and a structural test for the
  `ci.yml` / `deploy.yml` job graph.
- Record a new coverage audit for the post-2026-11-21 updates with explicit unit, integration and
  workflow evidence.
- Keep all historical review records intact except for the raw capture's dangling references.

## Non-goals

- Rewriting the 2026-11-21 audit's historical assessment.
- Re-testing hero CRUD, which the G13 integration tests already cover.
- Running a live GitHub Actions deploy, an owner-present rollback drill or a production smoke.
- Adding a YAML parser dependency for workflow tests.

## Approaches considered

1. **Wait 5.5 seconds in each browser test.** Simple and uses the real clock, but adds roughly 30
   to 50 seconds per Playwright project. Chosen for reliability; Playwright's clock API would be
   faster but its interaction with Next.js hydration and React scheduling is not proven in this
   repository.
2. **Refactor `scripts/detect-pending-migrations.mjs` into a testable command function.** Adds a
   small seam so tests can inject a child-process runner, while the CLI keeps identical output and
   exit codes. Chosen because stubbing `npm.cmd` directly fails on Windows with `EINVAL`, and a
   Node loader that replaces `node:child_process` is fragile.
3. **Parse the workflows with a new YAML dev dependency.** More complete, but adds a dependency for
   one structural test. Rejected; the existing block reader can extract job names and `needs:`
   targets without a parser.
4. **Leave the CLI wrapper and job graph untested and mark them as follow-up.** Rejected because
   these are exactly the fail-closed and deploy-order behaviors the new wave introduced.

## Design

### Cleanup

- Delete `docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt`.
- In `docs/reviews/2026-11-23-requesting-code-review-hero-slider.md` and
  `docs/reviews/2026-11-23-systematic-debugging-pr154.md`, replace the reference to the deleted
  file with a note that the raw capture was removed as a duplicate and the complete output remains
  embedded in the review record.
- Do not rewrite historical prompt text in `AI_LOG.md` or the plan; record the removal in the new
  AI_LOG entry.

### Hero slider workflow tests

Add `e2e/hero-slider.spec.ts` with the `@storefront` tag:

- advances one slide after 5 seconds and loops;
- pauses while the pointer is over the slider and resumes after it leaves;
- pauses while focus is inside the slider and resumes after focus leaves;
- restarts the countdown after a manual dot selection;
- renders no Pause/Play control and keeps `aria-live` in sync.

These assert browser behavior that the jsdom timer tests cannot prove.

### Pending-migration CLI integration

Refactor `scripts/detect-pending-migrations.mjs` without changing behavior:

- export `classifyStatusCommand(result)` for the pending-first, failure-second, classifier-last
  decision;
- export `runStatusCommand({ spawn, npm, env })` that runs
  `npm run db:migrate:status:production` and returns `{ exitCode, stdout, stderr }`;
- keep the direct-invocation block writing the same strings and exiting with the same codes.

Add `src/test/detect-pending-migrations-cli.test.ts` that injects a real child-process runner and
asserts:

- a pending banner returns `true` with exit code 0 even when the command exits non-zero;
- an up-to-date marker returns `false` with exit code 0;
- empty or unknown output returns `true` with exit code 0;
- a failed command with no pending banner returns exit code 1 and the refusal message;
- the runner receives the exact npm arguments and environment.

### Workflow graph test

Add `src/test/deploy-workflow-graph.test.ts` that:

- extracts job names and `needs:` targets from `.github/workflows/ci.yml` and
  `.github/workflows/deploy.yml`;
- asserts every `needs:` target exists and the graph is acyclic;
- asserts the deploy chain `verify-ci -> check-migrations -> approval -> migrate -> deploy -> smoke
  -> rollback -> finalize` through the real edges;
- asserts `deploy.yml`'s `workflow_run.workflows: [ci]` matches the `name:` in `ci.yml`.

### Coverage audit

Write `docs/reviews/2026-11-25-requesting-code-review-test-coverage.md` using the review template.
It lists every post-audit update, its unit, integration and workflow evidence, the gap found, the
decision, and the new tests that close it. Findings with no local evidence are marked explicitly.

### Verification and PR

Run the full check set from `docs/CONTRIBUTING.md` through Node `spawnSync` in UTF-8 with
`NO_COLOR=1`, plus the local E2E suite for the new hero spec. Save the complete output in the
review record and the PR body, prepend an AI_LOG entry, and open a PR with `gh`.

## Risks

- Real 5-second waits make the new E2E tests slower; they remain deterministic because they assert
  the active dot rather than a transient state.
- The CLI refactor touches the deploy gate; tests must prove every branch matches the current
  behavior, and the existing workflow guard must stay green.
- The new E2E tests depend on the seeded hero slides; they read only the current dot and do not
  assume slide copy.
