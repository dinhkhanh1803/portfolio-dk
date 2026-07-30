import type { AiKnowledge } from "./neon-fleet-ai.ts";
import {
  BOARD_SIZE,
  FLEET,
  cellKey,
  type BoardState,
  type Cell,
  type Orientation,
  type ShipId,
} from "./neon-fleet-data.ts";
import { placeShip, type FleetMatch } from "./neon-fleet-engine.ts";

export type MatchClock = {
  startedAtMs: number | null;
  pausedAtMs: number | null;
  pausedTotalMs: number;
};

export type PlacementAttempt = {
  match: FleetMatch;
  accepted: boolean;
  announcement: string;
};

export type TerminalMetrics = {
  shots: number;
  hits: number;
  accuracy: number;
  yourShipsRemaining: number;
  enemyShipsRemaining: number;
  durationMs: number;
};

export type TerminalWriteGuard = {
  runId: number;
  recordedRunId: number | null;
};

const validTime = (value: number) => Number.isFinite(value) ? value : 0;

export const createMatchClock = (): MatchClock => ({
  startedAtMs: null,
  pausedAtMs: null,
  pausedTotalMs: 0,
});

export const resetMatchClock = createMatchClock;

export const startMatchClock = (_clock: MatchClock, nowMs: number): MatchClock => ({
  startedAtMs: validTime(nowMs),
  pausedAtMs: null,
  pausedTotalMs: 0,
});

export const pauseMatchClock = (clock: MatchClock, nowMs: number): MatchClock => {
  if (clock.startedAtMs === null || clock.pausedAtMs !== null) return clock;
  return { ...clock, pausedAtMs: Math.max(clock.startedAtMs, validTime(nowMs)) };
};

export const resumeMatchClock = (clock: MatchClock, nowMs: number): MatchClock => {
  if (clock.startedAtMs === null || clock.pausedAtMs === null) return clock;
  const resumedAt = Math.max(clock.pausedAtMs, validTime(nowMs));
  return {
    ...clock,
    pausedAtMs: null,
    pausedTotalMs: clock.pausedTotalMs + resumedAt - clock.pausedAtMs,
  };
};

export const elapsedMatchMs = (clock: MatchClock, nowMs: number): number => {
  if (clock.startedAtMs === null) return 0;
  const endpoint = clock.pausedAtMs ?? Math.max(clock.startedAtMs, validTime(nowMs));
  return Math.max(0, endpoint - clock.startedAtMs - clock.pausedTotalMs);
};

export const coordinateLabel = ({ x, y }: Cell) =>
  `${String.fromCharCode(65 + y)}${x + 1}`;

const cellsForAnnouncement = (
  origin: Cell,
  length: number,
  orientation: Orientation,
): Cell[] => Array.from({ length }, (_, index) => ({
  x: origin.x + (orientation === "horizontal" ? index : 0),
  y: origin.y + (orientation === "vertical" ? index : 0),
}));

const inBounds = ({ x, y }: Cell) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

export const attemptManualPlacement = (
  match: FleetMatch,
  shipId: ShipId,
  origin: Cell,
  orientation: Orientation,
): PlacementAttempt => {
  const definition = FLEET.find((ship) => ship.id === shipId);
  const shipName = definition?.name ?? "Ship";
  const coordinate = inBounds(origin) ? coordinateLabel(origin) : `(${origin.x}, ${origin.y})`;
  if (match.phase !== "setup") {
    return { match, accepted: false, announcement: `${shipName} cannot be placed after battle has started.` };
  }
  if (match.player.ships.some((ship) => ship.id === shipId)) {
    return { match, accepted: false, announcement: `${shipName} is already placed. Select it to remove first.` };
  }
  if (!definition) {
    return { match, accepted: false, announcement: `Cannot place an unknown ship at ${coordinate}.` };
  }

  const desired = cellsForAnnouncement(origin, definition.length, orientation);
  if (!desired.every(inBounds)) {
    return { match, accepted: false, announcement: `${shipName} at ${coordinate} extends beyond the grid bounds.` };
  }
  const occupied = new Set(match.player.ships.flatMap((ship) => ship.cells.map(cellKey)));
  if (desired.some((cell) => occupied.has(cellKey(cell)))) {
    return { match, accepted: false, announcement: `${shipName} at ${coordinate} would overlap another ship.` };
  }

  const next = placeShip(match, shipId, origin, orientation);
  if (next === match) {
    return { match, accepted: false, announcement: `${shipName} cannot be placed at ${coordinate}.` };
  }
  return {
    match: next,
    accepted: true,
    announcement: `${shipName} placed at ${coordinate}, ${orientation}.`,
  };
};

