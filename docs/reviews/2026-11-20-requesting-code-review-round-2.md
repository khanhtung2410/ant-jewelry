# Whole-codebase + production review, round 2 (2026-11-20)

- **Skill:** `requesting-code-review` + `verification-before-completion` + `browser`
- **Head reviewed:** `ea87187` (main after PR #119 and PR #120)
- **Base:** `cfef8cb`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-20 ... - Full evidence, production check và Lighthouse v4`.
- **Reviewer:** fresh-context general subagent, read-only, no subagents of its own.

## Method

Reviewer inspected `git diff cfef8cb..ea87187`, then read the actual current files (tokens, five migrated components, E2E isolation, docs, AI_LOG). It mechanically resolved every CSS variable to a concrete hex, checked all `--component-*` consumers, and checked the E2E `finally` restore paths. It did not re-run the check gate (read-only); the full gate with complete output was run separately in this round.

Production check: Playwright as ADMIN against `https://ant-jewelry.vercel.app`, read-only (Cancel/Escape only, no creates or updates). Credentials were supplied by the owner, held in a temp script outside the repo, and the script was deleted after the run.

Lighthouse: 13.6.0, mobile, simulate throttling, 3 runs per page on production URLs; raw JSON committed under `docs/lighthouse-reports/prod-*-v4-*.json`.

## Production check (complete output)

```text
BASE: https://ant-jewelry.vercel.app
LOGIN: <owner-supplied admin>
LOGIN: OK -> https://ant-jewelry.vercel.app/admin
/admin: 200 bodyHas"Dashboard"=true
/admin/products: 200 bodyHas"Products"=true
/admin/categories: 200 bodyHas"Categories"=true
/admin/blog: 200 bodyHas"Blog"=true
/admin/hero-slides: 200 bodyHas"Hero"=true
/admin/settings: 200 bodyHas"Settings"=true
/admin/users: 200 bodyHas"Users"=true
confirm: cancelFocused=true tabToDelete=true tabWraps=true escapeClosed=true recordVisible=true
hide confirm: hideButton=true escapeOrCancelKeptVisible=true
ivy product: 200 uploadedImages=2
LOGOUT: OK
native dialogs: 0 []
console errors: 0 []
page errors: 0 []
```

## Lighthouse v4 (complete output)

```text
home    run 1: exit=0 perf=85 a11y=96 best=100 seo=100 FCP=1264 LCP=2960 TBT=159 CLS=0
home    run 2: exit=0 perf=95 a11y=96 best=100 seo=100 FCP=1307 LCP=2957 TBT=30  CLS=0
home    run 3: exit=0 perf=98 a11y=96 best=100 seo=100 FCP=967  LCP=2317 TBT=47  CLS=0
product run 1: exit=0 perf=98 a11y=100 best=100 seo=100 FCP=957  LCP=2225 TBT=93  CLS=0
product run 2: exit=0 perf=94 a11y=100 best=100 seo=100 FCP=1204 LCP=2404 TBT=207 CLS=0
product run 3: exit=0 perf=100 a11y=100 best=100 seo=100 FCP=1289 LCP=1664 TBT=33  CLS=0
blog    run 1: exit=0 perf=95 a11y=98 best=100 seo=100 FCP=1236 LCP=2480 TBT=155 CLS=0
blog    run 2: exit=0 perf=98 a11y=98 best=100 seo=100 FCP=958  LCP=2161 TBT=103 CLS=0
blog    run 3: exit=0 perf=98 a11y=98 best=100 seo=100 FCP=930  LCP=2130 TBT=95  CLS=0
```

Median performance: home **95** (85–98), product **98** (94–100), blog **98** (95–98). TBT 30–207 ms, CLS 0 in all nine runs.

## Reviewer report (verbatim)

### Strengths

- Token layering structurally correct: all 37 `--raw-*` values feed `--primitive-*`, then `--semantic-*`, then `--component-*` and compatibility aliases; one-directional, zero cycles, zero dangling references (`globals.css:4-196`).
- All compatibility aliases preserve their original computed values (`--background` `#fefdf8`, `--foreground` `#000000`, `--underline-color` `#265649`, `--danger-bg` `#fef2f2`, `--success-text` `#065f46`, etc.); `@theme inline` mapping names unchanged (`globals.css:158-217`).
- Every declared `--component-*` token has at least one consumer (29/29 checked across `src`, `e2e`, `scripts`).
- Three specific verifications pass: ConfirmPopover primary text resolves to `#fefdf8` not `#ffffff`; CloseButton focus outline `#991b1b`; E2E `finally` restores and asserts seed state (`e2e/storefront-admin.spec.ts:312-341, 349-382`).
- E2E restore robust to a thrown assertion: `try` mutations followed by unconditional `finally`, re-navigation works from the storefront, row filter matches both names.
- Finding #11 handled conservatively: only behaviour change is password `.trim()`; rest is comments/documentation plus one assertion, matching the owner's "low-risk only" choice.
- Repo-wide CJK/Hangul/Cyrillic scan zero matches; `contact-popover.test.tsx` assertion edits are an unavoidable consequence of migrating child components.

### Issues

#### Critical (Must Fix)
None found.

#### Important (Should Fix)

1. Undocumented third colour change on the CloseButton border — `src/features/layout/components/close-button.tsx:16`, `src/app/globals.css:144`, `docs/ARCHITECTURE.md:884`. `--component-close-button-border` maps to `--semantic-border-line` = `#93aaa0`; base was `--neutral-strong` = `#262626`. Not in the sanctioned exception, so "every other token resolves to its previous value" was false. ArrowButton border still `#262626`.

#### Minor (Nice to Have)

2. AI_LOG entry lost its title header — `AI_LOG.md:36`: the design-token header was replaced outright by the findings #9–11 entry.
3. Second screenshot committed despite the plan requiring five byte-identical captures — `docs/deploy-screenshots/product-1920.png` changed by 2 bytes (local seed noise).
4. Semantic-role mismatch in `--component-confirm-primary-text` — `globals.css:143`: a background token consumed as text.
5. Token resolution test pinned only 6 of 29 component tokens — `src/app/globals.tokens.test.ts:85-92`.

### Assessment

Ready to merge: **With fixes**. Functionally sound and all three specific verifications pass, but the undocumented CloseButton border change and the AI_LOG header regression need repair.

## Decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `globals.css:144`, `close-button.tsx:16`, `ARCHITECTURE.md:884` | Render CloseButton: border resolves `#93aaa0` instead of base `#262626`; spec claimed no other colour changed. | **Fixed in follow-up PR on `fix/review-1-and-3` (owner asked to fix, not just document).** Changed `--component-close-button-border` back to `var(--semantic-border-strong)` (`#262626`). RED first: resolution test expected `#262626`, got `#93aaa0`; GREEN after: 7/7 token + close-button tests pass. Removed the border from the sanctioned exception in `ARCHITECTURE.md`, spec and plan; the exception now covers only background and X colour. |
| 2 | Minor · `AI_LOG.md:36` | Design-token entry began bare with `### Prompt...`, breaking the established header format. | **Accepted (fixed).** Reinserted `## 2026-11-20 12:45:47 +07:00 - Layered design tokens + X button + Figma check`. |
| 3 | Minor · `docs/deploy-screenshots/product-1920.png` | 2-byte delta from local seed data, not from tokens. | **Fixed in follow-up PR on `fix/review-1-and-3`.** Restored the file from `cfef8cb` (199398 bytes, byte-identical to base; the local build had 199396). Spec and plan no longer carry the deviation note. `product-contact-popover-1920.png` remains the only intentional visual change. |
| 4 | Minor · `globals.css:143` | Background token used as text colour. | **Accepted (fixed).** Added `--semantic-text-on-brand-soft: var(--primitive-neutral-50)` and repointed `--component-confirm-primary-text` to it. Resolution stays `#fefdf8`; the resolution test still passes. |
| 5 | Minor · `globals.tokens.test.ts:85-92` | Six of 30 component tokens pinned; silent drift possible. | **Accepted (fixed).** Replaced the sample with a table pinning all 30 component tokens and asserting each is declared exactly once. Test now 5 passed. |

## Limitations

- Reviewer did not re-run the check gate; full complete-output evidence is in the PR and `AI_LOG.md`.
- No historical Figma snapshot in the repo; the CloseButton border ruling relies on the current Figma `Product-2` render inspected in this session.
- Production check was read-only; no data was created, updated or deleted. Credentials were never committed.

## Flake investigation found during the full gate

The first complete E2E run in this round failed one test:

```text
1) [desktop-chrome] e2e/accessibility.spec.ts:73:1
   contact popover has no serious or critical accessibility violations @a11y
   expect(locator).toBeVisible() failed
   Locator: getByRole('dialog', { name: 'CONTACT US' })
   1 failed / 29 passed
```

- **Phase 1 (root cause):** the dialog is rendered from React state (`contact-popover.tsx:254-266`); a click before hydration is a no-op. The test clicked the footer trigger immediately after `page.goto('/')` with no hydration wait. A direct probe using `waitUntil: 'commit'` and an immediate click reproduced the symptom **3/10 times** (`dialogVisible=false`), so the failure is timing-dependent, not a token regression: the same full suite passed on rerun, and the failing test passed 4/4 in isolation.
- **Phase 2 (pattern):** the analogous storefront test in `e2e/storefront-admin.spec.ts` performs several assertions and interactions before opening the popover, so it rarely hits the same window. No product code changed in this round for the popover.
- **Phase 3 (hypothesis):** hydration race in the test, not the component.
- **Phase 4 (fix):** `e2e/accessibility.spec.ts:77-92` now polls the interaction with `expect(...).toPass({ timeout: 10_000 })` — click the footer trigger (and expand the mobile accordion when needed) until the dialog actually appears. No arbitrary sleeps.
- **Verification:** two consecutive full E2E runs after the fix: **30 passed / 1.4m** and **30 passed / 1.4m**. Temp probe scripts deleted.
