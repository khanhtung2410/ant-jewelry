# Design: improve Superpowers usage after S6-S8

## Intent

The mentor confirmed the skills were used, but three process gaps let defects through: a review finding was fixed at one file without tracing consumers (S6/F1), the first review copied the mentor checklist and named no real skill (S7), and four review rounds could not prove their "Đạt" items with tests or output and missed T2 and F2 (S8). The goal is to turn those lessons into rules that change what I do before writing code, then prove the change on the open gaps.

## Goals

- Every review file names the exact skill id used, not "superpowers".
- Before accepting or fixing a finding, re-read the real source and grep every consumer of the value being changed.
- Every "Đạt" item in a review points to a test or output; otherwise it is marked as lacking evidence.
- If a round finds nothing beyond the mentor checklist, say so explicitly.
- Feedback from the owner is trusted: verify it technically against source, but do not reject an explicit request solely because it changes historical records or old prompts. State what was verified, then do it. (Closes the S7 mojibake-rejection gap.)
- Unit RED→GREEN is not treated as sufficient for a value that crosses module boundaries; add a flow test.
- AI_LOG entries keep their `##` headers when new entries are prepended.
- Apply the improved process to F1, T2 and F2 in a separate verified task.

## Non-goals

- No new global plugin, no V2 config migration, no project-local skill that duplicates Superpowers.
- No rewriting historical review verdicts except the S7 correction already made in PR #124.
- No code/test fix for F1, T2 or F2 in the process PR; that is task C.

## Constraints

- `AGENTS.md` has `next dev` managed blocks; project text must stay outside them.
- No Han/Hangul/Cyrillic characters in anything written.
- Full check-command output with exit codes goes into the PR body, not just "exit 0".
- Every task starts from latest `origin/main` on a new branch.

## Approaches considered

- **A - standing rule plus review template (chosen).** Add a numbered pre-work rule to `AGENTS.md` and a mandatory template under `docs/reviews/`. Lightweight and applies to every task; the weak point is that it still depends on me following the rule.
- **B - project-local skill.** Would fire automatically, but duplicates bundled Superpowers and AGENTS.md warns about V1 name collisions. Rejected.
- **C - prove by fixing the open gaps.** Strongest evidence of changed behaviour, but mixes process and product changes. Accepted as a second, separate task after A.

## Design

Task A changes two files plus one AI_LOG entry:

1. `AGENTS.md`: add rule 10 inside "Standing working agreement", above the managed blocks. It lists the pre-work steps in concrete, checkable form: load the relevant skill by exact id; re-read the whole source and grep consumers before accepting a finding; write the checklist-versus-evidence column; state "no new findings" honestly; add a flow test for cross-module values; verify AI_LOG headers after prepending.
2. `docs/reviews/TEMPLATE.md`: a fill-in template with mandatory sections - exact skill id, scope/base/head, method, findings with file:line/severity/reproduction/decision, declined-to-judge, checklist-versus-evidence table, verification output, limitations, AI_LOG link.
3. `docs/CONTRIBUTING.md`: point the Review section at the template so the structure is discoverable.
4. `AI_LOG.md`: verbatim prompt, verified facts, accepted/rejected findings, "AI sai ở đâu", limitations.

Task C (separate branch and PR): use the protocol to fix F1 (create user to login flow test), T2 (ADMIN upload E2E) and F2 (S3 conclusion backed by explicit output), each with its own RED→GREEN or evidence, then the full gate with complete output. These three known defects are the discovery fixtures: if the improved process cannot surface them again from the real code, the rule is only documentation and has not improved skill usage.

## What is left to the builder

- Implement A on a branch from latest main, run the full check set, open the PR with complete output.
- Only after A is merged, start C on a fresh branch; do not bundle the two.
