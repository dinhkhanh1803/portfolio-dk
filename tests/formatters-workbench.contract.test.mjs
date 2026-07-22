import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Formatters workbench carries its own stylesheet chunk", async () => {
  const source = await readFile(new URL("../app/tools/formatters-workbench.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/tools/formatters-workbench.module.css", import.meta.url), "utf8");

  assert.match(source, /import\s+"\.\/formatters-workbench\.module\.css"/);
  assert.match(styles, /:global\(\.fmt-workbench\)/);
  assert.match(styles, /:global\(\.fmt-grid\)/);
});
