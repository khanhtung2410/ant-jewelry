# Code review - scoped re-review of the capture alias fix (2026-11-24)

- **Skill:** `subagent-driven-development`
- **Scope:** fix round 1 of the capture alias fix, commits `d58149a..82c22b3` (workflow capture and rollback guards, docs, guard tests)
- **Base:** `d58149a` | **Head:** `82c22b3`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 21:12:02 +07:00 - Scoped re-review cho capture alias fix`.

## Method

Fresh-context reviewer dispatched with the exact skill id `subagent-driven-development` and the scoped re-review template. It was read-only, received the task brief, the fix report, the three findings under verification, and the review package for `d58149a..82c22b3`. It re-read the whole `.github/workflows/deploy.yml`, `docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `src/test/deploy-workflow.test.ts` and `src/test/smoke-rollback.test.ts`, and grepped `has_target|steps.select|previous_id|previous_url|deploymentId` to find every consumer. It did not re-run the suites; it verified the implementer report's named tests and output.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| R1 | Important · `docs/DEPLOY.md:190,198`, `docs/ARCHITECTURE.md:994` (before) | Manual rollback told the reader to copy `uid` from `vercel ls --prod --json`, a field that does not exist; architecture described rollback by `uid` and finalize red for every smoke that is not `success`. | **Accepted (fixed in `ci/fix-capture-alias-api`)** - now uses `deploymentId` from `GET /v1/aliases/<alias>` and `previous_id`, dashboard promotion as fallback, and finalize is red only on `failure`/`cancelled`. Verified ADDRESSED. |
| R2 | Minor · `.github/workflows/deploy.yml:284` (before) | A capture failure left `deploy` at `failure`, so rollback still started and printed a second, misleading "No previous production deployment id". | **Accepted (fixed in `ci/fix-capture-alias-api`)** - `id: select` with `has_target`, neutral exit 0 for a real run without a target, and `if: steps.select.outputs.has_target == 'true'` on the alias call; drill without an id still errors. Verified ADDRESSED. |
| R3 | Minor · `.github/workflows/deploy.yml:183-184` (before) | Alias host handling stripped only `https://`; an `http://` origin would build a malformed alias. | **Accepted as documented (fixed in `ci/fix-capture-alias-api`)** - `DEPLOY.md` states the HTTPS-origin-only constraint and that a malformed `SITE_URL` fails the non-2xx lookup before promotion. Verified ADDRESSED under the authorized smaller option. |
| R4 | Minor · `docs/reviews/2026-11-24-receiving-code-review-fix-capture-round1.md:36,38-40` | The round-1 review record only points at a temp path instead of attaching the full stdout/stderr with `EXIT=` lines, contrary to `docs/reviews/TEMPLATE.md:28-30`. | **Accepted (fixed in `ci/fix-capture-alias-api`)** - the round-1 record and this record now embed the complete captured output. |

New breakage in the fix diff: none Critical or Important. Out-of-scope observation: historical plan and older review files still mention `uid`/CLI rollback; they are historical records and were deliberately left untouched.

## Declined to judge

- A live `deploy.yml` run on GitHub Actions after the fix: the implementer was forbidden to push or touch live settings, and the controller owns that run.
- Test suites: the reviewer did not re-run them by design; the controller re-ran the full set before the PR.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Capture uses the alias endpoint and fails closed | `src/test/deploy-workflow.test.ts > captures the previous deployment from the production alias endpoint` and `> rejects an alias response missing the deployment url or id` | đạt/pass |
| Alias payload crosses from REST into both outputs | flow test `> parses the alias response into the deployment url and id` (runs the embedded Node parser) | đạt/pass |
| Rollback skips cleanly without a target, drill still errors | `src/test/smoke-rollback.test.ts > skips the alias call cleanly when capture produced no target` | đạt/pass |
| Finalize fails only on real smoke failure or cancel | `src/test/deploy-workflow.test.ts > documents the alias capture, the alias fallback and the exact finalize cases` and `src/test/smoke-rollback.test.ts > leaves the workflow red when smoke failed even after a rollback` | đạt/pass |
| Stale `uid` guidance is gone from the two reported docs | same documentation guard, assertions on `Manual rollback` and the architecture `finalize` line | đạt/pass |
| Full check set on the final tree | output below with every `EXIT=` line | đạt/pass |

## Verification output

Full check set on the final tree, captured via Node `spawnSync` in UTF-8 with `NO_COLOR=1` and `DATABASE_URL=file:./prisma/dev.db`:

```text
$ npx --no-install next typegen
Generating route types...
✓ Types generated successfully
EXIT=0

$ npm run db:push

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

The database is already in sync with the Prisma schema.

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
EXIT=0

$ npm run lint

> ant-jewelry@0.1.0 lint
> eslint

EXIT=0

$ npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0

$ npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/ci-deploy-gating


 Test Files  86 passed (86)
      Tests  431 passed (431)
   Start at  21:07:18
   Duration  190.67s (environment 42%, import 33%, tests 18%, transform 6%, setup 1%, worker 1%)

     Import  210 modules were evaluated 672 times · 45.95s total, 33% of tracked time
             ~31.59s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

$ npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
EXIT=0

$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 503ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 22.4s
  Running TypeScript ...
  Finished TypeScript in 10.5s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 6.3s
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
│ └ ○ /blog/__empty__                              15m      1y
├   /c/[slug]                                      15m      1y
│ ├ ◐ /c/[slug]                                    15m      1y
│ └ ◐ /c/__empty__                                 15m      1y
├ ○ /jewelry-care                                  15m      1y
├   /p/[slug]                                      15m      1y
│ ├ ◐ /p/[slug]                                    15m      1y
│ └ ○ /p/__empty__                                 15m      1y
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

EXIT=0

$ npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0
FAILED_COMMANDS=0
```

Ghi chu: ky tu legend U+0192 cua Next.js da duoc thay bang `F`.

## Limitations

- No live workflow run, smoke, rollback or drill after the fix; those are verified after the PR merges.
- The alias response shape comes from the controller's live check, not from a repo-side request.
- Checks ran on Windows with SQLite, not on `ubuntu-latest` in Actions.
- Historical plan and review files that mention `uid` or CLI rollback were left unchanged on purpose.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 21:12:02 +07:00 - Scoped re-review cho capture alias fix`.
