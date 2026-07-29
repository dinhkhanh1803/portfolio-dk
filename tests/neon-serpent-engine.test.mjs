import assert from "node:assert/strict";
import test from "node:test";
import {
  DIFFICULTIES,
  GRID,
  SKILLS,
  STAGES,
} from "../app/playground/neon-serpent/neon-serpent-data.ts";
import {
  createSerpentRun,
  isDangerousCell,
  queueDirection,
  stepSerpent,
} from "../app/playground/neon-serpent/neon-serpent-engine.ts";

test("defines a 24x16 board, three difficulties, five skills, and eight stages", () => {
  assert.deepEqual(GRID, { columns: 24, rows: 16, width: 960, height: 640 });
  assert.deepEqual(Object.keys(DIFFICULTIES).sort(), ["easy", "hard", "normal"]);
  assert.deepEqual(Object.keys(SKILLS).sort(), ["magnet", "phase", "scoreBoost", "shield", "slowTime"]);
  assert.equal(STAGES.length, 8);
  assert.deepEqual(STAGES.filter((stage) => stage.boss).map((stage) => stage.id), [4, 8]);
});

test("moves one cell per tick and rejects a direct reverse", () => {
  const run = createSerpentRun("normal", 1, 42);
  const reversed = queueDirection(run, "left");
  assert.equal(reversed.queuedDirection, "right");
  const moved = stepSerpent(queueDirection(run, "up"), run.tickMs);
  assert.deepEqual(moved.snake[0], { x: run.snake[0].x, y: run.snake[0].y - 1 });
});

test("eating a core grows the snake and deterministic seeds reproduce state", () => {
  const first = createSerpentRun("normal", 1, 91);
  const staged = { ...first, phase: "playing", core: { x: first.snake[0].x + 1, y: first.snake[0].y } };
  const eaten = stepSerpent(staged, staged.tickMs);
  assert.equal(eaten.snake.length, staged.snake.length + 1);
  assert.equal(eaten.coresCollected, 1);
  assert.deepEqual(createSerpentRun("normal", 1, 91), first);
});

test("shield absorbs damage before lives and respawn is safe", () => {
  const run = createSerpentRun("easy", 1, 7);
  const crashed = {
    ...run,
    phase: "playing",
    snake: [{ x: 23, y: 8 }],
    direction: "right",
    queuedDirection: "right",
  };
  const shielded = stepSerpent(crashed, crashed.tickMs);
  assert.equal(shielded.shieldCharges, 0);
  assert.equal(shielded.lives, run.lives);
  assert.ok(shielded.snake.every((cell) => !isDangerousCell(shielded, cell)));
});
