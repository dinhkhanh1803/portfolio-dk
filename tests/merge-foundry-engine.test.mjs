import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canDeliver,
  createGame,
  deliverOrder,
  hasMoves,
  moveBoard,
  slide,
  undo,
} from "../app/playground/merge-foundry/merge-foundry-engine.ts";
import {
  parseSavedShift,
  serializeShift,
} from "../app/playground/merge-foundry/merge-foundry-storage.ts";

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
test("valid moves spawn deterministically and invalid moves do nothing", () => {
  const initial = {
    ...createGame(1234),
    board: [null, 1, ...Array(23).fill(null)],
  };
  const first = slide(initial, "left");
  const replay = slide(
    { ...createGame(1234), board: [null, 1, ...Array(23).fill(null)] },
    "left",
  );
  assert.deepEqual(first.state, replay.state);
  assert.equal(first.changed, true);
  assert.equal(first.spawnedIndex, replay.spawnedIndex);

  const checker = Array.from({ length: 25 }, (_, index) =>
    ((Math.floor(index / 5) + (index % 5)) % 2 === 0 ? 1 : 2),
  );
  const blocked = { ...initial, board: checker };
  const invalid = slide(blocked, "left");
  assert.equal(invalid.changed, false);
  assert.equal(invalid.state, blocked);
  assert.equal(hasMoves(checker), false);
});

test("delivery removes materials, scores, and wins the eighth order", () => {
  const initial = createGame(7);
  const order = { id: "a", tier: 4, quantity: 1 };
  const state = {
    ...initial,
    board: [4, ...Array(24).fill(null)],
    orders: [order],
    completedOrders: 7,
  };

  assert.equal(canDeliver(state, "a"), true);
  const result = deliverOrder(state, "a");
  assert.equal(result.delivered, true);
  assert.equal(result.state.board[0], null);
  assert.equal(result.state.completedOrders, 8);
  assert.equal(result.state.status, "won");
  assert.ok(result.state.score > state.score);
});

test("undo restores the exact previous state and is consumed", () => {
  const initial = {
    ...createGame(42),
    board: [null, 1, ...Array(23).fill(null)],
  };
  const moved = slide(initial, "left").state;
  const restored = undo(moved);

  assert.deepEqual(restored.board, initial.board);
  assert.equal(restored.seed, initial.seed);
  assert.equal(restored.score, initial.score);
  assert.equal(restored.undoAvailable, false);
  assert.equal(restored.undoSnapshot, null);
});

test("saved shifts are versioned, cloned, and validated", () => {
  const state = createGame(8);
  const parsed = parseSavedShift(serializeShift(state));
  assert.deepEqual(parsed, state);
  assert.notEqual(parsed, state);
  assert.equal(parseSavedShift("{bad"), null);
  assert.equal(
    parseSavedShift(JSON.stringify({ ...state, version: 99 })),
    null,
  );
});
test("merge foundry audio supports gameplay cues and cleanup", () => {
  const source = readFileSync(
    "app/playground/merge-foundry/merge-foundry-audio.ts",
    "utf8",
  );
  assert.match(source, /class MergeFoundryAudio/);
  assert.match(source, /playSlide\(/);
  assert.match(source, /playMerge\(tier: MaterialTier\)/);
  assert.match(source, /playDelivery\(combo: number\)/);
  assert.match(source, /playInvalid\(/);
  assert.match(source, /playOutcome\(won: boolean\)/);
  assert.match(source, /setMuted\(muted: boolean\)/);
  assert.match(source, /dispose\(\)/);
});
test("merge foundry route exposes board, orders, controls, and persistence", () => {
  const page = readFileSync("app/playground/merge-foundry/page.tsx", "utf8");
  const game = readFileSync(
    "app/playground/merge-foundry/merge-foundry-game.tsx",
    "utf8",
  );
  assert.match(page, /MergeFoundryGame/);
  assert.match(page, /metadata/);
  assert.match(game, /role="grid"/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /onPointerDown/);
  assert.match(game, /localStorage/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /deliverOrder/);
  assert.match(game, /undo/);
});