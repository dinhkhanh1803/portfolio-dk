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
  assert.deepEqual(FLEET, [
    { id: "carrier", name: "Carrier", length: 5 },
    { id: "battleship", name: "Battleship", length: 4 },
    { id: "cruiser", name: "Cruiser", length: 3 },
    { id: "submarine", name: "Submarine", length: 3 },
    { id: "destroyer", name: "Destroyer", length: 2 },
  ]);
  assert.deepEqual(DIFFICULTIES, {
    easy: { label: "Easy" },
    normal: { label: "Normal" },
    hard: { label: "Hard" },
  });
});

test("serializes and parses cell coordinates", () => {
  const cell = { x: 6, y: 1 };
  assert.equal(cellKey(cell), "6:1");
  assert.deepEqual(parseCellKey(cellKey(cell)), cell);
  assert.deepEqual(parseCellKey("0:0"), { x: 0, y: 0 });
  assert.deepEqual(parseCellKey("9:9"), { x: 9, y: 9 });
});

test("rejects malformed and out-of-board cell keys", () => {
  for (const key of ["", "6", "6:", ":1", "6:1:0", "1.5:2", "1e2:1", " 1:2", "1:2 ", "Infinity:0", "NaN:0", "-1:0", "0:-1", "10:0", "0:10"]) {
    assert.equal(parseCellKey(key), null, key);
  }
});
