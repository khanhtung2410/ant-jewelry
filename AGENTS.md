## Project rules for coding agents

### Standing working agreement (every task)

Apply these automatically to **every** user request — do not wait to be told:

1. Pull the latest `main` from `origin` first (`git fetch origin` + reset/branch from `origin/main`), then create a new branch for the work.
2. Read the **whole** relevant files before editing; never patch from a snippet or assumption.
3. Update docs when behavior or configuration changes.
4. Add an entry to `AI_LOG.md` following the established format: prompt used verbatim, what was self-verified, **"AI sai ở đâu"** with concrete examples, and limitations.
5. Create the PR with `gh`, using a Conventional Commits title and a body that follows `docs/CONTRIBUTING.md`.
6. Capture all check-command output via Node `spawnSync` in UTF-8 (`NO_COLOR=1`), never PowerShell redirection — PowerShell writes UTF-16 here and characters like `✓ ─ │ · —` become mojibake in code blocks.
7. **Verification before completion** (`verification-before-completion`): before opening a PR and before the final response, re-run the full check set from `docs/CONTRIBUTING.md` (`npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`) plus a production check where access exists. Record the **full output with exit code**; write "đạt/pass" only when that output is attached. Never claim success from a previous run or from an agent report.
8. **When creating a PR with `gh`, always give the user the PR link in the final response.**

### Code review records

- After **every** review round (any review produced by a skill such as `requesting-code-review`, or a self-review done with `superpowers`), save the complete result to `docs/reviews/YYYY-MM-DD-<skill>.md` — `<skill>` is the skill id you actually used without the `superpowers:` prefix; a self-review uses `superpowers`. Use the date you run the review, in the agent's local time. Keep one file per review round; do not overwrite a previous round.
- For **every** finding, the file must state `file:line`, severity (`Critical` / `Important` / `Minor`), reproduction steps, and an explicit decision: **Accepted** (fixed in this PR or scheduled in a named follow-up PR/branch) or **Rejected** (with the concrete reason). Never silently drop a finding, and never accept an AI suggestion without re-reading the real source yourself first.
- In `AI_LOG.md`, prepend a new entry containing: the **verbatim prompt used**, **which findings were accepted** (with the PR/branch they go to), and **which findings were rejected and why**. Link to the review file.
- These rules are project-owned text, not Next.js managed blocks — place them outside the `<!-- BEGIN:... -->` / `<!-- END:... -->` markers so `next dev` preserves them.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
