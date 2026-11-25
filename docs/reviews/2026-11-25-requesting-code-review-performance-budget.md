# Code review - Performance budget K1 final round (2026-11-25)

- **Skill:** requesting-code-review
- **Scope:** whole `k1-performance-budget` branch, `b91f7a9..2813873`, plus the Task 3 working-tree
  changes: `docs/DEPLOY.md`, `docs/PERFORMANCE.md`, `AI_LOG.md`, the reconciled K1 spec and plan,
  and this review set.
- **Base:** `b91f7a9` | **Head:** working tree at `2813873` plus uncommitted documentation
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.

## Method

Read-only self-review with the exact skill id `requesting-code-review`; no reviewer subagent was
available in this harness, so this record states that fact instead of implying a second reviewer.
Before accepting any finding I re-read the whole source of every touched file: `docs/DEPLOY.md`,
`docs/PERFORMANCE.md`, `AI_LOG.md`, `lighthouserc.json`, `.gitignore`,
`src/test/lighthouse-config.test.ts`, `.github/workflows/ci.yml`, `src/test/ci-workflow.test.ts`,
the three `generateStaticParams` pages, the reconciled spec and plan, `docs/reviews/TEMPLATE.md`,
and both task review results. I grepped every consumer of the changed values (`lhci-report`,
`lighthouse-report`, `CHROME_PATH`, `lhci autorun`, `__empty__`, `P2021`, `generateStaticParams`)
across tracked text files and checked `git status` for stray report files. The single authoritative
capture for this fix round is `.superpowers/sdd/2026-11-25-performance-budget/final-checks.md`,
re-run with the prepared helper through Node `spawnSync`, `encoding: 'utf8'` and `NO_COLOR: '1'`.
The `## Verification output` block below is copied verbatim from that same file; no earlier check
run is used as evidence.

Spec Compliance: four storefront URLs, three mobile runs, median thresholds 0.85/0.90/0.95/0.1 at
`error` level, `lighthouse-report` artifact with `if: always()`, no report committed, and a verified
exit 0 for a build against an empty SQLite database. All are present. Strengths: the guard tests read
the real config and workflow text instead of trusting report prose; LHCI owns the port 3200 server
lifecycle; the empty-database experiment was captured before the documentation was changed.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| BR-1 | Important · `docs/DEPLOY.md:132`, `docs/DEPLOY.md:421` | Read either sentence and compare with `src/app/(public)/blog/[slug]/page.tsx:8-19` plus the captured empty-database build: an operator is told `generateStaticParams` returns empty params, but the code returns `{ slug: '__empty__' }` and an empty array would break Cache Components. | **Accepted (fixed in branch `k1-performance-budget`).** Both sentences now name the placeholder, keep the P2021 log visible, and link to the AI_LOG evidence. |
| BR-2 | Minor · `docs/PERFORMANCE.md:134-140` | Before the fix, the new CI section was inserted between the `CI` and `Đánh đổi E3` bullets, detaching one bullet from its list. Reading lines 132-134 showed the broken structure. | **Accepted (fixed in branch `k1-performance-budget`).** The section was moved to the end of the file and the blank line between the two bullets removed. |
| BR-3 | Minor · `docs/superpowers/specs/2026-11-25-security-automation-design.md:1` | `git status` shows this untracked K2 spec beside the K1 spec and plan; a broad `git add docs/superpowers` would commit K2 work into a K1 PR. | **Rejected.** The brief permits only the K1 spec and plan in this commit; the K2 file stays untracked and unchanged for its own PR. |
| BR-4 | Minor · `scripts/check-language.mjs:40-43` (not touched) | Run `npm run check:language` on Windows: it exits 0 but prints no success line because `new URL(import.meta.url).pathname` is URL-encoded while `process.argv[1]` is a Windows path. | **Rejected as out of scope.** The script is pre-existing and outside the K1 file list. I ran an explicit `findDisallowedLetters` scan over all scanned extensions; it found no disallowed letters. |
| BR-5 | Minor · `lighthouserc.json:29-32`, `.github/workflows/ci.yml:118-124` | A naive `git add -A` after a local `lhci autorun` could stage `lhci-report/`; the workflow upload and config both point there. | **Accepted as already guarded.** `.gitignore:17` ignores `/lhci-report/`, `src/test/lighthouse-config.test.ts:79-85` pins the ignore entry, and `git status` shows no report file in the commit. |

