import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Echo Circuit route and UI expose sound-memory gameplay", async () => {
  const page = await read("../app/playground/echo-circuit/page.tsx");
  const game = await read("../app/playground/echo-circuit/echo-circuit-game.tsx");
  const css = await read("../app/playground/echo-circuit/echo-circuit.module.css");
  assert.match(page, /Echo Circuit — Sound Memory/);
  for (const token of ["AudioContext", "playbackDelay", "pressPad", "visualAssist", "data-theme", "localStorage"]) assert.match(game, new RegExp(token));
  assert.match(css, /\.pads/);
  assert.match(css, /\.page\.light/);
  assert.match(css, /prefers-reduced-motion/);
});

test("Playground publishes Echo Circuit as game eleven", async () => {
  const page = await read("../app/playground/page.tsx");
  const css = await read("../app/playground/playground.module.css");
  assert.equal((page.match(/\bslug:\s*"/g) ?? []).length, 11);
  assert.match(page, /href: "\/playground\/echo-circuit"/);
  assert.match(page, /visual: "echo"/);
  assert.match(page, /visualEcho/);
  assert.match(css, /\.visualEcho/);
});

