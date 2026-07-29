import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  BALL_RADIUS,
  FIXED_STEP_MS,
  MAX_BALLS,
  MAX_BALL_SPEED,
  MIN_BALL_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceFixed,
  applyPowerUp,
  createRun,
  damageBrick,
  evaluateProgress,
  launchBall,
  pauseRun,
  powerUpForBrick,
  resumeRun,
  rewardBrickDamage,
  startNextLevel,
  step,
} from "../app/playground/neon-breaker/neon-breaker-engine.ts";
import { LEVELS } from "../app/playground/neon-breaker/neon-breaker-levels.ts";

const NO_INPUT = { left: false, right: false, pointerX: null };

const destroyAll = (state) => state.bricks.map((brick) =>
  brick.kind === "indestructible"
    ? brick
    : { ...brick, destroyed: true, hitsRemaining: 0 });

test("defines five valid handcrafted levels", () => {
  assert.equal(LEVELS.length, 5);
  for (const level of LEVELS) {
    assert.ok(level.bricks.length >= 20);
    assert.ok(level.bricks.some((brick) => brick.kind !== "indestructible"));
    assert.equal(new Set(level.bricks.map((brick) => brick.id)).size, level.bricks.length);
  }
});

test("creates a centered ready three-life run", () => {
  const state = createRun();
  assert.equal(state.phase, "ready");
  assert.equal(state.level, 1);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
  assert.equal(state.combo, 1);
  assert.equal(state.balls.length, 1);
  assert.equal(state.balls[0].attached, true);
  assert.equal(state.paddle.x + state.paddle.width / 2, WORLD_WIDTH / 2);
  assert.ok(state.paddle.y < WORLD_HEIGHT);
});

test("validates an optional starting level", () => {
  assert.equal(createRun(4).level, 4);
  assert.equal(createRun(99).level, 1);
});

test("launches the attached ball and clamps paddle movement", () => {
  const launched = launchBall(createRun());
  assert.equal(launched.phase, "playing");
  assert.equal(launched.balls[0].attached, false);
  assert.ok(launched.balls[0].vy < 0);
  const stationary = {
    ...launched,
    balls: launched.balls.map((ball) => ({ ...ball, vx: 0, vy: 0 })),
  };
  let moved = stationary;
  for (let index = 0; index < 200; index += 1) {
    moved = step(moved, FIXED_STEP_MS, { left: true, right: false, pointerX: null });
  }
  assert.equal(moved.paddle.x, 0);
});

test("pointer input targets the paddle center without leaving the arena", () => {
  const playing = launchBall(createRun());
  const left = step(playing, 16, { ...NO_INPUT, pointerX: -200 });
  const right = step(left, 16, { ...NO_INPUT, pointerX: WORLD_WIDTH + 200 });
  assert.equal(left.paddle.x, 0);
  assert.equal(right.paddle.x + right.paddle.width, WORLD_WIDTH);
});

test("fixed timestep remains stable across render cadences", () => {
  const initial = launchBall(createRun());
  const single = advanceFixed(initial, 0, 480, NO_INPUT);
  let chunked = { state: initial, accumulatorMs: 0 };
  for (let index = 0; index < 8; index += 1) {
    chunked = advanceFixed(chunked.state, chunked.accumulatorMs, 60, NO_INPUT);
  }
  assert.deepEqual(chunked, single);
});

test("pause and resume preserve simulation state", () => {
  const playing = launchBall(createRun());
  const paused = pauseRun(playing);
  assert.deepEqual(step(paused, 500, NO_INPUT), paused);
  assert.equal(resumeRun(paused).phase, "playing");
});

test("reflects from side and top walls", () => {
  const playing = launchBall(createRun());
  const side = step({
    ...playing,
    balls: [{ ...playing.balls[0], x: BALL_RADIUS + 1, y: 700, vx: -500, vy: -200 }],
  }, 16, NO_INPUT);
  assert.ok(side.balls[0].vx > 0);
  const top = step({
    ...playing,
    balls: [{ ...playing.balls[0], x: 450, y: BALL_RADIUS + 1, vx: 100, vy: -500 }],
  }, 16, NO_INPUT);
  assert.ok(top.balls[0].vy > 0);
});

