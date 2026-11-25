# New-update test flow and stale-capture cleanup implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicated raw capture, add the missing unit/integration/workflow coverage for the post-2026-11-21 updates, record a new coverage audit, and open a verified PR.

**Architecture:** Five independent tasks on one branch. Documentation cleanup first, then browser workflow tests for the hero slider, an integration test for the pending-migration CLI wrapper with a behavior-preserving seam, a structural job-graph test for both workflows, and finally the audit record, AI_LOG entry, verification and PR.

**Tech Stack:** Next.js 16.4.5, React 19.3, TypeScript 5, Vitest 5, Playwright 1.65, Node 22.

**Spec:** `docs/superpowers/specs/2026-11-25-new-update-test-flow-design.md`

## Global Constraints

- Work on `test/new-update-flow-coverage` from `origin/main`; never edit `main`.
- Only Vietnamese and English letters in written text; run `npm run check:language` before committing.
- Do not rewrite historical verbatim prompts in `AI_LOG.md` or old plans.
- Every review file follows `docs/reviews/TEMPLATE.md` and names an exact skill id.
- Capture check output with Node `spawnSync` in UTF-8 with `NO_COLOR=1`; never PowerShell redirection.
- The deploy-gate refactor must preserve the current output and exit codes exactly.
- Do not add a YAML parser dependency; reuse the block reader pattern.
- Keep the full check output in the PR body, not only a summary or a link.

## Review Focus

- A hover or focus pause that only works in jsdom because the browser never receives the event: the E2E tests must hover and focus the real element and assert the active dot.
- A countdown that does not restart after a manual dot click because focus stays inside the slider: the test must blur the dot and then prove the old deadline does not fire.
- A pending migration whose status command exits non-zero but still prints the pending banner: the wrapper must return true and exit 0, not fail closed on the wrong branch.
- A failed status command with empty output that silently returns false: the wrapper must exit 1 and print the refusal message.
- A `needs:` typo or cycle that text matching cannot see: the graph test must resolve every target and detect a cycle.

---

### Task 1: Remove the duplicated raw capture

**Files:**
- Delete: `docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt`
- Modify: `docs/reviews/2026-11-23-requesting-code-review-hero-slider.md:211`
- Modify: `docs/reviews/2026-11-23-systematic-debugging-pr154.md:32`

**Interfaces:**
- Consumes: nothing.
- Produces: no dangling path to the deleted file in `docs/reviews/*.md`.

- [ ] **Step 1: Verify the raw file is duplicated**

Run: `grep -n "Bản chép đầy đủ" docs/reviews/2026-11-23-requesting-code-review-hero-slider.md`
Expected: the line says the full copy is also in the `.txt`; the complete output is already embedded above it.

- [ ] **Step 2: Delete the file**

Run: `git rm docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt`
Expected: the file is staged for deletion.

- [ ] **Step 3: Rewrite the two review references**

In `docs/reviews/2026-11-23-requesting-code-review-hero-slider.md`, replace the sentence starting
`Bản chép đầy đủ cũng nằm trong ...` with a sentence that says the raw capture was removed as a
duplicate on 2026-11-25 and the complete output remains embedded in that review record.

In `docs/reviews/2026-11-23-systematic-debugging-pr154.md`, replace the set-aside bullet that names
the `.txt` with a bullet that says the raw capture was removed as a duplicate on 2026-11-25 and
its content is preserved in the review record.

- [ ] **Step 4: Verify no review file points at the deleted path**

Run: `git grep -n "remove-hero-pause-button-checks" -- docs/reviews`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add docs/reviews
git commit -m "docs(reviews): remove duplicated hero pause capture"
```

---

### Task 2: Hero slider browser workflow tests

**Files:**
- Create: `e2e/hero-slider.spec.ts`

**Interfaces:**
- Consumes: seeded visible hero slides from `prisma/seed.ts`; the carousel DOM from
  `src/features/layout/components/hero-slider.tsx`.
- Produces: five Playwright tests tagged `@storefront`.

- [ ] **Step 1: Write the failing workflow tests**

Create `e2e/hero-slider.spec.ts` with this shape:

```ts
import { expect, test, type Page } from '@playwright/test';

const carousel = (page: Page) => page.locator('section[aria-label="Featured collections"]');
const currentSlide = (page: Page) =>
  carousel(page).locator('button[aria-current="true"][aria-label^="Go to slide"]');
const liveRegion = (page: Page) => carousel(page).locator('[aria-live]');

async function releasePointerAndFocus(page: Page) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

test('hero slider advances one slide after five seconds and loops', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/');
  await releasePointerAndFocus(page);
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', { timeout: 12_000 });
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 3', { timeout: 12_000 });
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1', { timeout: 12_000 });
});

