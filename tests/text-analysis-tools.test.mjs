import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");

test("Text Analysis collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");

  assert.match(page, /import TextAnalysisWorkbench from "\.\/text-analysis-workbench"/);
  assert.match(page, /activeCollection\.id === "text-analysis" \? <TextAnalysisWorkbench \/>/);
  assert.match(page, /"Keyword Density"/);
  assert.match(page, /"Readability Checker"/);
});

test("Text Analysis workbench exposes focused analysis tabs and report actions", () => {
  const workbench = read("app/tools/text-analysis-workbench.tsx");

  for (const label of ["Overview", "Keyword Density", "Character Frequency", "Readability", "Word Count", "Reading time", "Top keywords", "Flesch score"]) {
    assert.match(workbench, new RegExp(label));
  }

  assert.match(workbench, /TEXT_ANALYSIS_SAMPLE/);
  assert.match(workbench, /Copy report/);
  assert.match(workbench, /Download \.json/);
  assert.match(workbench, /text-analysis-workbench/);
});

test("Text Analysis engine contains real statistics, density, frequency, and readability logic", () => {
  const engine = read("app/tools/text-analysis-engine.ts");

  for (const fn of ["analyzeText", "getKeywordDensity", "getCharacterFrequency", "getReadability", "formatAnalysisReport"]) {
    assert.match(engine, new RegExp(`export function ${fn}`));
  }

  assert.match(engine, /fleschReadingEase/);
  assert.match(engine, /fleschKincaidGrade/);
  assert.match(engine, /uniqueWords/);
  assert.match(engine, /stopWords/);
  assert.match(engine, /sentiment/);
});

test("Text Analysis styling is scoped and keeps metric cards readable in both themes", () => {
  const css = read("app/globals.css");

  assert.match(css, /\.text-analysis-workbench/);
  assert.match(css, /\.text-analysis-metrics/);
  assert.match(css, /\.text-analysis-card/);
  assert.match(css, /\[data-theme="dark"\] \.text-analysis-card/);
  assert.doesNotMatch(css, /\.text-analysis-tabs\{[^}]*overflow-x:auto/);
});
