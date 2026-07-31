import assert from "node:assert/strict";
import test from "node:test";
import {
  createEchoGame,
  nextRound,
  playbackDelay,
  pressPad,
  startEchoGame,
  startInput,
} from "../app/playground/echo-circuit/echo-circuit-engine.ts";

test("creates a deterministic ready game", () => {
  const game = createEchoGame(42);
  assert.equal(game.phase, "ready");
  assert.equal(game.lives, 3);
  assert.deepEqual(createEchoGame(42), game);
});

test("starts with one deterministic pad and enters playback", () => {
  const game = startEchoGame(createEchoGame(7));
  assert.equal(game.phase, "playback");
  assert.equal(game.sequence.length, 1);
  assert.ok(game.sequence[0] >= 0 && game.sequence[0] <= 3);
});

test("accepts a complete correct sequence and scores a round", () => {
  const playback = { ...startEchoGame(createEchoGame(9)), sequence: [0, 2, 1] };
  let game = startInput(playback);
  game = pressPad(game, 0);
  game = pressPad(game, 2);
  game = pressPad(game, 1);
  assert.equal(game.phase, "roundClear");
  assert.equal(game.combo, 1);
  assert.ok(game.score >= 100);
});

test("wrong input costs a life and replays, then ends after three mistakes", () => {
  let game = startInput({ ...startEchoGame(createEchoGame(11)), sequence: [1] });
  game = pressPad(game, 2);
  assert.equal(game.phase, "playback");
  assert.equal(game.lives, 2);
  game = pressPad(startInput(game), 2);
  game = pressPad(startInput(game), 2);
  assert.equal(game.phase, "gameover");
  assert.equal(game.lives, 0);
});

test("next round appends one tone and increases difficulty", () => {
  const cleared = { ...startEchoGame(createEchoGame(13)), phase: "roundClear", sequence: [0, 1] };
  const next = nextRound(cleared);
  assert.equal(next.round, cleared.round + 1);
  assert.equal(next.sequence.length, 3);
  assert.equal(next.phase, "playback");
  assert.ok(playbackDelay(next.round) < playbackDelay(1));
});

test("ignores pad input outside the input phase", () => {
  const game = startEchoGame(createEchoGame(15));
  assert.equal(pressPad(game, 0), game);
});

