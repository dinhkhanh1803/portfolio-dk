# Contact Form UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing promotional contact copy with a responsive two-column contact-details and project-inquiry form UI.

**Architecture:** Extract a focused `ContactSection` component that owns bilingual contact/form copy and static form markup. Keep page-level language state in `app/page.tsx`, keep styles in the existing global stylesheet, and deliberately leave submission inert until an email API is selected.

**Tech Stack:** Next.js 16, React 19, TypeScript, lucide-react, CSS, Node.js built-in test runner

---

## File Structure

- Create `app/contact-section.tsx`: bilingual contact details and static inquiry form.
- Modify `app/page.tsx`: remove obsolete contact-only copy/imports and render `ContactSection`.
- Modify `app/globals.css`: replace the current contact-copy/list rules with responsive details/form rules.
- Create `tests/contact-section.contract.test.mjs`: lightweight structural contract for the UI-only phase.
- Modify `package.json`: expose the Node.js test command.

The worktree already contains user changes in `app/page.tsx`, `app/globals.css`, and `package.json`. Implementation changes must remain unstaged until the user reviews the combined diff; do not create an implementation commit automatically.

### Task 1: Lock the contact UI contract

**Files:**
- Create: `tests/contact-section.contract.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const componentPath = resolve("app/contact-section.tsx");
const source = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("contact form exposes the six approved controls without submitting", () => {
  for (const name of ["name", "email", "phone", "projectType", "budget", "message"]) {
    assert.match(source, new RegExp(`name=["']${name}["']`));
  }
  assert.match(source, /type=["']button["']/);
  assert.doesNotMatch(source, /onSubmit|fetch\(|\/api\//);
});

test("contact details preserve all four approved channels", () => {
  assert.match(source, /trandinhkhanh0318@gmail\.com/);
  assert.match(source, /0915 368 545/);
  assert.match(source, /trandinhkhanh2002/);
  assert.match(source, /Đà Nẵng, Việt Nam/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/contact-section.contract.test.mjs`

Expected: FAIL because `app/contact-section.tsx` does not exist, leaving the inspected source empty.

- [ ] **Step 3: Add the test script**

Add this entry to `package.json` scripts:

```json
"test": "node --test tests/*.test.mjs"
```

### Task 2: Extract and render the contact section

**Files:**
- Create: `app/contact-section.tsx`
- Modify: `app/page.tsx`
- Test: `tests/contact-section.contract.test.mjs`

- [ ] **Step 1: Create the bilingual component**

Create `ContactSection({ language }: { language: "vi" | "en" })` with:

```tsx
import { ArrowDownRight, Facebook, Mail, MapPin, Phone } from "lucide-react";

const contactCopy = {
  vi: {
    email: "Email",
    phone: "Điện thoại / Zalo",
    facebook: "Facebook",
    location: "Địa điểm",
    locationValue: "Đà Nẵng, Việt Nam",
    name: "Họ và tên",
    namePlaceholder: "Nguyễn Văn A",
    emailPlaceholder: "email@example.com",
    phonePlaceholder: "09xx xxx xxx",
    projectType: "Loại dự án",
    projectPlaceholder: "Chọn loại dự án",
    projects: ["Website", "Ứng dụng", "Game", "UI/UX", "Khác"],
    budget: "Ngân sách dự kiến",
    budgetPlaceholder: "Chọn khoảng ngân sách",
    budgets: ["Dưới 10 triệu", "10–30 triệu", "30–60 triệu", "Trên 60 triệu", "Cần tư vấn"],
    message: "Nội dung cần trao đổi",
    messagePlaceholder: "Mô tả ngắn về mục tiêu, thời gian và yêu cầu của dự án...",
    send: "Gửi yêu cầu",
  },
  en: {
    email: "Email",
    phone: "Phone / Zalo",
    facebook: "Facebook",
    location: "Location",
    locationValue: "Da Nang, Vietnam",
    name: "Full name",
    namePlaceholder: "Your name",
    emailPlaceholder: "email@example.com",
    phonePlaceholder: "Your phone number",
    projectType: "Project type",
    projectPlaceholder: "Select a project type",
    projects: ["Website", "Application", "Game", "UI/UX", "Other"],
    budget: "Estimated budget",
    budgetPlaceholder: "Select a budget range",
    budgets: ["Under 10M VND", "10–30M VND", "30–60M VND", "Over 60M VND", "Need consultation"],
    message: "Project details",
    messagePlaceholder: "Briefly describe your goals, timeline and project requirements...",
    send: "Send request",
  },
} as const;
```

Render four `.contact-detail-card` items in the left `.contact-details` column and the six named controls inside `.contact-form-panel` on the right. Use `<button type="button">` and do not add handlers.

- [ ] **Step 2: Integrate the component in the page**

Import:

```tsx
import ContactSection from "./contact-section";
```

Replace the existing `<section className="contact-section ...">...</section>` with:

```tsx
<ContactSection language={language} />
```

Remove the `Facebook`, `Mail`, and `Phone` imports and the obsolete contact-only translation keys. Keep `MapPin` and `Sparkles` because the hero and projects section still use them.

- [ ] **Step 3: Run the contract test and verify GREEN**

Run: `npm test`

Expected: 2 tests pass.

### Task 3: Implement the approved responsive styling

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace obsolete contact rules**

Keep `.contact-section`, `.contact-card`, and its decorative pseudo-elements. Change the card to `grid-template-columns: minmax(0, .86fr) minmax(0, 1.14fr)` and add focused rules for:

```css
.contact-details { display: grid; gap: 10px; align-content: center; }
.contact-detail-card { min-height: 82px; display: grid; grid-template-columns: 49px 1fr auto; }
.contact-form-panel { padding: clamp(20px, 3vw, 34px); border-radius: 26px; }
.contact-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.contact-field { display: grid; gap: 8px; }
.contact-field-full { grid-column: 1 / -1; }
.contact-field input,
.contact-field select,
.contact-field textarea { width: 100%; border: 1px solid var(--line); background: rgba(255,255,255,.78); }
.contact-submit { width: 100%; min-height: 54px; }
```

Match the existing typography, coral primary button, dark icon tiles, hover transitions, focus-visible rings, and glass surfaces from the approved mockup.

- [ ] **Step 2: Add responsive layout rules**

At `max-width: 940px`, stack the contact columns with details first. At `max-width: 620px`, switch `.contact-form-grid` to one column, make full-width fields use the normal single column, and reduce panel/card padding without hiding any field.

- [ ] **Step 3: Run static checks**

Run: `npm test && npm run lint`

Expected: tests and ESLint pass with no new warnings.

### Task 4: Production and visual verification

**Files:**
- Verify only; no additional files expected.

- [ ] **Step 1: Build the production app**

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 2: Inspect desktop and mobile rendering**

Start the app with `npm run dev`, open the contact section, and verify:

- Desktop: four contact cards on the left, complete form on the right.
- Mobile: contact cards above the form, all six fields visible without horizontal overflow.
- VI/EN: every contact and form label updates.
- Clicking the button does not navigate, reload, call an API, or show a fake success state.

- [ ] **Step 3: Review the final diff without staging**

Run: `git diff -- app/page.tsx app/contact-section.tsx app/globals.css package.json tests/contact-section.contract.test.mjs`

Expected: only the approved contact UI, its contract test, and the test script are present among the implementation hunks. Leave these files unstaged because they contained pre-existing user work.
