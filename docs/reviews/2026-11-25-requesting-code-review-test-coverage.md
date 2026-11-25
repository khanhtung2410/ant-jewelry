# Code review - Post-2026-11-21 update coverage (2026-11-25)

- **Skill:** `requesting-code-review`
- **Scope:** Coverage audit for the two update waves after 2026-11-21: hero slider auto-advance, pause, reduced motion and removed pause control; CI required checks, deploy trigger, migration approval, alias capture, smoke and rollback; stale capture cleanup and docs evidence
- **Base:** `eb7e241` | **Head:** `4aff895`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 12:44:33 +07:00 - Bổ sung coverage và verification cho các cập nhật mới`.

## Method

Self-review under the exact skill id `requesting-code-review`; no reviewer subagent was dispatched for this coverage-audit round, as required by the task brief. Before writing, I read the whole task brief, `docs/reviews/TEMPLATE.md`, the design spec, the first 80 lines of `AI_LOG.md` for the entry format, and all four task review records. I re-read the named test files and compared the base tree at `eb7e241` with the head tree at `4aff895`: `git ls-tree eb7e241 -- e2e src/test` shows only `e2e/hero-slider-a11y.spec.ts`, while the three new files `e2e/hero-slider.spec.ts`, `src/test/detect-pending-migrations-cli.test.ts` and `src/test/deploy-workflow-graph.test.ts` exist only on this branch. I did not rewrite historical verbatim prompts or old plans. Every pass claim below points to a named test or to the captured output in this record.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| C-1 | Important · `e2e/hero-slider.spec.ts:13-30,78-94` | At `eb7e241`, auto-advance and manual reset were covered only by fake timers in `src/features/layout/components/hero-slider.auto-slide.test.tsx:134-172`, so a browser hydration or scheduling regression could pass CI. Run `npm run test:e2e -- e2e/hero-slider.spec.ts`; the captured run shows the 5-second loop and the countdown reset passing on both browser projects. | **Accepted (fixed in `test/new-update-flow-coverage`)** - the new spec asserts the active dot through slides 1, 2, 3 and back to 1, then asserts no advance 2.5 seconds after a manual dot selection. |
| C-2 | Important · `e2e/hero-slider.spec.ts:32-76` | At `eb7e241`, hover and focus pause were covered only in jsdom at `src/features/layout/components/hero-slider.auto-slide.test.tsx:226-265`; removing the real pointer or focus handlers was not caught in a browser. Run the focused E2E command; the captured output shows both pause and resume cases passing on desktop-chrome and pixel-7. | **Accepted (fixed in `test/new-update-flow-coverage`)** - the two browser tests use explicit 2-second observation windows and a hydration gate, as recorded in `docs/reviews/2026-11-25-subagent-driven-development-task2.md`. |
| C-3 | Minor · `e2e/hero-slider-a11y.spec.ts:8-20`; `src/features/layout/components/hero-slider.auto-slide.test.tsx:267-292` | `git show eb7e241:e2e/hero-slider-a11y.spec.ts` already contains the reduced-motion browser test, and the unit file already covers a preference change. No gap was found. The targeted capture ran only `e2e/hero-slider.spec.ts`, so runtime evidence for this pre-existing spec is absent from this check set. | **Accepted (no gap; no new test)** - existing named tests are retained unchanged; runtime pass for this pre-existing spec is `lacking evidence` in this capture. |
| C-4 | Important · `e2e/hero-slider.spec.ts:96-105`; `src/features/layout/components/hero-slider.auto-slide.test.tsx:294-299` | At `eb7e241`, the removed pause control had a unit-only guard. Reintroducing a Play or Pause button would not fail any browser job. Run the focused E2E command; the captured output shows the count-zero assertion and the load-time `aria-live="off"` assertion passing on both projects. | **Accepted (fixed in `test/new-update-flow-coverage`)** - a browser regression guard now checks the accessible button name and the live-region initial state. |
| C-5 | Important · `src/test/deploy-workflow-graph.test.ts:79-94`; `src/test/ci-workflow.test.ts:41-94`; `src/test/deploy-workflow.test.ts:85-126` | Text guards at the base could still pass if job ids or `needs:` targets drifted, because they did not resolve the real YAML graph. Run `npm test`; the full suite reports 88 files and 445 tests passing, including the new graph test. | **Accepted (fixed in `test/new-update-flow-coverage`)** - the new test resolves every `needs:` target in both workflows, rejects cycles, and pins `workflow_run.workflows: [ci]` to the `name: ci` workflow. |
| C-6 | Important · `src/test/detect-pending-migrations-cli.test.ts:8-71`; `src/test/detect-pending-migrations.test.ts:5-40` | At `eb7e241`, only classifier unit tests existed; the wrapper's exit codes, refusal message and exact npm arguments were untested. Run `npm test`; the captured suite passes the six new CLI cases together with the existing classifier cases. | **Accepted (fixed in `test/new-update-flow-coverage`)** - `runStatusCommand` and `classifyStatusCommand` are covered for pending banner precedence, up-to-date output, empty or unknown output, failed status, spawn error and injected environment. |
| C-7 | Important · `src/test/deploy-workflow-graph.test.ts:42-77`; `src/test/deploy-workflow.test.ts:40-47,175-271,402-420` | At `eb7e241`, alias parser execution and workflow text guards existed, but the deploy order and target resolution were not pinned structurally. A dropped edge could keep the text guards green. Run `npm test`; the captured suite passes the new graph assertions over the real workflow files. | **Accepted (fixed in `test/new-update-flow-coverage`)** - the chain `verify-ci -> check-migrations -> approval -> migrate -> deploy -> smoke -> rollback -> finalize` is asserted through real `needs:` edges, with target resolution and acyclicity checked first. |
| C-8 | Minor · `docs/DEPLOY.md:155-157,362`; `docs/reviews/2026-11-25-superpowers-deploy-evidence.md` | Reading the deployment record shows the branch-protection image, the Vercel deployment image and run `45428604255` already recorded. No code path changed for this evidence, so no test can be added. | **Accepted (no gap; no new test)** - documentation evidence is retained; the full check output is reproduced below and in the PR body draft. |
| C-9 | Minor · `docs/reviews/2026-11-23-requesting-code-review-hero-slider.md:2`; `docs/reviews/2026-11-23-systematic-debugging-pr154.md:32` | Before Task 1, both records pointed to a duplicated raw capture file. Opening those paths at `eb7e241` found the stale artifact; at `4aff895` the path is gone and the embedded output remains. | **Accepted (fixed in `test/new-update-flow-coverage`)** - the duplicate was deleted and the two targeted references now state that the complete output stays in the review record. The two historical `.txt` claims at `docs/reviews/2026-11-23-systematic-debugging-pr154.md:25,244` are deferred to the final review, not silently rewritten. |

## Declined to judge

- Production `prisma migrate status` and a live deploy: no production PostgreSQL or deploy target is available in this agent environment; the local wrapper probe is recorded in `docs/reviews/2026-11-25-subagent-driven-development-task3.md:227-234`.
- Figma pixel diff: the Figma file is not stored in the repository, so no pixel comparison was attempted.
- Runtime pass of the pre-existing reduced-motion spec: the targeted E2E command in this check set runs only `e2e/hero-slider.spec.ts`; the test file is named above but no runtime output for it is captured here.
- Historical verbatim prompt text in `AI_LOG.md` and old plans: protected by the global constraint; the new entry records the cleanup instead of rewriting history.
- Final whole-branch review and PR creation: controller-owned after this step; no link exists yet.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Full check set green | `final-checks.md`, nine commands, every `EXIT=0`; `npm test` 88 files / 445 tests; `npm run build` `EXIT=0` | pass |
| Hero slider auto-advance and reset in a browser | `e2e/hero-slider.spec.ts:13-30,78-94`; captured E2E cases 1, 4, 6 and 9 | pass |
| Hover and focus pause in a browser | `e2e/hero-slider.spec.ts:32-76`; captured E2E cases 2, 3, 7 and 8 | pass |
| Reduced motion still covered | `e2e/hero-slider-a11y.spec.ts:8-20`; pre-existing file, not in the targeted capture | lacking evidence |
| Removed pause control guarded in a browser | `e2e/hero-slider.spec.ts:96-105`; captured E2E cases 5 and 10 | pass |
| CI and deploy graph resolved | `src/test/deploy-workflow-graph.test.ts:42-94`; `npm test` captured at 445 tests | pass |
| Migration CLI contract covered | `src/test/detect-pending-migrations-cli.test.ts:8-71`; `npm test` captured at 445 tests | pass |
| Alias capture, smoke and rollback order pinned | `src/test/deploy-workflow-graph.test.ts:67-77` plus `src/test/deploy-workflow.test.ts:40-47,175-271` | pass |
| Language rule clean | `npm run check:language`, `EXIT=0`, captured output in `final-checks.md` | pass |
| Production live check | no target available | lacking evidence by design |
| Final review and PR link | controller-owned after this step | lacking evidence until controller |

## Verification output

Complete normalized capture from `.superpowers/sdd/2026-11-25-new-update-test-flow/final-checks.md`. The raw capture is at `.superpowers/sdd/2026-11-25-new-update-test-flow/final-checks.raw.txt`.

```text
Normalization note: U+0192 in the Next.js route legend is replaced by F to satisfy rule 12; all other captured output is verbatim.

