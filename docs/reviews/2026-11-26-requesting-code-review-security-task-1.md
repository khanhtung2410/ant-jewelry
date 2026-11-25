# Code review - K2 Task 1 production audit wrapper (2026-11-26)

- **Skill:** requesting-code-review
- **Scope:** Task 1 of `docs/superpowers/plans/2026-11-25-security-automation.md`: fail-closed production audit wrapper.
- **Base:** `b91f7a9` | **Head:** `4e4bbc9`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-26 - K2 cập nhật dependency và quét bảo mật tự động`.

## Method

A fresh reviewer subagent read the task brief, the binding spec, the complete diff package `task-1-b91f7a9-4e4bbc9-diff.md`, and the whole source of `scripts/audit-dependencies.mjs`, `src/test/security-audit.test.ts`, `package.json` and `scripts/detect-pending-migrations.mjs`. The controller independently re-read the complete diff and the implementer report before accepting any finding. The reviewer re-ran the focused tests, full `npm test`, the real audit, lint, typecheck and format:check; the controller re-ran `npm run format:check` after formatting the ignored helper script.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T1-1 | Minor · `scripts/check-language.mjs:41-42` | On Windows, `path.resolve(process.argv[1])` does not equal `path.resolve(new URL(import.meta.url).pathname)`, so `npm run check:language` exits 0 without scanning. The implementer scanned the changed files directly and the reviewer confirmed the same predicate mismatch. | **Rejected for this PR:** pre-existing defect outside Task 1's brief and not introduced by this diff. CI runs on Linux. Tracked as a limitation in the K2 AI_LOG entry; do not silently widen Task 1 scope. |
| T1-2 | Minor · `scripts/audit-dependencies.mjs:26-45` | No dedicated unit test injects a cyclic `via` graph. The `seen` set in `advisoryIdsFor` prevents recursion from looping forever. | **Rejected:** the reviewer verified the cycle guard by source inspection and the real npm report is acyclic. A cycle test would add no behavior beyond the existing string-reference and fail-closed tests. |
| T1-3 | Minor · `.superpowers/sdd/2026-11-25-security-automation/capture-checks.mjs:1` | `npm run format:check` initially exited 1 because this ignored helper was unformatted, even though the three Task 1 files passed targeted Prettier. | **Accepted (fixed in this PR branch):** ran `npx prettier --write` on the SDD helper scripts; full `npm run format:check` then exited 0 with `All matched files use Prettier code style!`. |

The reviewer reported no Critical or Important finding. Spec verdict: **PASS**. Quality verdict: **PASS**. Ready for Task 2: **YES**.

## Declined to judge

- Merging pull requests: the owner's standing rule forbids self-merge; out of scope.
- CodeQL and Dependabot behavior: created by Task 2, not present in this diff.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Task 1 files match the brief | `git show --stat 4e4bbc9`: `package.json` +1, `scripts/audit-dependencies.mjs` +212, `src/test/security-audit.test.ts` +252 | đạt/pass |
| Required exports exist | `evaluateAuditReport`, `classifyAuditCommands`, `runAudit({ spawn })`, `ALLOWED_ADVISORIES` read in full source | đạt/pass |
| Literal audit command is pinned | `src/test/security-audit.test.ts` asserts `['audit', '--omit=dev', '--audit-level=high']` and `NO_COLOR=1` | đạt/pass |
| Unknown advisory fails closed | focused test `fails on an unknown advisory and prints no pass message` | đạt/pass |
| Spawn error, null status, malformed JSON and empty report fail closed | four named focused tests in `src/test/security-audit.test.ts` | đạt/pass |
| Real advisory output is visible | `npm run audit:production` printed the 3-high-vulnerability report and exited 0 naming `GHSA-7589-6fvf-x4pw` | đạt/pass |
| Four required check names unchanged | `package.json` diff adds only `audit:production`; `ci.yml` untouched in Task 1 | đạt/pass |
| Focused tests pass | `npx vitest run src/test/security-audit.test.ts`: 15 passed | đạt/pass |
| Full tests pass | `npm test`: 90 files, 469 tests passed | đạt/pass |
| Lint and typecheck pass | reviewer re-ran both with `EXIT=0` | đạt/pass |
| Format check passes | controller re-ran `npm run format:check`: `All matched files use Prettier code style!`, `EXIT=0` | đạt/pass |
| Language check scans on CI | Windows silent no-op documented; direct changed-file scan clean; Linux CI path not exercised locally | lacking evidence locally |

## Verification output

Captured by the implementer with Node `spawnSync`, `encoding: 'utf8'` and `NO_COLOR: '1'`. Relevant complete sections:

```text
npx vitest run src/test/security-audit.test.ts
RUN  v5.1.0 D:/thuc tap/ant-jewelry
Test Files  1 passed (1)
     Tests  15 passed (15)
EXIT=0

npm test
Test Files  90 passed (90)
     Tests  469 passed (469)
EXIT=0

npm run audit:production
# npm audit report
effect  <=3.22.0
Severity: high
Effect: ReDoS in Schema.TemplateLiteral compiled regex - https://github.com/advisories/GHSA-7589-6fvf-x4pw
fix available via `npm audit fix --force`
Will install prisma@6.12.0, which is a breaking change
node_modules/effect
  @prisma/config  >=6.13.0-dev.1
  Depends on vulnerable versions of effect
  node_modules/@prisma/config
    prisma  >=6.13.0-dev.1
    Depends on vulnerable versions of @prisma/config
    node_modules/prisma
3 high severity vulnerabilities
[audit-dependencies] Documented exception accepted: GHSA-7589-6fvf-x4pw. See docs/SECURITY.md.
EXIT=0

npm run lint
EXIT=0
npm run typecheck
EXIT=0
```

Controller re-run after T1-3:

```text
> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

EXIT=0
```

## Limitations

- `npm run check:language` exits 0 silently on Windows because of the pre-existing path bug; the changed files were scanned directly and were clean. The Linux CI behavior is not exercised locally.
- The live `npm audit` result depends on the npm registry and the currently published `prisma@7.10.1` dependency graph.
- Task 2 had not started when this review was recorded, so no workflow or Security-tab evidence exists yet.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-26 - K2 cập nhật dependency và quét bảo mật tự động`.
