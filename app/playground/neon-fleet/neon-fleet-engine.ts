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
