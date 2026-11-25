# Dependency and security automation (K2, 2026-11-25)

## Intent and why

The repository currently has no automatic dependency updates and no security scanning in CI. Known
vulnerabilities are only found by an occasional manual `npm audit`, so stale or vulnerable packages
can sit unnoticed. The owner wants Dependabot to propose small weekly updates, CodeQL to scan the
JavaScript and TypeScript source, and a production dependency audit to run in the CI `static` job. A
currently known advisory must be recorded and time-boxed instead of turning the audit off.

## Goals

- Add `.github/dependabot.yml` for `npm` and `github-actions`, weekly, grouping minor and patch
  updates into one pull request for each ecosystem.
- Add a CodeQL workflow for `javascript-typescript` that uploads results to the GitHub Security tab.
- Run a production dependency audit in the `static` job of `.github/workflows/ci.yml`.
- Document the existing `effect` advisory in `docs/SECURITY.md` with the reason for temporary
  acceptance and a review date; any other high or critical advisory must still fail CI.

## Non-goals

- Downgrading Prisma to 6.12.0 or overriding `effect` to 4.x. Both are breaking changes to a
  build-time toolchain and are outside this task.
- Making the audit step `continue-on-error`, adding `|| true`, or otherwise suppressing all findings.
- Merging pull requests. Repository rules say the author does not self-merge; Dependabot and CodeQL
  results remain subject to the usual review.
- Scanning languages other than JavaScript and TypeScript.

## Approaches considered

1. **Run the literal `npm audit --omit=dev --audit-level=high` behind a small wrapper that only
   accepts documented advisories.** Chosen. The real command and its output stay in the CI log, and
   the job still fails on anything new.
2. **Set `continue-on-error: true` on the audit step.** Rejected: it turns off the gate the owner asked
   for and would hide new vulnerabilities.
3. **Add an npm `override` for `effect`.** Rejected: `effect` 3.20.0 comes from Prisma 7.10.1 via
   `@prisma/config`; forcing 4.x is an untested breaking change in the CLI toolchain.
4. **Only document the advisory without a CI check.** Rejected: the documented exception would have
   no enforcement and could silently widen over time.

## Design

### Dependabot

`.github/dependabot.yml` has two entries, both with `directory: "/"`, `schedule.interval: weekly`
and a group named `weekly-minor-patch` with patterns `*` and update types `minor` and `patch`. Major
updates stay as individual pull requests so they can be reviewed separately.

### CodeQL

Add `.github/workflows/codeql.yml`:

- triggers on push and pull request to `main`, plus a weekly `schedule`;
- `permissions: contents: read`, `actions: read`, `security-events: write`;
- one `analyze` job with a matrix over `javascript-typescript`, using `github/codeql-action/init@v3`,
  `github/codeql-action/analyze@v3` and `autobuild` so no language-specific build command is hard-coded;
- concurrency that cancels superseded runs of the same ref.

The workflow is not added to the required status checks: it reports into the Security tab.

### Production audit wrapper

- Add `scripts/audit-dependencies.mjs`, following the testable seam used by
  `scripts/detect-pending-migrations.mjs`:
  - export `evaluateAuditReport(report, allowedAdvisories)` which returns the disallowed advisory
    list;
  - export `runAudit({ spawn })` which runs `npm audit --omit=dev --audit-level=high` with inherited
    output, and on failure runs the same command with `--json` to classify the findings;
  - keep direct invocation printing the real output and exiting 0 only when every finding is in the
    documented allowlist.
- Add `npm run audit:production` and call it as a named step in the `static` job of `ci.yml`.
- The allowlist contains only advisory `GHSA-7589-6fvf-x4pw` (`effect` ReDoS through
  `@prisma/config` and `prisma`). Any new advisory fails the job.

### Security record

Create `docs/SECURITY.md` with:

- the advisory id, affected package chain and severity;
- the reason for temporary acceptance: fixing it means downgrading Prisma to 6.12.0 (a breaking
  change), and the vulnerable package belongs to the Prisma build-time CLI chain rather than the
  runtime storefront bundle;
- the review date `2026-12-25`, the owner responsible, and the exact condition that would remove the
  exception (a compatible Prisma upgrade or an upstream patched release);
- a link to the workflow step that enforces the allowlist.

### Guard tests

- Add `src/test/security-automation.test.ts` that:
  - injects a fake audit report with only the documented advisory and asserts exit 0;
  - injects a report with an unknown advisory and asserts a non-zero exit and no pass message;
  - asserts the advisory id in the wrapper is also written in `docs/SECURITY.md` with a review date;
  - asserts `.github/dependabot.yml` covers both ecosystems, weekly schedule and minor/patch groups;
  - asserts the CodeQL workflow uses `javascript-typescript`, `security-events: write` and the
    `init`/`analyze` actions;
  - asserts the `static` job in `ci.yml` runs `npm run audit:production` and that no
    `continue-on-error` or `|| true` appears on that step.
- Extend `src/test/ci-workflow.test.ts` only if the existing block reader needs a new job name; the
  four required check names must remain unchanged.

### Verification and evidence

Run the full check set through Node `spawnSync` in UTF-8 with `NO_COLOR=1`, plus `npm run audit:production`
and `npm test`. Prepend an `AI_LOG.md` entry, save a review record with `docs/reviews/TEMPLATE.md`, and
open one PR with `gh` using a Conventional Commits title. After merge, verify CodeQL results in the
Security tab and the first Dependabot pull request through the GitHub API where access allows; record
anything that requires the owner's merge as a limitation instead of claiming it as complete.

## Risks

- `npm audit --omit=dev` still reports direct development dependencies such as `prisma`; the wrapper
  documents exactly why this single chain is accepted rather than pretending it is a production
  package.
- Dependabot group settings differ slightly between ecosystems; the guard test checks the file shape
  and the first real pull request confirms behavior.
- CodeQL results depend on GitHub Actions permissions and repository settings that are outside this
  repository's YAML; access limitations will be recorded honestly.
