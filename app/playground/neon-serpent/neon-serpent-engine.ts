import {
  DIFFICULTIES,
  GRID,
  SKILLS,
  STAGES,
  getStage,
  type BossType,
  type Cell,
  type Difficulty,
  type SkillType,
  type StageDefinition,
} from "./neon-serpent-data.ts";

export type Direction = "up" | "down" | "left" | "right";
export type RunPhase = "ready" | "playing" | "paused" | "stageClear" | "victory" | "gameover";
export type Pickup = { id: number; type: SkillType; cell: Cell; expiresMs: number };
export type BossState = { type: BossType; phase: number; shield: number; maxShield: number; elapsedMs: number };
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
  boss: BossState | null;
  seed: number;
  nextId: number;
  event: SerpentEvent | null;
  campaignComplete: boolean;
  portalCooldownMs: number;
  boundaryInset: number;
  hunter: Cell | null;
  hazardElapsedMs: number;
  exitPortal: Cell | null;
};

const START_SNAKE: Cell[] = [
  { x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 },
];
const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const inside = (cell: Cell, inset = 0) =>
  cell.x >= inset && cell.x < GRID.columns - inset && cell.y >= inset && cell.y < GRID.rows - inset;
const advanceSeed = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};
export const getRunDefinition = (state: Pick<SerpentRun, "stage" | "mode" | "wave" | "difficulty" | "seed">) =>
  state.mode === "endless" ? generateEndlessStage(state.wave, state.difficulty, state.seed) : getStage(state.stage);
const freeCell = (state: Pick<SerpentRun, "seed" | "snake" | "stage" | "mode" | "wave" | "difficulty"> & Partial<Pick<SerpentRun, "boundaryInset" | "hunter" | "pickups" | "core">>) => {
  let seed = state.seed;
  const walls = getRunDefinition(state).walls;
  for (let attempt = 0; attempt < GRID.columns * GRID.rows; attempt += 1) {
    const randomX = advanceSeed(seed);
    const randomY = advanceSeed(randomX.seed);
    seed = randomY.seed;
    const cell = { x: Math.floor(randomX.value * GRID.columns), y: Math.floor(randomY.value * GRID.rows) };
    const portals = getRunDefinition(state).portals ?? [];
    const blocked = !inside(cell, state.boundaryInset ?? 0)
      || state.snake.some((part) => sameCell(part, cell)) || walls.some((wall) => sameCell(wall, cell))
      || portals.some((portal) => sameCell(portal, cell))
      || Boolean(state.hunter && sameCell(state.hunter, cell))
      || Boolean(state.core && sameCell(state.core, cell))
      || Boolean(state.pickups?.some((pickup) => sameCell(pickup.cell, cell)));
    if (!blocked) {
      return { cell, seed };
    }
  }
  return { cell: { x: 12, y: 8 }, seed };
};
const bossFor = (boss?: BossType): BossState | null => boss
  ? { type: boss, phase: 1, shield: boss === "hydra" ? 12 : 8, maxShield: boss === "hydra" ? 12 : 8, elapsedMs: 0 }
  : null;

export const generateEndlessStage = (wave: number, difficulty: Difficulty, seed: number): StageDefinition => {
  const safeWave = Math.max(1, Math.min(999, Math.floor(wave)));
  const inset = Math.min(3, Math.floor(safeWave / 14));
  const random = advanceSeed((seed ^ safeWave) >>> 0);
  const boss = safeWave % 5 === 0 ? (safeWave % 10 === 0 ? "sentinel" : "hydra") : undefined;
  const walls = Array.from({ length: Math.min(18, 3 + Math.floor(safeWave / 2)) }, (_, index) => ({
    x: 3 + ((index * 7 + Math.floor(random.value * 11)) % 18),
    y: 2 + ((index * 5 + safeWave) % 12),
  })).filter((cell) => cell.x >= inset && cell.x < GRID.columns - inset);
  return {
    id: 8,
    name: `Endless ${safeWave}`,
    subtitle: boss ? "Boss signal" : "Grid instability",
    target: Math.min(28, 10 + Math.floor(safeWave * 0.8)),
    tickMs: Math.max(72, 132 - safeWave * 2 - (difficulty === "hard" ? 8 : 0)),
    hazards: [
      "wall",
      ...(safeWave >= 2 ? ["laser" as const] : []),
      ...(safeWave >= 4 ? ["portal" as const] : []),
      ...(safeWave >= 7 ? ["hunter" as const] : []),
      ...(safeWave >= 12 ? ["contract" as const] : []),
    ],
    walls,
    portals: safeWave >= 4 ? [{ x: 2 + inset, y: 2 + inset }, { x: 21 - inset, y: 13 - inset }] : undefined,
    boss,
  };
};

