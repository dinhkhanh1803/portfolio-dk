import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_SIZE,
  DIFFICULTIES,
  FLEET,
  cellKey,
  parseCellKey,
} from "../app/playground/neon-fleet/neon-fleet-data.ts";

test("defines the classic 10 by 10 fleet and difficulty order", () => {
  assert.equal(BOARD_SIZE, 10);
  assert.deepEqual(FLEET.map((ship) => ship.length), [5, 4, 3, 3, 2]);
  assert.deepEqual(Object.keys(DIFFICULTIES), ["easy", "normal", "hard"]);
});

test("serializes and parses cell coordinates", () => {
  const cell = { x: 6, y: 1 };
  assert.equal(cellKey(cell), "6:1");
  assert.deepEqual(parseCellKey(cellKey(cell)), cell);
});
