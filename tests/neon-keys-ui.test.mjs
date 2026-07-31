import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Neon Keys exposes piano, rhythm, audio, controls, and theme sync", async () => {
  const [page, game, styles] = await Promise.all([
    read("app/playground/neon-keys/page.tsx"),
    read("app/playground/neon-keys/neon-keys-game.tsx"),
    read("app/playground/neon-keys/neon-keys.module.css"),
  ]);
  assert.match(page, /NeonKeysGame/);
  assert.match(game, /const NOTES = \[/);
  assert.match(game, /AudioContext/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /MutationObserver/);
  assert.match(game, /"challenge" \| "free"/);
  assert.match(game, /KEYS\.indexOf/);
  assert.match(styles, /\.page\.light/);
  assert.match(styles, /\.keyboard/);
});

test("Playground publishes Neon Keys as game twelve", async () => {
  const hub = await read("app/playground/page.tsx");
  assert.match(hub, /slug: "neon-keys"/);
  assert.match(hub, /href: "\/playground\/neon-keys"/);
  assert.match(hub, /visual: "keys"/);
  assert.equal((hub.match(/slug: "/g) ?? []).length, 12);
});
