# Tailwind Config Generator Expansion

## Goal

Expand the CSS Utilities Tailwind Config Generator with practical design-system variables and use the available right-column height for the generated configuration.

## Scope

- Keep the existing JavaScript and TypeScript output modes, copy action, and download action.
- Expand theme colors to eight editable semantic colors.
- Add editable font sizes, spacing, border radii, and box shadows.
- Keep the three editable font stacks.
- Expand container controls to include centering, default padding, and all `sm` through `2xl` breakpoints.
- Generate every edited value in the JavaScript and TypeScript configuration output.

## Layout

- The left control column remains a stack of compact grouped panels.
- Repeated variables use responsive two-column grids where space permits and one column on narrow screens.
- The right preview/config column fills the available workbench height.
- `Generated Config` grows into unused vertical space; only its code body scrolls when the output is longer than the panel.
- Copy controls remain visible in the sticky output header.

## Data Flow

- One Tailwind state object owns colors, fonts, font sizes, spacing, radii, shadows, container values, breakpoints, and language.
- Controlled inputs update their corresponding state branch.
- A memoized serializer produces valid JavaScript or TypeScript configuration from the complete state.
- Preview swatches and summaries are derived from the same state so preview and output cannot drift apart.

## Validation and Safety

- Empty values remain serializable strings instead of crashing the generator.
- Generated object keys are quoted where needed.
- Long configuration output wraps safely or scrolls inside its own bounded code region without overflowing the tool panel.

## Verification

- Add regression tests for the expanded variable groups and generated output.
- Add stylesheet contract tests for the full-height output layout and responsive control grids.
- Run the CSS tools tests, full test suite, ESLint, production build, and browser QA for desktop and narrow layouts.
