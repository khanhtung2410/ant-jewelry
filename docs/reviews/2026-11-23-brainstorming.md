# Code review - builder check on CI deploy gating design (2026-11-23)

- **Skill:** brainstorming
- **Scope:** design doc `docs/superpowers/specs/2026-11-23-ci-deploy-gating-design.md` before writing the implementation plan
- **Base:** `c75a89c` | **Head:** branch `docs/ci-deploy-gating-spec`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-23 14:42:12 +07:00 - Spec và plan cho tách CI, deploy và migration`.

## Method

Loaded `brainstorming` before any design work, read the current workflow, Vercel config, migration script, smoke config and deployment docs, then wrote the spec. Dispatched a fresh general-purpose builder-check subagent with the skill's `builder-check-prompt.md`, exact document path and a DevOps domain. The subagent returned seven questions ranked by impact. Re-read the real source for each question before sorting it into answered, my-call, or owner-only.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `docs/superpowers/specs/2026-11-23-ci-deploy-gating-design.md:11` | `DIRECT_URL` was deliberately removed from the PostgreSQL schema; reintroducing it would add a secret and change four docs plus `.env.example`, while the repo already documents using the direct string in `DATABASE_URL`. | **Accepted (owner decided: keep `DATABASE_URL` direct; spec updated)** |
| 2 | Important · `docs/DEPLOY.md:60-72` | Unclear whether app env stays in Vercel or moves into the GitHub Environment; wrong guess duplicates secrets or breaks `vercel pull`. | **Accepted (my call: app env stays in Vercel; spec updated)** |
| 3 | Important · `e2e/production.smoke.spec.ts:12-27`, `playwright.production.config.ts:19` | Smoke against a per-deployment URL would fail the canonical assertion and roll back a healthy release. | **Accepted (my call: smoke targets `SITE_URL` origin; spec updated)** |
| 4 | Important · `.github/workflows/npm-ci.yml:1` | `workflow_run.workflows` matches the workflow `name:`, not the filename; leaving `name: npm ci (Linux)` after a rename would silently disable deploy. Required check names were ambiguous. | **Accepted (my call: `name: ci` and jobs `static`, `test`, `build`, `e2e`; spec updated)** |
| 5 | Minor · spec "Evidence and access limits" | Live external actions were conditional, leaving verification scope undecided. | **Accepted (owner chose live actions once credentials are supplied; spec updated)** |
| 6 | Minor · `playwright.production.config.ts:16` | Only the `list` reporter is configured, so an artifact step would upload nothing. | **Accepted (my call: add html reporter with `open: 'never'`; spec updated)** |
| 7 | Minor · `docs/DEPLOY.md:236` | Project policy requires a snapshot before each migration; the described job had no checkpoint step. | **Accepted (my call: manual reviewer gate plus printed commit SHA; spec updated)** |

## Declined to judge

- Re-enabling C5 preview deploys: owner marked it optional and the spec defers it.
- Live GitHub/Vercel configuration: no credentials supplied yet; recorded as blocked, not claimed as done.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Spec covers C1-C4 and defers C5 | Section headings in `docs/superpowers/specs/2026-11-23-ci-deploy-gating-design.md` | đạt/pass |
| Builder check used a concrete skill id | `- **Skill:** brainstorming` above and `builder-check-prompt.md` from that skill | đạt/pass |
| Plan gives one PR per item in order | Tasks 1-4 in `docs/superpowers/plans/2026-11-23-ci-deploy-gating.md` | đạt/pass |
| Plan tests live under Vitest `include` | Self-review correction to `src/test/detect-pending-migrations.test.ts`; `vitest.config.mts:14` includes `src/**/*.{test,spec}.{ts,tsx}` | đạt/pass |
| Full check set green with complete output | Attached stdout/stderr below, all six commands `EXIT=0` | đạt/pass |
| Language-clean documentation | `npm run check:language` `EXIT=0` in the attached output | đạt/pass |

## Verification output

Captured with Node `spawnSync`, UTF-8, `NO_COLOR=1`. Full stdout/stderr, verbatim:

```text
Verification run at 2026-11-23T07:44:01.060Z

=== npm run lint ===


> ant-jewelry@0.1.0 lint
> eslint

EXIT=0

=== npm run typecheck ===


> ant-jewelry@0.1.0 typecheck
> tsc --noEmit

EXIT=0

=== npm test ===


> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  82 passed (82)
      Tests  389 passed (389)
   Start at  14:44:23
   Duration  51.20s (tests 45%, import 34%, environment 13%, transform 4%, setup 2%, worker 2%)

     Import  205 modules were evaluated 662 times · 9.66s total, 34% of tracked time
             ~6.67s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation

EXIT=0

=== npm run format:check ===


> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

EXIT=0

=== npm run build ===


> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
- Environments: .env.production.local, .env.local, .env
✓ Running next.config.ts took 272ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 3.4s
  Running TypeScript ...
  Finished TypeScript in 5.6s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.3s
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
│ ├ ○ /blog/cach-chon-nhan-cuoi-phu-hop            15m      1y
│ ├ ○ /blog/cac-kieu-giac-cat-kim-cuong            15m      1y
│ └ ◐ [+3 more paths]
├   /c/[slug]                                      15m      1y
│ ├ ◐ /c/[slug]                                    15m      1y
│ ├ ◐ /c/wedding-ring                              15m      1y
│ ├ ◐ /c/engagement-ring                           15m      1y
│ └ ◐ [+2 more paths]
├ ○ /jewelry-care                                  15m      1y
├   /p/[slug]                                      15m      1y
│ ├ ◐ /p/[slug]                                    15m      1y
│ ├ ○ /p/aurora-band                               15m      1y
│ ├ ○ /p/eclipse-pave-band                         15m      1y
│ └ ◐ [+21 more paths]
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

=== npm run check:language ===


> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs

EXIT=0
```

Ghi chú: trong bản ghi output `next build` ở trên, ký hiệu legend `F` thay cho ký tự gốc U+0192 (LATIN SMALL LETTER F WITH HOOK) để tuân quy tắc chỉ dùng chữ cái tiếng Việt và tiếng Anh. Các dòng khác được giữ nguyên.

## Limitations

- The builder-check subagent read only the design doc and was not asked to re-run suites.
- No live GitHub or Vercel configuration was performed; no credentials were available at review time.
- This round adds no independent product finding beyond the design review and the mentor checklist.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-23 14:42:12 +07:00 - Spec và plan cho tách CI, deploy và migration`.