test('hero slider pauses while the pointer is over it and resumes after the pointer leaves', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/');
  await releasePointerAndFocus(page);
  await carousel(page).hover();
  await page.waitForTimeout(5_500);
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
  await page.mouse.move(1, 1);
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', { timeout: 12_000 });
});

test('hero slider pauses while focus is inside it and resumes after focus leaves', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/');
  await releasePointerAndFocus(page);
  await currentSlide(page).focus();
  await page.waitForTimeout(5_500);
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 2', { timeout: 12_000 });
});

test('choosing a slide restarts the five second countdown', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/');
  await releasePointerAndFocus(page);
  await page.waitForTimeout(3_000);
  await carousel(page).getByRole('button', { name: 'Go to slide 3' }).click();
  await releasePointerAndFocus(page);
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 3');
  await page.waitForTimeout(2_500);
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 3');
  await expect(currentSlide(page)).toHaveAttribute('aria-label', 'Go to slide 1', { timeout: 12_000 });
});

test('hero slider renders no pause control and keeps the live region quiet while advancing', { tag: '@storefront' }, async ({ page }) => {
  await page.goto('/');
  await expect(carousel(page).getByRole('button', { name: /automatic slide changes/i })).toHaveCount(0);
  await expect(liveRegion(page)).toHaveAttribute('aria-live', 'off');
});
```

- [ ] **Step 2: Run the new spec to verify it passes on the current behavior**

Run: `npm run test:e2e -- e2e/hero-slider.spec.ts`
Expected: 5 tests pass on both `desktop-chrome` and `pixel-7` (10 total).

- [ ] **Step 3: Prove the pause tests can fail**

Temporarily edit `src/features/layout/components/hero-slider.tsx` so `isAutoAdvancing` ignores
`isHovered` and `isFocusWithin`, run the two pause tests, observe them fail, then restore the file
with `git checkout -- src/features/layout/components/hero-slider.tsx`.

Run: `npm run test:e2e -- e2e/hero-slider.spec.ts -g "pauses while"`
Expected: the two tests fail while the guards are removed; they pass again after the restore.

- [ ] **Step 4: Commit**

```bash
git add e2e/hero-slider.spec.ts
git commit -m "test(home): cover hero slider browser workflow"
```

---

### Task 3: Pending-migration CLI integration

**Files:**
- Modify: `scripts/detect-pending-migrations.mjs`
- Create: `src/test/detect-pending-migrations-cli.test.ts`

**Interfaces:**
- Consumes: `hasPendingMigrations(output: string): boolean`.
- Produces:
  `classifyStatusCommand(result: { stdout?: string | null; stderr?: string | null; status?: number | null; error?: unknown }): { exitCode: number; stdout: string; stderr: string }`
  and
  `runStatusCommand(options?: { spawn?: typeof spawnSync; npm?: string; env?: NodeJS.ProcessEnv }): { exitCode: number; stdout: string; stderr: string }`.

- [ ] **Step 1: Write the failing integration test**

Create `src/test/detect-pending-migrations-cli.test.ts` with these tests:

```ts
import { describe, expect, it } from 'vitest';
import { classifyStatusCommand, runStatusCommand } from '../../scripts/detect-pending-migrations.mjs';

