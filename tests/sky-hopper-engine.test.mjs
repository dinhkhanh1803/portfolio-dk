import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  BIRD_X,
  FIXED_STEP_MS,
  FLOOR_Y,
  PIPE_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceFixed,
  createGame,
  flap,
  step,
} from "../app/playground/sky-hopper/sky-hopper-engine.ts";

test("first flap starts the run and applies upward velocity", () => {
  const ready = createGame(42);
  const started = flap(ready);
  assert.equal(ready.phase, "ready");
  assert.equal(started.phase, "playing");
  assert.ok(started.bird.vy < 0);
  assert.equal(started.score, 0);
});

test("physics applies gravity and advances the bird", () => {
  const started = flap(createGame(42));
  const next = step(started, 100);
  assert.ok(next.bird.y < started.bird.y);
  assert.ok(next.bird.vy > started.bird.vy);
  const later = step(next, 500);
  assert.ok(later.bird.vy > 0);
});

test("fixed timestep produces the same state across different frame cadences", () => {
  const initial = flap(createGame(17));
  const oneFrame = advanceFixed(initial, 0, 500);
  let manyFrames = { state: initial, accumulatorMs: 0 };
  for (let index = 0; index < 10; index += 1) {
    manyFrames = advanceFixed(manyFrames.state, manyFrames.accumulatorMs, 50);
  }
  assert.deepEqual(manyFrames, oneFrame);
  assert.ok(oneFrame.accumulatorMs < FIXED_STEP_MS);
});

test("pipe spawning preserves timer overshoot", () => {
  const initial = {
    ...flap(createGame(18)),
    bird: { x: BIRD_X, y: 410, vy: 0, rotation: 0 },
    spawnTimer: 0.01,
  };
  const next = step(initial, 50);
  assert.equal(next.pipes.length, 1);
  assert.ok(next.spawnTimer > 1.4);
  assert.ok(next.spawnTimer < 1.5);
});

test("pipes spawn deterministically with reachable gaps", () => {
  const first = step({ ...flap(createGame(9)), spawnTimer: 0 }, 16);
  const replay = step({ ...flap(createGame(9)), spawnTimer: 0 }, 16);
  assert.deepEqual(first.pipes, replay.pipes);
  assert.equal(first.pipes.length, 1);
  assert.equal(first.pipes[0].x, WORLD_WIDTH);
  assert.ok(first.pipes[0].gapY > 170);
  assert.ok(first.pipes[0].gapY < FLOOR_Y - 170);
});

test("passing a pipe awards one point exactly once", () => {
  const game = {
    ...flap(createGame(3)),
    bird: { x: BIRD_X, y: 420, vy: 0, rotation: 0 },
    pipes: [{ id: 1, x: BIRD_X - PIPE_WIDTH - 1, gapY: 420, gapSize: 220, passed: false }],
    spawnTimer: 10,
  };
  const scored = step(game, 16);
  assert.equal(scored.score, 1);
  assert.equal(scored.pipes[0].passed, true);
  assert.equal(step(scored, 16).score, 1);
});

test("pipe, ceiling, and floor collisions end the run", () => {
  const base = flap(createGame(4));
  const pipeHit = step({
    ...base,
    bird: { x: BIRD_X, y: 100, vy: 0, rotation: 0 },
    pipes: [{ id: 1, x: BIRD_X - 10, gapY: 520, gapSize: 180, passed: false }],
    spawnTimer: 10,
  }, 16);
  assert.equal(pipeHit.phase, "gameover");

  const floorHit = step({
    ...base,
    bird: { x: BIRD_X, y: FLOOR_Y - 5, vy: 300, rotation: 0 },
    spawnTimer: 10,
  }, 50);
  assert.equal(floorHit.phase, "gameover");

  const ceilingHit = step({
    ...base,
    bird: { x: BIRD_X, y: 2, vy: -200, rotation: 0 },
    spawnTimer: 10,
  }, 16);
  assert.equal(ceilingHit.phase, "gameover");
});

test("difficulty rises gradually without exceeding the cap", () => {
  const base = flap(createGame(5));
  const easy = step(base, 16);
  const hard = step({ ...base, score: 30, elapsed: 90 }, 16);
  assert.ok(hard.speed > easy.speed);
  assert.ok(hard.speed <= 330);
});

test("world constants define a portrait browser game", () => {
  assert.equal(WORLD_WIDTH, 720);
  assert.equal(WORLD_HEIGHT, 900);
  assert.ok(FLOOR_Y < WORLD_HEIGHT);
});

test("Sky Hopper route wires canvas, controls, sound, persistence, and theme", () => {
  const page = readFileSync("app/playground/sky-hopper/page.tsx", "utf8");
  const game = readFileSync("app/playground/sky-hopper/sky-hopper-game.tsx", "utf8");
  assert.match(page, /SkyHopperGame/);
  assert.match(page, /metadata/);
  assert.match(game, /<canvas/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /Space|pointer/);
  assert.match(game, /localStorage/);
  assert.match(game, /SkyHopperAudio/);
  assert.match(game, /data-theme/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /const overlayPaused = paused && view\.phase === "playing"/);
  assert.match(game, /disabled=\{view\.phase !== "playing"\}/);
  assert.match(game, /target\.closest\("button, input, select, textarea, a/);
  const action = game.slice(game.indexOf("const takeAction"), game.indexOf("useEffect", game.indexOf("const takeAction")));
  assert.match(action, /stateRef\.current = next[\s\S]*audio\?\.unlock\(\)/);
  assert.doesNotMatch(action, /await audio/);
  assert.match(game, /advanceFixed/);
  assert.doesNotMatch(action, /const next = flap\(current\);\s*accumulatorRef\.current = 0/);
  assert.match(action, /current\.phase === "gameover"[\s\S]*accumulatorRef\.current = 0/);
  assert.doesNotMatch(game, /Math\.min\(40, time - lastTimeRef\.current\)/);
});

test("Sky Hopper styles are responsive, themed, and motion-aware", () => {
  const css = readFileSync("app/playground/sky-hopper/sky-hopper.module.css", "utf8");
  assert.match(css, /:global\(\[data-theme="dark"\]\)/);
  assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("Playground hub links and filters Sky Hopper", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  assert.match(page, /\/playground\/sky-hopper/);
  assert.match(page, /Sky Hopper/);
  assert.match(page, /Arcade/);
  assert.match(page, /Endless/);
});
