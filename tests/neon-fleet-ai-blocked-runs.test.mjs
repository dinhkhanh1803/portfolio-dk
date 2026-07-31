import assert from "node:assert/strict";
import test from "node:test";
import { cellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";
import { chooseAiShot } from "../app/playground/neon-fleet/neon-fleet-ai.ts";

test("recovers orthogonal targets when an inferred hit run is fully blocked", () => {
  const knowledge = {
    shots: { "0:0": "hit", "1:0": "hit", "2:0": "miss" },
    remainingLengths: [5, 4, 3, 3, 2],
  };
  // Both line extensions are unavailable; the two downward orthogonal neighbors are the only legal targets.
  const targets = new Set(["0:1", "1:1"]);
  const seeds = Array.from({ length: 40 }, (_, index) => Math.imul(index, 0x9e3779b1) >>> 0);

  for (const difficulty of ["normal", "hard"]) {
    const choices = seeds.map((seed) => chooseAiShot(difficulty, knowledge, seed));
    for (const result of choices) {
      assert.ok(result.cell);
      assert.ok(targets.has(cellKey(result.cell)), `${difficulty} selected ${cellKey(result.cell)}`);
    }
    assert.deepEqual(new Set(choices.map(({ cell }) => cellKey(cell))), targets);
  }
});
