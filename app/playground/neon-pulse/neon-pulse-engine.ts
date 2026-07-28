export type HitGrade = "perfect" | "good" | "miss";
export type RunStatus = "ready" | "playing" | "paused" | "game-over";

export type GameState = {
  status: RunStatus;
  pulseAngle: number;
  targetAngle: number;
  targetWidth: number;
  speed: number;
  direction: 1 | -1;
  score: number;
  combo: number;
  bestCombo: number;
  lives: number;
  elapsedMs: number;
  feedback: HitGrade | null;
  feedbackId: number;
};

const TAU = Math.PI * 2;
const BASE_SPEED = 1.45;
const BASE_TARGET_WIDTH = 0.22;

const wrapAngle = (angle: number) => ((angle % TAU) + TAU) % TAU;

function angularDistance(first: number, second: number) {
  const direct = Math.abs(wrapAngle(first) - wrapAngle(second));
  return Math.min(direct, TAU - direct);
}

function difficultyFor(elapsedMs: number) {
  const stage = Math.min(8, Math.floor(Math.max(0, elapsedMs) / 10000));
  return {
    speed: BASE_SPEED + stage * 0.16,
    targetWidth: Math.max(0.09, BASE_TARGET_WIDTH - stage * 0.014),
  };
}

export function createGame(random = Math.random): GameState {
  return {
    status: "ready",
    pulseAngle: -Math.PI / 2,
    targetAngle: wrapAngle(random() * TAU),
    targetWidth: BASE_TARGET_WIDTH,
    speed: BASE_SPEED,
    direction: 1,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    elapsedMs: 0,
    feedback: null,
    feedbackId: 0,
  };
}

export function gradeHit(
  pulseAngle: number,
  targetAngle: number,
  targetWidth: number,
): HitGrade {
  const distance = angularDistance(pulseAngle, targetAngle);
  const safeWidth = Math.max(0.01, targetWidth);
  if (distance <= safeWidth * 0.32) return "perfect";
  if (distance <= safeWidth) return "good";
  return "miss";
}

export function stepGame(state: GameState, deltaMs: number): GameState {
  if (state.status !== "playing") return state;
  const safeDelta = Math.min(50, Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0));
  const elapsedMs = state.elapsedMs + safeDelta;
  const difficulty = difficultyFor(elapsedMs);
  return {
    ...state,
    ...difficulty,
    elapsedMs,
    pulseAngle: wrapAngle(
      state.pulseAngle + state.direction * difficulty.speed * (safeDelta / 1000),
    ),
  };
}

export function resolveHit(
  state: GameState,
  random = Math.random,
): GameState {
  if (state.status !== "playing") return state;
  const feedback = gradeHit(
    state.pulseAngle,
    state.targetAngle,
    state.targetWidth,
  );
  const feedbackId = state.feedbackId + 1;

  if (feedback === "miss") {
    const lives = Math.max(0, state.lives - 1);
    return {
      ...state,
      lives,
      combo: 0,
      feedback,
      feedbackId,
      status: lives === 0 ? "game-over" : state.status,
    };
  }

  const combo = state.combo + 1;
  const points =
    feedback === "perfect" ? 100 + combo * 12 : 50 + combo * 6;
  return {
    ...state,
    score: state.score + points,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    feedback,
    feedbackId,
    targetAngle: wrapAngle(random() * TAU),
    direction:
      combo % 5 === 0 ? ((state.direction * -1) as 1 | -1) : state.direction,
  };
}