export const createSerpentRun = (difficulty: Difficulty = "normal", stage = 1, seed = 20260729): SerpentRun => {
  const definition = getStage(stage);
  const settings = DIFFICULTIES[difficulty];
  const base: SerpentRun = {
    difficulty, mode: "campaign", phase: "ready", stage: definition.id, wave: 0,
    snake: START_SNAKE.map((cell) => ({ ...cell })), direction: "right", queuedDirection: "right",
    core: { x: 12, y: 8 }, pickups: [], lives: settings.lives,
    shieldCharges: settings.startingShield, score: 0, combo: 1,
    comboRemainingMs: settings.comboMs, coresCollected: 0, target: definition.target,
    tickMs: Math.round(definition.tickMs * settings.speedScale), accumulatorMs: 0,
    invulnerableMs: 0, effects: { magnet: 0, slowTime: 0, phase: 0, scoreBoost: 0 },
    boss: bossFor(definition.boss), seed: seed >>> 0, nextId: 1, event: null,
    campaignComplete: false, portalCooldownMs: 0, boundaryInset: 0,
    hunter: definition.hazards.includes("hunter") ? { x: 20, y: 13 } : null,
    hazardElapsedMs: 0, exitPortal: null,
  };
  const spawned = freeCell(base);
  return { ...base, core: spawned.cell, seed: spawned.seed };
};

const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
export const queueDirection = (state: SerpentRun, direction: Direction): SerpentRun =>
  OPPOSITE[state.direction] === direction
    ? state
    : { ...state, queuedDirection: direction, phase: state.phase === "ready" ? "playing" : state.phase };
const nextHead = (head: Cell, direction: Direction): Cell => direction === "up"
  ? { x: head.x, y: head.y - 1 }
  : direction === "down"
    ? { x: head.x, y: head.y + 1 }
    : direction === "left" ? { x: head.x - 1, y: head.y } : { x: head.x + 1, y: head.y };

export const activeLaserCells = (state: SerpentRun): Cell[] => {
  const definition = getRunDefinition(state);
  if (!definition.hazards.includes("laser")) return [];
  const elapsed = state.boss?.elapsedMs ?? state.hazardElapsedMs;
  if (elapsed % 2600 < 1800) return [];
  const phase = state.boss?.phase ?? 1;
  const lane = (phase * 3 + Math.floor(elapsed / 2600)) % GRID.rows;
  const cells = Array.from({ length: GRID.columns }, (_, x) => ({ x, y: lane }));
  if (state.boss?.type === "hydra") cells.push(...Array.from({ length: GRID.rows }, (_, y) => ({ x: (lane * 5) % GRID.columns, y })));
  return cells;
};
const laserDanger = (state: SerpentRun, cell: Cell) => activeLaserCells(state).some((laser) => sameCell(laser, cell));
export const isDangerousCell = (state: SerpentRun, cell: Cell) => {
  const definition = getRunDefinition(state);
  return !inside(cell, state.boundaryInset)
    || definition.walls.some((wall) => sameCell(wall, cell))
    || Boolean(state.hunter && sameCell(state.hunter, cell))
    || laserDanger(state, cell);
};

const withEvent = (state: SerpentRun, type: SerpentEvent["type"], label?: string): SerpentRun => ({
  ...state, nextId: state.nextId + 1, event: { id: state.nextId, type, label },
});
const respawn = (state: SerpentRun, shielded: boolean): SerpentRun => {
  const lives = shielded ? state.lives : state.lives - 1;
  return withEvent({
    ...state, phase: lives <= 0 ? "gameover" : "playing", lives: Math.max(0, lives),
    shieldCharges: shielded ? state.shieldCharges - 1 : state.shieldCharges,
    snake: START_SNAKE.map((cell) => ({ ...cell })), direction: "right", queuedDirection: "right",
    combo: 1, invulnerableMs: 1200,
  }, shielded ? "shield" : "damage", shielded ? "SHIELD" : "-1 LIFE");
};

