# Dependency and Security Automation (K2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add weekly dependency updates, CodeQL scanning and a fail-closed production audit with one documented, time-boxed advisory exception.

**Architecture:** Dependabot and CodeQL are repository YAML with no runtime coupling to the app. The audit stays honest by running the literal `npm audit --omit=dev --audit-level=high` in CI, then classifying only its failure with a second JSON run so a documented advisory can pass while every unknown advisory still fails the job. Guard tests read the wrapper, the three workflow/config files and the security document so a weakened gate is visible in `npm test`.

**Tech Stack:** Node 22, npm 10, GitHub Actions, Dependabot v2, CodeQL Action v3, Vitest, JavaScript modules.

**Spec:** `docs/superpowers/specs/2026-11-25-security-automation-design.md`

## Global Constraints

- Work on a new branch from `origin/main`; never commit to `main`; keep K2 in one PR separate from K1.
- Only Vietnamese and English letters in written text; `npm run check:language` must stay clean.
- Keep the four required status check names exactly `static`, `test`, `build`, `e2e`.
- The audit command must stay `npm audit --omit=dev --audit-level=high`; no `continue-on-error`, `|| true` or suppressed findings.
- The only allowed advisory is `GHSA-7589-6fvf-x4pw`, reviewed on `2026-12-25`.
- Capture every check command with Node `spawnSync`, `encoding: 'utf8'`, `NO_COLOR: '1'`; never PowerShell redirection.
- The PR body contains the complete captured check output with every `EXIT=` line.

## Review Focus

- A new high or critical advisory next to the documented `effect` chain: `evaluateAuditReport` must return it as disallowed so `npm run audit:production` exits non-zero.
- An audit command that cannot run or returns unreadable JSON: `classifyAuditCommands` must fail closed instead of treating the exception as a pass.
- A Dependabot config that misses GitHub Actions or major-update separation: the guard test pins both ecosystems, weekly schedule and minor/patch groups.
- CodeQL that reports nowhere or scans the wrong language: the guard test pins `javascript-typescript`, `security-events: write` and `init`/`analyze` v3.
- A documentation exception that silently widens: the guard test requires the exact advisory id and `2026-12-25` in `docs/SECURITY.md`, and the allowlist contains no second id.

---

### Task 1: Fail-closed production audit wrapper

**Files:**
- Create: `scripts/audit-dependencies.mjs`
- Test: `src/test/security-audit.test.ts`
- Modify: `package.json` (add the `audit:production` script)

**Interfaces:**
- Consumes: npm audit JSON shape with `vulnerabilities[name].via[]`; the allowlist id `GHSA-7589-6fvf-x4pw`.
- Produces: `evaluateAuditReport(report, allowedAdvisories)` returning `string[]` of disallowed advisory ids; `classifyAuditCommands(liveResult, jsonResult, allowedAdvisories)` returning `{ exitCode, stdout, stderr }`; `runAudit({ spawn })` returning the same classification; `npm run audit:production`.

- [ ] **Step 1: Write the failing classification tests**

Create `src/test/security-audit.test.ts`. Import `evaluateAuditReport` and `classifyAuditCommands` from `scripts/audit-dependencies.mjs`. Assert:

```ts
const allowed = ['GHSA-7589-6fvf-x4pw'];
const allowedReport = {
  vulnerabilities: {
    effect: {
      via: [
        {
          title: 'Effect ReDoS',
          url: 'https://github.com/advisories/GHSA-7589-6fvf-x4pw',
          severity: 'high',
          range: '<=3.22.0',
        },
      ],
    },
    prisma: {
      via: [
        {
          title: 'Effect ReDoS',
          url: 'https://github.com/advisories/GHSA-7589-6fvf-x4pw',
          severity: 'high',
          range: '>=6.13.0-dev.1',
        },
      ],
    },
  },
};
expect(evaluateAuditReport(allowedReport, allowed)).toEqual([]);
```

