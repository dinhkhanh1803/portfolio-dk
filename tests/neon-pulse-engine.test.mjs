import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  gradeHit,
  resolveHit,
  stepGame,
} from "../app/playground/neon-pulse/neon-pulse-engine.ts";

test("grades wrapped angular distance consistently", () => {
  assert.equal(gradeHit(0.01, Math.PI * 2 - 0.01, 0.18), "perfect");
  assert.equal(gradeHit(0.14, 0, 0.18), "good");
  assert.equal(gradeHit(0.4, 0, 0.18), "miss");
});

test("perfect hits grow score and combo while misses cost a life", () => {
  const initial = createGame(() => 0.25);
  const perfect = resolveHit(
    { ...initial, status: "playing", pulseAngle: initial.targetAngle },
    () => 0.5,
  );
  assert.equal(perfect.feedback, "perfect");
  assert.equal(perfect.combo, 1);
  assert.ok(perfect.score >= 100);

  const missed = resolveHit(
    { ...perfect, pulseAngle: perfect.targetAngle + 1 },
    () => 0.5,
  );
  assert.equal(missed.feedback, "miss");
  assert.equal(missed.combo, 0);
  assert.equal(missed.lives, 2);
});

test("difficulty rises and stepping wraps the pulse angle", () => {
  const state = {
    ...createGame(() => 0),
    status: "playing",
    elapsedMs: 45000,
    pulseAngle: 6.2,
  };
  const stepped = stepGame(state, 500);
  assert.ok(stepped.speed > state.speed);
  assert.ok(stepped.targetWidth < state.targetWidth);
  assert.ok(stepped.pulseAngle >= 0 && stepped.pulseAngle < Math.PI * 2);
});

