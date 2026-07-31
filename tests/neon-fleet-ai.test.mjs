import assert from "node:assert/strict";
import test from "node:test";
import { BOARD_SIZE, cellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";
import { chooseAiShot } from "../app/playground/neon-fleet/neon-fleet-ai.ts";

const knowledge = (shots = {}, remainingLengths = [5, 4, 3, 3, 2]) => ({ shots, remainingLengths });

const isOrthogonalNeighbor = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

const scoresFor = (shots, lengths) => {
  const scores = new Map();
  const blocked = (cell) => ["miss", "sunk"].includes(shots[cellKey(cell)]);
  const addPlacement = (cells) => {
    if (cells.some(blocked)) return;
    for (const cell of cells) {
      if (!Object.hasOwn(shots, cellKey(cell))) {
        const key = cellKey(cell);
        scores.set(key, (scores.get(key) ?? 0) + 1);
      }
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

test("returns identical choices for repeated input and seed at every difficulty", () => {
  const state = knowledge({ "4:4": "hit", "3:4": "miss" });
  for (const difficulty of ["easy", "normal", "hard"]) {
    assert.deepEqual(chooseAiShot(difficulty, state, 12345), chooseAiShot(difficulty, state, 12345));
  }
});

test("chooses only untried, integer in-bounds cells across useful seeds", () => {
  const state = knowledge({ "0:0": "miss", "1:0": "hit", "5:5": "sunk" });
  for (const difficulty of ["easy", "normal", "hard"]) {
    for (let seed = 1; seed <= 100; seed += 1) {
      const result = chooseAiShot(difficulty, state, seed);
      assert.ok(result.cell, `${difficulty} seed ${seed}`);
      assert.ok(Number.isInteger(result.cell.x) && Number.isInteger(result.cell.y), `${difficulty} seed ${seed}`);
      assert.ok(result.cell.x >= 0 && result.cell.x < BOARD_SIZE && result.cell.y >= 0 && result.cell.y < BOARD_SIZE, `${difficulty} seed ${seed}`);
      assert.equal(Object.hasOwn(state.shots, cellKey(result.cell)), false, `${difficulty} seed ${seed}`);
    }
  }
});

test("returns null and preserves the seed when every board cell was tried", () => {
  const shots = Object.fromEntries(Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => [
    `${index % BOARD_SIZE}:${Math.floor(index / BOARD_SIZE)}`,
    "miss",
  ]));
  for (const difficulty of ["easy", "normal", "hard"]) {
    assert.deepEqual(chooseAiShot(difficulty, knowledge(shots), 77), { cell: null, seed: 77 });
  }
});

test("easy samples all legal cells instead of targeting unresolved hits", () => {
  const state = knowledge({ "5:5": "hit" });
  const result = chooseAiShot("easy", state, 1);
  assert.ok(result.cell);
  assert.equal(isOrthogonalNeighbor(result.cell, { x: 5, y: 5 }), false);
});

test("normal targets unresolved hit neighbors, extends aligned hits, and ignores sunk cells", () => {
  const single = chooseAiShot("normal", knowledge({ "4:4": "hit" }), 9);
  assert.ok(single.cell);
  assert.ok(isOrthogonalNeighbor(single.cell, { x: 4, y: 4 }));

  const aligned = chooseAiShot("normal", knowledge({ "3:5": "hit", "4:5": "hit" }), 9);
  assert.ok(aligned.cell);
  assert.deepEqual(aligned.cell.y, 5);
  assert.ok([2, 5].includes(aligned.cell.x));

  const sunkOnly = knowledge({ "4:4": "sunk", "5:4": "sunk" });
  const result = chooseAiShot("normal", sunkOnly, 1);
  assert.ok(result.cell);
  assert.equal(isOrthogonalNeighbor(result.cell, { x: 4, y: 4 }) || isOrthogonalNeighbor(result.cell, { x: 5, y: 4 }), false);
});

test("hard extends aligned hit runs when a miss blocks the other side", () => {
  const result = chooseAiShot("hard", knowledge({ "3:5": "hit", "4:5": "hit", "2:5": "miss" }), 9);
  assert.deepEqual(result.cell, { x: 5, y: 5 });
});

test("hard hunt selects a legal highest-probability cell and treats misses and sunk cells as blockers", () => {
  const state = knowledge({ "4:4": "miss", "5:4": "sunk" }, [5, 3, 2]);
  const scores = scoresFor(state.shots, state.remainingLengths);
  const maximum = Math.max(...scores.values());
  const expected = new Set([...scores].filter(([, score]) => score === maximum).map(([key]) => key));
  const result = chooseAiShot("hard", state, 77);

  assert.ok(result.cell);
  assert.ok(expected.has(cellKey(result.cell)));
  assert.equal(Object.hasOwn(state.shots, cellKey(result.cell)), false);
});

test("does not mutate AI knowledge", () => {
  const state = knowledge({ "3:5": "hit", "4:5": "hit", "2:5": "miss" }, [4, 3, 2]);
  const snapshot = structuredClone(state);
  chooseAiShot("hard", state, 123);
  assert.deepEqual(state, snapshot);
});
