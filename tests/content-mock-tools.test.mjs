import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { formatMockRows, generateLorem, generateMockRows, generateSequence } from "../app/tools/content-mock-engine.ts";

const bytes = (...values) => { let offset = 0; return (length) => Uint8Array.from({ length }, () => values[offset++ % values.length] ?? 0); };

test("lorem generator supports paragraph, sentence, word and HTML output", () => {
  const paragraph = generateLorem({ mode: "paragraphs", count: 2, sentencesPerParagraph: 2, includeStart: true, flavor: "classic", html: true });
  assert.match(paragraph, /^<p>Lorem ipsum dolor sit amet,/);
  assert.equal((paragraph.match(/<p>/g) ?? []).length, 2);
  assert.match(generateLorem({ mode: "words", count: 4, sentencesPerParagraph: 1, includeStart: false, flavor: "tech", html: false }), /^adaptive interface signal system$/);
});

test("mock rows render deterministic JSON, CSV and SQL with selected fields", () => {
  const rows = generateMockRows([{ key: "fullName", type: "Full Name" }, { key: "email", type: "Email" }, { key: "active", type: "Boolean" }], 2, bytes(0));
  assert.equal(rows.length, 2);
  assert.deepEqual(Object.keys(rows[0]), ["fullName", "email", "active"]);
  assert.match(String(rows[0].email), /@/);
  assert.match(formatMockRows(rows, "CSV"), /^fullName,email,active/m);
  assert.match(formatMockRows(rows, "SQL"), /INSERT INTO mock_data/);
});

test("number sequences create arithmetic, Fibonacci, prime and powers values", () => {
  assert.deepEqual(generateSequence("Arithmetic", 5, 2, 3), [2, 5, 8, 11, 14]);
  assert.deepEqual(generateSequence("Fibonacci", 6, 1, 1), [0, 1, 1, 2, 3, 5]);
  assert.deepEqual(generateSequence("Prime", 5, 1, 1), [2, 3, 5, 7, 11]);
  assert.deepEqual(generateSequence("Powers", 4, 2, 3), [1, 2, 4, 8]);
});

test("content and mock data collection uses a dedicated five-tab workbench", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const workbench = readFileSync(resolve("app/tools/content-mock-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  for (const label of ["Lorem Ipsum", "Lorem Ipsum Generator", "Mock Data Generator", "Random Data Generator", "Number Sequence Generator"]) assert.match(workbench, new RegExp(label));
  assert.match(page, /activeCollection\.id === "mock-data" \? <ContentMockWorkbench/);
  assert.match(css, /\.content-mock-workbench/);
});
test("theme tokens keep controls, active states, and dropdowns readable", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /--control-surface:/);
  assert.match(css, /--control-text:/);
  assert.match(css, /button\.is-active\{[^}]*color:var\(--control-on-ink\)/);
  assert.match(css, /select,option\{[^}]*color:var\(--control-text\)/);
  assert.match(css, /\[data-theme="dark"\] \.header-cta,\[data-theme="dark"\] \.button-primary/);
  assert.doesNotMatch(css, /background:var\(--navy\)/);
});