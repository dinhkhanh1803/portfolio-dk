export const TARGET_VALUE = 2048 as const;
export type TileValue = 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048;
export type Cell = TileValue | null;
export type Board = Cell[];
export type Direction = "up" | "down" | "left" | "right";
export type GameStatus = "playing" | "won" | "lost";

export type MergeEvent = {
  from: number[];
  to: number;
  value: TileValue;
};

export type BoardMove = {
  board: Board;
  changed: boolean;
  merges: MergeEvent[];
  scoreGained: number;
};

export type UndoSnapshot = {
  board: Board;
  seed: number;
  score: number;
  status: GameStatus;
  moveCount: number;
};

export type GameState = UndoSnapshot & {
  version: 2;
  undoAvailable: boolean;
  undoSnapshot: UndoSnapshot | null;
};

export type SlideTransition = {
  state: GameState;
  changed: boolean;
  merges: MergeEvent[];
  spawnedIndex: number | null;
};

type MovingCell = { value: TileValue; source: number };

const TILE_VALUES = new Set<number>([2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]);

function assertBoard(board: Board) {
  if (
    board.length !== 16 ||
    board.some((cell) => cell !== null && !TILE_VALUES.has(cell))
  ) {
    throw new Error("2048 boards must contain 16 valid cells.");
  }
}

function lineIndexes(direction: Direction) {
  return Array.from({ length: 4 }, (_, line) =>
    Array.from({ length: 4 }, (_, offset) => {
      if (direction === "left") return line * 4 + offset;
      if (direction === "right") return line * 4 + (3 - offset);
      if (direction === "up") return offset * 4 + line;
      return (3 - offset) * 4 + line;
    }),
  );
}

function sameBoard(first: Board, second: Board) {
  return first.every((cell, index) => cell === second[index]);
}

export function moveBoard(board: Board, direction: Direction): BoardMove {
  assertBoard(board);
  const nextBoard: Board = Array(16).fill(null);
  const merges: MergeEvent[] = [];

  for (const indexes of lineIndexes(direction)) {
    const compact = indexes.flatMap<MovingCell>((index) => {
      const value = board[index];
      return value === null ? [] : [{ value, source: index }];
    });
    const resolved: Array<MovingCell & { mergedFrom?: number[] }> = [];

    for (let index = 0; index < compact.length; index += 1) {
      const current = compact[index];
      const following = compact[index + 1];
      if (
        following &&
        following.value === current.value &&
        current.value < TARGET_VALUE
      ) {
        resolved.push({
          value: (current.value * 2) as TileValue,
          source: current.source,
          mergedFrom: [current.source, following.source],
        });
        index += 1;
      } else {
        resolved.push(current);
      }
    }

    resolved.forEach((cell, offset) => {
      const destination = indexes[offset];
      nextBoard[destination] = cell.value;
      if (cell.mergedFrom) {
        merges.push({ from: cell.mergedFrom, to: destination, value: cell.value });
      }
    });
  }

  return {
    board: nextBoard,
    changed: !sameBoard(board, nextBoard),
    merges,
    scoreGained: merges.reduce((total, merge) => total + merge.value, 0),
  };
}

function nextRandom(seed: number) {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: nextSeed, value: nextSeed / 4294967296 };
}

function spawnTile(board: Board, seed: number) {
  const emptyIndexes = board.flatMap((cell, index) => cell === null ? [index] : []);
  if (emptyIndexes.length === 0) {
    return { board, seed, spawnedIndex: null as number | null };
  }
  const positionRoll = nextRandom(seed);
  const valueRoll = nextRandom(positionRoll.seed);
  const spawnedIndex = emptyIndexes[
    Math.min(emptyIndexes.length - 1, Math.floor(positionRoll.value * emptyIndexes.length))
  ];
  const nextBoard = [...board];
  nextBoard[spawnedIndex] = valueRoll.value < 0.9 ? 2 : 4;
  return { board: nextBoard, seed: valueRoll.seed, spawnedIndex };
}

function snapshotOf(state: GameState): UndoSnapshot {
  return {
    board: [...state.board],
    seed: state.seed,
    score: state.score,
    status: state.status,
    moveCount: state.moveCount,
  };
}

export function createGame(seed = Date.now() >>> 0): GameState {
  let nextSeed = seed >>> 0;
  let board: Board = Array(16).fill(null);
  const first = spawnTile(board, nextSeed);
  board = first.board;
  nextSeed = first.seed;
  const second = spawnTile(board, nextSeed);
  board = second.board;
  nextSeed = second.seed;
  return {
    version: 2,
    board,
    seed: nextSeed,
    score: 0,
    status: "playing",
    moveCount: 0,
    undoAvailable: true,
    undoSnapshot: null,
  };
}

export function hasMoves(board: Board) {
  assertBoard(board);
  if (board.some((cell) => cell === null)) return true;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column;
      const value = board[index];
      if (value === TARGET_VALUE) continue;
      if (column < 3 && value === board[index + 1]) return true;
      if (row < 3 && value === board[index + 4]) return true;
    }
  }
  return false;
}

export function slide(state: GameState, direction: Direction): SlideTransition {
  if (state.status !== "playing") {
    return { state, changed: false, merges: [], spawnedIndex: null };
  }
  const movement = moveBoard(state.board, direction);
  if (!movement.changed) {
    return { state, changed: false, merges: [], spawnedIndex: null };
  }
  const snapshot = state.undoAvailable ? snapshotOf(state) : null;
  const spawned = spawnTile(movement.board, state.seed);
  const won = spawned.board.includes(TARGET_VALUE);
  const status: GameStatus = won
    ? "won"
    : hasMoves(spawned.board) ? "playing" : "lost";
  const nextState: GameState = {
    ...state,
    board: spawned.board,
    seed: spawned.seed,
    score: state.score + movement.scoreGained,
    status,
    moveCount: state.moveCount + 1,
    undoSnapshot: snapshot,
  };
  return {
    state: nextState,
    changed: true,
    merges: movement.merges,
    spawnedIndex: spawned.spawnedIndex,
  };
}

export function undo(state: GameState): GameState {
  if (!state.undoAvailable || !state.undoSnapshot) return state;
  return {
    version: 2,
    ...state.undoSnapshot,
    board: [...state.undoSnapshot.board],
    undoAvailable: false,
    undoSnapshot: null,
  };
}