DATABASE_URL note: db:push, build and E2E used DATABASE_URL=file:./prisma/e2e.db in the child environment because this clean clone needs it.
Capture method: Node spawnSync with shell true, encoding utf8 and NO_COLOR=1 for every command.

COMMAND: npx --no-install next typegen
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---
Generating route types...
✓ Types generated successfully

--- STDERR ---


COMMAND: npm run db:push
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 db:push
> prisma db push

Datasource "db": SQLite database "e2e.db" at "file:./prisma/e2e.db"

The database is already in sync with the Prisma schema.


--- STDERR ---
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.


COMMAND: npm run lint
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 lint
> eslint


--- STDERR ---


COMMAND: npm run typecheck
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 typecheck
> tsc --noEmit


--- STDERR ---


COMMAND: npm test
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 test
> vitest run


 RUN  v5.1.0 C:/Users/Hello/.local/share/opencode/worktree/43112d/clever-pixel


 Test Files  88 passed (88)
      Tests  445 passed (445)
   Start at  12:47:06
   Duration  51.02s (tests 43%, import 34%, environment 14%, transform 5%, setup 2%, worker 2%)

     Import  212 modules were evaluated 678 times · 9.81s total, 34% of tracked time
             ~6.74s faster with isolate: false — shared modules are evaluated once per worker instead of once per file
             learn more: https://vitest.dev/guide/improving-performance#test-isolation


