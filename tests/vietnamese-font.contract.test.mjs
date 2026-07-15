import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vietnamese pages use a Vietnamese-capable font", async () => {
  const [layout, page, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Be_Vietnam_Pro/);
  assert.match(layout, /--font-vietnamese/);
  assert.match(layout, /subsets:\s*\["latin",\s*"vietnamese"\]/);
  assert.match(page, /className={`lang-\${language}`}/);
  assert.match(page, /lang={language}/);
  assert.match(css, /\.lang-vi[\s\S]*var\(--font-vietnamese\)/);
});
