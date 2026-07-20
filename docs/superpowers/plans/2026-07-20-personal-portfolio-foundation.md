# Personal Portfolio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the freelance-oriented page into a bilingual personal portfolio with a concise home page and dedicated content routes.

**Architecture:** Put all Vietnamese and English starter content in a typed data module. A lightweight client context provides the language choice to a shared shell and route components. Reusable cards display the content, keeping each route small and ready to grow.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, lucide-react, Node test runner, ESLint.

---

## File Structure

- Create `app/portfolio-data.ts`: localized profile, projects, tools, playground entries and posts.
- Create `app/language-provider.tsx`, `app/site-header.tsx`, `app/site-footer.tsx`, `app/content-cards.tsx`.
- Create `app/{projects,tools,playground,blog,about,contact}/page.tsx`.
- Modify `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Remove `app/contact-section.tsx` and `app/project-filter.ts`.
- Create `tests/personal-portfolio.contract.test.mjs`.

### Task 1: Define and test bilingual content

**Files:**
- Create: `app/portfolio-data.ts`
- Create: `tests/personal-portfolio.contract.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test("portfolio data covers bilingual content areas", async () => {
  const { portfolio, siteNav } = await import(pathToFileURL(resolve("app/portfolio-data.ts")).href);
  assert.deepEqual(siteNav.map((item) => item.href), ["/about", "/projects", "/tools", "/playground", "/blog"]);
  assert.equal(portfolio.vi.profile.role, "Full-stack Developer");
  assert.equal(portfolio.en.profile.role, "Full-stack Developer");
  for (const language of ["vi", "en"]) {
    assert.ok(portfolio[language].projects.length >= 3);
    assert.ok(portfolio[language].tools.length >= 1);
    assert.ok(portfolio[language].playground.length >= 1);
    assert.ok(portfolio[language].posts.length >= 1);
  }
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `node --test tests/personal-portfolio.contract.test.mjs`

Expected: FAIL because `app/portfolio-data.ts` is absent.

- [ ] **Step 3: Implement the data module**

```ts
export type Language = "vi" | "en";
export type PortfolioItem = { id: string; title: string; description: string; category: string; tags: string[]; status: "live" | "coming-soon"; href: string };
export const siteNav = [
  { href: "/about", label: { vi: "Giới thiệu", en: "About" } },
  { href: "/projects", label: { vi: "Dự án", en: "Projects" } },
  { href: "/tools", label: { vi: "Công cụ", en: "Tools" } },
  { href: "/playground", label: { vi: "Góc thử nghiệm", en: "Playground" } },
  { href: "/blog", label: { vi: "Bài viết", en: "Blog" } },
] as const;
```

Add explicit equivalent VI/EN records for at least three current projects, one useful tool, one experiment and one technical note. Projects include `role` and `outcome`; no record has service-package, pricing or freelancer copy.

- [ ] **Step 4: Run it and verify it passes**

Run: `node --test tests/personal-portfolio.contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add app/portfolio-data.ts tests/personal-portfolio.contract.test.mjs && git commit -m "feat: add bilingual portfolio content"`

### Task 2: Implement the shared bilingual shell

**Files:**
- Create: `app/language-provider.tsx`, `app/site-header.tsx`, `app/site-footer.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`
- Test: `tests/personal-portfolio.contract.test.mjs`

- [ ] **Step 1: Add the failing shell test**

```js
test("shell provides accessible persisted language controls", async () => {
  const layout = await readFile("app/layout.tsx", "utf8");
  const header = await readFile("app/site-header.tsx", "utf8");
  assert.match(layout, /LanguageProvider/);
  assert.match(header, /siteNav/);
  assert.match(header, /sessionStorage/);
  assert.match(header, /aria-pressed/);
  assert.match(header, /aria-expanded/);
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `node --test tests/personal-portfolio.contract.test.mjs`

Expected: FAIL because provider and header are missing.

- [ ] **Step 3: Implement provider and shell**

```tsx
"use client";
const LanguageContext = createContext<{ language: Language; setLanguage: (next: Language) => void } | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");
  useEffect(() => { const saved = sessionStorage.getItem("portfolio-language"); if (saved === "vi" || saved === "en") setLanguage(saved); }, []);
  const changeLanguage = (next: Language) => { sessionStorage.setItem("portfolio-language", next); setLanguage(next); };
  return <LanguageContext value={{ language, setLanguage: changeLanguage }}>{children}</LanguageContext>;
}
```

`SiteHeader` maps `siteNav`, has VI/EN buttons with `aria-pressed`, a collapsible mobile menu with `aria-expanded`, and a `/contact` CTA. Wrap the layout children with provider, header and footer. Replace metadata with `Trần Đình Khánh | Full-stack Developer`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/personal-portfolio.contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add app/language-provider.tsx app/site-header.tsx app/site-footer.tsx app/layout.tsx app/globals.css tests/personal-portfolio.contract.test.mjs && git commit -m "feat: add bilingual portfolio shell"`

### Task 3: Build the concise home hub

**Files:**
- Create: `app/content-cards.tsx`
- Modify: `app/page.tsx`, `app/globals.css`
- Test: `tests/personal-portfolio.contract.test.mjs`

- [ ] **Step 1: Add the failing home contract**

```js
test("home is a personal portfolio hub without freelancer sales copy", async () => {
  const page = await readFile("app/page.tsx", "utf8");
  assert.match(page, /Full-stack Developer/);
  assert.match(page, /selectedProjects/);
  assert.match(page, /tools/);
  assert.match(page, /playground/);
  assert.match(page, /posts/);
  assert.doesNotMatch(page, /Freelance|Services|Client reviews|Estimated budget/);
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `node --test tests/personal-portfolio.contract.test.mjs`

Expected: FAIL against legacy page content.

- [ ] **Step 3: Implement the home sections and cards**

```tsx
const { language } = useLanguage();
const content = portfolio[language];
const selectedProjects = content.projects.slice(0, 3);
return <main>
  <section className="hero"><p>Full-stack Developer</p><h1>{content.profile.name}</h1><p>{content.profile.summary}</p></section>
  <section><h2>{language === "vi" ? "Dự án nổi bật" : "Selected work"}</h2><ProjectCards items={selectedProjects} /></section>
  <section><h2>{language === "vi" ? "Đang xây dựng" : "Building beyond client work"}</h2><ToolCard item={content.tools[0]} /><PlaygroundCard item={content.playground[0]} /><PostCard item={content.posts[0]} /></section>
</main>;
```

Cards link to `/projects`, `/tools`, `/playground`, `/blog` and `/contact`. Use generous whitespace, strong typography and restrained accents. Remove services, testimonials, quote form and freelance role rotation.

- [ ] **Step 4: Verify test and lint**

Run: `node --test tests/personal-portfolio.contract.test.mjs && npm run lint`

Expected: PASS and ESLint exit 0.

- [ ] **Step 5: Commit**

Run: `git add app/page.tsx app/content-cards.tsx app/globals.css tests/personal-portfolio.contract.test.mjs && git commit -m "feat: refocus home as personal portfolio"`

### Task 4: Add destinations and complete responsive verification

**Files:**
- Create: `app/projects/page.tsx`, `app/tools/page.tsx`, `app/playground/page.tsx`, `app/blog/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`
- Remove: `app/contact-section.tsx`, `app/project-filter.ts`
- Modify: `app/globals.css`
- Test: `tests/personal-portfolio.contract.test.mjs`

- [ ] **Step 1: Add the failing route test**

```js
test("portfolio routes exist and freelancer modules are removed", () => {
  for (const name of ["projects", "tools", "playground", "blog", "about", "contact"]) assert.ok(existsSync(resolve(`app/${name}/page.tsx`)));
  assert.equal(existsSync(resolve("app/contact-section.tsx")), false);
  assert.equal(existsSync(resolve("app/project-filter.ts")), false);
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `node --test tests/personal-portfolio.contract.test.mjs`

Expected: FAIL because the new route files do not yet exist.

- [ ] **Step 3: Implement all destination pages**

```tsx
export default function ProjectsPage() {
  const { language } = useLanguage();
  return <PageIntro title={language === "vi" ? "Dự án" : "Projects"}><ProjectCards items={portfolio[language].projects} /></PageIntro>;
}
```

Apply the same data/card pattern to tools, playground and blog. About renders profile, values, timeline and skills. Contact renders email, phone, location and social links only. Remove both legacy files and their unused CSS.

- [ ] **Step 4: Add accessibility and responsive rules**

```css
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
@media (max-width: 720px) { .content-grid { grid-template-columns: 1fr; } .site-nav { display: none; } .site-nav.is-open { display: grid; } }
```

For `coming-soon` records, render a visible label rather than a dead link.

- [ ] **Step 5: Run all checks and inspect layout**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0. Inspect every route, navigation and language switcher on desktop and 375px mobile width.

- [ ] **Step 6: Commit**

Run: `git add app tests && git add -u app && git commit -m "feat: add personal portfolio destinations"`

## Plan Self-Review

- Spec coverage: Tasks 1–2 implement bilingual data, metadata and navigation; Task 3 implements the short home page; Task 4 implements all required routes, removes freelancer framing and verifies responsiveness and accessibility.
- Placeholder scan: no unresolved requirement or file is unspecified.
- Type consistency: `Language`, `portfolio`, `siteNav` and the language context introduced in the first two tasks are used consistently later.
