import assert from "node:assert/strict";
import test from "node:test";
import { BOARD_SIZE, FLEET, cellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";
import {
  autoPlaceEnemy,
  autoPlaceFleet,
  createMatch,
  fireAiShot,
  firePlayerShot,
  placeShip,
  removeShip,
  startBattle,
} from "../app/playground/neon-fleet/neon-fleet-engine.ts";

const battleReady = (seed = 42) => startBattle(autoPlaceEnemy(autoPlaceFleet(createMatch("normal", seed))));

const emptyCell = (board) => {
  const occupied = new Set(board.ships.flatMap((ship) => ship.cells.map(cellKey)));
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!occupied.has(cellKey({ x, y }))) return { x, y };
    }
  }
  throw new Error("expected an empty board cell");
};

const withAllButOneFleetCellHit = (board, target) => ({
  ...board,
  ships: board.ships.map((ship) => ({
    ...ship,
    hits: ship.cells.filter((cell) => cellKey(cell) !== cellKey(target)).map(cellKey),
  })),
});

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
    assert.ok(cells.every(({ x, y }) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE), `seed ${seed}`);
  }
});

test("auto-places a deterministic enemy fleet without changing the player fleet", () => {
  const playerPlaced = autoPlaceFleet(createMatch("hard", 99));
  const a = autoPlaceEnemy(playerPlaced);
  const b = autoPlaceEnemy(playerPlaced);
  const enemyCells = a.enemy.ships.flatMap((ship) => ship.cells);

  assert.equal(a.player, playerPlaced.player);
  assert.equal(a.phase, "setup");
  assert.deepEqual(a.enemy.ships, b.enemy.ships);
  assert.equal(a.enemy.ships.length, FLEET.length);
  assert.equal(new Set(enemyCells.map(cellKey)).size, 17);
  assert.ok(enemyCells.every(({ x, y }) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE));
});

test("starts a battle only when both fleets are complete and valid", () => {
  const incomplete = autoPlaceFleet(createMatch());
  assert.equal(startBattle(incomplete), incomplete);

  const ready = autoPlaceEnemy(incomplete);
  const started = startBattle(ready);
  assert.equal(started.phase, "playerTurn");
  assert.equal(started.event, "Your turn");
});

test("fires a player hit once, advances to the AI, and preserves the input match", () => {
  const ready = battleReady();
  const target = ready.enemy.ships[0].cells[0];
  const shot = firePlayerShot(ready, target);
  const hitShip = shot.enemy.ships.find((ship) => ship.cells.some((cell) => cellKey(cell) === cellKey(target)));

  assert.equal(ready.enemy.shots[cellKey(target)], undefined);
  assert.equal(shot.enemy.shots[cellKey(target)], "hit");
  assert.deepEqual(hitShip.hits, [cellKey(target)]);
  assert.equal(shot.turn, ready.turn + 1);
  assert.equal(shot.phase, "aiTurn");
});

test("records player misses and rejects duplicate or invalid player shots unchanged", () => {
  const ready = battleReady();
  const miss = emptyCell(ready.enemy);
  const fired = firePlayerShot(ready, miss);
  const duplicateOnPlayerTurn = { ...fired, phase: "playerTurn" };

  assert.equal(fired.enemy.shots[cellKey(miss)], "miss");
  assert.equal(firePlayerShot(duplicateOnPlayerTurn, miss), duplicateOnPlayerTurn);
  assert.equal(firePlayerShot(ready, { x: 10, y: 0 }), ready);
  assert.equal(firePlayerShot(ready, { x: 1.5, y: 1 }), ready);
});

test("fires AI shots on the player board without incrementing the player turn count", () => {
  const ready = battleReady();
  const target = ready.player.ships[0].cells[0];
  const aiTurn = { ...ready, phase: "aiTurn" };
  const shot = fireAiShot(aiTurn, target);

  assert.equal(shot.player.shots[cellKey(target)], "hit");
  assert.equal(shot.player.ships[0].hits[0], cellKey(target));
  assert.equal(shot.turn, aiTurn.turn);
  assert.equal(shot.phase, "playerTurn");
  assert.equal(fireAiShot(shot, target), shot);
  assert.equal(fireAiShot(aiTurn, { x: -1, y: 0 }), aiTurn);
});

test("marks a ship sunk only after its final cell is hit", () => {
  const ready = battleReady();
  const destroyer = ready.enemy.ships.find((ship) => ship.id === "destroyer");
  const target = destroyer.cells.at(-1);
  const prepared = {
    ...ready,
    enemy: {
      ...ready.enemy,
      ships: ready.enemy.ships.map((ship) => ship.id === destroyer.id
        ? { ...ship, hits: ship.cells.slice(0, -1).map(cellKey) }
        : ship),
    },
  };
  const shot = firePlayerShot(prepared, target);
  const sunk = shot.enemy.ships.find((ship) => ship.id === destroyer.id);

  assert.equal(shot.enemy.shots[cellKey(target)], "sunk");
  assert.equal(sunk.hits.length, sunk.length);
});

test("awards victory when the player hits the last unsunk fleet cell", () => {
  const ready = battleReady();
  const target = ready.enemy.ships[0].cells[0];
  const match = { ...ready, enemy: withAllButOneFleetCellHit(ready.enemy, target) };
  const shot = firePlayerShot(match, target);

  assert.equal(shot.phase, "victory");
});

