export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 900;
export const FLOOR_Y = 820;
export const BIRD_X = 180;
export const BIRD_RADIUS = 24;
export const PIPE_WIDTH = 100;
export const FIXED_STEP_MS = 16;

const GRAVITY = 1400;
const FLAP_VELOCITY = -460;
const BASE_SPEED = 190;
const MAX_SPEED = 330;

export type GamePhase = "ready" | "playing" | "gameover";

export type BirdState = {
  x: number;
  y: number;
  vy: number;
  rotation: number;
};

export type PipeState = {
  id: number;
  x: number;
  gapY: number;
  gapSize: number;
  passed: boolean;
};

export type SkyHopperState = {
  version: 1;
  phase: GamePhase;
  bird: BirdState;
  pipes: PipeState[];
  score: number;
  elapsed: number;
  speed: number;
  spawnTimer: number;
  nextPipeId: number;
  seed: number;
};

function nextRandom(seed: number) {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: nextSeed, value: nextSeed / 4294967296 };
}

function currentSpeed(score: number, elapsed: number) {
  return Math.min(MAX_SPEED, BASE_SPEED + score * 4 + elapsed * 0.7);
}

function spawnInterval(score: number) {
  return Math.max(1.08, 1.52 - score * 0.012);
}

function createPipe(state: SkyHopperState) {
  const gapRoll = nextRandom(state.seed);
  const gapSize = Math.max(164, 224 - state.score * 1.6);
  const margin = gapSize / 2 + 78;
  const minY = margin;
  const maxY = FLOOR_Y - margin;
  const gapY = minY + gapRoll.value * (maxY - minY);
  const pipe: PipeState = {
    id: state.nextPipeId,
    x: WORLD_WIDTH,
    gapY,
    gapSize,
    passed: false,
  };
  return { pipe, seed: gapRoll.seed };
}

function circleHitsRect(
  x: number,
  y: number,
  radius: number,
  rectX: number,
  rectY: number,
  width: number,
  height: number,
) {
  const closestX = Math.max(rectX, Math.min(x, rectX + width));
  const closestY = Math.max(rectY, Math.min(y, rectY + height));
  const dx = x - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

function collides(bird: BirdState, pipes: PipeState[]) {
  if (bird.y - BIRD_RADIUS <= 0 || bird.y + BIRD_RADIUS >= FLOOR_Y) {
    return true;
  }
  return pipes.some((pipe) => {
    const topHeight = pipe.gapY - pipe.gapSize / 2;
    const bottomY = pipe.gapY + pipe.gapSize / 2;
    return circleHitsRect(
      bird.x,
      bird.y,
      BIRD_RADIUS,
      pipe.x,
      0,
      PIPE_WIDTH,
      topHeight,
    ) || circleHitsRect(
      bird.x,
      bird.y,
      BIRD_RADIUS,
      pipe.x,
      bottomY,
      PIPE_WIDTH,
      FLOOR_Y - bottomY,
    );
  });
}

export function createGame(seed = Date.now() >>> 0): SkyHopperState {
  return {
    version: 1,
    phase: "ready",
    bird: { x: BIRD_X, y: 410, vy: 0, rotation: 0 },
    pipes: [],
    score: 0,
    elapsed: 0,
    speed: BASE_SPEED,
    spawnTimer: 0.72,
    nextPipeId: 1,
    seed: seed >>> 0,
  };
}

export function flap(state: SkyHopperState): SkyHopperState {
  if (state.phase === "gameover") return state;
  return {
    ...state,
    phase: "playing",
    bird: { ...state.bird, vy: FLAP_VELOCITY, rotation: -0.34 },
  };
}

export function step(state: SkyHopperState, deltaMs: number): SkyHopperState {
  if (state.phase !== "playing") return state;
  const dt = Math.max(0, Math.min(deltaMs, 500)) / 1000;
  if (dt === 0) return state;

  const elapsed = state.elapsed + dt;
  const speed = currentSpeed(state.score, elapsed);
  const vy = state.bird.vy + GRAVITY * dt;
  const bird: BirdState = {
    ...state.bird,
    y: state.bird.y + state.bird.vy * dt + 0.5 * GRAVITY * dt * dt,
    vy,
    rotation: Math.max(-0.38, Math.min(1.1, vy / 620)),
  };

  let pipes = state.pipes
    .map((pipe) => ({ ...pipe, x: pipe.x - speed * dt }))
    .filter((pipe) => pipe.x + PIPE_WIDTH > -10);
  let score = state.score;
  pipes = pipes.map((pipe) => {
    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
      score += 1;
      return { ...pipe, passed: true };
    }
    return pipe;
  });

  let spawnTimer = state.spawnTimer - dt;
  let seed = state.seed;
  let nextPipeId = state.nextPipeId;
  if (spawnTimer <= 0) {
    const generated = createPipe({ ...state, score, seed, nextPipeId });
    pipes = [...pipes, generated.pipe];
    seed = generated.seed;
    nextPipeId += 1;
    spawnTimer += spawnInterval(score);
  }

  const phase: GamePhase = collides(bird, pipes) ? "gameover" : "playing";
  return {
    ...state,
    phase,
    bird,
    pipes,
    score,
    elapsed,
    speed: currentSpeed(score, elapsed),
    spawnTimer,
    nextPipeId,
    seed,
  };
}

export function advanceFixed(
  state: SkyHopperState,
  accumulatorMs: number,
  deltaMs: number,
) {
  let next = state;
  let remainingMs = Math.max(0, accumulatorMs + Math.max(0, deltaMs));

  while (remainingMs >= FIXED_STEP_MS && next.phase === "playing") {
    next = step(next, FIXED_STEP_MS);
    remainingMs -= FIXED_STEP_MS;
  }

  if (next.phase !== "playing") remainingMs = 0;

  return {
    state: next,
    accumulatorMs: remainingMs,
  };
}
