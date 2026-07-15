# Generic Product Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the personal hero collage badge with the approved generic Product Lab badge.

**Architecture:** Keep the existing `ProductCollage` component and badge structure. Change only the badge icon and copy, then protect that isolated markup with a source contract test.

**Tech Stack:** Next.js, React, TypeScript, Lucide React, Node test runner

---

### Task 1: Protect the generic badge contract

**Files:**
- Create: `tests/product-collage.contract.test.mjs`
- Modify: `app/page.tsx:297-303`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("hero collage badge uses generic product identity", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = source.indexOf('<div className="collage-brand glass-panel">');
  const end = source.indexOf('<div className="shape shape-teal"', start);
  const badge = source.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(badge, /<Layers3/);
  assert.match(badge, /Product Lab/);
  assert.match(badge, /Design · Build · Launch/);
  assert.doesNotMatch(badge, />DK</);
  assert.doesNotMatch(badge, /Trần Đình Khánh/);
  assert.doesNotMatch(badge, /Developer & Digital Maker/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`

Expected: the new test fails because the badge still contains `DK`, the personal name, and the personal role.

- [ ] **Step 3: Replace the badge content**

```tsx
<div className="collage-brand glass-panel">
  <div className="mini-mark"><Layers3 size={25} strokeWidth={1.8} aria-hidden="true" /></div>
  <div>
    <strong>Product Lab</strong>
    <span>Design · Build · Launch</span>
  </div>
</div>
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: all tests pass.

### Task 2: Verify the finished page

**Files:**
- Verify: `app/page.tsx`
- Verify: `app/globals.css`

- [ ] **Step 1: Run static checks**

Run: `npm run lint`

Expected: ESLint exits with code 0.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: the Next.js production build exits with code 0.

- [ ] **Step 3: Verify local rendered output**

Request `http://localhost:3000/` and confirm it contains `Product Lab` and `Design · Build · Launch`, and no longer contains the personal role text in the badge markup.
