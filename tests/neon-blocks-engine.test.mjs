import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createGame,
  getGhostY,
  hardDrop,
  holdPiece,
  movePiece,
  rotatePiece,
  startGame,
  tickGame,
} from "../app/playground/neon-blocks/neon-blocks-engine.ts";

test("creates a deterministic 10x20 ready game with a seven-piece bag", () => {
  const game = createGame(42);
  assert.equal(game.board.length, BOARD_HEIGHT);
  assert.equal(game.board[0].length, BOARD_WIDTH);
  assert.equal(game.phase, "ready");
  assert.equal(new Set([game.active.type, ...game.queue.slice(0, 6)]).size, 7);
  assert.deepEqual(createGame(42), game);
});

test("starts, moves, rotates with kicks, and never crosses the walls", () => {
  let game = startGame(createGame(7));
  game = { ...game, active: { type: "T", rotation: 0, x: 0, y: 0 } };
  assert.equal(movePiece(game, -1).active.x, 0);
  const rotated = rotatePiece(game, 1);
  assert.equal(rotated.active.rotation, 1);
  assert.ok(rotated.active.x >= 0);
});

test("ghost and hard drop land the piece, award distance, and spawn the next piece", () => {
  const game = startGame(createGame(12));
  const ghostY = getGhostY(game);
  const dropped = hardDrop(game);
  assert.ok(ghostY > game.active.y);
  assert.notEqual(dropped.active.type, game.active.type);
  assert.equal(dropped.score, (ghostY - game.active.y) * 2);
  assert.ok(dropped.board.flat().some(Boolean));
});

test("hold swaps once per falling piece and resets after lock", () => {
  const game = startGame(createGame(22));
  const firstType = game.active.type;
  const held = holdPiece(game);
  assert.equal(held.hold, firstType);
  assert.equal(held.canHold, false);
  assert.equal(holdPiece(held), held);
  const locked = hardDrop(held);
  assert.equal(locked.canHold, true);
  const swapped = holdPiece(locked);
  assert.equal(swapped.active.type, firstType);
});

test("clears a line, scores, grows combo, and advances level", () => {
  const base = startGame(createGame(31));
  const board = base.board.map((row) => [...row]);
  board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1);
  board[BOARD_HEIGHT - 1][4] = 0;
  board[BOARD_HEIGHT - 1][5] = 0;
  const setup = {
    ...base,
    board,
    active: { type: "O", rotation: 0, x: 3, y: BOARD_HEIGHT - 3 },
    lines: 9,
  };
  const result = hardDrop(setup);
  assert.equal(result.lines, 10);
  assert.equal(result.level, 2);
  assert.equal(result.combo, 1);
  assert.ok(result.score >= 100);
});

test("gravity locks pieces and detects game over when the spawn is blocked", () => {
  let game = startGame(createGame(55));
  game = tickGame(game, 60_000);
  assert.ok(game.board.flat().some(Boolean));
  const blocked = {
    ...startGame(createGame(56)),
    board: Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(1)),
  };
  assert.equal(hardDrop(blocked).phase, "gameover");
});

