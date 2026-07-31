export const PAD_COUNT = 4;
export type EchoPhase = "ready" | "playback" | "input" | "roundClear" | "gameover";
export type Pad = 0 | 1 | 2 | 3;
export type EchoGame = {
  phase: EchoPhase;
  sequence: Pad[];
  expectedIndex: number;
  round: number;
  lives: number;
  score: number;
  combo: number;
  bestCombo: number;
  seed: number;
  event: "idle" | "correct" | "wrong" | "round";
};

const randomStep = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

const appendPad = (game: EchoGame): EchoGame => {
  let random = randomStep(game.seed);
  let pad = Math.floor(random.value * PAD_COUNT) as Pad;
  const last = game.sequence.at(-1);
  const beforeLast = game.sequence.at(-2);
  if (last === pad && beforeLast === pad) {
    random = randomStep(random.seed);
    pad = ((pad + 1 + Math.floor(random.value * 3)) % PAD_COUNT) as Pad;
  }
  return { ...game, seed: random.seed, sequence: [...game.sequence, pad] };
};

export const createEchoGame = (seed = Date.now()): EchoGame => ({
  phase: "ready",
  sequence: [],
  expectedIndex: 0,
  round: 0,
  lives: 3,
  score: 0,
  combo: 0,
  bestCombo: 0,
  seed: seed >>> 0,
  event: "idle",
});

export const startEchoGame = (game: EchoGame): EchoGame =>
  game.phase === "ready"
    ? { ...appendPad(game), phase: "playback", round: 1, expectedIndex: 0, event: "round" }
    : game;

export const startInput = (game: EchoGame): EchoGame =>
  game.phase === "playback" ? { ...game, phase: "input", expectedIndex: 0, event: "idle" } : game;

export const pressPad = (game: EchoGame, pad: Pad): EchoGame => {
  if (game.phase !== "input") return game;
  if (game.sequence[game.expectedIndex] !== pad) {
    const lives = game.lives - 1;
    return {
      ...game,
      lives,
      combo: 0,
      expectedIndex: 0,
      phase: lives <= 0 ? "gameover" : "playback",
      event: "wrong",
    };
  }
  const expectedIndex = game.expectedIndex + 1;
  if (expectedIndex < game.sequence.length) return { ...game, expectedIndex, event: "correct" };
  const combo = game.combo + 1;
  return {
    ...game,
    phase: "roundClear",
    expectedIndex: 0,
    combo,
    bestCombo: Math.max(game.bestCombo, combo),
    score: game.score + game.round * 100 + Math.max(0, combo - 1) * 35,
    event: "round",
  };
};

export const nextRound = (game: EchoGame): EchoGame =>
  game.phase === "roundClear"
    ? { ...appendPad(game), phase: "playback", round: game.round + 1, expectedIndex: 0, event: "round" }
    : game;

export const playbackDelay = (round: number) => Math.max(230, 760 - Math.max(1, round) * 28);

