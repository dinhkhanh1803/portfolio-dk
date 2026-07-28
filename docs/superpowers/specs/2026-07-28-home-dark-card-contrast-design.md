# Home dark-mode card contrast

## Goal

Correct the home page dark theme so buttons, metadata pills, and the four
service cards no longer retain light-theme gray surfaces or lose text contrast.

## Scope

- Keep the current layout, typography, icon colors, spacing, and motion.
- Change only dark-mode presentation for the home hero controls and service rail.
- Use the existing dark glass direction already established by the product
  collage.

## Visual design

- Service cards use a translucent `#142229`-family glass surface with a subtle
  light border and a dark shadow.
- Service titles and arrow icons use the high-contrast `--ink` token.
- Service descriptions use `--muted`, which is already a light gray in dark mode.
- The secondary hero button and hero metadata pills use dark translucent
  surfaces, light borders, and dark-theme text tokens.
- The coral primary action and the four colored service icons remain unchanged.

## Implementation boundary

Add narrowly scoped selectors under `[data-theme="dark"] .home-main` in
`app/globals.css`. Do not change component markup or global light-mode tokens.

## Verification

- Add a contract test proving the required dark-mode selectors and token-based
  foreground colors exist.
- Run the focused contract test, the full test suite, lint, and production build.
- Render the home page in dark mode at the reported desktop viewport and visually
  confirm readable title, description, arrows, pills, and both hero buttons.