test("awards defeat when the AI hits the player's last unsunk fleet cell", () => {
  const ready = battleReady();
  const target = ready.player.ships[0].cells[0];
  const match = {
    ...ready,
    phase: "aiTurn",
    player: withAllButOneFleetCellHit(ready.player, target),
  };
  const shot = fireAiShot(match, target);

  assert.equal(shot.phase, "defeat");
  assert.equal(shot.turn, match.turn);
});

test("rejects battle starts outside setup and with malformed five-ship fleets", () => {
  const ready = autoPlaceEnemy(autoPlaceFleet(createMatch()));
  const wrongPhase = { ...ready, phase: "playerTurn" };
  const overlapping = {
    ...ready,
    enemy: {
      ...ready.enemy,
      ships: ready.enemy.ships.map((ship, index) => index === 0
        ? { ...ship, cells: [...ship.cells.slice(0, -1), ready.enemy.ships[1].cells[0]] }
        : ship),
    },
  };

  assert.equal(startBattle(wrongPhase), wrongPhase);
  assert.equal(startBattle(overlapping), overlapping);
});

test("rejects player shots outside the player's turn by reference", () => {
  const setup = autoPlaceEnemy(autoPlaceFleet(createMatch()));
  assert.equal(firePlayerShot(setup, { x: 0, y: 0 }), setup);
});

test("does not sink ships from duplicate or arbitrary hit keys", () => {
  const ready = battleReady();
  const carrier = ready.enemy.ships.find((ship) => ship.id === "carrier");
  const target = carrier.cells.at(-1);
  const match = {
    ...ready,
    enemy: {
      ...ready.enemy,
      ships: ready.enemy.ships.map((ship) => ship.id === carrier.id
        ? { ...ship, hits: Array.from({ length: ship.length - 1 }, () => cellKey(ship.cells[0])) }
        : ship),
    },
  };
  const shot = firePlayerShot(match, target);
  const updatedCarrier = shot.enemy.ships.find((ship) => ship.id === carrier.id);

  assert.equal(shot.enemy.shots[cellKey(target)], "hit");
  assert.deepEqual(updatedCarrier.hits, [cellKey(carrier.cells[0]), cellKey(target)]);
});

test("does not award victory from arbitrary hit keys", () => {
  const ready = battleReady();
  const target = ready.enemy.ships[0].cells[0];
  const match = {
    ...ready,
    enemy: {
      ...ready.enemy,
      ships: ready.enemy.ships.map((ship, index) => ({
        ...ship,
        hits: Array.from({ length: ship.length - (index === 0 ? 1 : 0) }, () => "forged"),
      })),
    },
  };
  const shot = firePlayerShot(match, target);

  assert.equal(shot.phase, "aiTurn");
  assert.equal(shot.enemy.shots[cellKey(target)], "hit");
});

test("does not award victory from a malformed fleet with every cell hit", () => {
  const ready = battleReady();
  const enemy = {
    ...ready.enemy,
    ships: ready.enemy.ships.map((ship, index) => index === 0
      ? { ...ship, cells: [...ship.cells].reverse() }
      : ship),
  };
  const target = enemy.ships[0].cells[0];
  const match = { ...ready, enemy: withAllButOneFleetCellHit(enemy, target) };
  const shot = firePlayerShot(match, target);

  assert.equal(shot.enemy.shots[cellKey(target)], "sunk");
  assert.equal(shot.phase, "aiTurn");
});

test("requires pristine shot maps to start a battle", () => {
  const ready = autoPlaceEnemy(autoPlaceFleet(createMatch()));
  const playerShots = {
    ...ready,
    player: { ...ready.player, shots: { [cellKey({ x: 0, y: 0 })]: "miss" } },
  };
  const enemyShots = {
    ...ready,
    enemy: { ...ready.enemy, shots: { [cellKey({ x: 0, y: 0 })]: "miss" } },
  };

  assert.equal(startBattle(playerShots), playerShots);
  assert.equal(startBattle(enemyShots), enemyShots);
});

test("relabels every hit cell when a ship is sunk without changing unrelated shots", () => {
  const ready = battleReady();
  const destroyer = ready.enemy.ships.find((ship) => ship.id === "destroyer");
  const unrelatedHit = ready.enemy.ships.find((ship) => ship.id === "carrier").cells[0];
  const unrelatedMiss = emptyCell(ready.enemy);
  const hit = firePlayerShot(ready, unrelatedHit);
  const miss = firePlayerShot({ ...hit, phase: "playerTurn" }, unrelatedMiss);
  const firstDestroyerHit = firePlayerShot({ ...miss, phase: "playerTurn" }, destroyer.cells[0]);
  const sunk = firePlayerShot({ ...firstDestroyerHit, phase: "playerTurn" }, destroyer.cells[1]);

  assert.ok(destroyer.cells.every((cell) => sunk.enemy.shots[cellKey(cell)] === "sunk"));
  assert.equal(sunk.enemy.shots[cellKey(unrelatedHit)], "hit");
  assert.equal(sunk.enemy.shots[cellKey(unrelatedMiss)], "miss");
});

test("rejects both players' shots after victory or defeat by reference", () => {
  const ready = battleReady();
  const victory = { ...ready, phase: "victory" };
  const defeat = { ...ready, phase: "defeat" };
  const cell = { x: 0, y: 0 };

  assert.equal(firePlayerShot(victory, cell), victory);
  assert.equal(fireAiShot(victory, cell), victory);
  assert.equal(firePlayerShot(defeat, cell), defeat);
  assert.equal(fireAiShot(defeat, cell), defeat);
});
