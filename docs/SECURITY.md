# Security

This document records the security automation for the repository and every temporary exception that
the production dependency audit accepts. The allowlist lives in
[`scripts/audit-dependencies.mjs`](../scripts/audit-dependencies.mjs); the audit runs as a named step
in the `static` job of [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Automated checks

- Dependabot opens weekly npm and GitHub Actions pull requests. Minor and patch updates are grouped
  into one pull request per ecosystem; major updates stay separate.
- CodeQL scans JavaScript and TypeScript on every push and pull request to `main` and on a weekly
  schedule, and uploads the results to the GitHub Security tab.
- `npm run audit:production` runs `npm audit --omit=dev --audit-level=high` in the `static` CI job.
  A high or critical advisory fails the job unless it is listed in the allowlist below.

## Accepted advisory: GHSA-7589-6fvf-x4pw

| Field | Value |
|---|---|
| Advisory | `GHSA-7589-6fvf-x4pw` |
| Severity | High |
| Package chain | `prisma -> @prisma/config -> effect` |
| Installed versions | `prisma` 7.10.1, `@prisma/config` 7.10.1, `effect` 3.20.0 |
| Owner | `khanhtung2410` |
| Review date | `2026-12-25` |

### Why this exception exists

Prisma 7.10.1 pins `effect` 3.20.0 through `@prisma/config`, so the vulnerable version cannot be
replaced without changing the Prisma release line. The advisory is a regular expression denial of
service in `effect`. Downgrading Prisma to 6.12.0 is a breaking change to the build-time toolchain
and is not acceptable for this task. The affected package is part of the Prisma CLI chain that runs
during generation and build, not part of the runtime storefront bundle.

The exception only covers this advisory id. Any other high or critical advisory, including a second
advisory on the same package chain, still fails the audit.

### Review and removal

- Review date: `2026-12-25`. The owner must re-check the advisory and the installed Prisma version
  on or before that date.
- Remove this exception when Prisma publishes a compatible release that uses a patched `effect`
  version (or a version outside the vulnerable range), or when the advisory is withdrawn. Then
  remove `GHSA-7589-6fvf-x4pw` from `ALLOWED_ADVISORIES`, delete this section, and confirm that
  `npm run audit:production` passes without the allowlist.
- The exception is enforced by the audit step in the `static` job of
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). That step runs
  `npm run audit:production` without any error suppression.

## Reporting a vulnerability

Do not open a public issue. Follow the security reporting process in
[`docs/CONTRIBUTING.md`](CONTRIBUTING.md).
