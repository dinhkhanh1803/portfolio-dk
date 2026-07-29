import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Neon Serpent does not render the on-screen directional button cluster", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /className=\{styles\.dpad\}/);
  assert.doesNotMatch(source, /aria-label="Directional controls"/);
});
