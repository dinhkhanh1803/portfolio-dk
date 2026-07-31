export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const PIECES = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type PieceType = (typeof PIECES)[number];
export type GamePhase = "ready" | "playing" | "paused" | "gameover";
export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ActivePiece = { type: PieceType; rotation: number; x: number; y: number };
export type NeonBlocksGame = {
  board: Cell[][];
  active: ActivePiece;
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  phase: GamePhase;
  score: number;
  lines: number;
  level: number;
  combo: number;
  bestCombo: number;
  accumulatorMs: number;
  seed: number;
};

type Point = readonly [number, number];

const BASE: Record<Exclude<PieceType, "I" | "O">, Point[]> = {
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};
const I_ROTATIONS: Point[][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1]],
  [[2, 0], [2, 1], [2, 2], [2, 3]],
  [[0, 2], [1, 2], [2, 2], [3, 2]],
  [[1, 0], [1, 1], [1, 2], [1, 3]],
];
const O_ROTATION: Point[] = [[1, 0], [2, 0], [1, 1], [2, 1]];
const rotatePoint = ([x, y]: Point): Point => [2 - y, x];

export const pieceCells = (piece: ActivePiece): Array<{ x: number; y: number }> => {
  const turns = ((piece.rotation % 4) + 4) % 4;
  let shape: Point[];
  if (piece.type === "I") shape = I_ROTATIONS[turns];
  else if (piece.type === "O") shape = O_ROTATION;
  else {
    shape = BASE[piece.type];
    for (let index = 0; index < turns; index += 1) shape = shape.map(rotatePoint);
  }
  return shape.map(([x, y]) => ({ x: x + piece.x, y: y + piece.y }));
};

const emptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(0));

const randomStep = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

const shuffledBag = (seed: number) => {
  const bag = [...PIECES];
  let nextSeed = seed >>> 0;
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const random = randomStep(nextSeed);
    nextSeed = random.seed;
    const target = Math.floor(random.value * (index + 1));
    [bag[index], bag[target]] = [bag[target], bag[index]];
  }
  return { bag, seed: nextSeed };
};

const fillQueue = (queue: PieceType[], seed: number, minimum = 7) => {
  const nextQueue = [...queue];
  let nextSeed = seed;
  while (nextQueue.length < minimum) {
    const shuffled = shuffledBag(nextSeed);
    nextQueue.push(...shuffled.bag);
    nextSeed = shuffled.seed;
  }
  return { queue: nextQueue, seed: nextSeed };
};

const spawnPiece = (type: PieceType): ActivePiece => ({ type, rotation: 0, x: 3, y: -1 });

export const collides = (board: Cell[][], piece: ActivePiece) =>
  pieceCells(piece).some(({ x, y }) =>
    x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && board[y][x] !== 0));

const takeNext = (game: NeonBlocksGame): NeonBlocksGame => {
  const filled = fillQueue(game.queue, game.seed);
  const [type, ...remaining] = filled.queue;
  const replenished = fillQueue(remaining, filled.seed);
  const active = spawnPiece(type);
  return {
    ...game,
    active,
    queue: replenished.queue,
    seed: replenished.seed,
    canHold: true,
    accumulatorMs: 0,
    phase: collides(game.board, active) ? "gameover" : game.phase,
  };
};

export const createGame = (seed = Date.now()): NeonBlocksGame => {
  const filled = fillQueue([], seed >>> 0);
  const [type, ...queue] = filled.queue;
  const replenished = fillQueue(queue, filled.seed);
  return {
    board: emptyBoard(),
    active: spawnPiece(type),
    queue: replenished.queue,
    hold: null,
    canHold: true,
    phase: "ready",
    score: 0,
    lines: 0,
    level: 1,
    combo: 0,
    bestCombo: 0,
    accumulatorMs: 0,
    seed: replenished.seed,
  };
};

export const startGame = (game: NeonBlocksGame): NeonBlocksGame =>
  game.phase === "ready" ? { ...game, phase: "playing" } : game;

export const togglePause = (game: NeonBlocksGame): NeonBlocksGame =>
  game.phase === "playing"
    ? { ...game, phase: "paused" }
    : game.phase === "paused" ? { ...game, phase: "playing" } : game;