No Critical issue and no open Important issue remain. The two Important/Minor documentation defects
were fixed in this branch before the final check run; the remaining findings are explicit rejections
with concrete reasons.

## Declined to judge

- Live `npx lhci autorun` scores and the deliberate Performance failure: no runner here; Task 4 owns
  the red run and the controller owns the push.
- PostgreSQL production build with no tables: no credentials; the recorded experiment used SQLite,
  and the doc link states that limitation.
- Dependabot/CodeQL/npm audit from K2: different PR, different spec.
- Change history in old AI_LOG entries that still describe `generateStaticParams` returning `[]`:
  historical verbatim records; rewriting them would falsify what was done at that time.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Four URLs, three runs, mobile settings, four error-level median assertions | `src/test/lighthouse-config.test.ts:35-77`, focused guard run in `final-checks.md` | đạt/pass |
| Workflow steps and artifact settings | `src/test/ci-workflow.test.ts:110-131`, focused guard run in `final-checks.md` | đạt/pass |
| Build succeeds with no Prisma tables | Empty-database capture in `AI_LOG.md`, `EXIT=0`, 24/24 static pages and three `__empty__` routes | đạt/pass |
| Reports not committed | `.gitignore:17`, config test, `git status --porcelain=v1` | đạt/pass |
| Full check set | Single authoritative capture at `final-checks.md`, re-run after the fix edits; its verbatim copy is in `## Verification output`, seven `EXIT=` lines | đạt/pass |
| Language rule | `npm run check:language` `EXIT=0` plus the explicit `findDisallowedLetters` scan | đạt/pass |
| PR body carries the full captured output | `pr-body.md` contains `final-checks.md` verbatim with every `EXIT=` line | đạt/pass |

## Verification output

```text
## lint
$ npm run lint

> ant-jewelry@0.1.0 lint
> eslint



EXIT=0

## typecheck
$ npm run typecheck

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit



EXIT=0

## test
$ npm test

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  90 passed (90)
      Tests  458 passed (458)
   Start at  22:29:30
   Duration  55.27s (tests 47%, import 33%, environment 11%, transform 4%, setup 2%, worker 2%)

     Import  214 modules were evaluated 682 times · 10.22s total, 33% of tracked time
             ~7.02s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation



EXIT=0

## format:check
$ npm run format:check

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!


EXIT=0

## build
$ npm run build

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
- Environments: .env.production.local, .env.local, .env
✓ Running next.config.ts took 204ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 4.6s
  Running TypeScript ...
  Finished TypeScript in 5.3s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 6.7s
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

## check:language
$ npm run check:language

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs



EXIT=0

## focused guard tests
$ npx vitest run src/test/lighthouse-config.test.ts src/test/ci-workflow.test.ts

 RUN  v5.1.0 D:/thuc tap/ant-jewelry


 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  22:30:57
   Duration  8.20s (tests 29%, import 21%, setup 19%, transform 18%, worker 13%, environment 1%)



EXIT=0
```

Ký hiệu legend U+0192 của Next.js được helper thay bằng `F` trước khi ghi `final-checks.md`; cùng
bản output đã làm sạch này được dán ở trên và trong `pr-body.md` theo `AGENTS.md`. Không có file
capture raw được giữ trong workspace SDD; không có bản check cũ nào được dùng làm bằng chứng.

## Limitations

- No GitHub runner, production credentials or Figma source file were available.
- `check:language` prints no success line on this Windows host; the explicit scan is the evidence.
- The review is a read-only self-review, not an independent reviewer subagent round.
- Push, PR creation and the Task 4 negative evidence run remain controller-owned.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.
