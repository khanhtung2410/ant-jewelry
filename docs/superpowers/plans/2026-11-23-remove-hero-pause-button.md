# Remove Visible Hero Slider Pause Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the visible pause/play button from the hero slider while keeping the non-visible pause mitigations.

**Architecture:** The change is confined to one client component and its tests. Deleting the button makes `isPlaying` permanently true, so the state is removed and `isAutoAdvancing` drops that term. The live region and all other pause triggers stay as they are.

**Tech Stack:** Next.js 16.4.5, React 19.3.0, TypeScript strict, Vitest with Testing Library, Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-11-23-remove-hero-pause-button-design.md`

## Global Constraints

- Keep auto-advance interval at 5000 ms.
- Keep pointer-hover pause, focus-within pause, and `prefers-reduced-motion` pause.
- Keep the `aria-live` expression `isAutoAdvancing ? 'off' : 'polite'`.
- Do not touch the product carousel or any other component outside the files listed below.
- Do not rewrite historical review records or historical verbatim prompts.
- Vietnamese and English letters only in anything written; run `npm run check:language`.
- Full check set before PR: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`.
- Capture check output with Node `spawnSync`, UTF-8, `NO_COLOR=1`.

## Review Focus

- Reduced-motion preference still stops auto-advance and flips the live region to `polite`.
  Pinned by the kept unit test `never auto slides when the user prefers reduced motion`.
- Pointer hover and focus-within still pause auto-advance.
  Pinned by the kept unit tests `pauses auto slide while the pointer is over the slider`
  and `pauses auto slide while focus is inside the slider and resumes when focus leaves`.
- The live region starts at `off` while auto-advancing.
  Pinned by a new assertion in Task 1's new test, replacing the deleted button test.
- No pause or play control renders in the default state, so the page matches the Figma.
  Pinned by Task 1's new test only; the reduced-motion e2e assertion was removed in Task 2.
- The production-style page under reduced motion does not advance.
  Pinned by the kept e2e test in `e2e/hero-slider-a11y.spec.ts`.

---

### Task 1: Remove the visible control and update unit tests

**Files:**
- Modify: `src/features/layout/components/hero-slider.tsx`
- Modify: `src/features/layout/components/hero-slider.auto-slide.test.tsx`

**Interfaces:**
- Consumes: `HeroSlide` from `@/features/shared/domain/domain`; existing props
  `{ slides: HeroSlide[] }`.
- Produces: same `HeroSlider` export and props. No new public names.

- [ ] **Step 1: Write the failing regression test**

Add to `describe('HeroSlider auto slide')` in
`src/features/layout/components/hero-slider.auto-slide.test.tsx`:

```tsx
it('does not render a pause or play control and announces while auto advancing', () => {
  const { container } = render(<HeroSlider slides={slides} />);

  expect(screen.queryByRole('button', { name: /automatic slide changes/i })).toBeNull();
  expect(container.querySelector('[aria-live]')?.getAttribute('aria-live')).toBe('off');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/layout/components/hero-slider.auto-slide.test.tsx -t "does not render a pause or play control"`
Expected: FAIL on the first assertion because the button still renders.

- [ ] **Step 3: Remove the obsolete test coverage**

In the same test file, delete the whole test
`pauses and resumes from the Pause/Play button and updates the live region` (lines
295-315) and delete the now-trivial line
`expect(screen.queryByRole('button', { name: /automatic slide changes/i })).toBeNull();`
from the test `never auto slides when the user prefers reduced motion`. Keep the
reduced-motion and `aria-live` polite assertion in that test.

- [ ] **Step 4: Implement the removal in `hero-slider.tsx`**

Delete the `isPlaying` state declaration. Change `isAutoAdvancing` to
`slides.length >= 2 && !isHovered && !isFocusWithin && !prefersReducedMotion`.
Delete the entire conditional pause/play `<button>` block (lines 138-169), including
both SVG icons. Leave the live region, hover/focus handlers, arrows, dots, and action
button untouched.

- [ ] **Step 5: Run the unit tests to verify they pass**

Run: `npx vitest run src/features/layout/components/hero-slider.auto-slide.test.tsx src/features/layout/components/hero-slider.test.tsx`
Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
git add src/features/layout/components/hero-slider.tsx src/features/layout/components/hero-slider.auto-slide.test.tsx
git commit -m "fix(home): remove visible hero slider pause button"
```

### Task 2: Update the e2e specification

**Files:**
- Modify: `e2e/hero-slider-a11y.spec.ts`

**Interfaces:**
- Consumes: the rendered home page at `/` and the carousel selector already in the file.
- Produces: the same spec file with one remaining test.

- [ ] **Step 1: Align the e2e spec with the new behavior**

In `e2e/hero-slider-a11y.spec.ts`, delete the `releasePointerAndFocus` helper, delete
the test `hero slider pause control stops auto advance and play resumes it`, and delete
the button-count assertion from the reduced-motion test. Keep the reduced-motion test
and its `aria-live` polite assertion.

- [ ] **Step 2: Run the e2e spec**

Run: `npx playwright test e2e/hero-slider-a11y.spec.ts`
Expected: PASS. This command seeds `prisma/e2e.db` and starts the app itself. If the
environment blocks browser launch, record the exact blocker instead of claiming a pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/hero-slider-a11y.spec.ts
git commit -m "test(e2e): drop hero slider pause button coverage"
```

### Task 3: Documentation and full verification

**Files:**
- Create: `docs/superpowers/specs/2026-11-23-remove-hero-pause-button-design.md`
- Create: `docs/superpowers/plans/2026-11-23-remove-hero-pause-button.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `AI_LOG.md`

**Interfaces:**
- Consumes: the owner decision recorded in the spec.
- Produces: an AI_LOG entry with verbatim prompt, self-verification, mistakes, and limitations.

- [ ] **Step 1: Write the AI_LOG entry**

Prepend an entry following the established format: verbatim prompt, what was
self-verified, "AI sai ở đâu" with concrete examples, findings accepted and rejected,
and limitations. Include the owner's explicit a11y override and the residual WCAG
2.2.2 gap. Link the spec and plan. Verify the previous `##` header is still directly
below the new `---`.

- [ ] **Step 2: Capture the full check set**

Using Node `spawnSync` with `encoding: 'utf8'` and `env: { ...process.env, NO_COLOR: '1' }`,
run each of `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`,
`npm run build`, and `npm run check:language`. Save the complete stdout, stderr, and
exit code for each command to `docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt`
so the PR body can quote it verbatim.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-11-23-remove-hero-pause-button-design.md \
  docs/superpowers/plans/2026-11-23-remove-hero-pause-button.md \
  AI_LOG.md docs/reviews/2026-11-23-remove-hero-pause-button-checks.txt
git commit -m "docs: record hero slider pause button removal"
```