export const collectPickup = (state: SerpentRun, pickupId: number): SerpentRun => {
  const pickup = state.pickups.find((item) => item.id === pickupId);
  if (!pickup) return state;
  const next = { ...state, pickups: state.pickups.filter((item) => item.id !== pickupId) };
  if (pickup.type === "shield") {
    return withEvent({ ...next, shieldCharges: Math.min(SKILLS.shield.maxCharges, state.shieldCharges + 1) }, "skill", "SHIELD");
  }
  return withEvent({
    ...next,
    effects: { ...state.effects, [pickup.type]: SKILLS[pickup.type].durationMs },
  }, "skill", SKILLS[pickup.type].label.toUpperCase());
};

const maybeDropPickup = (state: SerpentRun): SerpentRun => {
  if ((state.coresCollected + 1) % 4 !== 0) return state;
  const types: SkillType[] = ["shield", "magnet", "slowTime", "phase", "scoreBoost"];
  const type = types[(state.coresCollected + state.stage + state.wave) % types.length];
  const spawned = freeCell(state);
  return {
    ...state, seed: spawned.seed, nextId: state.nextId + 1,
    pickups: [...state.pickups, { id: state.nextId, type, cell: spawned.cell, expiresMs: 9000 }],
  };
};
const portalDestination = (state: SerpentRun, head: Cell) => {
  const portals = getRunDefinition(state).portals;
  if (!portals || state.portalCooldownMs > 0) return head;
  if (sameCell(head, portals[0])) return { ...portals[1] };
  if (sameCell(head, portals[1])) return { ...portals[0] };
  return head;
};
const moveHunter = (state: SerpentRun) => {
  if (!state.hunter || state.coresCollected % 2 !== 0) return state.hunter;
  const target = state.snake[Math.min(state.snake.length - 1, 3)];
  const dx = Math.sign(target.x - state.hunter.x);
  const dy = Math.sign(target.y - state.hunter.y);
  return Math.abs(target.x - state.hunter.x) > Math.abs(target.y - state.hunter.y)
    ? { x: state.hunter.x + dx, y: state.hunter.y }
    : { x: state.hunter.x, y: state.hunter.y + dy };
};

const moveOneTick = (state: SerpentRun): SerpentRun => {
  const direction = state.queuedDirection;
  const rawHead = nextHead(state.snake[0], direction);
  const head = portalDestination(state, rawHead);
  const phaseSafe = state.effects.phase > 0;
  const selfHit = state.snake.slice(0, -1).some((cell) => sameCell(cell, head));
  if (state.exitPortal && sameCell(state.exitPortal, head)) {
    return withEvent({ ...state, snake: [head, ...state.snake.slice(0, -1)], phase: "stageClear" }, "stage", "STAGE CLEAR");
  }
  const definition = getRunDefinition(state);
  const phaseBlocked = !inside(head, state.boundaryInset) || Boolean(state.hunter && sameCell(state.hunter, head)) || laserDanger(state, head);
  const normalBlocked = phaseBlocked || definition.walls.some((wall) => sameCell(wall, head)) || selfHit;
  if (state.invulnerableMs <= 0 && (phaseSafe ? phaseBlocked : normalBlocked)) {
    return respawn(state, state.shieldCharges > 0);
  }
  const ate = sameCell(head, state.core);
  const snake = [head, ...state.snake];
  if (!ate) snake.pop();
  let next: SerpentRun = {
    ...state, phase: "playing", direction, snake, hunter: moveHunter(state),
    portalCooldownMs: sameCell(head, rawHead) ? Math.max(0, state.portalCooldownMs) : 900,
  };
  const pickup = next.pickups.find((item) => sameCell(item.cell, head));
  if (pickup) next = collectPickup(next, pickup.id);
  if (!ate) return next;
  const settings = DIFFICULTIES[state.difficulty];
  const combo = state.comboRemainingMs > 0 ? Math.min(9, state.combo + 1) : 1;
  const multiplier = state.effects.scoreBoost > 0 ? 2 : 1;
  const boss = state.boss ? { ...state.boss, shield: Math.max(0, state.boss.shield - 1) } : null;
  const spawned = freeCell({ ...next, seed: state.seed });
  next = maybeDropPickup({
    ...next, seed: spawned.seed, core: spawned.cell, coresCollected: state.coresCollected + 1,
    combo, comboRemainingMs: settings.comboMs,
    score: state.score + Math.round(100 * combo * multiplier * settings.scoreScale),
    boss, event: { id: state.nextId, type: "core", label: `x${combo}` }, nextId: state.nextId + 1,
  });
  if ((boss && boss.shield === 0) || (!boss && next.coresCollected >= next.target)) {
    const exit = freeCell({ ...next, snake: [...next.snake, next.core] });
    return withEvent({ ...next, seed: exit.seed, exitPortal: exit.cell }, boss ? "boss" : "stage", "PORTAL OPEN");
  }
  return next;
};

