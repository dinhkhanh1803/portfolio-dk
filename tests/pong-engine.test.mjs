import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  BALL_RADIUS,
  FIXED_STEP_MS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceFixed,
  aiConfig,
  createMatch,
  startRally,
  step,
  updateAiTarget,
} from "../app/playground/pong/pong-engine.ts";

const NO_INPUT = {
  leftUp: false,
  leftDown: false,
  rightUp: false,
  rightDown: false,
};

const settings = {
  mode: "local",
  targetScore: 7,
  difficulty: "normal",
};

test("creates a centered ready match with selected settings", () => {
  const state = createMatch({ mode: "ai", targetScore: 7, difficulty: "normal" });
  assert.equal(state.phase, "ready");
  assert.equal(state.targetScore, 7);
  assert.equal(state.leftScore, 0);
  assert.equal(state.rightScore, 0);
  assert.equal(state.ball.x, WORLD_WIDTH / 2);
  assert.equal(state.ball.y, WORLD_HEIGHT / 2);
});

test("starts a rally and clamps both paddles inside the arena", () => {
  let state = startRally(createMatch(settings));
  state = { ...state, ball: { ...state.ball, vx: 0, vy: 0 } };
  for (let index = 0; index < 200; index += 1) {
    state = step(state, FIXED_STEP_MS, {
      leftUp: true,
      leftDown: false,
      rightUp: false,
      rightDown: true,
    });
  }
  assert.equal(state.phase, "playing");
  assert.equal(state.leftPaddle.y, 0);
  assert.equal(state.rightPaddle.y + state.rightPaddle.height, WORLD_HEIGHT);
});

test("fixed-step simulation is stable across render cadences", () => {
  const initial = startRally(createMatch(settings));
  const single = advanceFixed(initial, 0, 480, NO_INPUT);
  let chunked = { state: initial, accumulatorMs: 0 };
  for (let index = 0; index < 8; index += 1) {
    chunked = advanceFixed(chunked.state, chunked.accumulatorMs, 60, NO_INPUT);
  }
  assert.deepEqual(chunked, single);
  assert.ok(single.accumulatorMs < FIXED_STEP_MS);
});

test("wall collisions reflect the ball without leaving the arena", () => {
  const initial = startRally(createMatch(settings));
  const next = step({
    ...initial,
    ball: { ...initial.ball, y: BALL_RADIUS + 1, vx: 220, vy: -600 },
  }, 16, NO_INPUT);
  assert.ok(next.ball.vy > 0);
  assert.ok(next.ball.y >= BALL_RADIUS);
});

test("paddle contact changes rebound angle and caps acceleration", () => {
  const initial = startRally(createMatch(settings));
  const next = step({
    ...initial,
    leftPaddle: { ...initial.leftPaddle, y: 260 },
    ball: { x: 88, y: 274, vx: -900, vy: 0, radius: BALL_RADIUS, speed: 900 },
  }, 24, NO_INPUT);
  assert.ok(next.ball.vx > 0);
  assert.ok(next.ball.vy < 0);
  assert.ok(next.ball.speed > 900);
  assert.ok(next.ball.speed <= 980);
  assert.ok(next.ball.x >= next.leftPaddle.x + next.leftPaddle.width + BALL_RADIUS);
});

test("scores, recenters, and serves toward the player who conceded", () => {
  const initial = startRally(createMatch({ ...settings, targetScore: 5 }));
  const scored = step({
    ...initial,
    ball: { ...initial.ball, x: WORLD_WIDTH + BALL_RADIUS + 1, vx: 500 },
  }, 16, NO_INPUT);
  assert.equal(scored.leftScore, 1);
  assert.equal(scored.phase, "ready");
  assert.equal(scored.serveDirection, 1);
  assert.equal(scored.ball.x, WORLD_WIDTH / 2);
});

for (const targetScore of [5, 7, 11]) {
  test(`ends the match at ${targetScore} points`, () => {
    const initial = startRally(createMatch({ ...settings, targetScore }));
    const next = step({
      ...initial,
      leftScore: targetScore - 1,
      ball: { ...initial.ball, x: WORLD_WIDTH + BALL_RADIUS + 1, vx: 500 },
    }, 16, NO_INPUT);
    assert.equal(next.phase, "gameover");
    assert.equal(next.winner, "left");
    assert.equal(next.leftScore, targetScore);
  });
}

