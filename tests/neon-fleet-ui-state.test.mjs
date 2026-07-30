import assert from "node:assert/strict";
import test from "node:test";
import { cellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";
import {
  autoPlaceEnemy,
  autoPlaceFleet,
  createMatch,
} from "../app/playground/neon-fleet/neon-fleet-engine.ts";
import {
  attemptManualPlacement,
  buildAiKnowledge,
  buildTerminalMetrics,
  claimTerminalWrite,
  createMatchClock,
  createTerminalWriteGuard,
  elapsedMatchMs,
  isEnemyCellActionable,
  pauseMatchClock,
  resetMatchClock,
  resetTerminalWriteGuard,
  resumeMatchClock,
  startMatchClock,
} from "../app/playground/neon-fleet/neon-fleet-ui-state.ts";

test("match clock excludes repeated, accumulated, and current pauses and resets cleanly", () => {
  const reset = createMatchClock();
  assert.deepEqual(reset, { startedAtMs: null, pausedAtMs: null, pausedTotalMs: 0 });
  assert.equal(elapsedMatchMs(reset, 900), 0);

  let clock = startMatchClock(reset, 100);
  assert.equal(elapsedMatchMs(clock, 300), 200);
  clock = pauseMatchClock(clock, 300);
  assert.equal(elapsedMatchMs(clock, 900), 200);
  assert.deepEqual(pauseMatchClock(clock, 950), clock);

  clock = resumeMatchClock(clock, 500);
  assert.equal(elapsedMatchMs(clock, 700), 400);
  clock = pauseMatchClock(clock, 750);
  assert.equal(elapsedMatchMs(clock, 1000), 450);
  clock = resumeMatchClock(clock, 1100);
  assert.equal(elapsedMatchMs(clock, 1500), 850);
  assert.deepEqual(resetMatchClock(), reset);
});

test("manual placement wrapper announces accepted and rejected engine outcomes", () => {
  const initial = createMatch("normal", 23);
  const placed = attemptManualPlacement(initial, "carrier", { x: 0, y: 0 }, "horizontal");
  assert.notEqual(placed.match, initial);
  assert.equal(placed.accepted, true);
  assert.match(placed.announcement, /Carrier placed at A1/i);

  const duplicate = attemptManualPlacement(placed.match, "carrier", { x: 0, y: 4 }, "horizontal");
  assert.equal(duplicate.match, placed.match);
  assert.equal(duplicate.accepted, false);
  assert.match(duplicate.announcement, /already placed/i);

  const overlap = attemptManualPlacement(placed.match, "battleship", { x: 0, y: 0 }, "vertical");
  assert.equal(overlap.match, placed.match);
  assert.match(overlap.announcement, /overlap/i);

  const outside = attemptManualPlacement(placed.match, "destroyer", { x: 9, y: 9 }, "horizontal");
  assert.equal(outside.match, placed.match);
  assert.match(outside.announcement, /grid|bounds/i);
});

test("AI knowledge exposes only public shots and remaining lengths", () => {
  const match = autoPlaceFleet(createMatch("hard", 71));
  const sunk = match.player.ships.find((ship) => ship.id === "carrier");
  assert.ok(sunk);
  const shots = Object.fromEntries(sunk.cells.map((cell) => [cellKey(cell), "sunk"]));
  const terminalCarrier = { ...sunk, hits: sunk.cells.map(cellKey) };
  const withSunkCarrier = {
    ...match,
    player: {
      ...match.player,
      shots,
      ships: match.player.ships.map((ship) => ship.id === sunk.id ? terminalCarrier : ship),
    },
  };

  const knowledge = buildAiKnowledge(withSunkCarrier);
  assert.deepEqual(Object.keys(knowledge).sort(), ["remainingLengths", "shots"]);
  assert.equal(knowledge.shots, withSunkCarrier.player.shots);
  assert.deepEqual(knowledge.remainingLengths, [4, 3, 3, 2]);
  assert.equal(Object.hasOwn(knowledge, "ships"), false);
  assert.equal(Object.hasOwn(knowledge, "coordinates"), false);
});

test("terminal metrics include accuracy, both remaining fleets, and active duration", () => {
  let match = autoPlaceFleet(createMatch("normal", 99));
  match = autoPlaceEnemy(match);
  const sink = (ship) => ({ ...ship, hits: ship.cells.map(cellKey) });
  match = {
    ...match,
    phase: "victory",
    player: {
      ...match.player,
      ships: match.player.ships.map((ship, index) => index === 0 ? sink(ship) : ship),
    },
    enemy: {
      ...match.enemy,
      shots: { "0:0": "miss", "1:0": "hit", "2:0": "sunk" },
      ships: match.enemy.ships.map((ship, index) => index < 2 ? sink(ship) : ship),
    },
  };
  let clock = startMatchClock(createMatchClock(), 100);
  clock = pauseMatchClock(clock, 200);
  clock = resumeMatchClock(clock, 500);

  assert.deepEqual(buildTerminalMetrics(match, clock, 1000), {
    shots: 3,
    hits: 2,
    accuracy: 67,
    yourShipsRemaining: 4,
    enemyShipsRemaining: 3,
    durationMs: 600,
  });
});

test("terminal write guard emits once per run and resets for rematch", () => {
  let guard = createTerminalWriteGuard();
  const nonTerminal = claimTerminalWrite(guard, false);
  assert.equal(nonTerminal.shouldWrite, false);
  assert.equal(nonTerminal.guard, guard);

  const first = claimTerminalWrite(guard, true);
  assert.equal(first.shouldWrite, true);
  guard = first.guard;
  assert.equal(claimTerminalWrite(guard, true).shouldWrite, false);

  guard = resetTerminalWriteGuard(guard);
  const rematch = claimTerminalWrite(guard, true);
  assert.equal(rematch.shouldWrite, true);
  assert.notEqual(rematch.guard.runId, first.guard.runId);
});

test("enemy cell actionability requires an unlocked, legal, untried player turn", () => {
  const base = {
    ...createMatch("normal", 5),
    phase: "playerTurn",
    enemy: { ships: [], shots: { "0:0": "miss" } },
  };
  assert.equal(isEnemyCellActionable(base, { x: 1, y: 0 }, false, false), true);
  assert.equal(isEnemyCellActionable(base, { x: 1, y: 0 }, true, false), false);
  assert.equal(isEnemyCellActionable(base, { x: 1, y: 0 }, false, true), false);
  assert.equal(isEnemyCellActionable(base, { x: 0, y: 0 }, false, false), false);
  assert.equal(isEnemyCellActionable({ ...base, phase: "aiTurn" }, { x: 1, y: 0 }, false, false), false);
  assert.equal(isEnemyCellActionable(base, { x: -1, y: 0 }, false, false), false);
  assert.equal(isEnemyCellActionable(base, { x: 10, y: 0 }, false, false), false);
});
