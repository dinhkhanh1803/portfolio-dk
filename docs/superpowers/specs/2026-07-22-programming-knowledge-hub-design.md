# Programming Knowledge Hub Design

## Goal

Turn `/blog` into the portfolio's bilingual programming knowledge hub. It should be useful as a durable reference for both new and experienced developers, rather than a chronological personal-post index.

## Scope

- Keep the existing `/blog` route and rename its Vietnamese navigation label from `Bài viết` to `Tài liệu` (English: `Docs`).
- Replace the generic writing-card index with a self-contained, client-side knowledge hub.
- Include a searchable set of starter learning entries grouped into four areas: Foundations, Languages & Ecosystem, Algorithms & Problem Solving, and Developer Tools & AI.
- Provide equivalent Vietnamese and English content through the existing language provider.
- Keep the page usable in the existing light and dark themes, across desktop and mobile.

## Experience and Visual Direction

The page follows DK Coder's current visual system: warm sand background, teal and coral accents, rounded glass panels, Sora/Manrope typography and generous whitespace. It does not reproduce the reference layout. The hero becomes an asymmetric editorial introduction with a compact topic summary; the search is presented as an embedded utility control; and category cards use the site's distinct color accents and icon language.

## Components and Data Flow

`app/blog/page.tsx` becomes a client component with local typed documentation data. Each entry has an id, localized title and description, category, tags, reading level and a currently non-navigating status. The selected language chooses localized labels and text.

The page derives a filtered entry list from a local search query. A case-insensitive match checks title, description, category and tags. Category cards set the active category filter; a clear action returns to all entries. Empty search results display an accessible no-results message and a way to reset the filters.

The shared navigation data changes only the Blog label, preserving the `/blog` link and every other route.

## Page Structure

1. A documentation eyebrow, bilingual heading and concise statement of purpose.
2. A search control and a compact count of matching resources.
3. Four topic cards, each with an icon, a color treatment, description and entry count.
4. A filtered resource list. Each entry shows topic, level, title, summary and tags. Initial entries are actionable reference topics, not fabricated published articles.

## Accessibility and Resilience

- Search has an explicit label, keyboard focus state and a visible reset action.
- Category cards are buttons with `aria-pressed` state.
- Icons supplement text rather than replacing it.
- The mobile layout stacks all controls and cards without horizontal overflow.
- Existing reduced-motion behavior remains in effect.

## Verification

- Add a focused contract test covering the renamed navigation label, route content, topic labels and search implementation markers.
- Run the full test suite, ESLint and a production build.
