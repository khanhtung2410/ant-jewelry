# Layered Design Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add raw / primitive / semantic / component token layers to the CSS and migrate five core components to component tokens without changing any colour.

**Architecture:** `src/app/globals.css` gains four commented layers; every current token name becomes an alias into the semantic layer, so unmigrated components and their tests keep their exact computed values. Only `ActionButton`, `admin-table-actions`, `ConfirmPopover`, `CloseButton` and `ArrowButton` switch their class strings to component tokens.

**Tech Stack:** Next.js 16, Tailwind CSS v4 with `@theme inline`, Vitest 5, Playwright (30 E2E tests + 6 screenshot captures).

**Spec:** `docs/superpowers/specs/2026-11-20-token-layer-design.md`

## Global Constraints

- No colour, spacing or layout change; every existing hex value stays identical, except the X close button's cream background / dark X authorised during Task 4.
- Existing token names (`--underline-color`, `--font-color`, `--surface-overlay-color`, `--line`, `--button-bg-*`, `--backdrop-*`, `--badge-*`, `--danger-*`, `--success-text`, `--neutral-*`, `--control-outline`, `--focus-ring-color`, `--popover-shadow-color`, `--product-image-background`) stay declared as aliases.
- Tailwind `@theme inline` keeps all current mapping names.
- Only the five listed components are edited; other components keep using aliases.
- Project language rule: no Han/Hangul/Cyrillic characters in docs, code, PR or commit.
- Five regenerated 1920px screenshots must be byte-identical to the committed PNGs; `product-contact-popover-1920.png` is the intentional X close-button exception (background `#fefdf8`, X `#383838`). The close-button border stays `#262626`.

## Review Focus

- An unmigrated component reading `--underline-color` must get the same hex after aliasing; pinned by the CSS token test (Task 1) and byte-identical screenshots (Task 5).
- `@theme inline` utility names (`--color-background`, `--color-line`, `--color-muted`, etc.) must not be renamed; pinned by Task 1 test asserting each name exists.
- Hover and disabled button states must resolve to the same colours; pinned by component class assertions (Tasks 2–4) and screenshots.
- `CloseButton` focus outline must stay danger red (`#991b1b`), not the generic green control outline; pinned by Task 4 test.
- New docs and CSS comments must contain no stray non-Vietnamese/English script; pinned by repo-wide `rg` scan (Task 5).

---

### Task 1: Token layers and compatibility aliases

**Files:**
- Modify: `src/app/globals.css:3-65`
- Create: `src/app/globals.tokens.test.ts`
- Modify: `docs/ARCHITECTURE.md` (design tokens section)

**Interfaces:**
- Consumes: current hex values in `globals.css:5-44`.
- Produces: component token names used by Tasks 2–4: `--component-action-button-*`, `--component-admin-action-*`, `--component-confirm-*`, `--component-close-button-*`, `--component-arrow-button-*`; all existing names still declared.

- [ ] **Step 1: Write the failing CSS token test**

`src/app/globals.tokens.test.ts` reads `src/app/globals.css` as UTF-8 and asserts:
  - the four comment markers `/* 1. Raw`, `/* 2. Primitive`, `/* 3. Semantic`, `/* 4. Component` each appear once;
  - each current name (`--underline-color`, `--font-color`, `--line`, `--surface-overlay-color`, `--button-bg-hover`, `--button-bg-normal`, `--control-outline`, `--danger-border`, `--danger-text`, `--danger-bg`, `--danger-strong`, `--success-text`, `--neutral-strong`, `--neutral-hover`, `--backdrop-color`, `--backdrop-strong-color`, `--backdrop-dialog-color`, `--product-image-background`) is declared with a value beginning `var(--`;
  - every `@theme inline` name currently present (`--color-background`, `--color-foreground`, `--color-product-image`, `--color-line`, `--color-muted`, `--button-bg-hover`, `--button-bg-normal`, `--color-surface-muted`, `--color-admin-background`) still appears;
  - the hex values `#265649`, `#383838`, `#fefdf8`, `#93aaa0`, `#991b1b`, `#262626`, `#e5e5e5` still appear exactly as today.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/globals.tokens.test.ts`
Expected: FAIL because layer markers and `var(--...)` aliases do not exist yet.

- [ ] **Step 3: Implement the four layers in `globals.css`**

Raw: name each current hex by palette role under `--raw-*` (example: `--raw-brand-700: #265649`). Primitive: `--primitive-brand-700: var(--raw-brand-700)` etc. Semantic: role names (`--semantic-background-brand`, `--semantic-text-brand`, `--semantic-border-brand`, `--semantic-background-overlay`, `--semantic-border-line`, `--semantic-text-body`, plus danger/success/neutral roles) pointing at primitives. Component: the token names listed in Interfaces, pointing at semantic tokens. Then repoint every existing name to the appropriate semantic/component token with `var(--...)`; keep `@theme inline` untouched. Add the architecture note with a text sketch of the four-layer chain.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/app/globals.tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add src/app/globals.css src/app/globals.tokens.test.ts docs/ARCHITECTURE.md && git commit -m "feat(ui): add layered design tokens with compatible aliases"`

### Task 2: Migrate ActionButton

**Files:**
- Modify: `src/features/layout/components/action-button.tsx:26-33`
- Test: `src/features/layout/components/action-button.test.tsx:47-48`

