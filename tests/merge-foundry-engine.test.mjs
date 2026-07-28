import assert from "node:assert/strict";
import test from "node:test";
import { moveBoard } from "../app/playground/merge-foundry/merge-foundry-engine.ts";

const board = (...cells) => cells;

test("slides and merges left without double-merging a result", () => {
  const input = board(
    1, 1, 1, 1, null,
    ...Array(20).fill(null),
  );
  const result = moveBoard(input, "left");

  assert.equal(result.changed, true);
  assert.deepEqual(result.board.slice(0, 5), [2, 2, null, null, null]);
  assert.deepEqual(result.merges.map((item) => item.tier), [2, 2]);
});

test("moves the same line consistently in all four directions", () => {
  const horizontal = board(
    1, null, 1, null, null,
    ...Array(20).fill(null),
  );
  assert.deepEqual(
    moveBoard(horizontal, "right").board.slice(0, 5),
    [null, null, null, null, 2],
  );

  const vertical = Array(25).fill(null);
  vertical[0] = 1;
  vertical[10] = 1;
  assert.equal(moveBoard(vertical, "down").board[20], 2);
  assert.equal(moveBoard(vertical, "up").board[0], 2);
});