test("paddle rebound angle follows the contact position", () => {
  const playing = launchBall(createRun());
  const next = step({
    ...playing,
    balls: [{
      ...playing.balls[0],
      x: playing.paddle.x + 18,
      y: playing.paddle.y - BALL_RADIUS - 2,
      vx: 0,
      vy: 900,
      speed: 900,
    }],
  }, 16, NO_INPUT);
  assert.ok(next.balls[0].vy < 0);
  assert.ok(next.balls[0].vx < 0);
});

test("swept collision damages a crossed brick without tunneling", () => {
  const playing = launchBall(createRun());
  const target = playing.bricks.find((brick) => brick.kind === "standard");
  const next = step({
    ...playing,
    balls: [{
      ...playing.balls[0],
      x: target.x + target.width / 2,
      y: target.y + target.height + 42,
      vx: 0,
      vy: -1200,
      speed: 1200,
    }],
  }, 64, NO_INPUT);
  assert.equal(next.bricks.filter((brick) => brick.destroyed).length, 1);
  assert.ok(next.balls[0].vy > 0);
});

test("reinforced bricks need two hits and indestructible bricks survive", () => {
  const state = createRun(4);
  const reinforced = state.bricks.find((brick) => brick.kind === "reinforced");
  const indestructible = state.bricks.find((brick) => brick.kind === "indestructible");
  const firstHit = damageBrick(reinforced);
  assert.equal(firstHit.hitsRemaining, 1);
  assert.equal(damageBrick(firstHit).destroyed, true);
  assert.equal(damageBrick(indestructible).destroyed, false);
});

test("brick rewards grow combo and cap ball speed", () => {
  let state = launchBall(createRun());
  for (let index = 0; index < 12; index += 1) {
    state = rewardBrickDamage(state, "standard");
  }
  assert.ok(state.score > 1200);
  assert.equal(state.combo, 3);
  assert.ok(state.balls.every((ball) => ball.speed <= MAX_BALL_SPEED));
});

test("losing the final ball costs one life and resets combo", () => {
  const playing = launchBall(createRun());
  const next = step({
    ...playing,
    combo: 2.5,
    balls: [{ ...playing.balls[0], y: WORLD_HEIGHT + 50, vy: 600 }],
  }, 16, NO_INPUT);
  assert.equal(next.lives, 2);
  assert.equal(next.combo, 1);
  assert.equal(next.phase, "ready");
  assert.equal(next.balls.length, 1);
  assert.equal(next.balls[0].attached, true);
});

test("losing a non-final multiball does not cost a life", () => {
  const multi = applyPowerUp(launchBall(createRun()), "multiball");
  const next = step({
    ...multi,
    balls: multi.balls.map((ball, index) =>
      index === 0 ? { ...ball, y: WORLD_HEIGHT + 50, vy: 600 } : ball),
  }, 16, NO_INPUT);
  assert.equal(next.lives, 3);
  assert.equal(next.balls.length, 2);
  assert.equal(next.phase, "playing");
});

test("zero lives ends the run", () => {
  const playing = launchBall({ ...createRun(), lives: 1 });
  const next = step({
    ...playing,
    balls: [{ ...playing.balls[0], y: WORLD_HEIGHT + 50, vy: 600 }],
  }, 16, NO_INPUT);
  assert.equal(next.phase, "gameover");
});

test("clears levels one through five and ends in victory", () => {
  let state = createRun();
  for (let level = 1; level <= 5; level += 1) {
    state = evaluateProgress({ ...state, phase: "playing", bricks: destroyAll(state) });
    if (level < 5) {
      assert.equal(state.phase, "level-clear");
      const previousScore = state.score;
      state = startNextLevel(state);
      assert.equal(state.level, level + 1);
      assert.ok(previousScore >= 1500);
    }
  }
  assert.equal(state.phase, "victory");
});