--- STDERR ---


COMMAND: npm run format:check
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

--- STDERR ---


COMMAND: npm run check:language
DATABASE_URL_IN_CHILD: not set
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 check:language
> node scripts/check-language.mjs


--- STDERR ---


COMMAND: npm run build
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 build
> next build

▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 193ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 2.9s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/53) ...
  Generating static pages using 7 workers (13/53) 
  Generating static pages using 7 workers (26/53) 
  Generating static pages using 7 workers (39/53) 
✓ Generating static pages using 7 workers (53/53) in 5.6s
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


--- STDERR ---


COMMAND: npm run test:e2e -- e2e/hero-slider.spec.ts
DATABASE_URL_IN_CHILD: file:./prisma/e2e.db
EXIT=0
--- STDOUT ---

> ant-jewelry@0.1.0 test:e2e
> playwright test e2e/hero-slider.spec.ts


Running 10 tests using 1 worker

  ok  1 [desktop-chrome] › e2e\hero-slider.spec.ts:13:1 › hero slider advances one slide after five seconds and loops @storefront (16.5s)
  ok  2 [desktop-chrome] › e2e\hero-slider.spec.ts:32:1 › hero slider pauses while the pointer is over it and resumes after the pointer leaves @storefront (16.8s)
  ok  3 [desktop-chrome] › e2e\hero-slider.spec.ts:55:1 › hero slider pauses while focus is inside it and resumes after focus leaves @storefront (17.5s)
  ok  4 [desktop-chrome] › e2e\hero-slider.spec.ts:78:1 › choosing a slide restarts the five second countdown @storefront (9.2s)
  ok  5 [desktop-chrome] › e2e\hero-slider.spec.ts:96:1 › hero slider renders no pause control and keeps the live region quiet while advancing @storefront (457ms)
  ok  6 [pixel-7] › e2e\hero-slider.spec.ts:13:1 › hero slider advances one slide after five seconds and loops @storefront (16.2s)
  ok  7 [pixel-7] › e2e\hero-slider.spec.ts:32:1 › hero slider pauses while the pointer is over it and resumes after the pointer leaves @storefront (16.9s)
  ok  8 [pixel-7] › e2e\hero-slider.spec.ts:55:1 › hero slider pauses while focus is inside it and resumes after focus leaves @storefront (17.2s)
  ok  9 [pixel-7] › e2e\hero-slider.spec.ts:78:1 › choosing a slide restarts the five second countdown @storefront (9.0s)
  ok 10 [pixel-7] › e2e\hero-slider.spec.ts:96:1 › hero slider renders no pause control and keeps the live region quiet while advancing @storefront (465ms)

  10 passed (2.5m)

--- STDERR ---
[WebServer] (node:14460) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:21820) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:21880) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:16876) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:13140) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:1424) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:4384) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:10144) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:2012) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:10444) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:21720) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:6052) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:17816) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
(node:11392) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:17992) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


```

## Limitations

- No production PostgreSQL or live deploy check was run; no production status command was exercised.
- No Figma pixel diff was attempted because the design file is not in the repository.
- Browser evidence is Playwright output on `desktop-chrome` and `pixel-7` only; no other project or manual browser was used.
- Parser hardening and CLI robustness are scheduled follow-ups, not fixes in this branch.
- The final whole-branch review and the PR link are added by the controller after this step.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 12:44:33 +07:00 - Bổ sung coverage và verification cho các cập nhật mới`.
