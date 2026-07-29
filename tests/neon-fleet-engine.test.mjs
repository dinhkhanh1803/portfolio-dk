import assert from "node:assert/strict";
import test from "node:test";
import { BOARD_SIZE, FLEET, cellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";
import {
  autoPlaceFleet,
  createMatch,
  placeShip,
  removeShip,
} from "../app/playground/neon-fleet/neon-fleet-engine.ts";

test("creates an empty setup match with its supplied seed", () => {
  const match = createMatch("normal", 42);
  assert.equal(match.difficulty, "normal");
  assert.equal(match.phase, "setup");
  assert.deepEqual(match.player, { ships: [], shots: {} });
  assert.deepEqual(match.enemy, { ships: [], shots: {} });
  assert.equal(match.seed, 42);
  assert.equal(match.turn, 0);
  assert.equal(match.event, "Place your fleet");
});

test("places a ship in the requested orientation", () => {
  const placed = placeShip(createMatch("normal", 42), "carrier", { x: 1, y: 2 }, "horizontal");
  assert.equal(placed.player.ships.length, 1);
  assert.equal(placed.player.ships[0].id, "carrier");
  assert.equal(placed.player.ships[0].cells.length, 5);
  assert.deepEqual(placed.player.ships[0].cells, [
    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
  ]);
  assert.deepEqual(placed.player.ships[0].hits, []);
});

test("rejects overlapping placements without changing the match", () => {
  const first = placeShip(createMatch(), "carrier", { x: 1, y: 2 }, "horizontal");
  assert.equal(placeShip(first, "battleship", { x: 3, y: 2 }, "vertical"), first);
});

test("rejects out-of-bounds placements without changing the match", () => {
  const match = createMatch();
  assert.equal(placeShip(match, "carrier", { x: 6, y: 9 }, "horizontal"), match);
});

test("removes a placed ship during setup", () => {
  const placed = placeShip(createMatch(), "carrier", { x: 1, y: 2 }, "horizontal");
  const removed = removeShip(placed, "carrier");
  assert.equal(removed.player.ships.length, 0);
  assert.deepEqual(removed.player.shots, {});
});

test("auto-places a deterministic complete, valid fleet", () => {
  const a = autoPlaceFleet(createMatch("hard", 99));
  const b = autoPlaceFleet(createMatch("hard", 99));
  const cells = a.player.ships.flatMap((ship) => ship.cells);

  assert.deepEqual(a.player.ships, b.player.ships);
  assert.equal(a.player.ships.length, FLEET.length);
  assert.equal(new Set(cells.map(cellKey)).size, 17);
  assert.ok(cells.every(({ x, y }) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE));
});

test("auto-placement completes every fleet for a useful seed range", () => {
  for (let seed = 1; seed <= 25; seed += 1) {
    const match = autoPlaceFleet(createMatch("normal", seed));
    const cells = match.player.ships.flatMap((ship) => ship.cells);
    assert.equal(match.player.ships.length, FLEET.length, `seed ${seed}`);
    assert.equal(new Set(cells.map(cellKey)).size, 17, `seed ${seed}`);
  }
});
