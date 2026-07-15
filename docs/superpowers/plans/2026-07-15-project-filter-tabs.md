# Project Filter Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible client-side tabs that filter portfolio projects by All, Web, Mobile, and Game.

**Architecture:** Keep the existing project data and rendering in `app/page.tsx`, add a stable filter key plus stable visual index to every item, and isolate selection logic in a small pure TypeScript helper. React state controls the active filter while CSS renders the tabs as responsive glass pills.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Node.js built-in test runner

---

### Task 1: Project filter behavior

**Files:**
- Create: `app/project-filter.ts`
- Create: `tests/project-filter.test.mjs`

- [ ] **Step 1: Write the failing behavior test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const modulePath = resolve("app/project-filter.ts");

test("project filters expose the approved order and filter projects", async () => {
  assert.ok(existsSync(modulePath), "project-filter.ts should exist");
  const { PROJECT_FILTERS, filterProjects } = await import(modulePath);
  const projects = [
    { title: "Store", filter: "web" },
    { title: "Booking", filter: "mobile" },
    { title: "Quest", filter: "game" },
  ];

  assert.deepEqual(PROJECT_FILTERS, ["all", "web", "mobile", "game"]);
  assert.deepEqual(filterProjects(projects, "all"), projects);
  assert.deepEqual(filterProjects(projects, "web"), [projects[0]]);
  assert.deepEqual(filterProjects(projects, "mobile"), [projects[1]]);
  assert.deepEqual(filterProjects(projects, "game"), [projects[2]]);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test`

Expected: the new test fails with `project-filter.ts should exist`.

- [ ] **Step 3: Implement the pure helper**

```ts
export const PROJECT_FILTERS = ["all", "web", "mobile", "game"] as const;

export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

export function filterProjects<T extends { filter: ProjectFilter }>(
  projects: readonly T[],
  activeFilter: ProjectFilter,
) {
  return activeFilter === "all"
    ? [...projects]
    : projects.filter((project) => project.filter === activeFilter);
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test`

Expected: all contact and project-filter tests pass.

### Task 2: Tabs and filtered rendering

**Files:**
- Modify: `app/page.tsx`
- Test: `tests/project-filter.test.mjs`

- [ ] **Step 1: Add stable category metadata**

Add `filter: "web"` to Heritage Ginseng and Electronics Commerce, `filter: "game"` to Ocean Quest, and `filter: "mobile"` to Booking Platform in both language datasets.

- [ ] **Step 2: Add state and labels**

Import `PROJECT_FILTERS`, `ProjectFilter`, and `filterProjects`. Add `const [activeProjectFilter, setActiveProjectFilter] = useState<ProjectFilter>("all")` beside the existing state. Define labels:

```ts
const projectFilterLabels = {
  vi: { all: "Tất cả", web: "Web", mobile: "Mobile", game: "Game" },
  en: { all: "All", web: "Web", mobile: "Mobile", game: "Game" },
} as const;
```

- [ ] **Step 3: Preserve visual identity and filter items**

```ts
const visibleProjects = filterProjects(
  t.projects.map((project, visualIndex) => ({ ...project, visualIndex })),
  activeProjectFilter,
);
```

Use `visualIndex` for `projectIcons[visualIndex]` and `project-${visualIndex + 1}` so filtering does not change card icon or color.

- [ ] **Step 4: Render accessible tabs**

Insert before `.projects-grid`:

```tsx
<div className="project-filters" aria-label={language === "vi" ? "Lọc dự án" : "Filter projects"}>
  {PROJECT_FILTERS.map((filter) => (
    <button
      className={activeProjectFilter === filter ? "is-active" : ""}
      type="button"
      aria-pressed={activeProjectFilter === filter}
      onClick={() => setActiveProjectFilter(filter)}
      key={filter}
    >
      {projectFilterLabels[language][filter]}
    </button>
  ))}
</div>
```

Render `visibleProjects` instead of `t.projects`.

### Task 3: Responsive tab styling and verification

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Style the filter row**

```css
.project-filters {
  display: flex;
  gap: 9px;
  margin: -12px 0 26px;
  padding: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.project-filters button {
  flex: 0 0 auto;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(255,255,255,.78);
  border-radius: 999px;
  background: rgba(255,255,255,.46);
  color: #655d55;
  cursor: pointer;
}

.project-filters button.is-active {
  border-color: var(--teal);
  background: var(--teal);
  color: white;
  box-shadow: 0 10px 24px rgba(20,125,122,.2);
}
```

Add hover and focus-visible states; hide the WebKit scrollbar. On screens up to 620px, reduce button padding and keep the row horizontally scrollable.

- [ ] **Step 2: Run verification**

Run: `npm test && npm run lint && npm run build`

Expected: all tests pass, ESLint is clean, and Next.js production build succeeds.

- [ ] **Step 3: Verify the running dev bundle**

Fetch `http://localhost:3000`, then confirm the HTML contains `project-filters` and the served CSS contains `.project-filters`. Leave implementation files unstaged because `app/page.tsx` and `app/globals.css` contain pre-existing user work.
