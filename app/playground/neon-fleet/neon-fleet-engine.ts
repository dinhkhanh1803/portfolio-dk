import {
  BOARD_SIZE,
  FLEET,
  cellKey,
  type BoardState,
  type Cell,
  type Difficulty,
  type MatchPhase,
  type Orientation,
  type ShipId,
  type ShotResult,
} from "./neon-fleet-data.ts";

export type FleetMatch = {
  difficulty: Difficulty;
  phase: MatchPhase;
  player: BoardState;
  enemy: BoardState;
  seed: number;
  turn: number;
  event: string;
};

export const emptyBoard = (): BoardState => ({ ships: [], shots: {} });

const nextRandom = (seed: number) => {
  const next = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

export const createMatch = (difficulty: Difficulty = "normal", seed = 20260729): FleetMatch => ({
  difficulty,
  phase: "setup",
  player: emptyBoard(),
  enemy: emptyBoard(),
  seed: seed >>> 0,
  turn: 0,
  event: "Place your fleet",
});

const cellsFor = (origin: Cell, length: number, orientation: Orientation): Cell[] =>
  Array.from({ length }, (_, index) => ({
    x: origin.x + (orientation === "horizontal" ? index : 0),
    y: origin.y + (orientation === "vertical" ? index : 0),
  }));

const isInBounds = ({ x, y }: Cell) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

const hasValidPlacement = (board: BoardState, cells: Cell[]) => {
  const occupied = new Set(board.ships.flatMap((ship) => ship.cells.map(cellKey)));
  return cells.every(isInBounds) && cells.every((cell) => !occupied.has(cellKey(cell)));
};

export const placeShip = (
  match: FleetMatch,
  shipId: ShipId,
  origin: Cell,
  orientation: Orientation,
): FleetMatch => {
  if (match.phase !== "setup" || match.player.ships.some((ship) => ship.id === shipId)) return match;
  if (orientation !== "horizontal" && orientation !== "vertical") return match;

  const definition = FLEET.find((ship) => ship.id === shipId);
  if (!definition) return match;

  const cells = cellsFor(origin, definition.length, orientation);
  if (!hasValidPlacement(match.player, cells)) return match;

  return {
    ...match,
    player: {
      ...match.player,
      ships: [...match.player.ships, { ...definition, orientation, cells, hits: [] }],
    },
  };
};

export const removeShip = (match: FleetMatch, shipId: ShipId): FleetMatch => {
  if (match.phase !== "setup" || !match.player.ships.some((ship) => ship.id === shipId)) return match;

  return {
    ...match,
    player: {
      ...match.player,
      ships: match.player.ships.filter((ship) => ship.id !== shipId),
    },
  };
};

const guaranteedFleet = (): BoardState => ({
  ships: FLEET.map((definition, index) => ({
    ...definition,
    orientation: "horizontal" as const,
    cells: cellsFor({ x: 0, y: index }, definition.length, "horizontal"),
    hits: [],
  })),
  shots: {},
});

export const autoPlaceFleet = (match: FleetMatch): FleetMatch => {
  if (match.phase !== "setup") return match;

  let seed = match.seed >>> 0;
  let player = emptyBoard();
  const maxAttemptsPerShip = 250;

  for (const definition of FLEET) {
    let placed = false;

    for (let attempt = 0; attempt < maxAttemptsPerShip; attempt += 1) {
      const x = nextRandom(seed);
      const y = nextRandom(x.seed);
      const direction = nextRandom(y.seed);
      seed = direction.seed;

      const candidate = placeShip(
        { ...match, player, seed },
        definition.id,
        { x: Math.floor(x.value * BOARD_SIZE), y: Math.floor(y.value * BOARD_SIZE) },
        direction.value < 0.5 ? "horizontal" : "vertical",
      );
      if (candidate !== match && candidate.player !== player) {
        player = candidate.player;
        placed = true;
        break;
      }
    }

    if (!placed) {
      return { ...match, player: guaranteedFleet(), seed };
    }
  }

  return { ...match, player, seed };
};

export const autoPlaceEnemy = (match: FleetMatch): FleetMatch => {
  if (match.phase !== "setup") return match;

  const mirrored = autoPlaceFleet({ ...match, player: match.enemy });
  return { ...mirrored, player: match.player, enemy: mirrored.player };
};

const hasCompleteValidFleet = (board: BoardState) => {
  if (board.ships.length !== FLEET.length) return false;

  const occupied = new Set<string>();
  for (const definition of FLEET) {
    const ships = board.ships.filter((ship) => ship.id === definition.id);
    if (ships.length !== 1) return false;

    const [ship] = ships;
    if (
      ship.name !== definition.name
      || ship.length !== definition.length
      || ship.hits.length !== 0
      || ship.cells.length !== definition.length
    ) return false;

    const expectedCells = cellsFor(ship.cells[0], definition.length, ship.orientation);
    if (!ship.cells.every((cell, index) => isInBounds(cell) && cellKey(cell) === cellKey(expectedCells[index]))) return false;

    for (const cell of ship.cells) {
      const key = cellKey(cell);
      if (occupied.has(key)) return false;
      occupied.add(key);
    }
  }

  return occupied.size === FLEET.reduce((total, ship) => total + ship.length, 0);
};

export const startBattle = (match: FleetMatch): FleetMatch =>
  match.phase === "setup" && hasCompleteValidFleet(match.player) && hasCompleteValidFleet(match.enemy)
    ? { ...match, phase: "playerTurn", event: "Your turn" }
    : match;

const allSunk = (board: BoardState) =>
  board.ships.length === FLEET.length
  && FLEET.every((definition) => {
    const ships = board.ships.filter((ship) => ship.id === definition.id);
    return ships.length === 1 && ships[0].length === definition.length && ships[0].hits.length === ships[0].length;
  });

const fireAtBoard = (board: BoardState, cell: Cell) => {
  if (!isInBounds(cell)) return null;

  const key = cellKey(cell);
  if (Object.hasOwn(board.shots, key)) return null;

  const ship = board.ships.find((candidate) => candidate.cells.some((part) => cellKey(part) === key));
  const ships = ship
    ? board.ships.map((candidate) => candidate.id === ship.id
      ? { ...candidate, hits: candidate.hits.includes(key) ? candidate.hits : [...candidate.hits, key] }
      : candidate)
    : board.ships;
  const updatedShip = ships.find((candidate) => candidate.id === ship?.id);
  const result: ShotResult = !ship ? "miss" : updatedShip?.hits.length === updatedShip?.length ? "sunk" : "hit";

  return { board: { ships, shots: { ...board.shots, [key]: result } }, result };
};

export const firePlayerShot = (match: FleetMatch, cell: Cell): FleetMatch => {
  if (match.phase !== "playerTurn") return match;

  const resolved = fireAtBoard(match.enemy, cell);
  if (!resolved) return match;

  const victory = allSunk(resolved.board);
  return {
    ...match,
    enemy: resolved.board,
    turn: match.turn + 1,
    phase: victory ? "victory" : "aiTurn",
    event: victory ? "Enemy fleet destroyed" : resolved.result.toUpperCase(),
  };
};

export const fireAiShot = (match: FleetMatch, cell: Cell): FleetMatch => {
  if (match.phase !== "aiTurn") return match;

  const resolved = fireAtBoard(match.player, cell);
  if (!resolved) return match;

  const defeat = allSunk(resolved.board);
  return {
    ...match,
    player: resolved.board,
    phase: defeat ? "defeat" : "playerTurn",
    event: defeat ? "Your fleet was destroyed" : `AI ${resolved.result}`,
  };
};
