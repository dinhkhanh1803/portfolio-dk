# Vietnamese Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use Be Vietnam Pro for Vietnamese content while preserving the existing English typography and layout.

**Architecture:** Load the Vietnamese-capable font once in the root layout, expose it as a CSS variable, and scope its use with the active language class on `<main>`. A source contract test protects the font import, language marker, and CSS override.

**Tech Stack:** Next.js, React, TypeScript, `next/font/google`, CSS, Node test runner

---

### Task 1: Add a Vietnamese typography contract

**Files:**
- Create: `tests/vietnamese-font.contract.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vietnamese pages use a Vietnamese-capable font", async () => {
  const [layout, page, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Be_Vietnam_Pro/);
  assert.match(layout, /--font-vietnamese/);
  assert.match(layout, /subsets:\s*\["latin",\s*"vietnamese"\]/);
  assert.match(page, /className={`lang-\${language}`}/);
  assert.match(page, /lang={language}/);
  assert.match(css, /\.lang-vi[\s\S]*var\(--font-vietnamese\)/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`

Expected: the new contract fails because `Be_Vietnam_Pro` and `--font-vietnamese` do not exist yet.

### Task 2: Scope Be Vietnam Pro to Vietnamese

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Load the font variable**

Import `Be_Vietnam_Pro`, configure weights 400–900 with the Vietnamese subset, and add its variable class to `<body>`.

- [ ] **Step 2: Mark the active page language**

Set `<main className={`lang-${language}`} lang={language}>` so CSS and assistive technology receive the active language.

- [ ] **Step 3: Add the scoped CSS override**

```css
.lang-vi,
.lang-vi h1,
.lang-vi h2 {
  font-family: var(--font-vietnamese), "Segoe UI", Arial, sans-serif;
}
```

- [ ] **Step 4: Run verification**

Run: `npm test`, `npm run lint`, and `npm run build`.

Expected: all tests pass, ESLint exits cleanly, and the production build succeeds.

- [ ] **Step 5: Check the local page output**

Request `http://localhost:3000` and confirm the HTML contains `lang-vi`; confirm the served CSS contains `.lang-vi` and `--font-vietnamese`.