test("brick drops are deterministic and bounded", () => {
  const outcomes = LEVELS[0].bricks.map((brick) =>
    powerUpForBrick(brick.id, LEVELS[0].seed));
  assert.deepEqual(
    outcomes,
    LEVELS[0].bricks.map((brick) => powerUpForBrick(brick.id, LEVELS[0].seed)),
  );
  assert.ok(outcomes.some((value) => value === null));
  assert.ok(outcomes.every((value) =>
    value === null || ["wide", "multiball", "slow"].includes(value)));
});

test("wide, slow, and multiball power-ups remain bounded", () => {
  const base = launchBall(createRun());
  const wide = applyPowerUp(base, "wide");
  assert.ok(wide.paddle.width > base.paddle.width);
  assert.equal(wide.effects.wideRemainingMs, 10_000);
  const slow = applyPowerUp(base, "slow");
  assert.ok(slow.balls.every((ball) => ball.speed >= MIN_BALL_SPEED));
  assert.equal(slow.effects.slowRemainingMs, 7_000);
  const multi = applyPowerUp(base, "multiball");
  assert.equal(multi.balls.length, 3);
  assert.ok(applyPowerUp(multi, "multiball").balls.length <= MAX_BALLS);
});

test("slow refreshes without compounding and restores speed after seven seconds", () => {
  const initial = createRun();
  const base = {
    ...initial,
    phase: "playing",
    balls: [{
      ...initial.balls[0],
      baseSpeed: 800,
      speed: 800,
      vx: 0,
      vy: 0,
      attached: true,
    }],
  };
  const slowed = applyPowerUp(base, "slow");
  assert.equal(slowed.balls[0].speed, 576);
  assert.equal(applyPowerUp(slowed, "slow").balls[0].speed, 576);

  let expired = slowed;
  for (let index = 0; index < 438; index += 1) {
    expired = step(expired, FIXED_STEP_MS, NO_INPUT);
  }
  assert.equal(expired.effects.slowRemainingMs, 0);
  assert.equal(expired.balls[0].speed, 800);
});
test("storage parsing accepts valid records and rejects invalid values", async () => {
  const storage = await import("../app/playground/neon-breaker/neon-breaker-storage.ts");
  assert.deepEqual(storage.parseProgress('{"bestScore":12000,"unlockedLevel":4}'), {
    bestScore: 12000,
    unlockedLevel: 4,
  });
  assert.deepEqual(
    storage.parseProgress('{"bestScore":-1,"unlockedLevel":99}'),
    storage.DEFAULT_PROGRESS,
  );
});

test("route wires canvas, input, audio, theme, and accessibility", () => {
  const page = readFileSync("app/playground/neon-breaker/page.tsx", "utf8");
  const game = readFileSync("app/playground/neon-breaker/neon-breaker-game.tsx", "utf8");
  const audio = readFileSync("app/playground/neon-breaker/neon-breaker-audio.ts", "utf8");
  assert.match(page, /metadata/);
  assert.match(page, /NeonBreakerGame/);
  assert.match(game, /<canvas/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /advanceFixed/);
  assert.match(game, /visibilitychange/);
  assert.match(game, /ArrowLeft/);
  assert.match(game, /target\.closest\("button, input, select, textarea, a/);
  assert.match(game, /onPointer/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /aria-modal="true"/);
  assert.match(game, /data-theme/);
  for (const cue of [
    "playPaddle",
    "playWall",
    "playBrick",
    "playPowerUp",
    "playLifeLost",
    "playLevelClear",
    "playGameOver",
    "playVictory",
  ]) assert.match(audio, new RegExp(cue));
});

test("styles are responsive, themed, and motion-aware", () => {
  const css = readFileSync("app/playground/neon-breaker/neon-breaker.module.css", "utf8");
  assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(css, /:global\(\[data-theme="dark"\]\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /data-reduced-motion/);
});

test("Playground promotes Neon Breaker as the fifth game", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  assert.match(page, /\/playground\/neon-breaker/);
  assert.match(page, /Neon Breaker/);
  assert.match(page, /visual:\s*"breaker"/);
  assert.match(page, /Casual/);
});
