import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");

test("Regex Tools collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");

  assert.match(page, /import RegexToolsWorkbench from "\.\/regex-tools-workbench"/);
  assert.match(page, /activeCollection\.id === "regex-tools" \? <RegexToolsWorkbench \/>/);
  assert.match(page, /"Regex Replacer"/);
  assert.match(page, /"Pattern Library"/);
});

test("Regex workbench exposes tester, replacer, library, and quick actions", () => {
  const workbench = read("app/tools/regex-tools-workbench.tsx");

  for (const label of ["Regex Tester", "Regex Replacer", "Pattern Library", "Matches", "Groups", "Replacement preview", "Pattern cheatsheet"]) {
    assert.match(workbench, new RegExp(label));
  }

  assert.match(workbench, /REGEX_SAMPLE_TEXT/);
  assert.match(workbench, /Copy regex/);
  assert.match(workbench, /Download \.json/);
  assert.match(workbench, /regex-tools-workbench/);
  assert.match(workbench, /regex-pattern-card/);
  assert.match(workbench, /regex-flag-toggle/);
});

test("Regex engine contains safe evaluation, match groups, replace, and library data", () => {
  const engine = read("app/tools/regex-tools-engine.ts");

  for (const fn of ["evaluateRegex", "replaceRegex", "explainRegex", "buildFlags"]) {
    assert.match(engine, new RegExp(`export function ${fn}`));
  }

  assert.match(engine, /REGEX_PATTERNS/);
  assert.match(engine, /namedGroups/);
  assert.match(engine, /invalid/);
  assert.match(engine, /email/);
  assert.match(engine, /url/);
});

test("Regex styling is scoped, wraps tabs, and supports dark result cards", () => {
  const css = read("app/globals.css");

  assert.match(css, /\.regex-tools-workbench/);
  assert.match(css, /\.regex-match-card/);
  assert.match(css, /\.regex-pattern-grid/);
  assert.match(css, /\.regex-pattern-grid>\.regex-pattern-card/);
  assert.match(css, /\.regex-control-card \.regex-flag-toggle input/);
  assert.match(css, /\[data-theme="dark"\] \.regex-match-card/);
  assert.doesNotMatch(css, /\.regex-tools-tabs\{[^}]*overflow-x:auto/);
});