test("AI difficulties expose distinct fair limits", () => {
  const easy = aiConfig("easy");
  const normal = aiConfig("normal");
  const hard = aiConfig("hard");
  assert.ok(easy.maxSpeed < normal.maxSpeed);
  assert.ok(normal.maxSpeed < hard.maxSpeed);
  assert.ok(easy.reactionMs > normal.reactionMs);
  assert.ok(normal.reactionMs > hard.reactionMs);
  assert.ok(easy.error > normal.error);
  assert.ok(normal.error > hard.error);
  assert.ok(hard.error > 0);
});

test("AI prediction stays bounded and paddle never teleports", () => {
  const initial = startRally(createMatch({ mode: "ai", targetScore: 7, difficulty: "hard" }));
  const targeted = updateAiTarget({
    ...initial,
    ball: { ...initial.ball, x: 700, y: 50, vx: 500, vy: -120 },
  }, 0.5);
  assert.ok(targeted.aiTargetY >= 0);
  assert.ok(targeted.aiTargetY <= WORLD_HEIGHT);
  const next = step(targeted, 16, NO_INPUT);
  assert.ok(
    Math.abs(next.rightPaddle.y - targeted.rightPaddle.y)
      <= aiConfig("hard").maxSpeed * 0.016 + 0.001,
  );
});

test("pause and resume preserve the rally state", async () => {
  const { pauseMatch, resumeMatch } = await import("../app/playground/pong/pong-engine.ts");
  const playing = startRally(createMatch(settings));
  const paused = pauseMatch(playing);
  const stepped = step(paused, 500, NO_INPUT);
  assert.deepEqual(stepped, paused);
  assert.equal(resumeMatch(paused).phase, "playing");
});

test("settings and stats parsing reject invalid storage", async () => {
  const storage = await import("../app/playground/pong/pong-storage.ts");
  assert.deepEqual(
    storage.parseSettings('{"mode":"ai","targetScore":11,"difficulty":"hard"}'),
    { mode: "ai", targetScore: 11, difficulty: "hard" },
  );
  assert.deepEqual(
    storage.parseSettings('{"mode":"broken","targetScore":99}'),
    storage.DEFAULT_SETTINGS,
  );
  assert.deepEqual(storage.parseStats('{"soloWins":2,"soloLosses":1,"leftWins":3,"rightWins":4}'), {
    soloWins: 2,
    soloLosses: 1,
    leftWins: 3,
    rightWins: 4,
  });
  assert.deepEqual(storage.parseStats('{"soloWins":-2}'), storage.DEFAULT_STATS);
});

test("Pong route wires canvas, controls, audio, persistence, and theme", () => {
  const page = readFileSync("app/playground/pong/page.tsx", "utf8");
  const game = readFileSync("app/playground/pong/pong-game.tsx", "utf8");
  const audio = readFileSync("app/playground/pong/pong-audio.ts", "utf8");
  assert.match(page, /PongGame/);
  assert.match(page, /metadata/);
  assert.match(game, /<canvas/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /visibilitychange/);
  assert.match(game, /const openSettings[\s\S]*pauseMatch/);
  assert.match(game, /new Map<number/);
  assert.match(game, /pointerSidesRef\.current\.delete/);
  assert.match(game, /modalRef/);
  assert.match(game, /aria-pressed/);
  assert.match(game, /const toggleMute[\s\S]*\.unlock/);
  assert.match(game, /advanceFixed/);
  assert.match(game, /ArrowUp/);
  assert.match(game, /target\.closest\("button, input, select, textarea, a/);
  assert.match(game, /onPointer/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /data-theme/);
  assert.match(game, /safeRead/);
  assert.match(audio, /playPaddleHit/);
  assert.match(audio, /playWallBounce/);
  assert.match(audio, /playScore/);
  assert.match(audio, /playCountdown/);
  assert.match(audio, /playVictory/);
});

test("Pong styles are responsive, themed, and motion-aware", () => {
  const css = readFileSync("app/playground/pong/pong.module.css", "utf8");
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /:global\(\[data-theme="dark"\]\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /data-reduced-motion/);
});

test("Playground promotes Pong as the fourth playable game", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  assert.match(page, /\/playground\/pong/);
  assert.match(page, /Neon Classic Pong/);
  assert.match(page, /Multiplayer/);
  assert.match(page, /visual:\s*"pong"/);
});

