import {
  DIFFICULTIES,
  GRID,
  getStage,
  type Cell,
  type Difficulty,
  type SkillType,
} from "./neon-serpent-data.ts";

export type Direction = "up" | "down" | "left" | "right";
export type RunPhase = "ready" | "playing" | "paused" | "stageClear" | "victory" | "gameover";

export type Pickup = {
  id: number;
  type: SkillType;
  cell: Cell;
  expiresMs: number;
};

export type SerpentEvent = {
  id: number;
  type: "core" | "damage" | "shield" | "skill" | "portal" | "stage" | "boss";
  label?: string;
};

export type SerpentRun = {
  difficulty: Difficulty;
  mode: "campaign" | "endless";
  phase: RunPhase;
  stage: number;
  wave: number;
  snake: Cell[];
  direction: Direction;
  queuedDirection: Direction;
  core: Cell;
  pickups: Pickup[];
  lives: number;
  shieldCharges: number;
  score: number;
  combo: number;
  comboRemainingMs: number;
  coresCollected: number;
  target: number;
  tickMs: number;
  accumulatorMs: number;
  invulnerableMs: number;
  effects: Record<Exclude<SkillType, "shield">, number>;
  seed: number;
  nextId: number;
  event: SerpentEvent | null;
  campaignComplete: boolean;
};

const START_SNAKE: Cell[] = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
  { x: 4, y: 8 },
];

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const inside = (cell: Cell) => cell.x >= 0 && cell.x < GRID.columns && cell.y >= 0 && cell.y < GRID.rows;

const advanceSeed = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

const freeCell = (state: Pick<SerpentRun, "seed" | "snake" | "stage">) => {
  let seed = state.seed;
  const walls = getStage(state.stage).walls;
  for (let attempt = 0; attempt < GRID.columns * GRID.rows; attempt += 1) {
    const randomX = advanceSeed(seed);
    const randomY = advanceSeed(randomX.seed);
    seed = randomY.seed;
    const cell = {
      x: Math.floor(randomX.value * GRID.columns),
      y: Math.floor(randomY.value * GRID.rows),
    };
    if (!state.snake.some((part) => sameCell(part, cell)) && !walls.some((wall) => sameCell(wall, cell))) {
      return { cell, seed };
    }
  }
  return { cell: { x: 12, y: 8 }, seed };
};

export const createSerpentRun = (
  difficulty: Difficulty = "normal",
  stage = 1,
  seed = 20260729,
): SerpentRun => {
  const definition = getStage(stage);
  const settings = DIFFICULTIES[difficulty];
  const base = {
    difficulty,
    mode: "campaign" as const,
    phase: "ready" as const,
    stage: definition.id,
    wave: 0,
    snake: START_SNAKE.map((cell) => ({ ...cell })),
    direction: "right" as const,
    queuedDirection: "right" as const,
    core: { x: 12, y: 8 },
    pickups: [],
    lives: settings.lives,
    shieldCharges: settings.startingShield,
    score: 0,
    combo: 1,
    comboRemainingMs: settings.comboMs,
    coresCollected: 0,
    target: definition.target,
    tickMs: Math.round(definition.tickMs * settings.speedScale),
    accumulatorMs: 0,
    invulnerableMs: 0,
    effects: { magnet: 0, slowTime: 0, phase: 0, scoreBoost: 0 },
    seed: seed >>> 0,
    nextId: 1,
    event: null,
    campaignComplete: false,
  };
  const spawned = freeCell(base);
  return { ...base, core: spawned.cell, seed: spawned.seed };
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const queueDirection = (state: SerpentRun, direction: Direction): SerpentRun => {
  if (OPPOSITE[state.direction] === direction) return state;
  return { ...state, queuedDirection: direction, phase: state.phase === "ready" ? "playing" : state.phase };
};

const nextHead = (head: Cell, direction: Direction): Cell => {
  if (direction === "up") return { x: head.x, y: head.y - 1 };
  if (direction === "down") return { x: head.x, y: head.y + 1 };
  if (direction === "left") return { x: head.x - 1, y: head.y };
  return { x: head.x + 1, y: head.y };
};

export const isDangerousCell = (state: SerpentRun, cell: Cell) =>
  !inside(cell) || getStage(state.stage).walls.some((wall) => sameCell(wall, cell));

const respawn = (state: SerpentRun, shielded: boolean): SerpentRun => {
  const lives = shielded ? state.lives : state.lives - 1;
  return {
    ...state,
    phase: lives <= 0 ? "gameover" : "playing",
    lives: Math.max(0, lives),
    shieldCharges: shielded ? state.shieldCharges - 1 : state.shieldCharges,
    snake: START_SNAKE.map((cell) => ({ ...cell })),
    direction: "right",
    queuedDirection: "right",
    combo: 1,
    invulnerableMs: 1200,
    event: { id: state.nextId, type: shielded ? "shield" : "damage", label: shielded ? "SHIELD" : "-1 LIFE" },
    nextId: state.nextId + 1,
  };
};

const moveOneTick = (state: SerpentRun): SerpentRun => {
  const direction = state.queuedDirection;
  const head = nextHead(state.snake[0], direction);
  const phaseSafe = state.effects.phase > 0;
  const selfHit = state.snake.slice(0, -1).some((cell) => sameCell(cell, head));
  if (state.invulnerableMs <= 0 && ((!phaseSafe && isDangerousCell(state, head)) || (!phaseSafe && selfHit))) {
    return respawn(state, state.shieldCharges > 0);
  }
  const ate = sameCell(head, state.core);
  const snake = [head, ...state.snake];
  if (!ate) snake.pop();
  let next: SerpentRun = { ...state, phase: "playing", direction, snake };
  if (ate) {
    const settings = DIFFICULTIES[state.difficulty];
    const combo = state.comboRemainingMs > 0 ? Math.min(9, state.combo + 1) : 1;
    const multiplier = state.effects.scoreBoost > 0 ? 2 : 1;
    const spawned = freeCell({ ...next, seed: state.seed });
    next = {
      ...next,
      seed: spawned.seed,
      core: spawned.cell,
      coresCollected: state.coresCollected + 1,
      combo,
      comboRemainingMs: settings.comboMs,
      score: state.score + Math.round(100 * combo * multiplier * settings.scoreScale),
      event: { id: state.nextId, type: "core", label: `x${combo}` },
      nextId: state.nextId + 1,
    };
  }
  return next;
};

export const stepSerpent = (state: SerpentRun, elapsedMs: number): SerpentRun => {
  if (state.phase === "paused" || state.phase === "stageClear" || state.phase === "victory" || state.phase === "gameover") return state;
  let next: SerpentRun = {
    ...state,
    phase: state.phase === "ready" ? "playing" : state.phase,
    accumulatorMs: state.accumulatorMs + Math.max(0, elapsedMs),
    invulnerableMs: Math.max(0, state.invulnerableMs - elapsedMs),
    comboRemainingMs: Math.max(0, state.comboRemainingMs - elapsedMs),
  };
  while (next.accumulatorMs >= next.tickMs) {
    next = { ...moveOneTick(next), accumulatorMs: next.accumulatorMs - next.tickMs };
    if (next.phase === "gameover") break;
  }
  return next;
};
