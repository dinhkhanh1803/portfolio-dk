import type {
  Board,
  GameState,
  GameStatus,
  UndoSnapshot,
} from "./merge-foundry-engine";

export const GAME_KEY = "merge-foundry:2048:v2";
export const HIGH_SCORE_KEY = "merge-foundry:2048:high-score";
export const MUTED_KEY = "merge-foundry:muted";
export const REDUCED_MOTION_KEY = "merge-foundry:reduced-motion";

const tileValues = new Set([2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]);
const statuses: GameStatus[] = ["playing", "won", "lost"];

function isBoard(value: unknown): value is Board {
  return Array.isArray(value) &&
    value.length === 16 &&
    value.every((cell) => cell === null || (typeof cell === "number" && tileValues.has(cell)));
}

function boardHasMoves(board: Board) {
  if (board.some((cell) => cell === null)) return true;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column;
      const value = board[index];
      if (value === 2048) continue;
      if (column < 3 && value === board[index + 1]) return true;
      if (row < 3 && value === board[index + 4]) return true;
    }
  }
  return false;
}

function isSnapshot(value: unknown): value is UndoSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<UndoSnapshot>;
  if (
    !isBoard(snapshot.board) ||
    !Number.isInteger(snapshot.seed) ||
    Number(snapshot.seed) < 0 ||
    Number(snapshot.seed) > 0xffffffff ||
    !Number.isInteger(snapshot.score) ||
    Number(snapshot.score) < 0 ||
    !statuses.includes(snapshot.status as GameStatus) ||
    !Number.isInteger(snapshot.moveCount) ||
    Number(snapshot.moveCount) < 0
  ) {
    return false;
  }
  const valid = snapshot as UndoSnapshot;
  const hasTarget = valid.board.includes(2048);
  if (valid.status === "won") return hasTarget;
  if (hasTarget) return false;
  if (valid.status === "lost") return !boardHasMoves(valid.board);
  return boardHasMoves(valid.board);
}

function isGameState(value: unknown): value is GameState {
  if (!isSnapshot(value)) return false;
  const state = value as Partial<GameState>;
  if (
    state.version !== 2 ||
    typeof state.undoAvailable !== "boolean" ||
    !(state.undoSnapshot === null || isSnapshot(state.undoSnapshot))
  ) {
    return false;
  }
  return state.undoAvailable || state.undoSnapshot === null;
}

export function parseSavedGame(serialized: string | null): GameState | null {
  if (!serialized) return null;
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isGameState(parsed)) return null;
    return JSON.parse(JSON.stringify(parsed)) as GameState;
  } catch {
    return null;
  }
}

export function serializeGame(state: GameState) {
  return JSON.stringify(state);
}

export function readStoredBoolean(value: string | null, fallback: boolean) {
  return value === "true" ? true : value === "false" ? false : fallback;
}

export function readStoredScore(value: string | null) {
  const score = Number(value);
  return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
}
