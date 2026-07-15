# Vietnamese Hero Diacritics Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure Vietnamese accent marks render fully in the gradient hero heading.

**Architecture:** Add a narrowly scoped `.lang-vi` CSS override rather than changing the shared hero typography. Protect the override with a source contract test so English spacing and other headings remain untouched.

**Tech Stack:** CSS, Next.js, Node test runner

---

### Task 1: Add the regression contract

**Files:**
- Create: `tests/vietnamese-hero-diacritics.contract.test.mjs`
- Modify: `app/globals.css`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vietnamese gradient hero text reserves room for diacritics", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.lang-vi \.hero h1\s*{[^}]*line-height:\s*1\.08/);
  assert.match(css, /\.lang-vi \.hero h1 strong\s*{[^}]*padding-top:\s*\.1em[^}]*margin-top:\s*-\.1em/);
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test`

Expected: the new contract fails because the Vietnamese hero overrides are absent.

- [ ] **Step 3: Add the scoped CSS fix**

```css
.lang-vi .hero h1 {
  line-height: 1.08;
}

.lang-vi .hero h1 strong {
  padding-top: .1em;
  margin-top: -.1em;
}
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: all tests pass.

### Task 2: Verify the page

**Files:**
- Verify: `app/globals.css`

- [ ] **Step 1: Run lint and production build**

Run: `npm run lint` and `npm run build`.

Expected: both commands exit with code 0.

- [ ] **Step 2: Verify local CSS**

Request the stylesheet served by `http://localhost:3000/` and confirm it includes both Vietnamese hero overrides.