export const isShipSunk = (ship: BoardState["ships"][number]) => {
  const hits = new Set(ship.hits);
  return ship.cells.length === ship.length && ship.cells.every((cell) => hits.has(cellKey(cell)));
};

export const buildAiKnowledge = (match: FleetMatch): AiKnowledge => ({
  shots: match.player.shots,
  remainingLengths: match.player.ships
    .filter((ship) => !isShipSunk(ship))
    .map((ship) => ship.length),
});

const shotsTaken = (board: BoardState) => Object.keys(board.shots).length;
const successfulHits = (board: BoardState) =>
  Object.values(board.shots).filter((shot) => shot !== "miss").length;
const shipsRemaining = (board: BoardState) => board.ships.filter((ship) => !isShipSunk(ship)).length;

export const buildTerminalMetrics = (
  match: FleetMatch,
  clock: MatchClock,
  nowMs: number,
): TerminalMetrics => {
  const shots = shotsTaken(match.enemy);
  const hits = successfulHits(match.enemy);
  return {
    shots,
    hits,
    accuracy: shots ? Math.round(hits / shots * 100) : 0,
    yourShipsRemaining: shipsRemaining(match.player),
    enemyShipsRemaining: shipsRemaining(match.enemy),
    durationMs: elapsedMatchMs(clock, nowMs),
  };
};

export const createTerminalWriteGuard = (): TerminalWriteGuard => ({ runId: 0, recordedRunId: null });

export const resetTerminalWriteGuard = (guard: TerminalWriteGuard): TerminalWriteGuard => ({
  runId: guard.runId + 1,
  recordedRunId: null,
});

export const claimTerminalWrite = (
  guard: TerminalWriteGuard,
  terminal: boolean,
): { guard: TerminalWriteGuard; shouldWrite: boolean } => {
  if (!terminal || guard.recordedRunId === guard.runId) return { guard, shouldWrite: false };
  return { guard: { ...guard, recordedRunId: guard.runId }, shouldWrite: true };
};

export const isEnemyCellActionable = (
  match: FleetMatch,
  cell: Cell,
  paused: boolean,
  shotLocked: boolean,
) => match.phase === "playerTurn"
  && !paused
  && !shotLocked
  && inBounds(cell)
  && !Object.hasOwn(match.enemy.shots, cellKey(cell));

type MonotonicSource = { now: () => number | undefined };

const fallbackMonotonicSource: MonotonicSource = { now: () => 0 };

export const readMonotonicNow = (
  source: MonotonicSource = typeof performance === "undefined" ? fallbackMonotonicSource : performance,
) => {
  const value = source.now();
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

export const shouldScheduleAi = (match: FleetMatch, paused: boolean) =>
  match.phase === "aiTurn" && !paused;

export type GridNavigationKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End";

export const nextGridIndex = (
  currentIndex: number,
  key: string,
  actionable: readonly boolean[],
): number => {
  const total = BOARD_SIZE * BOARD_SIZE;
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= total) return currentIndex;

  const rowStart = Math.floor(currentIndex / BOARD_SIZE) * BOARD_SIZE;
  const rowEnd = rowStart + BOARD_SIZE - 1;
  let candidate: number;
  let step: number;
  let lowerBound = 0;
  let upperBound = total - 1;

  if (key === "ArrowLeft") {
    candidate = currentIndex - 1;
    step = -1;
    lowerBound = rowStart;
  } else if (key === "ArrowRight") {
    candidate = currentIndex + 1;
    step = 1;
    upperBound = rowEnd;
  } else if (key === "ArrowUp") {
    candidate = currentIndex - BOARD_SIZE;
    step = -BOARD_SIZE;
  } else if (key === "ArrowDown") {
    candidate = currentIndex + BOARD_SIZE;
    step = BOARD_SIZE;
  } else if (key === "Home") {
    candidate = rowStart;
    step = 1;
    upperBound = rowEnd;
  } else if (key === "End") {
    candidate = rowEnd;
    step = -1;
    lowerBound = rowStart;
  } else return currentIndex;

  while (candidate >= lowerBound && candidate <= upperBound) {
    if (actionable[candidate]) return candidate;
    candidate += step;
  }
  return currentIndex;
};

export const nearestActionableIndex = (
  currentIndex: number,
  actionable: readonly boolean[],
): number => {
  if (!actionable.some(Boolean)) return -1;
  const lastIndex = actionable.length - 1;
  const origin = Number.isInteger(currentIndex) ? Math.min(lastIndex, Math.max(0, currentIndex)) : 0;
  if (actionable[origin]) return origin;

  for (let distance = 1; distance <= lastIndex; distance += 1) {
    const next = origin + distance;
    if (next <= lastIndex && actionable[next]) return next;
    const previous = origin - distance;
    if (previous >= 0 && actionable[previous]) return previous;
  }
  return -1;
};
