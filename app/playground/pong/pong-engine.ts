export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
export const FIXED_STEP_MS = 16;
export const BALL_RADIUS = 12;

const PADDLE_WIDTH = 22;
const PADDLE_HEIGHT = 128;
const PLAYER_SPEED = 570;
const BASE_BALL_SPEED = 430;
const MAX_BALL_SPEED = 980;
const HIT_ACCELERATION = 1.055;
const MAX_REBOUND_ANGLE = Math.PI * 0.34;

export type MatchMode = "ai" | "local";
export type Difficulty = "easy" | "normal" | "hard";
export type MatchPhase = "ready" | "playing" | "paused" | "gameover";
export type MatchEvent = "paddle" | "wall" | "score" | "victory" | null;

export type PongInput = {
  leftUp: boolean;
  leftDown: boolean;
  rightUp: boolean;
  rightDown: boolean;
};

export type PaddleState = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
};

export type BallState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
};

export type PongState = {
  phase: MatchPhase;
  mode: MatchMode;
  difficulty: Difficulty;
  targetScore: 5 | 7 | 11;
  leftScore: number;
  rightScore: number;
  winner: "left" | "right" | null;
  leftPaddle: PaddleState;
  rightPaddle: PaddleState;
  ball: BallState;
  rallyHits: number;
  elapsedMs: number;
  serveDirection: -1 | 1;
  aiTargetY: number;
  aiReactionMs: number;
  event: MatchEvent;
  eventId: number;
};

const AI_CONFIG = {
  easy: { maxSpeed: 330, reactionMs: 210, error: 92 },
  normal: { maxSpeed: 465, reactionMs: 120, error: 44 },
  hard: { maxSpeed: 590, reactionMs: 68, error: 16 },
} as const;

