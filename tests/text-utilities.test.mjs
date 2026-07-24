import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Text Utilities collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");
  assert.match(page, /import TextUtilitiesWorkbench from "\.\/text-utilities-workbench"/);
  assert.match(page, /activeCollection\.id === "text-utilities" \? <TextUtilitiesWorkbench \/>/);
  assert.doesNotMatch(page, new RegExp("[\u00c3\u00c2\ufffd]|\u00e1\u00bb|\u00e1\u00ba|\u00c4\u2018|\u00c6|\u00e2\u0152|\u00e2\u20ac"));
});

test("Text Utilities workbench exposes practical utility tabs and actions", () => {
  const workbench = read("app/tools/text-utilities-workbench.tsx");
  for (const label of ["Slug Generator", "Diff Checker", "Whitespace Cleaner", "URL Tools", "HTML Entities", "Quote Wrapper"]) {
    assert.match(workbench, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(workbench, /TEXT_UTILITIES_SAMPLE/);
  assert.match(workbench, /navigator\.clipboard/);
  assert.match(workbench, /download/);
  assert.match(workbench, /text-utilities-workbench/);
});

test("Text Utilities engine includes real transform, diff, and entity helpers", () => {
  const engine = read("app/tools/text-utilities-engine.ts");
  for (const symbol of [
    "createSlug",
    "cleanWhitespace",
    "compareText",
    "encodeHtmlEntities",
    "decodeHtmlEntities",
    "wrapLines",
    "extractLines",
  ]) {
    assert.match(engine, new RegExp(`export function ${symbol}`));
  }
  assert.match(engine, /type DiffLine/);
});

test("Text Utilities styling is scoped and readable in both themes", () => {
  const css = read("app/globals.css");
  for (const selector of [".text-utilities-workbench", ".text-utility-layout", ".text-utility-diff", ".text-utility-card"]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /\[data-theme="dark"\] \.text-utility-card/);
  assert.doesNotMatch(css, /\.text-utility-tabs\{[^}]*overflow-x:auto/);
});
