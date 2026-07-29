import assert from "node:assert/strict";
import test from "node:test";
import {
  DIFFICULTIES,
  GRID,
  SKILLS,
  STAGES,
} from "../app/playground/neon-serpent/neon-serpent-data.ts";

test("defines a 24x16 board, three difficulties, five skills, and eight stages", () => {
  assert.deepEqual(GRID, { columns: 24, rows: 16, width: 960, height: 640 });
  assert.deepEqual(Object.keys(DIFFICULTIES).sort(), ["easy", "hard", "normal"]);
  assert.deepEqual(Object.keys(SKILLS).sort(), ["magnet", "phase", "scoreBoost", "shield", "slowTime"]);
  assert.equal(STAGES.length, 8);
  assert.deepEqual(STAGES.filter((stage) => stage.boss).map((stage) => stage.id), [4, 8]);
});
