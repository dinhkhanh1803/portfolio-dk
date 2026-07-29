import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEFAULT_PROGRESS, parseProgress } from "../app/playground/neon-serpent/neon-serpent-storage.ts";

test("progress parser accepts only consistent version-one records", () => {
  const valid = { version: 1, bestScore: 900, highestStage: 8, campaignComplete: true, endlessUnlocked: true, bestEndlessWave: 9 };
  assert.deepEqual(parseProgress(JSON.stringify(valid)), valid);
  assert.deepEqual(parseProgress('{"version":2}'), DEFAULT_PROGRESS);
  assert.deepEqual(parseProgress('{"version":1,"bestScore":-1}'), DEFAULT_PROGRESS);
});

test("audio adapter exposes unlock, mute, event, and dispose lifecycle", async () => {
  const source = await readFile(new URL("../app/playground/neon-serpent/neon-serpent-audio.ts", import.meta.url), "utf8");
  for (const token of ["unlock()", "setMuted(", "play(", "dispose()"]) assert.ok(source.includes(token), token);
});

test("game UI provides Canvas, inputs, theme, audio, pause, and accessible status", async () => {
  const source = await readFile(new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url), "utf8");
  for (const token of [
    "<canvas", "requestAnimationFrame", "ArrowUp", "KeyW", "touchstart",
    "MutationObserver", "prefers-reduced-motion", "aria-live", "visibilitychange",
    "Pause", "Restart", "Mute",
  ]) assert.ok(source.includes(token), token);
});

test("Playground exposes Neon Serpent as the seventh live game", async () => {
  const page = await readFile(new URL("../app/playground/page.tsx", import.meta.url), "utf8");
  assert.match(page, /slug: "neon-serpent"/);
  assert.match(page, /href: "\/playground\/neon-serpent"/);
  assert.match(page, /visual: "serpent"/);
  assert.match(page, /Neon Serpent/);
});
