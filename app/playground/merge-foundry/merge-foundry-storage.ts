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
  return (
    isBoard(snapshot.board) &&
    Number.isInteger(snapshot.seed) &&
    Number(snapshot.seed) >= 0 &&
    Number.isFinite(snapshot.score) &&
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
    statuses.includes(snapshot.status as ShiftStatus) &&
    Number.isInteger(snapshot.moveCount) &&
    Number(snapshot.moveCount) >= 0
  );
}

function isGameState(value: unknown): value is GameState {
  if (!isSnapshot(value)) return false;
  const state = value as Partial<GameState>;
  return (
    state.version === 1 &&
    typeof state.undoAvailable === "boolean" &&
    (state.undoSnapshot === null || isSnapshot(state.undoSnapshot))
  );
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
