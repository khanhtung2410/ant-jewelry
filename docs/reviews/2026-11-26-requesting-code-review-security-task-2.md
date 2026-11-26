# Code review - K2 Task 2 Dependabot, CodeQL and CI audit gate (2026-11-26)

- **Skill:** requesting-code-review
- **Scope:** Task 2 of `docs/superpowers/plans/2026-11-25-security-automation.md`: Dependabot configuration, CodeQL workflow, the production audit step in the `static` job and its guard tests.
- **Base:** `4e4bbc9` | **Head:** `ae39d6e`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-26 01:01:52 +07:00 - K2 cập nhật dependency và quét bảo mật tự động`.

## Method

A fresh reviewer subagent ran the `requesting-code-review` skill over the complete diff package
`4e4bbc9..ae39d6e`. The agent that wrote this record then re-read the whole source of
`.github/dependabot.yml`, `.github/workflows/codeql.yml`, `.github/workflows/ci.yml`,
`docs/SECURITY.md` and `src/test/security-automation.test.ts` (the Dependabot, CodeQL, CI gate and
security-record assertions at `:83-232`), and re-verified every citation, test name and line range
below against those files. No finding was accepted or rejected from the reviewer summary alone.

The reviewer returned SPEC PASS, QUALITY PASS and READY_FOR_TASK_3 YES with no Critical, Important or
Minor finding.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T2-0 | No findings · whole diff `4e4bbc9..ae39d6e` | The fresh reviewer read the complete diff and the five changed files and returned SPEC PASS, QUALITY PASS, READY_FOR_TASK_3 YES. No Critical, Important or Minor finding was reported, and the re-check against the real source found nothing to add. | **No action required.** No finding was invented to fill the table. |

## Declined to judge

- Windows `check:language` no-op (`scripts/check-language.mjs:40-42`): pre-existing path predicate bug
  that is outside Task 2 and not introduced by this diff; recorded as a limitation and handled by a
  direct `findDisallowedLetters` scan of the changed files in the Task 3 record.
- Live Dependabot pull request and CodeQL Security-tab results: they can only exist after the branch
  is pushed and the workflows run on GitHub. No such run exists at review time, so no claim is made.
- Fork-pull-request SARIF permission downgrade: this is GitHub Actions behavior for
  `pull_request` events from forks and is outside this plan's YAML and scope.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Dependabot configures exactly `npm` and `github-actions` | `.github/dependabot.yml:1-24`; test `is version 2 and configures exactly npm and github-actions` | đạt/pass |
| Both ecosystems update weekly with one `minor`/`patch` group | `.github/dependabot.yml:3-13` and `:14-24`; tests `updates npm weekly with one minor and patch group` and `updates github-actions weekly with one minor and patch group` | đạt/pass |
| CodeQL scans main pushes, main pull requests and a weekly schedule | `.github/workflows/codeql.yml:3-9`; test `scans main pushes, main pull requests and a weekly schedule` | đạt/pass |
| CodeQL grants `contents: read`, `actions: read`, `security-events: write` | `.github/workflows/codeql.yml:11-14`; test `grants read access to the repository and write access to security events` | đạt/pass |
| CodeQL runs one `analyze` job for `javascript-typescript` with the v3 init, autobuild and analyze actions | `.github/workflows/codeql.yml:20-40`; test `runs one analyze job for javascript-typescript with the v3 actions` | đạt/pass |
| CodeQL cancels superseded runs of the same ref | `.github/workflows/codeql.yml:16-18`; test `cancels superseded runs of the same ref` | đạt/pass |
| The `static` job runs the documented production audit | `.github/workflows/ci.yml:40-41`; test `runs the documented production audit in the static job` | đạt/pass |
| The audit step is named and has no `continue-on-error` or `|| true` | `.github/workflows/ci.yml:40-41`; tests `never suppresses audit failures in the static job` and `gives the audit step a name and keeps its command unsuppressed` | đạt/pass |
| `docs/SECURITY.md` records the advisory, package chain and pinned versions | `docs/SECURITY.md:17-49`; test `documents the advisory, the package chain and the pinned versions` | đạt/pass |
| The owner, review date and removal condition are recorded | `docs/SECURITY.md:25-26` and `:43-46`; test `names the owner, the review date and the removal condition` | đạt/pass |
| The wrapper allowlist equals the documented advisory | `ALLOWED_ADVISORIES` in `scripts/audit-dependencies.mjs`; test `keeps the wrapper allowlist identical to the documented advisory` | đạt/pass |
| The four required check names stay unchanged | `src/test/ci-workflow.test.ts:66-70` (`static`, `test`, `build`, `e2e`) | đạt/pass |
| Focused guard files pass | `npx vitest run src/test/security-audit.test.ts src/test/security-automation.test.ts`: 2 files, 29 tests passed, `EXIT=0` | đạt/pass |
| Full test suite passes | `npm test`: 91 files, 483 tests passed, `EXIT=0` | đạt/pass |

## Verification output

Relevant complete sections from the final capture, produced with Node `spawnSync`,
`encoding: 'utf8'` and `NO_COLOR: '1'`:

```text
## test

COMMAND=npm test
EXIT=0


> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  91 passed (91)
      Tests  483 passed (483)
   Start at  01:28:23
   Duration  49.06s (tests 49%, import 31%, environment 12%, transform 4%, setup 2%, worker 2%)

     Import  216 modules were evaluated 686 times · 8.58s total, 31% of tracked time
             ~5.88s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

## focused security guards

COMMAND=npx vitest run src/test/security-audit.test.ts src/test/security-automation.test.ts
EXIT=0


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  2 passed (2)
      Tests  29 passed (29)
   Start at  01:29:44
   Duration  6.88s (tests 26%, transform 22%, import 22%, setup 19%, worker 10%)
```

The complete eight-command capture is attached verbatim in
`docs/reviews/2026-11-25-requesting-code-review-security-automation.md`, section Verification output.

## Limitations

- `npm run check:language` exits 0 silently on Windows because of the pre-existing path predicate bug
  in `scripts/check-language.mjs:40-42`; the Task 3 record replaces it with a direct
  `findDisallowedLetters` scan of the K2 changed files. The Linux CI path was not exercised locally.
- No live Dependabot pull request and no CodeQL Security-tab result existed before push; both are
  recorded as limitations until GitHub produces them.
- A fork pull request has reduced SARIF upload permissions on GitHub; that behavior is outside this
  plan and is not changed by this branch.
- All checks ran on this Windows machine, not on the `ubuntu-latest` GitHub runner.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-26 01:01:52 +07:00 - K2 cập nhật dependency và quét bảo mật tự động`.
