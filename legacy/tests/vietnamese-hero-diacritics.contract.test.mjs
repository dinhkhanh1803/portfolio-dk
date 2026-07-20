import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vietnamese gradient hero text reserves room for diacritics", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.lang-vi \.hero h1\s*{[^}]*line-height:\s*1\.08/);
  assert.match(
    css,
    /\.lang-vi \.hero h1 strong\s*{[^}]*padding-top:\s*\.1em[^}]*margin-top:\s*-\.1em/,
  );
});
