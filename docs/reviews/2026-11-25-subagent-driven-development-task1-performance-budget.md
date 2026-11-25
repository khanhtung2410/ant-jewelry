# Code review - Task 1 Lighthouse CI configuration (2026-11-25)

- **Skill:** subagent-driven-development
- **Scope:** Task 1 of `docs/superpowers/plans/2026-11-25-performance-budget.md`: dependency,
  `lighthouserc.json`, `.gitignore` and the config guard test.
- **Base:** `b91f7a9` | **Head:** `87fc30b`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.

## Method

Read-only reviewer round run under the exact skill id `subagent-driven-development`, transcribed from
`.superpowers/sdd/2026-11-25-performance-budget/task-1-review-result.txt` without changing its
rulings. Task 3 re-read the whole source of every file in the reviewed diff: `package.json`,
`package-lock.json`, `lighthouserc.json`, `.gitignore` and `src/test/lighthouse-config.test.ts`.
The consumer grep covered `lhci-report`, `lighthouse-report`, `CHROME_PATH`, `lhci autorun`,
`generateStaticParams`, `__empty__` and `P2021` across tracked text files. The controller also
re-read the Next.js 16 banner evidence in the Task 1 report before accepting the ready-pattern
deviation. No file was mutated by the review round itself.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| T1-1 | Minor · `lighthouserc.json:16`, `src/test/lighthouse-config.test.ts:48` | The brief suggested `Ready on http://127.0.0.1:3200`, but the verified Next.js 16.4.5 production banner is `- Local:         http://127.0.0.1:3200` followed by `Ready in 567ms`. The suggested literal would leave LHCI waiting for a server that is already listening. | **Accepted** in branch `k1-performance-budget`. Step 5 of the task explicitly permits changing the ready pattern when the real banner differs. Only that field changed; the spec and plan were reconciled to the verified `Local:` value without touching the committed config. |
| T1-2 | Minor · `package-lock.json:13327` (transitive `tldts-core`) | Compare `git show HEAD:package-lock.json` with the working tree after `npm install --save-dev @lhci/cli@0.16.1`: `tldts-core` moved from 7.5.5 to 7.5.6 while 278 entries were added, 0 removed and 1 changed. | **Accepted** as the normal resolution of the pinned install command. The full suite and build passed in the Task 1 report; no dependency was removed. |

The reviewer recorded no Critical or Important issue in the reviewed diff. Its Spec Compliance
section verified the `npm run` dependency, three runs, four exact URLs, mobile settings, port 3200
server command, four `error`-level median assertions, filesystem upload to `./lhci-report`, the
`.gitignore` entry and the guard test that reads the real config through `JSON.parse`.

## Declined to judge

- Live `npx lhci autorun` on a GitHub runner: outside the Task 1 diff; Task 2 wires the workflow and
  the controller leaves runtime proof to the pushed CI run and Task 4.
- Workflow upload behavior: Task 2 owns `.github/workflows/ci.yml`; Task 1 only produces the report
  directory.
- `scripts/check-language.mjs:40-43` Windows output quirk: pre-existing and outside the Task 1 file
  list; the command still exits 0 and the Task 3 entry records the limitation explicitly.
- Documentation wording in `docs/PERFORMANCE.md` and `docs/DEPLOY.md`: owned by Task 3, not Task 1.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Three mobile runs over four exact storefront URLs | `src/test/lighthouse-config.test.ts:35-49`, focused run `EXIT=0` in the Task 1 report | đạt/pass |
| Four median assertions at `error` level | `src/test/lighthouse-config.test.ts:51-77`, focused run `EXIT=0` | đạt/pass |
| Reports stay out of git | `lighthouserc.json:29-32`, `.gitignore:17`, guard at `src/test/lighthouse-config.test.ts:79-85` | đạt/pass |
| Ready pattern matches the installed framework | Captured `next start` stdout in `task-1-report.md:112-134`, `MATCH=Local:         http://127.0.0.1:3200`, `EXIT=0` | đạt/pass |
| Full check set after the commit | `npm test` 90 files / 457 tests `EXIT=0`; lint, typecheck, format:check and seeded build all `EXIT=0` in `task-1-report.md:138-158` | đạt/pass |

## Verification output

This reviewer round was read-only and did not re-run the full check set. The implementation output is
in `.superpowers/sdd/2026-11-25-performance-budget/task-1-report.md`; the final Task 3 capture,
with every `EXIT=` line, is in `.superpowers/sdd/2026-11-25-performance-budget/final-checks.md` and
is pasted verbatim into `pr-body.md`.

## Limitations

- The review is transcribed from the completed round; no second reviewer agent was dispatched.
- Runner-level LHCI execution was not available on this host.
- The lockfile review compared byte-level package movement; it did not audit every transitive
  package for advisories. That work belongs to K2.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-25 21:34:21 +07:00 - Ngân sách hiệu năng trong pipeline K1`.
