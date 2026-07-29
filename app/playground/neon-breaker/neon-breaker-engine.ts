import { LEVELS, type BrickKind, type LevelDefinition } from "./neon-breaker-levels.ts";

export const WORLD_WIDTH = 900;
export const WORLD_HEIGHT = 1125;
export const FIXED_STEP_MS = 16;
export const BALL_RADIUS = 11;
export const MIN_BALL_SPEED = 480;
export const MAX_BALL_SPEED = 1250;
export const MAX_BALLS = 5;

const PADDLE_Y = 1040;
const PADDLE_HEIGHT = 24;
const PADDLE_WIDTH = 150;
const WIDE_PADDLE_WIDTH = 230;
const PADDLE_SPEED = 650;
const BRICK_WIDTH = 72;
const BRICK_HEIGHT = 40;
const BRICK_GAP_X = 8;
const BRICK_GAP_Y = 12;
const BRICK_START_X = 54;
const BRICK_START_Y = 145;
const DROP_SIZE = 28;
const DROP_SPEED = 230;
const MAX_REBOUND_ANGLE = Math.PI * 0.38;

export type BreakerPhase =
  | "ready"
  | "playing"
  | "paused"
  | "level-clear"
  | "gameover"
  | "victory";

export type PowerUpType =
  | "wide"
  | "multiball"
  | "slow"
  | "laser"
  | "shield"
  | "sticky";
export type ReadyReason = "initial" | "life-lost" | "shield" | "sticky" | "next-level";
export type SkillState = {
  laserShots: number;
  shieldCharges: number;
  stickyArmed: boolean;
};
export type BreakerEvent =
  | "launch"
  | "paddle"
  | "wall"
  | "brick"
  | "power-drop"
  | "power-collect"
  | "laser"
  | "shield"
  | "sticky"
  | "life-lost"
  | "level-clear"
  | "gameover"
  | "victory"
  | null;

export type BreakerInput = {
  left: boolean;
  right: boolean;
  pointerX: number | null;
};

export type PaddleState = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
};

export type BallState = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseSpeed: number;
  speed: number;
  attached: boolean;
};

export type BrickState = {
  id: string;
  kind: BrickKind;
  x: number;
  y: number;
  width: number;
  height: number;
  hitsRemaining: number;
  destroyed: boolean;
};

export type PowerUpDrop = {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  size: number;
  vy: number;
};

export type ActiveEffects = {
  wideRemainingMs: number;
  slowRemainingMs: number;
};

export type BreakerState = {
  phase: BreakerPhase;
  readyReason: ReadyReason;
  level: number;
  levelName: string;
  levelSeed: number;
  lives: number;
  score: number;
  combo: number;
  paddle: PaddleState;
  balls: BallState[];
  bricks: BrickState[];
  drops: PowerUpDrop[];
  effects: ActiveEffects;
  skills: SkillState;
  elapsedMs: number;
  nextBallId: number;
  event: BreakerEvent;
  eventId: number;
};

