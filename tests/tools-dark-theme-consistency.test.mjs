import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("tool detail tabs share the dark teal active state", () => {
  assert.match(css, /\/\* Tools detail dark-theme consistency \*\//);
  assert.match(
    css,
    /\[data-theme="dark"\] \.tools-main\.is-detail :is\(\[class\$="-tabs"\], \[class\*="-tabs "\]\) button:is\(\.active, \.is-active, \[aria-selected="true"\]\)[\s\S]*?background:\s*linear-gradient\(135deg,\s*var\(--teal\),\s*#2a9dab\)[\s\S]*?color:\s*#fff/
  );
});

test("tool detail form controls use readable dark surfaces", () => {
  assert.match(
    css,
    /\[data-theme="dark"\] \.tools-main\.is-detail :is\(textarea, select, input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="range"\]\):not\(\[type="color"\]\)\)[\s\S]*?background:\s*#101d24[\s\S]*?color:\s*var\(--ink\)/
  );
});

test("disabled tool actions remain visible without looking enabled", () => {
  assert.match(
    css,
    /\[data-theme="dark"\] \.tools-main\.is-detail button:disabled[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*\.07\)[\s\S]*?color:\s*#91a6a4[\s\S]*?opacity:\s*\.68/
  );
});
test("selected options inside tool cards use the same teal state", () => {
  assert.match(
    css,
    /\[data-theme="dark"\] \.tools-main\.is-detail button:is\(\.is-selected, \[aria-pressed="true"\]\)[\s\S]*?background:\s*linear-gradient\(135deg,\s*var\(--teal\),\s*#2a9dab\)[\s\S]*?color:\s*#fff/
  );
  assert.doesNotMatch(
    css,
    /\[data-theme="dark"\] \.image-export-choice-grid button\.is-selected\s*\{[\s\S]*?background:\s*#edf5f4/
  );
});