Also assert: a report whose `via` includes `GHSA-NEW-0000-0000` returns that id; a vulnerability with no advisory object returns a fail-closed marker containing the package name; `classifyAuditCommands({ status: 0 }, undefined, allowed).exitCode === 0`; a live failure with an allowed-only JSON report returns exit 0 and a message naming the exception; a live failure with an unknown advisory returns exit 1 and no pass message; a live failure with malformed JSON returns exit 1.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/test/security-audit.test.ts`
Expected: FAIL because `scripts/audit-dependencies.mjs` does not exist.

- [ ] **Step 3: Implement the wrapper**

Following `scripts/detect-pending-migrations.mjs`, create `scripts/audit-dependencies.mjs` with the exact exports from Interfaces. `evaluateAuditReport` collects advisory ids from `via` objects using the last URL segment, skips string `via` entries and returns disallowed ids; it marks any vulnerability with no advisory object as disallowed by package name. `classifyAuditCommands` passes a successful live command through, parses JSON only after a failed live command, prints the real audit output through the CLI wrapper, and fails closed on spawn errors or parse errors. `runAudit({ spawn })` defaults to Node `spawnSync`, invokes `npm audit --omit=dev --audit-level=high` with inherited output, then invokes the same command with `--json` on failure, and returns `classifyAuditCommands(...)`. Add `"audit:production": "node scripts/audit-dependencies.mjs"` to `package.json`.

- [ ] **Step 4: Run the tests and language check**

Run: `npx vitest run src/test/security-audit.test.ts` then `npm run check:language`
Expected: both exit 0.

- [ ] **Step 5: Run the real audit and commit**

Run: `npm run audit:production`
Expected: exit 0, the real high-advisory output in the log and a message naming `GHSA-7589-6fvf-x4pw` as the documented exception. Commit with `git add package.json scripts/audit-dependencies.mjs src/test/security-audit.test.ts` and message `feat(security): add documented production audit gate`.

---

### Task 2: Dependabot, CodeQL and static job wiring

**Files:**
- Create: `.github/dependabot.yml`, `.github/workflows/codeql.yml`, `docs/SECURITY.md`
- Modify: `.github/workflows/ci.yml`
- Test: `src/test/security-automation.test.ts`

**Interfaces:**
- Consumes: `npm run audit:production` from Task 1; the advisory id `GHSA-7589-6fvf-x4pw` and review date `2026-12-25`.
- Produces: weekly Dependabot groups, a CodeQL Security-tab workflow, the audit step in `static`, and a documented exception that the guard tests pin.

- [ ] **Step 1: Write the failing guard tests**

Create `src/test/security-automation.test.ts` reading the four files above. Assert: `dependabot.yml` has package-ecosystem entries for `npm` and `github-actions`, both `directory: "/"` and `schedule.interval: weekly`, each with group `weekly-minor-patch`, patterns `*` and update-types `minor` and `patch`; `codeql.yml` uses `javascript-typescript`, `security-events: write`, `github/codeql-action/init@v3`, `autobuild` and `github/codeql-action/analyze@v3`; the `static` job block in `ci.yml` contains `npm run audit:production` but not `continue-on-error` or `|| true` on that step; `docs/SECURITY.md` contains the exact advisory id, the affected package chain, the reason, the owner and `2026-12-25`.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/test/security-automation.test.ts`
Expected: FAIL on the missing files and missing workflow step.

- [ ] **Step 3: Add the configuration and documentation**

Write `.github/dependabot.yml` with the two ecosystems, weekly schedule and `weekly-minor-patch` groups. Write `.github/workflows/codeql.yml` with push and pull-request triggers on `main`, a weekly schedule, `permissions: contents: read`, `actions: read`, `security-events: write`, one `analyze` job with a `javascript-typescript` matrix, `init@v3`, `autobuild`, `analyze@v3` and concurrency that cancels superseded runs of the same ref. Add a named audit step running `npm run audit:production` to the `static` job of `ci.yml`, with no error suppression. Create `docs/SECURITY.md` naming `GHSA-7589-6fvf-x4pw`, the chain `prisma -> @prisma/config -> effect`, the reason that Prisma 7.10.1 pins `effect` 3.20.0 and downgrading Prisma to 6.12.0 is breaking, the owner, the review date `2026-12-25`, the removal condition, and a link to the CI workflow step.

- [ ] **Step 4: Run the guard tests**

Run: `npx vitest run src/test/security-automation.test.ts`
Expected: PASS, including all existing assertions.

- [ ] **Step 5: Commit**

Commit with `git add .github/dependabot.yml .github/workflows/codeql.yml .github/workflows/ci.yml docs/SECURITY.md src/test/security-automation.test.ts` and message `chore(security): add dependabot and codeql automation`.

---

### Task 3: Verification, review record and PR

**Files:**
- Modify: `AI_LOG.md`
- Create: `docs/reviews/2026-11-25-requesting-code-review-security-automation.md`

**Interfaces:**
- Consumes: passing guards from Tasks 1 and 2.
- Produces: full captured check output, an honest AI_LOG entry, a review record and one PR for K2.

- [ ] **Step 1: Capture the full check set**

Using Node `spawnSync` with `encoding: 'utf8'` and `NO_COLOR: '1'`, run `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`, `npm run check:language`, `npm run audit:production`, and the focused `npx vitest run src/test/security-audit.test.ts src/test/security-automation.test.ts`. Set `DATABASE_URL=file:./prisma/e2e.db` for `npm run build`. Save stdout, stderr and `EXIT=` for each; replace Next.js legend U+0192 with `F` and note it.

- [ ] **Step 2: Review and record**

Load the exact skill id `requesting-code-review`, re-read every touched file and grep every consumer of changed values, then save the complete review in `docs/reviews/2026-11-25-requesting-code-review-security-automation.md` using `docs/reviews/TEMPLATE.md`. Prepend an `AI_LOG.md` entry with the verbatim prompt, self-verification, accepted and rejected findings, `AI sai ở đâu` and limitations. Verify the previous `##` header immediately follows the new `---`.

- [ ] **Step 3: Commit, push and open the PR**

Commit with a Conventional Commits `docs(security)` or `chore(security)` title. Push the K2 branch and open one PR with `gh`, pasting the full captured check output including every `EXIT=` line. Record CodeQL Security-tab results and the first Dependabot pull request as limitations until they exist on GitHub.
