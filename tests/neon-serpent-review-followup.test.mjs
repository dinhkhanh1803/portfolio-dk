import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  activeLaserCells,
  createSerpentRun,
  getRunDefinition,
  startEndless,
  stepSerpent,
} from "../app/playground/neon-serpent/neon-serpent-engine.ts";

test("Endless geometry remains stable when the spawn seed advances", () => {
  const run = startEndless(
    { ...createSerpentRun("normal", 8, 41), campaignComplete: true },
    true,
  );
  const before = getRunDefinition(run).walls;
  const after = getRunDefinition({ ...run, seed: run.seed + 98765 }).walls;
  assert.deepEqual(after, before);
});

test("early Endless waves do not inherit the campaign hunter", () => {
  const run = startEndless(
    { ...createSerpentRun("normal", 8, 72), campaignComplete: true },
    true,
  );
  assert.equal(run.wave, 1);
  assert.equal(run.hunter, null);
});

test("opening the exit disables active hazards while navigation continues", () => {
  const run = {
    ...createSerpentRun("normal", 6, 9),
    phase: "playing",
    exitPortal: { x: 20, y: 8 },
    hazardElapsedMs: 2100,
    hunter: { x: 18, y: 12 },
    boundaryInset: 2,
  };
  const next = stepSerpent(run, run.tickMs);
  assert.equal(next.hazardElapsedMs, run.hazardElapsedMs);
  assert.equal(next.hunter, null);
  assert.equal(next.boundaryInset, 0);
  assert.deepEqual(activeLaserCells(next), []);
});

test("renderer draws lasers and exit outside pickup iteration and locks difficulty", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url),
    "utf8",
  );
  const pickupLoop = source.indexOf("run.pickups.forEach");
  const pickupLoopEnd = source.indexOf("});", pickupLoop);
  const lasers = source.indexOf("const lasers = activeLaserCells");
  assert.ok(lasers < pickupLoop || lasers > pickupLoopEnd);
  assert.match(source, /disabled=\{run\.phase !== "ready"/);
});
