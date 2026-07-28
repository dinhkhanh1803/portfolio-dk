import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createGame,
  hasMoves,
  moveBoard,
  slide,
  TARGET_VALUE,
  undo,
} from "../app/playground/merge-foundry/merge-foundry-engine.ts";
import {
  HIGH_SCORE_KEY,
  parseSavedGame,
  serializeGame,
} from "../app/playground/merge-foundry/merge-foundry-storage.ts";

const emptyBoard = () => Array(16).fill(null);

test("classic 2048 merges once per move on a 4x4 board", () => {
  const board = [2, 2, 2, 2, ...Array(12).fill(null)];
  const result = moveBoard(board, "left");
  assert.deepEqual(result.board.slice(0, 4), [4, 4, null, null]);
  assert.deepEqual(result.merges.map((merge) => merge.value), [4, 4]);
  assert.equal(result.scoreGained, 8);
});

test("moves rows and columns consistently in all directions", () => {
  const horizontal = [2, null, 2, null, ...Array(12).fill(null)];
  assert.deepEqual(moveBoard(horizontal, "right").board.slice(0, 4), [null, null, null, 4]);

  const vertical = emptyBoard();
  vertical[0] = 4;
  vertical[8] = 4;
  assert.equal(moveBoard(vertical, "down").board[12], 8);
  assert.equal(moveBoard(vertical, "up").board[0], 8);
});

test("new games start with two deterministic 2 or 4 tiles", () => {
  const game = createGame(42);
  const replay = createGame(42);
  const tiles = game.board.filter((cell) => cell !== null);
  assert.equal(game.board.length, 16);
  assert.equal(tiles.length, 2);
  assert.ok(tiles.every((value) => value === 2 || value === 4));
  assert.deepEqual(game, replay);
  assert.equal(TARGET_VALUE, 2048);
});

test("valid moves spawn one tile and invalid moves do nothing", () => {
  const board = emptyBoard();
  board[1] = 2;
  const initial = { ...createGame(5), board };
  const moved = slide(initial, "left");
  assert.equal(moved.changed, true);
  assert.equal(moved.state.board.filter(Boolean).length, 2);

  const checker = Array.from({ length: 16 }, (_, index) =>
    ((Math.floor(index / 4) + (index % 4)) % 2 === 0 ? 2 : 4),
  );
  const blocked = { ...initial, board: checker };
  const invalid = slide(blocked, "left");
  assert.equal(invalid.changed, false);
  assert.equal(invalid.state, blocked);
  assert.equal(hasMoves(checker), false);
});

test("merging 1024 tiles creates 2048 and wins", () => {
  const board = emptyBoard();
  board[0] = 1024;
  board[1] = 1024;
  const initial = { ...createGame(7), board, score: 100 };
  const result = slide(initial, "left");
  assert.equal(result.state.board[0], 2048);
  assert.equal(result.state.score, 2148);
  assert.equal(result.state.status, "won");
});

test("undo restores the exact previous move and is consumed", () => {
  const board = emptyBoard();
  board[1] = 2;
  const initial = { ...createGame(9), board };
  const moved = slide(initial, "left").state;
  const restored = undo(moved);
  assert.deepEqual(restored.board, initial.board);
  assert.equal(restored.seed, initial.seed);
  assert.equal(restored.score, initial.score);
  assert.equal(restored.undoAvailable, false);
  assert.equal(restored.undoSnapshot, null);
});

test("saved games are versioned, cloned, and reject impossible state", () => {
  const game = createGame(8);
  assert.equal(HIGH_SCORE_KEY, "merge-foundry:2048:high-score");
  const parsed = parseSavedGame(serializeGame(game));
  assert.deepEqual(parsed, game);
  assert.notEqual(parsed, game);
  assert.equal(parseSavedGame("{bad"), null);
  assert.equal(parseSavedGame(JSON.stringify({ ...game, version: 1 })), null);
  assert.equal(parseSavedGame(JSON.stringify({ ...game, board: Array(16).fill(3) })), null);
  assert.equal(parseSavedGame(JSON.stringify({ ...game, board: Array(16).fill("2") })), null);
  assert.equal(parseSavedGame(JSON.stringify({ ...game, status: "won" })), null);
});

test("audio supports 2048 gameplay cues", () => {
  const source = readFileSync("app/playground/merge-foundry/merge-foundry-audio.ts", "utf8");
  assert.match(source, /class MergeFoundryAudio/);
  assert.match(source, /playSlide\(/);
  assert.match(source, /playMerge\(value: TileValue\)/);
  assert.match(source, /playInvalid\(/);
  assert.match(source, /playOutcome\(won: boolean\)/);
  assert.doesNotMatch(source, /playDelivery|combo/);
});

test("route exposes a classic 2048 board without crafting orders", () => {
  const game = readFileSync("app/playground/merge-foundry/merge-foundry-game.tsx", "utf8");
  assert.match(game, /role="grid"/);
  assert.match(game, /data-value=\{value\}/);
  assert.match(game, /TARGET_VALUE/);
  assert.match(game, /onPointerDown/);
  assert.match(game, /aria-live="polite"/);
  assert.doesNotMatch(game, /deliverOrder|Crafting orders|Đơn chế tạo/);
});

test("styles use a readable responsive 4x4 2048 board", () => {
  const css = readFileSync("app/playground/merge-foundry/merge-foundry.module.css", "utf8");
  assert.match(css, /grid-template-columns:\s*repeat\(4/);
  assert.match(css, /\.tile\[data-value="2048"\]/);
  assert.match(css, /\.tile span\s*\{[\s\S]*?font-size:\s*clamp\(24px/);
  assert.match(css, /data-reduced-motion="true"/);
  assert.match(css, /@media \(max-width: 760px\)/);
});

test("Games hub still links to Merge Foundry", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  assert.match(page, /\/playground\/merge-foundry/);
  assert.match(page, /Merge Foundry/);
  assert.doesNotMatch(page, /5–10 min shifts/);
});