type Rect = { x: number; y: number; width: number; height: number };
type Collision = {
  time: number;
  normalX: -1 | 0 | 1;
  normalY: -1 | 0 | 1;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const emit = (state: BreakerState, event: Exclude<BreakerEvent, null>): BreakerState => ({
  ...state,
  event,
  eventId: state.eventId + 1,
});

const createPaddle = (): PaddleState => ({
  x: (WORLD_WIDTH - PADDLE_WIDTH) / 2,
  y: PADDLE_Y,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED,
});

const createAttachedBall = (paddle: PaddleState, id: number): BallState => ({
  id,
  x: paddle.x + paddle.width / 2,
  y: paddle.y - BALL_RADIUS - 3,
  vx: 0,
  vy: 0,
  radius: BALL_RADIUS,
  baseSpeed: MIN_BALL_SPEED,
  speed: MIN_BALL_SPEED,
  attached: true,
});

const brickHits = (kind: BrickKind) =>
  kind === "reinforced" ? 2 : kind === "indestructible" ? Infinity : 1;

const buildBricks = (level: LevelDefinition): BrickState[] =>
  level.bricks.map((brick) => ({
    id: brick.id,
    kind: brick.kind,
    x: BRICK_START_X + brick.column * (BRICK_WIDTH + BRICK_GAP_X),
    y: BRICK_START_Y + brick.row * (BRICK_HEIGHT + BRICK_GAP_Y),
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    hitsRemaining: brickHits(brick.kind),
    destroyed: false,
  }));

const validLevel = (level: number) =>
  Number.isInteger(level) && level >= 1 && level <= LEVELS.length ? level : 1;

export function createRun(startingLevel = 1): BreakerState {
  const levelNumber = validLevel(startingLevel);
  const definition = LEVELS[levelNumber - 1];
  const paddle = createPaddle();
  return {
    phase: "ready",
    readyReason: "initial",
    level: levelNumber,
    levelName: definition.name,
    levelSeed: definition.seed,
    lives: 3,
    score: 0,
    combo: 1,
    paddle,
    balls: [createAttachedBall(paddle, 1)],
    bricks: buildBricks(definition),
    drops: [],
    effects: { wideRemainingMs: 0, slowRemainingMs: 0 },
    skills: { laserShots: 0, shieldCharges: 0, stickyArmed: false },
    elapsedMs: 0,
    nextBallId: 2,
    event: null,
    eventId: 0,
  };
}

export function launchBall(state: BreakerState): BreakerState {
  if (!["ready", "playing"].includes(state.phase) || !state.balls.some((ball) => ball.attached)) {
    return state;
  }
  const direction = (state.level + state.lives) % 2 === 0 ? 1 : -1;
  const angle = Math.PI * (0.42 + direction * 0.035);
  return emit({
    ...state,
    phase: "playing",
    balls: state.balls.map((ball) => ball.attached
      ? {
          ...ball,
          attached: false,
          vx: Math.cos(angle) * ball.speed,
          vy: -Math.abs(Math.sin(angle) * ball.speed),
        }
      : ball),
  }, "launch");
}

export function pauseRun(state: BreakerState): BreakerState {
  return state.phase === "playing" ? { ...state, phase: "paused" } : state;
}

export function resumeRun(state: BreakerState): BreakerState {
  return state.phase === "paused" ? { ...state, phase: "playing" } : state;
}

export function damageBrick(brick: BrickState): BrickState {
  if (brick.destroyed || brick.kind === "indestructible") return brick;
  const hitsRemaining = Math.max(0, brick.hitsRemaining - 1);
  return { ...brick, hitsRemaining, destroyed: hitsRemaining === 0 };
}

const rescaleBall = (ball: BallState, speed: number): BallState => {
  const magnitude = Math.hypot(ball.vx, ball.vy);
  if (magnitude === 0) return { ...ball, speed };
  return {
    ...ball,
    speed,
    vx: (ball.vx / magnitude) * speed,
    vy: (ball.vy / magnitude) * speed,
  };
};

const setBaseSpeed = (ball: BallState, baseSpeed: number, slowed: boolean) => {
  const boundedBase = Math.min(MAX_BALL_SPEED, Math.max(MIN_BALL_SPEED, baseSpeed));
  const actualSpeed = slowed
    ? Math.max(MIN_BALL_SPEED, boundedBase * 0.72)
    : boundedBase;
  return { ...rescaleBall(ball, actualSpeed), baseSpeed: boundedBase };
};

export function rewardBrickDamage(
  state: BreakerState,
  kind: Exclude<BrickKind, "indestructible">,
): BreakerState {
  const base = kind === "reinforced" ? 150 : 100;
  const score = state.score + Math.round(base * state.combo);
  const combo = Math.min(3, state.combo + 0.25);
  return {
    ...state,
    score,
    combo,
    balls: state.balls.map((ball) =>
      setBaseSpeed(
        ball,
        (ball.baseSpeed ?? ball.speed) * 1.018,
        state.effects.slowRemainingMs > 0,
      )),
  };
}

function segmentVsExpandedRect(
  ball: BallState,
  dx: number,
  dy: number,
  rect: Rect,
): Collision | null {
  const minX = rect.x - ball.radius;
  const maxX = rect.x + rect.width + ball.radius;
  const minY = rect.y - ball.radius;
  const maxY = rect.y + rect.height + ball.radius;

  let nearX = -Infinity;
  let farX = Infinity;
  if (dx === 0) {
    if (ball.x < minX || ball.x > maxX) return null;
  } else {
    const tx1 = (minX - ball.x) / dx;
    const tx2 = (maxX - ball.x) / dx;
    nearX = Math.min(tx1, tx2);
    farX = Math.max(tx1, tx2);
  }

  let nearY = -Infinity;
  let farY = Infinity;
  if (dy === 0) {
    if (ball.y < minY || ball.y > maxY) return null;
  } else {
    const ty1 = (minY - ball.y) / dy;
    const ty2 = (maxY - ball.y) / dy;
    nearY = Math.min(ty1, ty2);
    farY = Math.max(ty1, ty2);
  }

  const near = Math.max(nearX, nearY);
  const far = Math.min(farX, farY);
  if (near > far || far < 0 || near < 0 || near > 1) return null;

  if (nearX > nearY) {
    return { time: near, normalX: dx > 0 ? -1 : 1, normalY: 0 };
  }
  return { time: near, normalX: 0, normalY: dy > 0 ? -1 : 1 };
}

function hashText(value: string, seed: number) {
  let hash = seed | 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return Math.abs(hash);
}

export function powerUpForBrick(brickId: string, seed: number): PowerUpType | null {
  const hash = hashText(brickId, seed);
  if (hash % 7 !== 0) return null;
  return (["wide", "multiball", "slow", "laser", "shield", "sticky"] as const)[
    Math.floor(hash / 7) % 6
  ] ?? null;
}

function createDrop(brick: BrickState, state: BreakerState): PowerUpDrop | null {
  const type = powerUpForBrick(brick.id, state.levelSeed);
  if (!type) return null;
  return {
    id: `${brick.id}-${state.elapsedMs}`,
    type,
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
    size: DROP_SIZE,
    vy: DROP_SPEED,
  };
}

function movePaddle(state: BreakerState, input: BreakerInput, dt: number) {
  let x = state.paddle.x;
  if (Number.isFinite(input.pointerX)) {
    x = (input.pointerX as number) - state.paddle.width / 2;
  } else {
    x += (Number(input.right) - Number(input.left)) * state.paddle.speed * dt;
  }
  const paddle = {
    ...state.paddle,
    x: clamp(x, 0, WORLD_WIDTH - state.paddle.width),
  };
  return {
    ...state,
    paddle,
    balls: state.balls.map((ball) => ball.attached
      ? {
          ...ball,
          x: paddle.x + paddle.width / 2,
          y: paddle.y - ball.radius - 3,
        }
      : ball),
  };
}

function reboundFromPaddle(ball: BallState, paddle: PaddleState, slowed: boolean): BallState {
  const relative = clamp(
    (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2),
    -1,
    1,
  );
  const angle = relative * MAX_REBOUND_ANGLE;
  const baseSpeed = Math.min(
    MAX_BALL_SPEED,
    Math.max(MIN_BALL_SPEED, (ball.baseSpeed ?? ball.speed) * 1.01),
  );
  const speed = slowed ? Math.max(MIN_BALL_SPEED, baseSpeed * 0.72) : baseSpeed;
  return {
    ...ball,
    y: paddle.y - ball.radius - 0.1,
    vx: Math.sin(angle) * speed,
    vy: -Math.cos(angle) * speed,
    speed,
    baseSpeed,
  };
}

function advanceBall(
  initialState: BreakerState,
  ball: BallState,
  dt: number,
): { state: BreakerState; ball: BallState } {
  let state = initialState;
  let next = { ...ball };
  const dx = next.vx * dt;
  const dy = next.vy * dt;
  let nextX = next.x + dx;
  let nextY = next.y + dy;
  let event: BreakerEvent = null;

  if (nextX - next.radius < 0) {
    nextX = next.radius + (next.radius - nextX);
    next.vx = Math.abs(next.vx);
    event = "wall";
  } else if (nextX + next.radius > WORLD_WIDTH) {
    nextX = WORLD_WIDTH - next.radius - (nextX + next.radius - WORLD_WIDTH);
    next.vx = -Math.abs(next.vx);
    event = "wall";
  }
  if (nextY - next.radius < 0) {
    nextY = next.radius + (next.radius - nextY);
    next.vy = Math.abs(next.vy);
    event = "wall";
  }

  const paddleCollision = next.vy > 0
    && next.y + next.radius <= state.paddle.y
    && nextY + next.radius >= state.paddle.y
    && nextX + next.radius >= state.paddle.x
    && nextX - next.radius <= state.paddle.x + state.paddle.width;
  if (paddleCollision) {
    if (state.skills.stickyArmed) {
      next = {
        ...next,
        x: state.paddle.x + state.paddle.width / 2,
        y: state.paddle.y - next.radius - 3,
        vx: 0,
        vy: 0,
        attached: true,
      };
      nextX = next.x;
      nextY = next.y;
      const hasFreeBall = state.balls.some((item) => item.id !== ball.id && !item.attached);
      state = emit({
        ...state,
        phase: hasFreeBall ? "playing" : "ready",
        readyReason: "sticky",
        skills: { ...state.skills, stickyArmed: false },
      }, "sticky");
    } else {
      next = reboundFromPaddle(
        { ...next, x: nextX, y: nextY },
        state.paddle,
        state.effects.slowRemainingMs > 0,
      );
      nextX = next.x;
      nextY = next.y;
      event = "paddle";
    }
  } else {
    let earliest: { collision: Collision; brick: BrickState } | null = null;
    for (const brick of state.bricks) {
      if (brick.destroyed) continue;
      const collision = segmentVsExpandedRect(ball, dx, dy, brick);
      if (collision && (!earliest || collision.time < earliest.collision.time)) {
        earliest = { collision, brick };
      }
    }
    if (earliest) {
      const { collision, brick } = earliest;
      nextX = ball.x + dx * collision.time + collision.normalX * 0.1;
      nextY = ball.y + dy * collision.time + collision.normalY * 0.1;
      if (collision.normalX) next.vx *= -1;
      if (collision.normalY) next.vy *= -1;
      const damaged = damageBrick(brick);
      state = {
        ...state,
        bricks: state.bricks.map((item) => item.id === brick.id ? damaged : item),
      };
      if (brick.kind !== "indestructible") {
        state = rewardBrickDamage(state, brick.kind);
        const rewardedBall = state.balls.find((item) => item.id === next.id);
        next = {
          ...rescaleBall(next, rewardedBall?.speed ?? next.speed),
          baseSpeed: rewardedBall?.baseSpeed ?? next.baseSpeed,
        };
        if (damaged.destroyed) {
          const drop = createDrop(brick, state);
          if (drop) {
            state = { ...state, drops: [...state.drops, drop] };
            event = "power-drop";
          } else event = "brick";
        } else event = "brick";
      } else event = "wall";
    }
  }

  next = { ...next, x: nextX, y: nextY };
  if (event) state = emit(state, event);
  return { state, ball: next };
}

function updateEffects(state: BreakerState, deltaMs: number): BreakerState {
  const wideRemainingMs = Math.max(0, state.effects.wideRemainingMs - deltaMs);
  const slowRemainingMs = Math.max(0, state.effects.slowRemainingMs - deltaMs);
  const slowExpired = state.effects.slowRemainingMs > 0 && slowRemainingMs === 0;
  const width = wideRemainingMs > 0 ? WIDE_PADDLE_WIDTH : PADDLE_WIDTH;
  const paddle = {
    ...state.paddle,
    width,
    x: clamp(state.paddle.x, 0, WORLD_WIDTH - width),
  };
  return {
    ...state,
    balls: slowExpired
      ? state.balls.map((ball) => rescaleBall(ball, ball.baseSpeed ?? ball.speed))
      : state.balls,
    paddle,
    effects: { wideRemainingMs, slowRemainingMs },
  };
}

function updateDrops(state: BreakerState, dt: number): BreakerState {
  let next = state;
  const remaining: PowerUpDrop[] = [];
  for (const drop of state.drops) {
    const moved = { ...drop, y: drop.y + drop.vy * dt };
    const collected = moved.y + moved.size / 2 >= state.paddle.y
      && moved.y - moved.size / 2 <= state.paddle.y + state.paddle.height
      && moved.x + moved.size / 2 >= state.paddle.x
      && moved.x - moved.size / 2 <= state.paddle.x + state.paddle.width;
    if (collected) next = applyPowerUp(next, moved.type);
    else if (moved.y - moved.size / 2 <= WORLD_HEIGHT) remaining.push(moved);
  }
  return { ...next, drops: remaining };
}

function loseLife(state: BreakerState): BreakerState {
  if (state.skills.shieldCharges > 0) {
    const paddle = createPaddle();
    return emit({
      ...state,
      phase: "ready",
      readyReason: "shield",
      combo: 1,
      paddle,
      balls: [createAttachedBall(paddle, state.nextBallId)],
      nextBallId: state.nextBallId + 1,
      drops: [],
      effects: { wideRemainingMs: 0, slowRemainingMs: 0 },
      skills: { ...state.skills, shieldCharges: 0 },
    }, "shield");
  }
  const lives = state.lives - 1;
  if (lives <= 0) {
    return emit({
      ...state,
      lives: 0,
      balls: [],
      drops: [],
      combo: 1,
      phase: "gameover",
      readyReason: "life-lost",
      effects: { wideRemainingMs: 0, slowRemainingMs: 0 },
      paddle: createPaddle(),
    }, "gameover");
  }
  const paddle = createPaddle();
  return emit({
    ...state,
    lives,
    combo: 1,
    phase: "ready",
    readyReason: "life-lost",
    paddle,
    balls: [createAttachedBall(paddle, state.nextBallId)],
    nextBallId: state.nextBallId + 1,
    drops: [],
    effects: { wideRemainingMs: 0, slowRemainingMs: 0 },
  }, "life-lost");
}

export function evaluateProgress(state: BreakerState): BreakerState {
  if (state.phase !== "playing") return state;
  const cleared = state.bricks
    .filter((brick) => brick.kind !== "indestructible")
    .every((brick) => brick.destroyed);
  if (!cleared) return state;
  const scored = { ...state, score: state.score + state.lives * 500 };
  if (state.level >= LEVELS.length) {
    return emit({ ...scored, phase: "victory", balls: [], drops: [] }, "victory");
  }
  return emit({ ...scored, phase: "level-clear", balls: [], drops: [] }, "level-clear");
}

export function startNextLevel(state: BreakerState): BreakerState {
  if (state.phase !== "level-clear" || state.level >= LEVELS.length) return state;
  const level = state.level + 1;
  const definition = LEVELS[level - 1];
  const paddle = createPaddle();
  return {
    ...state,
    phase: "ready",
    readyReason: "next-level",
    level,
    levelName: definition.name,
    levelSeed: definition.seed,
    combo: 1,
    paddle,
    balls: [createAttachedBall(paddle, state.nextBallId)],
    nextBallId: state.nextBallId + 1,
    bricks: buildBricks(definition),
    drops: [],
    effects: { wideRemainingMs: 0, slowRemainingMs: 0 },
    event: null,
  };
}

export function fireLaser(state: BreakerState, worldX: number): BreakerState {
  if (state.skills.laserShots <= 0 || state.phase !== "playing") return state;
  const target = state.bricks
    .filter((brick) =>
      !brick.destroyed
      && brick.kind !== "indestructible"
      && worldX >= brick.x
      && worldX <= brick.x + brick.width)
    .sort((left, right) => right.y - left.y)[0];
  if (!target || target.kind === "indestructible") return state;
  const destroyed = { ...target, hitsRemaining: 0, destroyed: true };
  let next: BreakerState = {
    ...state,
    bricks: state.bricks.map((brick) => brick.id === target.id ? destroyed : brick),
    skills: { ...state.skills, laserShots: state.skills.laserShots - 1 },
  };
  next = rewardBrickDamage(next, target.kind);
  const drop = createDrop(target, next);
  if (drop) next = { ...next, drops: [...next.drops, drop] };
  return emit(next, "laser");
}

export function applyPowerUp(state: BreakerState, type: PowerUpType): BreakerState {
  if (type === "laser") {
    return emit({
      ...state,
      skills: { ...state.skills, laserShots: 3 },
    }, "power-collect");
  }
  if (type === "shield") {
    return emit({
      ...state,
      skills: { ...state.skills, shieldCharges: 1 },
    }, "power-collect");
  }
  if (type === "sticky") {
    return emit({
      ...state,
      skills: { ...state.skills, stickyArmed: true },
    }, "power-collect");
  }
  if (type === "wide") {
    const width = WIDE_PADDLE_WIDTH;
    return emit({
      ...state,
      paddle: {
        ...state.paddle,
        width,
        x: clamp(state.paddle.x, 0, WORLD_WIDTH - width),
      },
      effects: { ...state.effects, wideRemainingMs: 10_000 },
    }, "power-collect");
  }
  if (type === "slow") {
    const alreadySlowed = state.effects.slowRemainingMs > 0;
    return emit({
      ...state,
      balls: alreadySlowed
        ? state.balls
        : state.balls.map((ball) =>
            rescaleBall(
              { ...ball, baseSpeed: ball.baseSpeed ?? ball.speed },
              Math.max(MIN_BALL_SPEED, (ball.baseSpeed ?? ball.speed) * 0.72),
            )),
      effects: { ...state.effects, slowRemainingMs: 7_000 },
    }, "power-collect");
  }
  const source = state.balls.find((ball) => !ball.attached) ?? state.balls[0];
  if (!source) return state;
  const capacity = Math.max(0, MAX_BALLS - state.balls.length);
  const additions = [-0.36, 0.36].slice(0, capacity).map((angle, index) => {
    const baseAngle = Math.atan2(source.vy || -source.speed, source.vx || 1);
    return {
      ...source,
      id: state.nextBallId + index,
      attached: false,
      vx: Math.cos(baseAngle + angle) * source.speed,
      vy: Math.sin(baseAngle + angle) * source.speed,
    };
  });
  return emit({
    ...state,
    balls: [...state.balls, ...additions],
    nextBallId: state.nextBallId + additions.length,
  }, "power-collect");
}

export function step(
  state: BreakerState,
  deltaMs: number,
  input: BreakerInput,
): BreakerState {
  if (state.phase !== "playing") return state;
  const safeDelta = Number.isFinite(deltaMs) ? clamp(deltaMs, 0, 64) : 0;
  if (safeDelta === 0) return state;
  const dt = safeDelta / 1000;
  let next = movePaddle(updateEffects({
    ...state,
    elapsedMs: state.elapsedMs + safeDelta,
    event: null,
  }, safeDelta), input, dt);

  const movedBalls: BallState[] = [];
  for (const ball of next.balls) {
    const result = advanceBall(next, ball, dt);
    next = result.state;
    if (result.ball.y - result.ball.radius <= WORLD_HEIGHT) {
      movedBalls.push(result.ball);
    }
  }
  next = { ...next, balls: movedBalls };
  next = updateDrops(next, dt);
  if (next.balls.length === 0) return loseLife(next);
  return evaluateProgress(next);
}

export function advanceFixed(
  state: BreakerState,
  accumulatorMs: number,
  deltaMs: number,
  input: BreakerInput,
) {
  let next = state;
  let remaining = Math.max(0, accumulatorMs + Math.max(0, deltaMs));
  while (remaining >= FIXED_STEP_MS && next.phase === "playing") {
    next = step(next, FIXED_STEP_MS, input);
    remaining -= FIXED_STEP_MS;
  }
  return {
    state: next,
    accumulatorMs: next.phase === "playing" ? remaining : 0,
  };
}