**Interfaces:**
- Consumes: `--component-action-button-background`, `--component-action-button-text`, `--component-action-button-hover-background`, `--component-action-button-hover-text` from Task 1.
- Produces: no new shared interface.

- [ ] **Step 1: Change the test assertions**

In `action-button.test.tsx`, expect the disabled case to contain `bg-[var(--component-action-button-background)] text-foreground`, and the enabled case not to contain `hover:bg-[var(--component-action-button-hover-background)]` in the disabled branch. Keep the existing visible-text assertions.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/layout/components/action-button.test.tsx`
Expected: FAIL (class strings still reference old tokens).

- [ ] **Step 3: Replace the four class strings in `action-button.tsx`**

Use the component tokens in the `disabled` and normal branches; leave layout, focus outline and `opacity-50` unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/layout/components/action-button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add src/features/layout/components/action-button.tsx src/features/layout/components/action-button.test.tsx && git commit -m "refactor(ui): use component tokens in ActionButton"`

### Task 3: Migrate admin action link/button and ConfirmPopover

**Files:**
- Modify: `src/features/admin/components/admin-table-actions.tsx:6-11`
- Modify: `src/features/admin/components/confirm-popover.tsx:94-108`
- Test: `src/features/admin/components/confirm-popover.test.tsx:19,33-34`

**Interfaces:**
- Consumes: `--component-admin-action-*` and `--component-confirm-*` from Task 1.
- Produces: no new shared interface.

- [ ] **Step 1: Change the confirm-popover assertions**

Replace expected `border-[var(--danger-border)]` / `text-[var(--danger-text)]` in the danger test with the corresponding `--component-confirm-*` token names; the non-danger test must assert absence of the same component token.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/admin/components/confirm-popover.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Swap class strings in both components**

`admin-table-actions.tsx`: default variant border/hover-border/hover-text and danger variant border/text/hover-border use `--component-admin-action-*` tokens. `confirm-popover.tsx`: Cancel border and both confirm button variants use `--component-confirm-*` tokens. Keep all text and layout classes.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/admin/components/confirm-popover.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add src/features/admin/components/admin-table-actions.tsx src/features/admin/components/confirm-popover.tsx src/features/admin/components/confirm-popover.test.tsx && git commit -m "refactor(admin): use component tokens in action links and confirm popover"`

### Task 4: Migrate CloseButton and ArrowButton

**Files:**
- Modify: `src/features/layout/components/close-button.tsx:15-18`
- Modify: `src/features/layout/components/arrow-button.tsx:18-21`
- Test: `src/features/layout/components/close-button.test.tsx:13-14`, `src/features/layout/components/arrow-button.test.tsx:13-15`

**Interfaces:**
- Consumes: `--component-close-button-*` and `--component-arrow-button-*` from Task 1.
- Produces: no new shared interface.

- [ ] **Step 1: Update the two test files**

Expect `hover:border-[var(--component-close-button-hover-border)]`, `hover:bg-[var(--component-close-button-hover-background)]`, `hover:border-[var(--component-arrow-button-hover-border)]`, etc. Add an assertion that `close-button.tsx` output contains `focus-visible:outline-[var(--component-close-button-outline)]` (which aliases the red danger value).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/layout/components/close-button.test.tsx src/features/layout/components/arrow-button.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Swap class strings in both components**

Use component tokens for border/background/text/hover/focus; leave size, radius, transitions and SVG classes unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/layout/components/close-button.test.tsx src/features/layout/components/arrow-button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add src/features/layout/components/close-button.tsx src/features/layout/components/arrow-button.tsx src/features/layout/components/close-button.test.tsx src/features/layout/components/arrow-button.test.tsx && git commit -m "refactor(ui): use component tokens in round buttons"`

### Task 5: Verify no visual change and hand off

**Files:**
- Modify: `AI_LOG.md`

**Interfaces:**
- Consumes: all four earlier tasks on this branch.
- Produces: PR with evidence.

- [ ] **Step 1: Run the full local gate**

Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build` (capture full output with exit codes via Node `spawnSync`).
Expected: all exit 0, 296+ tests.

- [ ] **Step 2: Run E2E**

Run: `npm run test:e2e`
Expected: 30 passed.

- [ ] **Step 3: Prove no visual change**

Run `npm run test:screenshots` with the default output directory, then compare all six PNGs to the committed versions. Expected: five captures byte-identical; `product-contact-popover-1920.png` is the only intentional change (X close button), regenerate and commit it with the rationale. Any other difference means stop and restore the previous token value.

- [ ] **Step 4: Check the language rule and AI log**

Run `rg -n '\p{Han}|\p{Hangul}|\p{Cyrillic}'` over tracked text files; expected no matches. Prepend an `AI_LOG.md` entry with the verbatim prompt, self-verification, "AI sai ở đâu" and limitations.

- [ ] **Step 5: Commit, push and open the PR**

Commit the AI log entry, push the branch, create the PR with `gh` using a Conventional Commits title and the contributing-guide body, and give the user the link.

## Self-review notes

- Spec coverage: four layers (Task 1), aliases + Tailwind mappings (Task 1), five components (Tasks 2–4), docs (Task 1), no visual change (Task 5), language rule (Task 5).
- All component token names are declared in Task 1 Interfaces and reused verbatim in Tasks 2–4.
- No function signatures are introduced; this is a CSS/class-string change, so each task's test is a class-string or CSS-content assertion.