export const stepSerpent = (state: SerpentRun, elapsedMs: number): SerpentRun => {
  if (["paused", "stageClear", "victory", "gameover"].includes(state.phase)) return state;
  const definition = getRunDefinition(state);
  const elapsed = Math.max(0, elapsedMs);
  const bossElapsed = (state.boss?.elapsedMs ?? 0) + elapsed;
  const boss = state.boss ? {
    ...state.boss,
    elapsedMs: bossElapsed,
    phase: state.boss.type === "hydra" ? (state.boss.shield <= 4 ? 3 : state.boss.shield <= 8 ? 2 : 1) : 1,
  } : null;
  const contract = definition.hazards.includes("contract")
    ? Math.min(3, Math.floor((state.coresCollected + Math.floor(bossElapsed / 9000)) / 6))
    : 0;
  let next: SerpentRun = {
    ...state, boss, boundaryInset: contract, hazardElapsedMs: state.hazardElapsedMs + elapsed, phase: state.phase === "ready" ? "playing" : state.phase,
    accumulatorMs: state.accumulatorMs + elapsed,
    invulnerableMs: Math.max(0, state.invulnerableMs - elapsed),
    comboRemainingMs: Math.max(0, state.comboRemainingMs - elapsed),
    portalCooldownMs: Math.max(0, state.portalCooldownMs - elapsed),
    pickups: state.pickups
      .map((item) => ({ ...item, expiresMs: item.expiresMs - elapsed }))
      .filter((item) => item.expiresMs > 0),
    effects: {
      magnet: Math.max(0, state.effects.magnet - elapsed),
      slowTime: Math.max(0, state.effects.slowTime - elapsed),
      phase: Math.max(0, state.effects.phase - elapsed),
      scoreBoost: Math.max(0, state.effects.scoreBoost - elapsed),
    },
  };
  const effectiveTick = next.effects.slowTime > 0 ? next.tickMs * 1.45 : next.tickMs;
  while (next.accumulatorMs >= effectiveTick) {
    next = { ...moveOneTick(next), accumulatorMs: next.accumulatorMs - effectiveTick };
    if (next.phase !== "playing") break;
    if (next.effects.magnet > 0) {
      const head = next.snake[0];
      const dx = Math.sign(head.x - next.core.x);
      const dy = Math.sign(head.y - next.core.y);
      const pulled = Math.abs(head.x - next.core.x) >= Math.abs(head.y - next.core.y) ? { x: next.core.x + dx, y: next.core.y } : { x: next.core.x, y: next.core.y + dy };
      if (!isDangerousCell(next, pulled) && !next.snake.some((cell) => sameCell(cell, pulled))) next = { ...next, core: pulled };
    }
  }
  return next;
};

export const advanceStage = (state: SerpentRun): SerpentRun => {
  if (state.phase !== "stageClear") return state;
  if (state.mode === "campaign" && state.stage >= STAGES.length) {
    return withEvent({ ...state, phase: "victory", campaignComplete: true }, "stage", "CAMPAIGN COMPLETE");
  }
  if (state.mode === "endless") {
    const next = createSerpentRun(state.difficulty, 8, state.seed);
    const definition = generateEndlessStage(state.wave + 1, state.difficulty, state.seed);
    return { ...next, mode: "endless", wave: state.wave + 1, phase: "ready", score: state.score,
      campaignComplete: true, target: definition.target, tickMs: definition.tickMs, boss: bossFor(definition.boss) };
  }
  const next = createSerpentRun(state.difficulty, state.stage + 1, state.seed);
  return { ...next, score: state.score, lives: state.lives, shieldCharges: state.shieldCharges };
};

export const startEndless = (state: SerpentRun, unlocked = state.campaignComplete): SerpentRun => {
  if (!unlocked) return state;
  const next = createSerpentRun(state.difficulty, 8, state.seed);
  const definition = generateEndlessStage(1, state.difficulty, state.seed);
  return { ...next, mode: "endless", wave: 1, campaignComplete: true,
    target: definition.target, tickMs: definition.tickMs, boss: bossFor(definition.boss) };
};
