import type {
  Board,
  CraftingOrder,
  GameState,
  ShiftStatus,
  UndoSnapshot,
} from "./merge-foundry-engine";

export const SHIFT_KEY = "merge-foundry:shift:v1";
export const HIGH_SCORE_KEY = "merge-foundry:high-score";
export const MUTED_KEY = "merge-foundry:muted";
export const REDUCED_MOTION_KEY = "merge-foundry:reduced-motion";

const statuses: ShiftStatus[] = ["playing", "won", "lost"];

function isBoard(value: unknown): value is Board {
  return (
    Array.isArray(value) &&
    value.length === 25 &&
    value.every(
      (cell) =>
        cell === null ||
        (Number.isInteger(cell) && Number(cell) >= 1 && Number(cell) <= 5),
    )
  );
}

function boardHasMoves(board: Board) {
  if (board.some((cell) => cell === null)) return true;
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const index = row * 5 + column;
      if (column < 4 && board[index] === board[index + 1]) return true;
      if (row < 4 && board[index] === board[index + 5]) return true;
    }
  }
  return false;
}
function isOrder(value: unknown): value is CraftingOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<CraftingOrder>;
  return (
    typeof order.id === "string" &&
    order.id.length > 0 &&
    Number.isInteger(order.tier) &&
    Number(order.tier) >= 1 &&
    Number(order.tier) <= 5 &&
    (order.quantity === 1 || order.quantity === 2)
  );
}

function isSnapshot(value: unknown): value is UndoSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<UndoSnapshot>;
  const structurallyValid =
    isBoard(snapshot.board) &&
    Number.isInteger(snapshot.seed) &&
    Number(snapshot.seed) >= 0 &&
    Number(snapshot.seed) <= 0xffffffff &&
    Number.isInteger(snapshot.score) &&
    Number(snapshot.score) >= 0 &&
    Number.isInteger(snapshot.combo) &&
    Number(snapshot.combo) >= 0 &&
    Number.isInteger(snapshot.slidesSinceDelivery) &&
    Number(snapshot.slidesSinceDelivery) >= 0 &&
    Number.isInteger(snapshot.completedOrders) &&
    Number(snapshot.completedOrders) >= 0 &&
    Number(snapshot.completedOrders) <= 8 &&
    Array.isArray(snapshot.orders) &&
    snapshot.orders.length <= 3 &&
    snapshot.orders.every(isOrder) &&
    new Set(snapshot.orders.map((order) => order.id)).size === snapshot.orders.length &&
    statuses.includes(snapshot.status as ShiftStatus) &&
    Number.isInteger(snapshot.moveCount) &&
    Number(snapshot.moveCount) >= 0;

  if (!structurallyValid) return false;
  const valid = snapshot as UndoSnapshot;
  if ((valid.status === "won") !== (valid.completedOrders === 8)) return false;
  if (valid.status === "lost" && boardHasMoves(valid.board)) return false;
  if (valid.status === "playing" && !boardHasMoves(valid.board)) return false;
  return true;
}

function isGameState(value: unknown): value is GameState {
  if (!isSnapshot(value)) return false;
  const state = value as Partial<GameState>;
  if (
    state.version !== 1 ||
    typeof state.undoAvailable !== "boolean" ||
    !(state.undoSnapshot === null || isSnapshot(state.undoSnapshot))
  ) {
    return false;
  }
  return state.undoAvailable || state.undoSnapshot === null;
}
export function parseSavedShift(serialized: string | null): GameState | null {
  if (!serialized) return null;
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isGameState(parsed)) return null;
    return JSON.parse(JSON.stringify(parsed)) as GameState;
  } catch {
    return null;
  }
}

export function serializeShift(state: GameState) {
  return JSON.stringify(state);
}

export function readStoredBoolean(value: string | null, fallback: boolean) {
  return value === "true" ? true : value === "false" ? false : fallback;
}

export function readStoredScore(value: string | null) {
  const score = Number(value);
  return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
}
