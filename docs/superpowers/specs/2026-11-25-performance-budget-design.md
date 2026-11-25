# Performance budget in CI (K1, 2026-11-25)

## Intent and why

Lighthouse numbers are currently measured by hand and recorded in `docs/PERFORMANCE.md`. A pull
request that slows a page therefore merges with a green CI and the regression is only noticed by a
later manual measurement. The owner wants CI to fail when a page falls below the agreed budget, so
the same thresholds that are documented today are enforced automatically.

## Goals

- Run `@lhci/cli` inside the existing `e2e` job of `.github/workflows/ci.yml` against a local
  production build, not against a Vercel preview.
- Measure Home, a category page, a product page and a blog detail page, three runs each, with mobile
  emulation and simulated throttling.
- Fail the job when the median Performance is below 85, Accessibility below 90, SEO below 95, or the
  median CLS is above 0.1.
- Upload the raw Lighthouse reports as a workflow artifact; never commit them to the repository.
- Verify that `npm run build` still succeeds when the SQLite database has no Prisma tables, and fix
  the stale documentation sentence that says `generateStaticParams` returns empty params.

## Non-goals

- Replacing the manual baseline in `docs/PERFORMANCE.md` with CI numbers. CI reports are evidence for
  a single run, not a new documented baseline.
- Measuring desktop profiles or pages outside the four named routes.
- Changing application code to silence Prisma `P2021` log messages during a build with no tables.
- Adding a hosted Lighthouse CI server or uploading reports to public temporary storage.

## Approaches considered

1. **Add Lighthouse CI as the last step of the `e2e` job.** Chosen. The job already installs Chromium,
   resets a dedicated `prisma/e2e.db`, creates a production build and starts `next start`. Reusing
   that setup avoids a second checkout and a second browser installation.
2. **Create a separate `performance` job.** Rejected: it would repeat checkout, install, browser
   download and build, and the owner explicitly asked for the check inside `e2e`.
3. **Measure a Vercel preview deployment.** Rejected: the deployment decision in `docs/DEPLOY.md`
   disabled Vercel Git integration, so a preview URL is not reliably available for every PR.

## Design

### Dependency and configuration

- Add `@lhci/cli@0.16.1` to `devDependencies` and update `package-lock.json`. Version 0.16.1 requires
  Node >= 22.19; the repository already requires Node >= 22 and CI uses Node 22.
- Add `lighthouserc.json` at the repository root:
  - `ci.collect.url`: `http://127.0.0.1:3200/`, `/c/wedding-ring`, `/p/aurora-band`,
    `/blog/cach-chon-nhan-cuoi-phu-hop`. These slugs already exist in the E2E seed and in the current
    production smoke suite.
  - `ci.collect.numberOfRuns: 3`, `ci.collect.settings.formFactor: mobile`,
    `ci.collect.settings.throttlingMethod: simulate`,
    `ci.collect.settings.chromeFlags: --no-sandbox` so the hosted runner can launch Chromium before
    any assertion runs.
  - `ci.collect.startServerCommand: npm run start -- --hostname 127.0.0.1 --port 3200` and a ready
    pattern matching the verified Next.js 16 `Local:` banner, so LHCI starts and stops the server
    itself.
  - `ci.assert.assertions`: `categories:performance` minScore 0.85, `categories:accessibility`
    minScore 0.90, `categories:seo` minScore 0.95 and `cumulative-layout-shift` maxNumericValue 0.1,
    all with `aggregationMethod: median`.
  - `ci.upload.target: filesystem`, `outputDir: ./lhci-report`, so reports stay on the runner.
- Add `/lhci-report/` to `.gitignore`. The existing `lighthouse-reports.test.ts` guard continues to
  allow only the committed v4 and ivy baselines.

### Workflow changes

In the `e2e` job, after `npm run test:e2e`:

- resolve the Playwright Chromium executable into `CHROME_PATH` through `$GITHUB_ENV`;
- reset `prisma/e2e.db` again and rebuild, so Lighthouse measures the seeded catalogue rather than
  whatever the E2E uploads mutated;
- run `npx lhci autorun`;
- upload `lhci-report/` with `actions/upload-artifact@v4` and `if: always()`, retention 7 days.

The four existing required status checks (`static`, `test`, `build`, `e2e`) keep their names; only the
`e2e` job gains steps.

### Guard tests

- Extend `src/test/ci-workflow.test.ts` to assert that the `e2e` job contains the Chromium lookup,
  `npx lhci autorun`, an artifact upload with `if: always()` and the `lhci-report/` path.
- Add `src/test/lighthouse-config.test.ts` to read `lighthouserc.json` and assert the four URLs, three
  runs, mobile settings, all four thresholds with median aggregation, filesystem upload, and that
  `.gitignore` ignores the report directory. This is the flow test for values crossing from config
  into the workflow: the artifact path in the config must equal the uploaded path in `ci.yml`.

### Documentation and evidence

- Add a CI budget section to `docs/PERFORMANCE.md`. Do not copy numbers there from an individual run;
  link to the workflow artifact convention instead.
- Correct `docs/DEPLOY.md` where it says `generateStaticParams` returns empty params on `P2021`; the
  current code returns a single `__empty__` placeholder. Verify first with a build against an empty
  SQLite file and record the exit code in the AI_LOG entry.
- Capture one deliberate failing run: a throwaway branch that adds a large unoptimized image to Home,
  opened as a PR and closed after the red `e2e` job is recorded. The PR must not be merged.
- Run the full check set through Node `spawnSync` in UTF-8 with `NO_COLOR=1`, prepend an `AI_LOG.md`
  entry, save a review record using `docs/reviews/TEMPLATE.md`, and open one PR with `gh`.

## Risks

- Lighthouse scores on shared CI runners vary. Three runs with median aggregation follow the existing
  manual method; the 85/90/95/0.1 budget leaves headroom over the documented baseline.
- `startServerCommand` must match the real `next start` banner; Task 1 verified the Next.js 16
  `Local:` line locally, and a future banner change must update both the config and its guard test.
- Rebuilding after E2E adds time to the job but keeps the measured dataset deterministic.
