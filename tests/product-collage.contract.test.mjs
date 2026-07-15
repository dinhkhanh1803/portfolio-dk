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
  assert.match(badge, /Design \u00b7 Build \u00b7 Launch/);
  assert.doesNotMatch(badge, />DK</);
  assert.doesNotMatch(badge, /Tr\u1ea7n \u0110\u00ecnh Kh\u00e1nh/);
  assert.doesNotMatch(badge, /Developer & Digital Maker/);
});
