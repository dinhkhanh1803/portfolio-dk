import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Game 10 route and UI expose the complete shooter contract", async () => {
  const page = await read("../app/playground/neon-invaders/page.tsx");
  const game = await read("../app/playground/neon-invaders/neon-invaders-game.tsx");
  const css = await read("../app/playground/neon-invaders/neon-invaders.module.css");
  assert.match(page, /Neon Invaders — Space Shooter/);
  for (const token of ["canvas", "firePlayer", "triggerBomb", "AudioContext", "localStorage", "data-theme", "onPointerMove"]) {
    assert.match(game, new RegExp(token));
  }
  assert.match(css, /\.arena/);
  assert.match(css, /\.page\.light/);
  assert.match(css, /prefers-reduced-motion/);
});

test("Playground publishes Neon Invaders as game ten", async () => {
  const page = await read("../app/playground/page.tsx");
  const css = await read("../app/playground/playground.module.css");
  assert.equal((page.match(/\bslug:\s*"/g) ?? []).length, 10);
  assert.match(page, /href: "\/playground\/neon-invaders"/);
  assert.match(page, /visual: "invaders"/);
  assert.match(page, /visualInvaders/);
  assert.match(css, /\.visualInvaders/);
});

