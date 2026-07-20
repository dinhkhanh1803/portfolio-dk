# Personal Portfolio Information Architecture Design

## Goal

Refocus the site as Trần Đình Khánh's long-term, bilingual personal portfolio. It must communicate current capability to recruiters and prospective clients without presenting itself as a freelance-services website. The site also needs clear boundaries for future tools, small games and writing.

## Product Positioning

- Identity: Full-stack Developer.
- Audience: recruiters first, then prospective clients and peers.
- Tone: minimal and professional, with deliberate creative details rather than a crowded or agency-like interface.
- Language: Vietnamese and English, with an explicit language switcher and equivalent content in both languages.
- Primary message: the owner designs and builds useful digital products across frontend, backend, product thinking and selected experimental work.

## Information Architecture

The current single long-form landing page becomes a short portfolio-first home page plus dedicated destinations:

| Route | Purpose | Initial content |
| --- | --- | --- |
| `/` | Quick professional introduction and navigation hub | Hero, selected work, capability snapshot, latest experiment/article, contact CTA |
| `/projects` | Evidence of product and engineering capability | Filterable project index and links to project detail pages |
| `/tools` | Useful utilities made by the owner | Tool cards with purpose, status, stack and live/demo links |
| `/playground` | Games and creative experiments | Experimental work cards, clearly separated from professional case studies |
| `/blog` | Technical notes, documentation and learning | Article index grouped by topic |
| `/about` | Personal narrative and full capability profile | Background, working values, timeline and detailed skills |
| `/contact` | Direct professional contact | Simple contact details and short invitation to connect |

The global navigation contains About, Projects, Tools, Playground and Blog; Contact remains a distinct CTA. It removes agency/freelancer language such as service packages, project-intake framing, client-review placeholders and "available for freelance" status.

## Home Page

The home page is intentionally short:

1. A bilingual hero identifies the owner as a Full-stack Developer and includes concise professional positioning, location and two links: selected work and contact.
2. Selected Work shows three to four strongest projects, each linking to `/projects` or a future detail page.
3. Capabilities groups skills by practice (frontend, backend/data, product delivery and creative/interactive), avoiding a claim that every listed technology has equal depth.
4. A "building beyond client work" block previews the newest tool, playground item and article, with links to their destinations.
5. A compact contact CTA supports opportunities, collaboration and conversations; it does not use a freelancer quotation form.

## Content Model and Components

Content is stored in typed, bilingual records rather than embedded independently in each page. Initial records are `Project`, `Tool`, `PlaygroundItem`, `Post`, `SkillGroup` and `Profile`.

Each item provides a stable id, visibility/status, category/tags, technology list, links, and `vi` and `en` fields. Projects additionally have role, problem, contribution and outcome fields for future case studies. The UI reads a current-language setting and renders the selected localized value; a missing translation must fall back to Vietnamese in development and be flagged before publishing.

Components are separated by page purpose: shared `SiteHeader`, `LanguageSwitcher`, `Footer` and content card components; page-specific sections remain in their route folder. This replaces the current oversized `app/page.tsx` as routes are introduced.

## Visual Direction

Keep the existing warm, creative visual vocabulary only where it supports the work. The page should use generous whitespace, strong typography, a quiet neutral base and a restrained accent palette. Cards and interaction should help scan content, while tools and games get their character from their own thumbnails rather than making the portfolio look like an agency showcase.

## Interaction, Accessibility and Failure States

- Language selection persists for the session and updates navigation, page metadata and visible content without broken links.
- Navigation works with keyboard and screen readers; the mobile menu has correct focus and expanded state.
- Cards must have a meaningful destination or a clearly visible "Coming soon" state, never a dead link.
- Empty category pages describe what will appear and point visitors to a relevant active section.
- Images require useful alt text; motion respects `prefers-reduced-motion`.

## Rollout Scope

The first implementation focuses on the new shared foundation, a concise home page and route shells with real starter content. Building functional standalone tools, publishing games, a CMS, a contact backend, analytics and a complete case-study system are future work. Existing project entries are retained but reframed as evidence of the owner's work; unverified testimonials and generic client-service content are removed.

## Verification

- Add contract tests for required routes, global navigation, bilingual fields and the absence of legacy freelance/service/review copy on the home page.
- Run the existing test suite, ESLint and a production build.
- Review desktop and mobile layouts for navigation, language switching, content hierarchy and reduced-motion behavior.

