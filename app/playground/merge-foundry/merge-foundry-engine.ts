export type MaterialTier = 1 | 2 | 3 | 4 | 5;
export type Cell = MaterialTier | null;
export type Board = Cell[];
export type Direction = "up" | "down" | "left" | "right";

export type MergeEvent = {
  from: number[];
  to: number;
  tier: MaterialTier;
};

export type BoardMove = {
  board: Board;
  changed: boolean;
  merges: MergeEvent[];
};

export type ShiftStatus = "playing" | "won" | "lost";

export type CraftingOrder = {
  id: string;
  tier: MaterialTier;
  quantity: 1 | 2;
};

export type UndoSnapshot = {
  board: Board;
  seed: number;
  score: number;
  combo: number;
  slidesSinceDelivery: number;
  completedOrders: number;
  orders: CraftingOrder[];
  status: ShiftStatus;
  moveCount: number;
};

export type GameState = UndoSnapshot & {
  version: 1;
  undoAvailable: boolean;
  undoSnapshot: UndoSnapshot | null;
};

export type SlideTransition = {
  state: GameState;
  changed: boolean;
  merges: MergeEvent[];
  spawnedIndex: number | null;
};

type MovingCell = {
  tier: MaterialTier;
  source: number;
};

function assertBoard(board: Board) {
  if (
    board.length !== 25 ||
    board.some(
      (cell) =>
        cell !== null &&
        (!Number.isInteger(cell) || cell < 1 || cell > 5),
    )
  ) {
    throw new Error("Merge Foundry boards must contain 25 valid cells.");
  }
}

function lineIndexes(direction: Direction) {
  return Array.from({ length: 5 }, (_, line) =>
    Array.from({ length: 5 }, (_, offset) => {
      if (direction === "left") return line * 5 + offset;
      if (direction === "right") return line * 5 + (4 - offset);
      if (direction === "up") return offset * 5 + line;
      return (4 - offset) * 5 + line;
    }),
  );
}

function sameBoard(first: Board, second: Board) {
  return first.every((cell, index) => cell === second[index]);
}

