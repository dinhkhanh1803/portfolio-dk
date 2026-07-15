# Vietnamese Typography Design

## Goal

Improve Vietnamese readability without changing the current layout, spacing, colors, or English typography.

## Decision

- Load **Be Vietnam Pro** through `next/font/google` with Vietnamese glyph support and weights 400–900.
- Keep Manrope for English body copy and Sora for English headings.
- Add a language class and `lang` attribute to the page `<main>`.
- When Vietnamese is active, use Be Vietnam Pro for the whole page, including headings that currently use Sora.
- Keep all existing font sizes, weights, line heights, and responsive rules unchanged.

## Verification

- A contract test confirms the Vietnamese font is loaded and scoped to the Vietnamese language class.
- Existing tests, ESLint, and the production build must pass.
- The local page output must contain the Vietnamese language class and the generated stylesheet must contain its font override.
