import assert from "node:assert/strict";
import test from "node:test";
import {
  CHALLENGE_MS,
  createPianoRun,
  hitNote,
  startPianoRun,
  tickPianoRun,
  togglePianoPause,
} from "../app/playground/neon-keys/neon-keys-engine.ts";

test("creates a deterministic ready piano challenge", () => {
  const run = createPianoRun(42);
  assert.equal(run.phase, "ready");
  assert.equal(run.lives, 5);
  assert.ok(run.remainingMs > 5_000 && run.remainingMs <= CHALLENGE_MS);
  assert.deepEqual(createPianoRun(42), run);
});

test("starts, pauses, and resumes the challenge", () => {
  let run = startPianoRun(createPianoRun(7));
  assert.equal(run.phase, "playing");
  run = togglePianoPause(run);
  assert.equal(run.phase, "paused");
  assert.equal(togglePianoPause(run).phase, "playing");
});

test("spawns deterministic falling notes over time", () => {
  const run = tickPianoRun(startPianoRun(createPianoRun(9)), 1000);
  assert.ok(run.notes.length > 0);
  assert.ok(run.notes.every((note) => note.key >= 0 && note.key < 12));
  assert.deepEqual(run, tickPianoRun(startPianoRun(createPianoRun(9)), 1000));
});

test("scores perfect and good hits and grows combo", () => {
  const base = startPianoRun(createPianoRun(11));
  const perfect = hitNote({ ...base, notes: [{ id: 1, key: 4, progress: 0.86 }] }, 4);
  assert.equal(perfect.judgement, "perfect");
  assert.equal(perfect.combo, 1);
  assert.ok(perfect.score >= 100);
  const good = hitNote({ ...perfect, notes: [{ id: 2, key: 2, progress: 0.74 }] }, 2);
  assert.equal(good.judgement, "good");
  assert.equal(good.combo, 2);
});

test("missed notes consume lives and eventually end the run", () => {
  let run = startPianoRun(createPianoRun(13));
  for (let miss = 0; miss < 5; miss += 1) {
    run = tickPianoRun({ ...run, notes: [{ id: miss + 1, key: 0, progress: 0.99 }] }, 100);
  }
  assert.equal(run.lives, 0);
  assert.equal(run.phase, "gameover");
});

test("challenge completes when sixty seconds elapse", () => {
  const run = tickPianoRun(startPianoRun(createPianoRun(15)), CHALLENGE_MS);
  assert.equal(run.remainingMs, 0);
  assert.equal(run.phase, "complete");
});

