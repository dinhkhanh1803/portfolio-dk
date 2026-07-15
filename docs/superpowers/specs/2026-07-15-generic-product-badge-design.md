# Generic Product Badge Design

## Goal

Remove personal identity from the floating badge in the hero product collage while preserving its current size, position, motion, and visual balance.

## Approved Design

- Replace the `DK` initials with the existing Layers icon.
- Replace the personal name with `Product Lab`.
- Replace the personal role with `Design · Build · Launch`.
- Keep the badge language-neutral so it works in both Vietnamese and English modes.
- Do not change the surrounding collage, layout, animation, colors, or responsive behavior.

## Verification

- A contract test confirms the old initials, name, and role no longer appear inside the badge.
- The same test confirms the generic Product Lab content and icon are present.
- Existing tests, ESLint, production build, and local page rendering must continue to pass.