export const movePiece = (game: NeonBlocksGame, dx: -1 | 1): NeonBlocksGame => {
  if (game.phase !== "playing") return game;
  const active = { ...game.active, x: game.active.x + dx };
  return collides(game.board, active) ? game : { ...game, active };
};

export const rotatePiece = (game: NeonBlocksGame, direction: -1 | 1): NeonBlocksGame => {
  if (game.phase !== "playing") return game;
  const rotation = (game.active.rotation + direction + 4) % 4;
  for (const kick of [0, -1, 1, -2, 2]) {
    const active = { ...game.active, rotation, x: game.active.x + kick };
    if (!collides(game.board, active)) return { ...game, active };
  }
  return game;
};

const clearLines = (board: Cell[][]) => {
  const remaining = board.filter((row) => row.some((cell) => cell === 0));
  const cleared = BOARD_HEIGHT - remaining.length;
  return {
    cleared,
    board: [
      ...Array.from({ length: cleared }, () => Array<Cell>(BOARD_WIDTH).fill(0)),
      ...remaining,
    ],
  };
};

const lockPiece = (game: NeonBlocksGame): NeonBlocksGame => {
  if (collides(game.board, game.active)) return { ...game, phase: "gameover" };
  const cells = pieceCells(game.active);
  if (cells.some(({ y }) => y < 0)) return { ...game, phase: "gameover" };
  const board = game.board.map((row) => [...row]);
  const color = (PIECES.indexOf(game.active.type) + 1) as Cell;
  cells.forEach(({ x, y }) => { board[y][x] = color; });
  const result = clearLines(board);
  const combo = result.cleared > 0 ? game.combo + 1 : 0;
  const lineScore = [0, 100, 300, 500, 800][result.cleared] * game.level;
  const comboScore = result.cleared > 0 ? Math.max(0, combo - 1) * 50 * game.level : 0;
  const lines = game.lines + result.cleared;
  return takeNext({
    ...game,
    board: result.board,
    lines,
    level: Math.floor(lines / 10) + 1,
    score: game.score + lineScore + comboScore,
    combo,
    bestCombo: Math.max(game.bestCombo, combo),
  });
};

export const getGhostY = (game: NeonBlocksGame) => {
  let y = game.active.y;
  while (!collides(game.board, { ...game.active, y: y + 1 })) y += 1;
  return y;
};

export const softDrop = (game: NeonBlocksGame): NeonBlocksGame => {
  if (game.phase !== "playing") return game;
  const active = { ...game.active, y: game.active.y + 1 };
  return collides(game.board, active)
    ? lockPiece(game)
    : { ...game, active, score: game.score + 1 };
};

export const hardDrop = (game: NeonBlocksGame): NeonBlocksGame => {
  if (game.phase !== "playing") return game;
  if (collides(game.board, game.active)) return { ...game, phase: "gameover" };
  const y = getGhostY(game);
  const distance = y - game.active.y;
  return lockPiece({ ...game, active: { ...game.active, y }, score: game.score + distance * 2 });
};

export const holdPiece = (game: NeonBlocksGame): NeonBlocksGame => {
  if (game.phase !== "playing" || !game.canHold) return game;
  if (game.hold) {
    const active = spawnPiece(game.hold);
    return {
      ...game,
      active,
      hold: game.active.type,
      canHold: false,
      phase: collides(game.board, active) ? "gameover" : game.phase,
    };
  }
  const current = game.active.type;
  const next = takeNext(game);
  return { ...next, hold: current, canHold: false };
};

export const gravityMs = (level: number) => Math.max(70, 850 - (Math.max(1, level) - 1) * 65);

export const tickGame = (game: NeonBlocksGame, elapsedMs: number): NeonBlocksGame => {
  if (game.phase !== "playing" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return game;
  let next = { ...game, accumulatorMs: game.accumulatorMs + Math.min(elapsedMs, 60_000) };
  let guard = 0;
  while (next.phase === "playing" && next.accumulatorMs >= gravityMs(next.level) && guard < 512) {
    const interval = gravityMs(next.level);
    const active = { ...next.active, y: next.active.y + 1 };
    next = collides(next.board, active)
      ? { ...lockPiece(next), accumulatorMs: Math.max(0, next.accumulatorMs - interval) }
      : { ...next, active, accumulatorMs: next.accumulatorMs - interval };
    guard += 1;
  }
  return next;
};

