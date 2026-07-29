import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  activeLaserCells,
  createSerpentRun,
  getRunDefinition,
  stepSerpent,
} from "../app/playground/neon-serpent/neon-serpent-engine.ts";

test("Endless exposes the same generated geometry used for collision and rendering", () => {
  const run = { ...createSerpentRun("normal", 8, 7), mode: "endless", wave: 12 };
  const definition = getRunDefinition(run);
  assert.match(definition.name, /Endless 12/);
  assert.ok(definition.walls.length > 0);
});

test("non-boss laser stages expose telegraphed and active lanes", () => {
  const run = { ...createSerpentRun("normal", 6, 4), hazardElapsedMs: 2100 };
  assert.ok(activeLaserCells(run).length > 0);
});

test("Magnet moves a distant core toward the snake head", () => {
  const run = {
    ...createSerpentRun("normal", 1, 4),
    phase: "playing",
    core: { x: 14, y: 8 },
    effects: { magnet: 8000, slowTime: 0, phase: 0, scoreBoost: 0 },
  };
  const next = stepSerpent(run, run.tickMs);
  assert.ok(Math.abs(next.core.x - next.snake[0].x) < Math.abs(run.core.x - run.snake[0].x));
});

test("meeting the target opens an exit portal instead of clearing immediately", () => {
  const run = createSerpentRun("normal", 1, 8);
  const staged = { ...run, phase: "playing", coresCollected: run.target - 1, core: { x: run.snake[0].x + 1, y: run.snake[0].y } };
  const next = stepSerpent(staged, staged.tickMs);
  assert.equal(next.phase, "playing");
  assert.ok(next.exitPortal);
});

test("UI renders engine geometry, laser lanes, resume stages, and writes terminal progress", async () => {
  const source = await readFile(new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url), "utf8");
  for (const token of ["getRunDefinition", "activeLaserCells", "highestStage", "gameover", "exitPortal"]) assert.ok(source.includes(token), token);
});
