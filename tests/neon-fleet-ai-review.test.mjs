import assert from "node:assert/strict";
import test from "node:test";
import { BOARD_SIZE, cellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";
import { chooseAiShot } from "../app/playground/neon-fleet/neon-fleet-ai.ts";

const knowledge = (shots = {}, remainingLengths = [5, 4, 3, 3, 2]) => ({ shots, remainingLengths });

const scoresFor = (shots, lengths) => {
  const scores = new Map();
  const blocked = (cell) => ["miss", "sunk"].includes(shots[cellKey(cell)]);
  const addPlacement = (cells) => {
    if (cells.some(blocked)) return;
    for (const cell of cells) {
      const key = cellKey(cell);
      if (!Object.hasOwn(shots, key)) scores.set(key, (scores.get(key) ?? 0) + 1);
    }
  };

  for (const length of lengths) {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x <= BOARD_SIZE - length; x += 1) {
        addPlacement(Array.from({ length }, (_, index) => ({ x: x + index, y })));
      }
    }
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      for (let y = 0; y <= BOARD_SIZE - length; y += 1) {
        addPlacement(Array.from({ length }, (_, index) => ({ x, y: y + index })));
      }
    }
  }
  return scores;
};

test("targets extensions across perpendicular touching ships and independent hits", () => {
  const state = knowledge({ "0:0": "hit", "1:0": "hit", "0:1": "hit", "9:9": "hit" });
  const targets = new Set(["2:0", "0:2", "8:9", "9:8"]);
  const touchingTargets = new Set(["2:0", "0:2"]);
  const independentTargets = new Set(["8:9", "9:8"]);
  const seeds = Array.from({ length: 40 }, (_, index) => Math.imul(index, 0x9e3779b1) >>> 0);

  for (const difficulty of ["normal", "hard"]) {
    const choices = seeds.map((seed) => chooseAiShot(difficulty, state, seed));
    for (const result of choices) {
      assert.ok(result.cell);
      assert.ok(targets.has(cellKey(result.cell)), `${difficulty} selected ${cellKey(result.cell)}`);
    }
    const selected = new Set(choices.map(({ cell }) => cellKey(cell)));
    assert.ok([...selected].some((key) => touchingTargets.has(key)), `${difficulty} missed touching cluster`);
    assert.ok([...selected].some((key) => independentTargets.has(key)), `${difficulty} missed independent cluster`);
  }
});

test("normalizes negative and overflow seeds consistently", () => {
  const state = knowledge({ "5:5": "hit" });
  for (const difficulty of ["easy", "normal", "hard"]) {
    assert.deepEqual(chooseAiShot(difficulty, state, -1), chooseAiShot(difficulty, state, 0xffffffff));
    assert.deepEqual(chooseAiShot(difficulty, state, 4294967296 + 2026), chooseAiShot(difficulty, state, 2026));
  }
});

test("easy reaches a wide spread of the full legal pool for diverse seeds", () => {
  const cells = new Set(
    Array.from({ length: 100 }, (_, index) => Math.imul(index, 0x9e3779b1) >>> 0)
      .map((seed) => chooseAiShot("easy", knowledge(), seed).cell)
      .map(cellKey),
  );

  assert.ok(cells.size >= 60, `expected broad legal-pool coverage, got ${cells.size}`);
});

test("hard breaks maximum-score ties deterministically across diverse seeds", () => {
  const state = knowledge({}, [2]);
  const scores = scoresFor(state.shots, state.remainingLengths);
  const maximum = Math.max(...scores.values());
  const expected = new Set([...scores].filter(([, score]) => score === maximum).map(([key]) => key));
  const seeds = [0, 1, 0x12345678, 0x9e3779b9, 0xffffffff, 0x7fffffff, 0x40000000, 0xdeadbeef];
  const choices = seeds.map((seed) => chooseAiShot("hard", state, seed));

  for (const [index, seed] of seeds.entries()) {
    assert.deepEqual(choices[index], chooseAiShot("hard", state, seed));
    assert.ok(choices[index].cell && expected.has(cellKey(choices[index].cell)));
  }
  assert.ok(new Set(choices.map(({ cell }) => cellKey(cell))).size >= 5);
});

test("hard falls back to a legal cell when no ship lengths remain", () => {
  const state = knowledge({ "0:0": "miss" }, []);
  const result = chooseAiShot("hard", state, 77);

  assert.ok(result.cell);
  assert.notDeepEqual(result.cell, { x: 0, y: 0 });
});
