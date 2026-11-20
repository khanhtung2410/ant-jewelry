# Design: layered design tokens (raw / primitive / semantic / component)

## Intent

Apply the four-layer token model shown by the project owner to the ANT JEWELRY UI. Today `src/app/globals.css` has one flat `:root` block of Figma hex values used directly as names such as `--underline-color` and `--font-color`. The goal is structure, not new colours: every current value stays byte-for-byte the same.

## Goals

- Four clearly commented layers in `globals.css`: raw hex → primitive → semantic → component.
- Existing token names remain as aliases, so unmigrated components and their unit tests keep working.
- Five core components consume component tokens: `ActionButton`, `admin-table-actions` (default/danger), `CloseButton`, `ArrowButton`, `ConfirmPopover`.
- A short architecture note explains the model and where to add new tokens.

## Non-goals / anti-goals

- No colour, spacing or layout change. The six committed 1920px screenshots must remain byte-identical after regeneration.
- No rename of every token in the repo (that was the rejected full-rename approach).
- No new font, CDN asset or dependency.

## Constraints

- Tailwind v4 `@theme inline` already re-exports selected CSS variables as utility colours; those mappings must keep their current names.
- Unit tests assert some exact class strings containing CSS variable names; only the five migrated components' assertions may change.
- Project language rule: no Han/Hangul/Cyrillic characters in docs, code, PR or commit.

## Approaches considered

- **Layered + aliases (chosen):** add the four layers, keep old names as aliases, migrate five components. Lowest risk; satisfies the model in code while preserving behaviour.
- **Full rename everywhere:** rejected — large diff, high chance of accidental visual drift, no extra benefit for this request.
- **Comments only:** rejected — documents the idea without applying it.

## Design

```
:root {
  /* 1. Raw values - exact hex from Figma / existing palette */
  --raw-brand-700: #265649;  /* etc. */

  /* 2. Primitive - palette-scale aliases */
  --primitive-brand-700: var(--raw-brand-700);

  /* 3. Semantic - role in the UI */
  --semantic-background-brand: var(--primitive-brand-700);
  --semantic-text-brand: var(--primitive-brand-700);
  --semantic-border-brand: var(--primitive-brand-700);

  /* 4. Component - one component's state */
  --component-button-primary-background: var(--semantic-background-brand);
  --component-button-primary-text: var(--raw-neutral-0);

  /* Compatibility aliases (existing public names) */
  --underline-color: var(--semantic-border-brand);
}
```

Existing names (`--background`, `--foreground`, `--line`, `--font-color`, `--underline-color`, `--button-bg-*`, `--backdrop-*`, `--surface-*`, `--badge-*`, `--danger-*`, `--success-text`, `--neutral-*`, `--control-outline`, `--focus-ring-color`, `--popover-shadow-color`, `--product-image-background`) are re-pointed at the appropriate semantic token, preserving their values.

Migrated components use `var(--component-...)` classes for their own backgrounds, text and borders. Hover/focus/disabled states get their own component tokens where a semantic token would be ambiguous. No other component files are edited.

## Verification

- `npm run lint`, `typecheck`, `test`, `format:check`, `build` all exit 0.
- `npm run test:e2e` -> 30 passed.
- `npm run test:screenshots` -> six PNGs byte-identical to the committed ones (proof of no visual change).
- Repo-wide CJK scan -> no matches.

## Builder notes

The plan should keep the change in small steps: layers + aliases first (should be a no-op visually), then one component group at a time, running tests after each. If any screenshot changes, stop and restore the previous value rather than "adjusting" the design.
