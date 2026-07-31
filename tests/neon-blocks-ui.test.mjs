import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Game 09 route mounts Neon Blocks with metadata", async () => {
  const page = await read("../app/playground/neon-blocks/page.tsx");
  assert.match(page, /Neon Blocks — Tetris Arcade/);
  assert.match(page, /<NeonBlocksGame \/>/);
});

test("Neon Blocks UI exposes controls, board, hold, queue, score, audio, and theme sync", async () => {
  const game = await read("../app/playground/neon-blocks/neon-blocks-game.tsx");
  const css = await read("../app/playground/neon-blocks/neon-blocks.module.css");
  for (const token of ["hardDrop", "holdPiece", "rotatePiece", "getGhostY", "MutationObserver", "AudioContext", "localStorage"]) {
    assert.match(game, new RegExp(token));
  }
  assert.match(game, /getAttribute\("data-theme"\) === "dark"/);
  assert.match(game, /attributeFilter: \["data-theme"\]/);
  assert.match(css, /\.board/);
  assert.match(css, /\.touchControls/);
  assert.match(css, /\.page\.light/);
  assert.match(css, /prefers-reduced-motion/);
});

test("Playground publishes Neon Blocks as the ninth live game", async () => {
  const page = await read("../app/playground/page.tsx");
  const css = await read("../app/playground/playground.module.css");
  assert.equal((page.match(/\bslug:\s*"/g) ?? []).length, 9);
  for (const token of [
    'slug: "neon-blocks"',
    'href: "/playground/neon-blocks"',
    'title: "Neon Blocks"',
    'categories: ["Arcade", "Puzzle", "Skill", "Endless"]',
    'visual: "blocks"',
  ]) assert.match(page, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(page, /visualBlocks/);
  assert.match(css, /\.visualBlocks/);
});