describe('pending migration CLI wrapper', () => {
  it('returns true for a pending banner even when the status command exits non-zero', () => {
    const result = classifyStatusCommand({
      stdout: 'Following migration have not yet been applied:\n20261118100000_add_product_image_blobs',
      stderr: '',
      status: 1,
    });
    expect(result).toEqual({ exitCode: 0, stdout: 'true\n', stderr: '' });
  });

  it('returns false only for an explicit up-to-date marker', () => {
    const result = classifyStatusCommand({ stdout: 'Database schema is up to date', stderr: '', status: 0 });
    expect(result).toEqual({ exitCode: 0, stdout: 'false\n', stderr: '' });
  });

  it('returns true for empty or unknown output', () => {
    expect(classifyStatusCommand({ stdout: '', stderr: '', status: 0 }).stdout).toBe('true\n');
    expect(classifyStatusCommand({ stdout: 'unknown wording', stderr: '', status: 0 }).stdout).toBe('true\n');
  });

  it('fails the command when status fails and no pending banner is present', () => {
    const result = classifyStatusCommand({ stdout: '', stderr: 'P1001', status: 1 });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('refusing to continue');
  });

  it('fails the command on a spawn error', () => {
    const result = classifyStatusCommand({ stdout: '', stderr: '', status: null, error: new Error('spawn failed') });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('refusing to continue');
  });

  it('runs the production status script with the injected environment', () => {
    const calls: Array<{ command: string; args: string[]; env: NodeJS.ProcessEnv }> = [];
    const result = runStatusCommand({
      npm: 'fake-npm',
      env: { TEST_MARKER: '1' },
      spawn: ((command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
        calls.push({ command, args, env: options.env });
        return { stdout: 'Database schema is up to date', stderr: '', status: 0 };
      }) as never,
    });

    expect(result).toEqual({ exitCode: 0, stdout: 'false\n', stderr: '' });
    expect(calls).toEqual([
      { command: 'fake-npm', args: ['run', 'db:migrate:status:production'], env: { TEST_MARKER: '1' } },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/test/detect-pending-migrations-cli.test.ts`
Expected: FAIL because `classifyStatusCommand` and `runStatusCommand` are not exported.

- [ ] **Step 3: Refactor the script without changing behavior**

In `scripts/detect-pending-migrations.mjs`, add the two exports and make the direct-invocation
block use them. The pending banner must win before the failure branch; a failed command with no
banner must return exit code 1 and the exact refusal message
`[detect-pending-migrations] prisma migrate status failed; refusing to continue.`; empty or unknown
output must return `true` with exit code 0. Keep the strings
`['run', 'db:migrate:status:production']` and `hasPendingMigrations(output)` present for the
existing workflow guard.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- src/test/detect-pending-migrations-cli.test.ts src/test/detect-pending-migrations.test.ts src/test/deploy-workflow.test.ts`
Expected: all pass, including the existing wrapper-wiring guard.

- [ ] **Step 5: Commit**

```bash
git add scripts/detect-pending-migrations.mjs src/test/detect-pending-migrations-cli.test.ts
git commit -m "test(ci): cover pending migration CLI exit behavior"
```

---

### Task 4: Workflow graph structure

**Files:**
- Create: `src/test/deploy-workflow-graph.test.ts`

**Interfaces:**
- Consumes: `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`.
- Produces: a structural test that every `needs:` target exists and the graph is acyclic.

- [ ] **Step 1: Write the failing structural test**

Create `src/test/deploy-workflow-graph.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

const block = (content: string, key: string, indent = 0): string => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => new RegExp(`^ {${indent}}${key}:\\s*$`).test(line));
  if (start === -1) return '';
  const collected: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') { collected.push(line); continue; }
    const lineIndent = line.match(/^ */)?.[0].length ?? 0;
    if (lineIndent <= indent) break;
    collected.push(line);
  }
  return collected.join('\n');
};

const jobNames = (content: string): string[] =>
  block(content, 'jobs')
    .split('\n')
    .map((line) => line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/)?.[1])
    .filter((name): name is string => Boolean(name));

const needsOf = (content: string, job: string): string[] => {
  const needs = block(block(content, 'jobs'), job, 2).match(/^ {4}needs:\s*(.+)$/m)?.[1];
  if (!needs) return [];
  return needs.replace(/^\[|\]$/g, '').split(',').map((target) => target.trim()).filter(Boolean);
};

describe('deploy workflow graph', () => {
  it('resolves every needs target and has no cycle', () => {
    const content = read('.github/workflows/deploy.yml');
    const names = jobNames(content);
    expect(names.length).toBeGreaterThan(0);

    const graph = new Map(names.map((name) => [name, needsOf(content, name)]));
    for (const [job, targets] of graph) {
      for (const target of targets) {
        expect(names, `${job} needs unknown job ${target}`).toContain(target);
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (job: string) => {
      expect(visiting.has(job), `cycle through ${job}`).toBe(false);
      if (visited.has(job)) return;
      visiting.add(job);
      for (const target of graph.get(job) ?? []) visit(target);
      visiting.delete(job);
      visited.add(job);
    };
    for (const job of names) visit(job);
  });

  it('keeps the production deploy chain in the real order', () => {
    const content = read('.github/workflows/deploy.yml');
    expect(needsOf(content, 'verify-ci')).toEqual([]);
    expect(needsOf(content, 'check-migrations')).toEqual(['verify-ci']);
    expect(needsOf(content, 'approval')).toEqual(['check-migrations']);
    expect(needsOf(content, 'migrate')).toEqual(['check-migrations', 'approval']);
    expect(needsOf(content, 'deploy')).toEqual(['verify-ci', 'migrate']);
    expect(needsOf(content, 'smoke')).toEqual(['deploy']);
    expect(needsOf(content, 'rollback')).toEqual(['deploy', 'smoke']);
    expect(needsOf(content, 'finalize')).toEqual(['smoke', 'rollback']);
  });

  it('names the CI workflow exactly and wires workflow_run to it', () => {
    const ci = read('.github/workflows/ci.yml');
    const deploy = read('.github/workflows/deploy.yml');
    expect(ci).toMatch(/^name: ci$/m);
    expect(block(deploy, 'workflow_run', 2)).toContain('workflows: [ci]');
  });

  it('has no unknown needs target in the CI workflow', () => {
    const content = read('.github/workflows/ci.yml');
    const names = jobNames(content);
    for (const job of names) {
      for (const target of needsOf(content, job)) {
        expect(names, `${job} needs unknown job ${target}`).toContain(target);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npm test -- src/test/deploy-workflow-graph.test.ts`
Expected: PASS.

- [ ] **Step 3: Prove the graph test can fail**

Temporarily change `needs: deploy` in the smoke job to `needs: smoked`, run the test, observe the
unknown-target failure, then restore with `git checkout -- .github/workflows/deploy.yml`.

Run: `npm test -- src/test/deploy-workflow-graph.test.ts`
Expected: FAIL with `smoke needs unknown job smoked`; restore and rerun for PASS.

- [ ] **Step 4: Commit**

```bash
git add src/test/deploy-workflow-graph.test.ts
git commit -m "test(ci): validate deploy workflow job graph"
```

---

### Task 5: Coverage audit, AI_LOG, verification and PR

**Files:**
- Create: `docs/reviews/2026-11-25-requesting-code-review-test-coverage.md`
- Modify: `AI_LOG.md`
- Create after the final review: `docs/reviews/2026-11-25-requesting-code-review-final.md`

**Interfaces:**
- Consumes: the tests from Tasks 1 to 4.
- Produces: the audit record, the AI_LOG entry, the full verification capture and the PR link.

- [ ] **Step 1: Write the coverage audit**

Use `docs/reviews/TEMPLATE.md`. The finding table must cover every post-2026-11-21 update:

- hero slider auto-advance and manual reset: unit and action integration already existed; the
  workflow gap is closed by `e2e/hero-slider.spec.ts`.
- hover and focus pause: unit already existed; the workflow gap is closed by the same spec.
- reduced motion: unit and E2E already existed; no new gap.
- removed pause button: unit guard existed; the browser regression guard is new.
- CI required checks and deploy trigger: text guards existed; the graph test is new.
- migration approval detection: unit existed; the CLI integration is new.
- alias capture, smoke and rollback: text guards and parser execution existed; the graph test now
  pins the order and target resolution.
- docs evidence: no code gap; no new test.

Each row states severity, `file:line`, reproduction, and **Accepted** or **Rejected** with a
reason. Any claim without a named test or captured output is marked `lacking evidence`.

- [ ] **Step 2: Prepend the AI_LOG entry**

Follow the existing format exactly: header with local time, `### Prompt nguyên văn đã dùng` with the
verbatim prompt, `### Đã tự kiểm chứng`, `### Findings được nhận / bác`, `### AI sai ở đâu`, and
`### Limitations`. Link the new audit and final review records. The previous `##` header must remain
immediately below the new `---`.

- [ ] **Step 3: Run the full check set through Node spawnSync**

Run a Node script that executes each command with `NO_COLOR=1`, `encoding: 'utf8'`, and prints the
complete stdout/stderr plus `EXIT=` for:

```text
npx --no-install next typegen
npm run db:push
npm run lint
npm run typecheck
npm test
npm run format:check
npm run check:language
npm run build
```

Also run `npm run test:e2e -- e2e/hero-slider.spec.ts` and capture its full output. Replace the
Next.js legend character U+0192 with `F` in pasted text and note why.

- [ ] **Step 4: Run the final review**

Load the `requesting-code-review` skill by exact id. Re-read the whole changed files and grep every
consumer of `runStatusCommand`, `classifyStatusCommand`, and the deleted capture path. Write
`docs/reviews/2026-11-25-requesting-code-review-final.md` with every finding's file:line, severity,
reproduction, and decision. For every pass claim, name the test or captured output; mark anything
else `lacking evidence`.

- [ ] **Step 5: Commit, push and open the PR**

```bash
git add AI_LOG.md docs/reviews docs/superpowers
git commit -m "docs(test): record new-update coverage and verification"
git push -u origin test/new-update-flow-coverage
gh pr create --base main --head test/new-update-flow-coverage --title "test: cover new update flows and remove stale capture" --body-file <captured-body.md>
```

The PR body follows `docs/CONTRIBUTING.md`, contains the complete check output with every `EXIT=`
line, links the audit and final review, and ends with the PR link in the final response.

- [ ] **Step 6: Report the PR link**

Return the `gh` PR URL to the user.
