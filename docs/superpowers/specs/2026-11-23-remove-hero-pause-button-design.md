# Remove Visible Hero Slider Pause Button - Design

## Intent and why

The customer Figma for the home page does not show a pause/play control on the hero
carousel. The current storefront renders one at the bottom-right of every slide
(`src/features/layout/components/hero-slider.tsx`, lines 138-169). The owner asked to
remove the visible control so the rendered page matches the design.

## Decision record: accessibility override

AGENTS.md rule 11 requires asking the project owner before dropping a mandatory
accessibility behavior. The pause button is the WAI-ARIA APG carousel pause control and
is one of the rule's named examples (WCAG 2.2.2 Pause, Stop, Hide). It was added
intentionally in commit `c75a89c` ("fix(home): add pause controls and reduced-motion
support to hero slider").

The owner was asked directly and chose **remove the visible button only**, explicitly
accepting the residual gap. The non-visible mitigations stay: auto-advance pauses while
the pointer is over the slider, while focus is inside the slider, and whenever
`prefers-reduced-motion: reduce` is set. The residual gap is that there is no longer a
persistent, discoverable control to pause auto-advance for a user who is not hovering
or focusing the carousel. This is recorded as a limitation in `AI_LOG.md`.

## Goals

- Remove the visible pause/play button from the rendered hero slider.
- Remove the now-permanently-true `isPlaying` state and simplify `isAutoAdvancing`.
- Keep pointer-hover pause, focus-within pause, reduced-motion pause, the live region,
  arrows, navigation dots, and auto-advance itself unchanged.
- Update unit and e2e tests so the suite describes the new behavior.

## Non-goals

- Do not remove auto-advance or change the 5000 ms interval.
- Do not touch the product carousel or any other carousel.
- Do not rewrite the historical review record that cites the deleted test.
- Do not add a replacement pause mechanism; the owner declined that scope.

## Constraints

- TypeScript strict, no `any`, no dead state.
- Vietnamese and English letters only in text written for this change.
- Full check set must pass before the PR: `npm run lint`, `npm run typecheck`,
  `npm test`, `npm run format:check`, `npm run build`.
- Check output must be captured with Node `spawnSync` in UTF-8 with `NO_COLOR=1`.

## Approaches

- **A (chosen):** remove the button and the `isPlaying` state, simplify
  `isAutoAdvancing`. No dead state remains.
- **B (rejected):** remove only the button and keep `isPlaying`. Leaves a state that is
  always `true` with no setter use, which violates the no-dead-code rule.
- **C (rejected):** remove all pause behavior. Outside the owner's
  "visible button only" choice and a broader regression than approved.

## Builder notes

- The live region uses `isAutoAdvancing ? 'off' : 'polite'`. With `isPlaying` removed,
  it still flips to `polite` on hover, focus, and reduced motion. Keep that expression.
- The static-markup test in `hero-slider.test.tsx` does not reference the pause button;
  leave it unchanged.
- The reduced-motion assertion `queryByRole('button', { name: /automatic slide
  changes/i })` becomes trivially true. Remove it rather than keep a meaningful-looking
  assertion that can never fail.
