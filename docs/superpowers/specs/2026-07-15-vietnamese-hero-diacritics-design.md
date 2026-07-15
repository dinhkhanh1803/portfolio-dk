# Vietnamese Hero Diacritics Fix Design

## Goal

Prevent Vietnamese accent marks in the gradient hero line from appearing clipped without reducing the heading size or changing the English layout.

## Root Cause

Be Vietnam Pro has taller Vietnamese diacritics than the previous heading font. The hero uses a tight `line-height: 1.01`, while the gradient line uses transparent text with `background-clip: text`; accent pixels extending beyond that block's paint area become transparent.

## Approved Fix

- Increase only the Vietnamese hero heading line height to `1.08`.
- Add `0.1em` top padding to the gradient line so its background covers the complete accent marks.
- Offset that padding with a `-0.1em` top margin to preserve the existing vertical composition.
- Keep font size, colors, English typography, and responsive layout unchanged.

## Verification

- Add a CSS contract test for the Vietnamese-specific line height and gradient-line paint area.
- Run the complete tests, ESLint, production build, and local CSS check.
