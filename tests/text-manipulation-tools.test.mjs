import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");

test("Text Manipulation collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");

  assert.match(page, /import TextManipulationWorkbench from "\.\/text-manipulation-workbench"/);
  assert.match(page, /activeCollection\.id === "text-manipulation" \? <TextManipulationWorkbench \/>/);
});

test("Text Manipulation workbench exposes all requested tools with samples and output actions", () => {
  const workbench = read("app/tools/text-manipulation-workbench.tsx");

  for (const label of ["Case Converter", "Line Sorter", "Duplicate Remover", "Text Reverser", "Text Trimmer", "Text Splitter", "Find & Replace", "Text Repeater", "Text Counter", "Slugify"]) {
    assert.match(workbench, new RegExp(label));
  }

  assert.match(workbench, /sampleInput/);
  assert.match(workbench, /Copy/);
  assert.match(workbench, /Download \.txt/);
  assert.match(workbench, /text-manipulation-workbench/);
});

test("Text Manipulation engine includes real transforms instead of generic passthroughs", () => {
  const engine = read("app/tools/text-manipulation-engine.ts");

  for (const fn of ["convertCase", "sortLines", "removeDuplicateLines", "reverseText", "trimText", "splitText", "replaceText", "repeatText", "slugifyText", "textStats"]) {
    assert.match(engine, new RegExp(`export function ${fn}`));
  }

  assert.match(engine, /sentence/);
  assert.match(engine, /title/);
  assert.match(engine, /camel/);
  assert.match(engine, /natural/);
  assert.match(engine, /case-insensitive/);
  assert.match(engine, /TrimMode/);
  assert.match(engine, /SplitMode/);
  assert.match(engine, /ReplaceOptions/);
  assert.match(engine, /RepeatOptions/);
});

test("Text Manipulation styling is scoped and supports dark selected buttons", () => {
  const css = read("app/globals.css");

  assert.match(css, /\.text-manipulation-workbench/);
  assert.match(css, /\.text-tool-grid/);
  assert.match(css, /\[data-theme="dark"\] \.text-tool-segmented button\.is-active/);
});