export const aiConfig = (difficulty: Difficulty) => AI_CONFIG[difficulty];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const centeredPaddle = (x: number): PaddleState => ({
  x,
  y: (WORLD_HEIGHT - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PLAYER_SPEED,
});

const centeredBall = (): BallState => ({
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  vx: 0,
  vy: 0,
  radius: BALL_RADIUS,
  speed: BASE_BALL_SPEED,
});

export function createMatch(settings: {
  mode: MatchMode;
  targetScore: 5 | 7 | 11;
  difficulty: Difficulty;
}): PongState {
  return {
    phase: "ready",
    ...settings,
    leftScore: 0,
    rightScore: 0,
    winner: null,
    leftPaddle: centeredPaddle(54),
    rightPaddle: centeredPaddle(WORLD_WIDTH - 54 - PADDLE_WIDTH),
    ball: centeredBall(),
    rallyHits: 0,
    elapsedMs: 0,
    serveDirection: 1,
    aiTargetY: WORLD_HEIGHT / 2,
    aiReactionMs: 0,
    event: null,
    eventId: 0,
  };
}

export function startRally(state: PongState): PongState {
  if (state.phase !== "ready") return state;
  const verticalDirection = (state.leftScore + state.rightScore) % 2 === 0 ? 1 : -1;
  const angle = 0.24 * verticalDirection;
  return {
    ...state,
    phase: "playing",
    event: null,
    ball: {
      ...state.ball,
      vx: Math.cos(angle) * state.ball.speed * state.serveDirection,
      vy: Math.sin(angle) * state.ball.speed,
    },
  };
}

export function pauseMatch(state: PongState): PongState {
  return state.phase === "playing" ? { ...state, phase: "paused" } : state;
}

export function resumeMatch(state: PongState): PongState {
  return state.phase === "paused" ? { ...state, phase: "playing" } : state;
}

export function updateAiTarget(state: PongState, randomValue: number): PongState {
  if (state.mode !== "ai") return state;
  const config = aiConfig(state.difficulty);
  const travelSeconds = state.ball.vx > 0
    ? Math.max(0, (state.rightPaddle.x - state.ball.x) / state.ball.vx)
    : 0;
  const projected = state.ball.y + state.ball.vy * travelSeconds;
  const error = (clamp(randomValue, 0, 1) * 2 - 1) * config.error;
  return {
    ...state,
    aiTargetY: clamp(projected + error, 0, WORLD_HEIGHT),
  };
}

function deterministicNoise(elapsedMs: number) {
  const value = Math.sin(elapsedMs * 0.0137 + 2.17) * 43758.5453;
  return value - Math.floor(value);
}

function movePlayerPaddle(
  paddle: PaddleState,
  up: boolean,
  down: boolean,
  dt: number,
) {
  const direction = Number(down) - Number(up);
  return {
    ...paddle,
    y: clamp(
      paddle.y + direction * paddle.speed * dt,
      0,
      WORLD_HEIGHT - paddle.height,
    ),
  };
}

function moveAiPaddle(state: PongState, dt: number) {
  const config = aiConfig(state.difficulty);
  const center = state.rightPaddle.y + state.rightPaddle.height / 2;
  const distance = state.aiTargetY - center;
  const movement = clamp(distance, -config.maxSpeed * dt, config.maxSpeed * dt);
  return {
    ...state.rightPaddle,
    y: clamp(
      state.rightPaddle.y + movement,
      0,
      WORLD_HEIGHT - state.rightPaddle.height,
    ),
  };
}

function emit(state: PongState, event: Exclude<MatchEvent, null>) {
  return { ...state, event, eventId: state.eventId + 1 };
}

function resetBall(state: PongState, serveDirection: -1 | 1): PongState {
  return {
    ...state,
    phase: "ready",
    serveDirection,
    rallyHits: 0,
    aiReactionMs: 0,
    aiTargetY: WORLD_HEIGHT / 2,
    ball: centeredBall(),
  };
}

function awardPoint(state: PongState, side: "left" | "right"): PongState {
  const leftScore = state.leftScore + Number(side === "left");
  const rightScore = state.rightScore + Number(side === "right");
  const winner = leftScore >= state.targetScore
    ? "left"
    : rightScore >= state.targetScore
      ? "right"
      : null;
  const reset = resetBall(
    { ...state, leftScore, rightScore, winner },
    side === "left" ? 1 : -1,
  );
  return emit(
    winner ? { ...reset, phase: "gameover", winner } : reset,
    winner ? "victory" : "score",
  );
}

function rebound(
  state: PongState,
  paddle: PaddleState,
  collisionY: number,
  direction: -1 | 1,
  remainingTime: number,
) {
  const relativeHit = clamp(
    (collisionY - (paddle.y + paddle.height / 2)) / (paddle.height / 2),
    -1,
    1,
  );
  const angle = relativeHit * MAX_REBOUND_ANGLE;
  const speed = Math.min(MAX_BALL_SPEED, state.ball.speed * HIT_ACCELERATION);
  const vx = Math.cos(angle) * speed * direction;
  const vy = Math.sin(angle) * speed;
  const face = direction === 1 ? paddle.x + paddle.width : paddle.x;
  const x = face + direction * state.ball.radius + vx * remainingTime;
  const y = collisionY + vy * remainingTime;
  return emit({
    ...state,
    rallyHits: state.rallyHits + 1,
    ball: { ...state.ball, x, y, vx, vy, speed },
  }, "paddle");
}

export function step(
  state: PongState,
  deltaMs: number,
  input: PongInput,
): PongState {
  if (state.phase !== "playing") return state;
  const safeDelta = Number.isFinite(deltaMs) ? clamp(deltaMs, 0, 100) : 0;
  if (safeDelta === 0) return state;
  const dt = safeDelta / 1000;

  let aiReactionMs = state.aiReactionMs + safeDelta;
  let aiState = state;
  if (state.mode === "ai" && aiReactionMs >= aiConfig(state.difficulty).reactionMs) {
    aiState = updateAiTarget(state, deterministicNoise(state.elapsedMs));
    aiReactionMs %= aiConfig(state.difficulty).reactionMs;
  }

  const leftPaddle = movePlayerPaddle(
    state.leftPaddle,
    input.leftUp,
    input.leftDown,
    dt,
  );
  const rightPaddle = state.mode === "ai"
    ? moveAiPaddle({ ...aiState, aiReactionMs }, dt)
    : movePlayerPaddle(
        state.rightPaddle,
        input.rightUp,
        input.rightDown,
        dt,
      );

  const previousBall = state.ball;
  const nextX = previousBall.x + previousBall.vx * dt;
  let nextY = previousBall.y + previousBall.vy * dt;
  let nextVy = previousBall.vy;
  let event: MatchEvent = null;

  if (nextY - previousBall.radius < 0) {
    nextY = previousBall.radius + (previousBall.radius - nextY);
    nextVy = Math.abs(nextVy);
    event = "wall";
  } else if (nextY + previousBall.radius > WORLD_HEIGHT) {
    nextY = WORLD_HEIGHT - previousBall.radius
      - (nextY + previousBall.radius - WORLD_HEIGHT);
    nextVy = -Math.abs(nextVy);
    event = "wall";
  }

  let next: PongState = {
    ...state,
    leftPaddle,
    rightPaddle,
    elapsedMs: state.elapsedMs + safeDelta,
    aiTargetY: aiState.aiTargetY,
    aiReactionMs,
    event,
    eventId: event ? state.eventId + 1 : state.eventId,
    ball: { ...previousBall, x: nextX, y: nextY, vy: nextVy },
  };

  if (nextX - previousBall.radius > WORLD_WIDTH) return awardPoint(next, "left");
  if (nextX + previousBall.radius < 0) return awardPoint(next, "right");

  if (previousBall.vx < 0) {
    const face = leftPaddle.x + leftPaddle.width;
    const oldEdge = previousBall.x - previousBall.radius;
    const newEdge = nextX - previousBall.radius;
    if (oldEdge >= face && newEdge <= face) {
      const travel = oldEdge - newEdge;
      const fraction = travel === 0 ? 0 : clamp((oldEdge - face) / travel, 0, 1);
      const collisionY = previousBall.y + (nextY - previousBall.y) * fraction;
      if (
        collisionY + previousBall.radius >= leftPaddle.y
        && collisionY - previousBall.radius <= leftPaddle.y + leftPaddle.height
      ) {
        next = rebound(next, leftPaddle, collisionY, 1, dt * (1 - fraction));
      }
    }
  } else if (previousBall.vx > 0) {
    const face = rightPaddle.x;
    const oldEdge = previousBall.x + previousBall.radius;
    const newEdge = nextX + previousBall.radius;
    if (oldEdge <= face && newEdge >= face) {
      const travel = newEdge - oldEdge;
      const fraction = travel === 0 ? 0 : clamp((face - oldEdge) / travel, 0, 1);
      const collisionY = previousBall.y + (nextY - previousBall.y) * fraction;
      if (
        collisionY + previousBall.radius >= rightPaddle.y
        && collisionY - previousBall.radius <= rightPaddle.y + rightPaddle.height
      ) {
        next = rebound(next, rightPaddle, collisionY, -1, dt * (1 - fraction));
      }
    }
  }

  return next;
}

export function advanceFixed(
  state: PongState,
  accumulatorMs: number,
  deltaMs: number,
  input: PongInput,
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