export function moveBoard(board: Board, direction: Direction): BoardMove {
  assertBoard(board);
  const nextBoard: Board = Array(25).fill(null);
  const merges: MergeEvent[] = [];

  for (const indexes of lineIndexes(direction)) {
    const compact = indexes.flatMap<MovingCell>((index) => {
      const tier = board[index];
      return tier === null ? [] : [{ tier, source: index }];
    });
    const resolved: Array<MovingCell & { mergedFrom?: number[] }> = [];

    for (let index = 0; index < compact.length; index += 1) {
      const current = compact[index];
      const following = compact[index + 1];
      if (following && following.tier === current.tier) {
        resolved.push({
          tier: Math.min(5, current.tier + 1) as MaterialTier,
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
      nextBoard[destination] = cell.tier;
      if (cell.mergedFrom) {
        merges.push({
          from: cell.mergedFrom,
          to: destination,
          tier: cell.tier,
        });
      }
    });
  }

  return {
    board: nextBoard,
    changed: !sameBoard(board, nextBoard),
    merges,
  };
}

function nextRandom(seed: number) {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: nextSeed, value: nextSeed / 4294967296 };
}

function spawnMaterial(
  board: Board,
  seed: number,
  completedOrders: number,
) {
  const emptyIndexes = board.flatMap((cell, index) =>
    cell === null ? [index] : [],
  );
  if (emptyIndexes.length === 0) {
    return { board, seed, spawnedIndex: null as number | null };
  }
  const positionRoll = nextRandom(seed);
  const tierRoll = nextRandom(positionRoll.seed);
  const spawnedIndex = emptyIndexes[
    Math.min(
      emptyIndexes.length - 1,
      Math.floor(positionRoll.value * emptyIndexes.length),
    )
  ];
  const copperChance = Math.min(0.34, 0.12 + completedOrders * 0.02);
  const nextBoard = [...board];
  nextBoard[spawnedIndex] = tierRoll.value < copperChance ? 2 : 1;
  return { board: nextBoard, seed: tierRoll.seed, spawnedIndex };
}

function generateOrder(seed: number, completedOrders: number) {
  const tierRoll = nextRandom(seed);
  const quantityRoll = nextRandom(tierRoll.seed);
  const maxTier = Math.min(5, 2 + Math.floor(completedOrders / 2));
  const tier = (1 + Math.floor(tierRoll.value * maxTier)) as MaterialTier;
  const quantity: 1 | 2 = tier <= 3 && quantityRoll.value < 0.28 ? 2 : 1;
  return {
    seed: quantityRoll.seed,
    order: {
      id: `order-${completedOrders}-${quantityRoll.seed.toString(36)}`,
      tier,
      quantity,
    } satisfies CraftingOrder,
  };
}

function snapshotOf(state: GameState): UndoSnapshot {
  return {
    board: [...state.board],
    seed: state.seed,
    score: state.score,
    combo: state.combo,
    slidesSinceDelivery: state.slidesSinceDelivery,
    completedOrders: state.completedOrders,
    orders: state.orders.map((order) => ({ ...order })),
    status: state.status,
    moveCount: state.moveCount,
  };
}

export function createGame(seed = Date.now() >>> 0): GameState {
  let nextSeed = seed >>> 0;
  let board: Board = Array(25).fill(null);
  const first = spawnMaterial(board, nextSeed, 0);
  board = first.board;
  nextSeed = first.seed;
  const second = spawnMaterial(board, nextSeed, 0);
  board = second.board;
  nextSeed = second.seed;
  const orders: CraftingOrder[] = [];
  while (orders.length < 3) {
    const generated = generateOrder(nextSeed, orders.length);
    orders.push(generated.order);
    nextSeed = generated.seed;
  }
  return {
    version: 1,
    board,
    seed: nextSeed,
    score: 0,
    combo: 0,
    slidesSinceDelivery: 0,
    completedOrders: 0,
    orders,
    status: "playing",
    moveCount: 0,
    undoAvailable: true,
    undoSnapshot: null,
  };
}

export function hasMoves(board: Board) {
  assertBoard(board);
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

export function slide(
  state: GameState,
  direction: Direction,
): SlideTransition {
  if (state.status !== "playing") {
    return { state, changed: false, merges: [], spawnedIndex: null };
  }
  const movement = moveBoard(state.board, direction);
  if (!movement.changed) {
    return { state, changed: false, merges: [], spawnedIndex: null };
  }
  const snapshot = state.undoAvailable ? snapshotOf(state) : null;
  const spawned = spawnMaterial(
    movement.board,
    state.seed,
    state.completedOrders,
  );
  const slidesSinceDelivery = state.slidesSinceDelivery + 1;
  const mergeScore = movement.merges.reduce(
    (total, merge) => total + 25 * 2 ** (merge.tier - 1),
    0,
  );
  const nextState: GameState = {
    ...state,
    board: spawned.board,
    seed: spawned.seed,
    score: state.score + mergeScore,
    combo: slidesSinceDelivery >= 3 ? 0 : state.combo,
    slidesSinceDelivery,
    moveCount: state.moveCount + 1,
    undoSnapshot: snapshot,
  };
  if (!hasMoves(nextState.board)) nextState.status = "lost";
  return {
    state: nextState,
    changed: true,
    merges: movement.merges,
    spawnedIndex: spawned.spawnedIndex,
  };
}

export function canDeliver(state: GameState, orderId: string) {
  if (state.status !== "playing") return false;
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return false;
  return state.board.filter((cell) => cell === order.tier).length >= order.quantity;
}

export function deliverOrder(state: GameState, orderId: string) {
  if (!canDeliver(state, orderId)) return { state, delivered: false };
  const order = state.orders.find((item) => item.id === orderId)!;
  const board = [...state.board];
  let remaining = order.quantity;
  for (let index = 0; index < board.length && remaining > 0; index += 1) {
    if (board[index] === order.tier) {
      board[index] = null;
      remaining -= 1;
    }
  }
  const completedOrders = state.completedOrders + 1;
  const combo = state.combo + 1;
  let seed = state.seed;
  const orders = state.orders.filter((item) => item.id !== orderId);
  while (completedOrders < 8 && orders.length < 3) {
    const generated = generateOrder(seed, completedOrders + orders.length);
    orders.push(generated.order);
    seed = generated.seed;
  }
  const nextState: GameState = {
    ...state,
    board,
    seed,
    score: state.score + order.tier * order.quantity * 250 * combo,
    combo,
    slidesSinceDelivery: 0,
    completedOrders,
    orders,
    status: completedOrders >= 8 ? "won" : "playing",
  };
  return { state: nextState, delivered: true };
}

export function undo(state: GameState): GameState {
  if (!state.undoAvailable || !state.undoSnapshot) return state;
  return {
    version: 1,
    ...state.undoSnapshot,
    board: [...state.undoSnapshot.board],
    orders: state.undoSnapshot.orders.map((order) => ({ ...order })),
    undoAvailable: false,
    undoSnapshot: null,
  };
}