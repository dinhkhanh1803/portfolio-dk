import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createPlaceholderSvg, createPlaceholderDataUrl, createPicsumUrl } from "../app/tools/favicon-placeholder-engine.ts";

test("placeholder SVG escapes text and preserves requested dimensions", () => {
  const svg = createPlaceholderSvg({ width: 400, height: 300, background: "#eeeeee", color: "#333333", text: "<400 & 300>", fontSize: 20 });
  assert.match(svg, /width="400" height="300"/);
  assert.match(svg, /&lt;400 &amp; 300&gt;/);
  assert.match(svg, /fill="#eeeeee"/);
});

test("placeholder data URL is SVG data and Picsum URL supports all options", () => {
  assert.match(createPlaceholderDataUrl({ width: 24, height: 24, background: "#fff", color: "#000", text: "x", fontSize: 12 }), /^data:image\/svg\+xml;charset=utf-8,/);
  assert.equal(createPicsumUrl({ width: 600, height: 400, blur: 3, grayscale: true, seed: "mountain" }), "https://picsum.photos/seed/mountain/600/400?grayscale&blur=3");
});

test("favicon and placeholder collection exposes six dedicated modes", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const workbench = readFileSync(resolve("app/tools/favicon-placeholder-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  for (const label of ["Favicon Generator", "Emoji Favicon Generator", "Image Favicon Generator", "CSS Placeholder Generator", "Placeholder Image Generator", "Placeholder Image URL"]) assert.match(workbench, new RegExp(label));
  assert.match(page, /activeCollection\.id === "favicon-placeholder" \? <FaviconPlaceholderWorkbench/);
  assert.match(css, /\.favicon-workbench\{[^}]*container-type:inline-size/);
  assert.match(css, /\.favicon-tabs\{[^}]*flex-wrap:wrap/);
});