# Superpowers Usage Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn mentor findings S6-S8 into a standing, checkable pre-work protocol so review and fix work traces consumers, proves "Đạt" items with evidence, and names the real skill.

**Architecture:** Add one numbered rule to the "Standing working agreement" in `AGENTS.md` (outside `next dev` managed blocks) and a fill-in review template under `docs/reviews/`. A guard test in `src/test/` pins the rule's key requirements, the template's mandatory sections, the absence of "superpowers" as a skill id in review files, and AI_LOG header integrity. Task C (fixing F1/T2/F2) is a separate branch and PR and is not part of this plan.

**Tech Stack:** Markdown docs plus Vitest + Node `fs` for the guard test.

**Spec:** `docs/superpowers/specs/2026-11-20-superpowers-usage-improvement-design.md`

## Global Constraints

- Pull latest `origin/main` first; create a new branch for the work.
- `AGENTS.md` managed blocks (`<!-- BEGIN:nextjs-agent-rules -->`, `<!-- BEGIN:nextjs-agent-feedback -->`) must not be edited; project text stays above them.
- No Han/Hangul/Cyrillic characters in any written file.
- PR body contains the complete stdout/stderr of the full check set, not just exit codes.
- Every review record uses an exact skill id, never the word "superpowers" as the skill name.
- Every task ends with a commit and a fresh full verification run.

## Review Focus

- A review file names "superpowers" instead of a concrete skill id -> guard test fails on `docs/reviews/*.md`.
- A value-changing finding is fixed at one file without tracing consumers -> rule 10 requires grep of every consumer plus a flow test; pinned by rule text assertions.
- A "Đạt" item has no test or output behind it -> template has a mandatory checklist-versus-evidence section; pinned by template assertions.
- A round that finds nothing new beyond the mentor checklist presents it as its own result -> rule 10 requires an explicit "no new findings" statement; pinned by rule text assertions.
- An explicit owner request is rejected because it changes historical records (the S7 mojibake case) -> rule 10 requires trusting owner feedback after technical verification and doing it; pinned by a rule text assertion containing `owner feedback` and `historical`.
- Prepending an AI_LOG entry deletes the previous entry's header -> guard test scans AI_LOG structure.
- The three known defects F1, T2, F2 are used as discovery fixtures in task C; a rule that only exists as text is not considered proven.

---

### Task 1: Standing protocol, review template and guard test

**Files:**
- Modify: `AGENTS.md` (add rule 10 inside "Standing working agreement", lines 3-15, above managed blocks)
- Create: `docs/reviews/TEMPLATE.md`
- Modify: `docs/CONTRIBUTING.md` (Review section, point to template)
- Create: `src/test/superpowers-process.test.ts`
- Modify: `AI_LOG.md` (new entry with verbatim prompt)

**Interfaces:**
- Consumes: existing `AGENTS.md` rule list, `docs/CONTRIBUTING.md` Review section, `docs/reviews/` directory, `AI_LOG.md` entry format.
- Produces: rule 10 text containing `docs/reviews/TEMPLATE.md`, `grep`, `flow test`, `mentor checklist`, and the AI_LOG header check; a template containing `## Checklist versus evidence` and `- **Skill:** <exact skill id>`; a passing guard test.

- [ ] **Step 1: Write the failing guard test**

Create `src/test/superpowers-process.test.ts` with these assertions, reading files with `readFileSync` from `process.cwd()`:
- `AGENTS.md` contains `### Standing working agreement` and, before `<!-- BEGIN:nextjs-agent-rules -->`, a rule containing each of: `docs/reviews/TEMPLATE.md`, `grep`, `flow test`, `mentor checklist`, `owner feedback`, `historical`, `##` header.
- `docs/reviews/TEMPLATE.md` exists and contains `- **Skill:** <exact skill id>` and `## Checklist versus evidence`.
- `docs/CONTRIBUTING.md` contains `docs/reviews/TEMPLATE.md`.
- No file in `docs/reviews/*.md` has a line matching `/^\s*-\s+\*\*Skill:\*\*\s+superpowers\s*$/m`.
- `AI_LOG.md`: every line equal to `### Prompt nguyên văn đã dùng` has a `## ` header at some earlier line.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/test/superpowers-process.test.ts`
Expected: FAIL on the first missing assertion (rule 10 / template not present).

- [ ] **Step 3: Add rule 10 to `AGENTS.md`**

Insert as item 10 in the numbered list at lines 7-15, above the managed blocks. Text must include: load the exact skill id and record it; re-read whole source and grep every consumer of a changed value; every "Đạt" item points to a test or output or is marked lacking evidence; state explicitly when a round adds nothing beyond the mentor checklist; treat owner feedback as trusted after technical verification and do not reject an explicit request merely because it changes historical records; add a flow test for values crossing module boundaries; verify the previous `##` header after prepending an AI_LOG entry; use `docs/reviews/TEMPLATE.md`.

- [ ] **Step 4: Create `docs/reviews/TEMPLATE.md`**

Include sections in this order: title, `- **Skill:** <exact skill id>`, scope/base/head, verbatim prompt link, method, findings table with file:line/severity/reproduction/decision, declined-to-judge, `## Checklist versus evidence` table (claim / test or output / result), verification output, limitations, AI_LOG link.

- [ ] **Step 5: Point `docs/CONTRIBUTING.md` at the template**

In the Review section, add one bullet: every review record must follow `docs/reviews/TEMPLATE.md`.

- [ ] **Step 6: Prepend the AI_LOG entry**

Add a new top entry with the verbatim prompt from the owner ("can you take this result in to account and improve skill usage" plus the chosen option A then C), self-verified facts, accepted/rejected findings with link to this plan and the design doc, "AI sai ở đâu" and limitations. Verify the existing top header `## 2026-11-20 15:55:00 +07:00 - Ghi nhận phản hồi Superpowers S6-S8` is still present immediately after the new `---`.

- [ ] **Step 7: Run the guard test to verify it passes**

Run: `npx vitest run src/test/superpowers-process.test.ts`
Expected: PASS.

- [ ] **Step 8: Run the full check set with complete output**

Run via Node `spawnSync` with `NO_COLOR=1`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`, `npm run test:e2e`. Save full stdout/stderr with exit codes and attach verbatim to the PR body.

- [ ] **Step 9: Scan for CJK and commit**

Run `rg -n '\p{Han}|\p{Hangul}|\p{Cyrillic}'` on changed files, expect no matches. Commit with a Conventional Commits title such as `docs(process): make Superpowers review rules checkable`.

- [ ] **Step 10: Open the PR**

Push the branch and create the PR with `gh`; paste the complete check output into the body and give the user the link in the final response.

**Self-review:** The spec's goals map to rule 10 and the template; the guard test pins each Review Focus line; Task C is explicitly out of scope and documented as a follow-up. No function bodies are prescribed beyond exact strings the test pins.
