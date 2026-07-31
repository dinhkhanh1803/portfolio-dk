export const CHALLENGE_MS = 60_000;
export const HIT_LINE = 0.86;
export type PianoPhase = "ready" | "playing" | "paused" | "gameover" | "complete";
export type Judgement = "idle" | "perfect" | "good" | "miss";
export type FallingNote = { id: number; key: number; progress: number };
export type PianoRun = {
  phase: PianoPhase;
  notes: FallingNote[];
  remainingMs: number;
  spawnMs: number;
  score: number;
  combo: number;
  bestCombo: number;
  perfects: number;
  goods: number;
  misses: number;
  lives: number;
  judgement: Judgement;
  seed: number;
  nextId: number;
};

const randomStep = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

export const createPianoRun = (seed = Date.now()): PianoRun => ({
  phase: "ready",
  notes: [],
  remainingMs: CHALLENGE_MS,
  spawnMs: 250,
  score: 0,
  combo: 0,
  bestCombo: 0,
  perfects: 0,
  goods: 0,
  misses: 0,
  lives: 5,
  judgement: "idle",
  seed: seed >>> 0,
  nextId: 1,
});

export const startPianoRun = (run: PianoRun): PianoRun =>
  run.phase === "ready" ? { ...run, phase: "playing" } : run;

export const togglePianoPause = (run: PianoRun): PianoRun =>
  run.phase === "playing" ? { ...run, phase: "paused" } : run.phase === "paused" ? { ...run, phase: "playing" } : run;

const spawnInterval = (remainingMs: number) => {
  const progress = 1 - remainingMs / CHALLENGE_MS;
  return Math.max(280, 620 - progress * 260);
};

export const tickPianoRun = (run: PianoRun, elapsedMs: number): PianoRun => {
  if (run.phase !== "playing" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return run;
  const dt = Math.min(CHALLENGE_MS, elapsedMs);
  const remainingMs = Math.max(0, run.remainingMs - dt);
  const elapsedProgress = 1 - remainingMs / CHALLENGE_MS;
  const speed = 0.00034 + elapsedProgress * 0.00017;
  let notes = run.notes.map((note) => ({ ...note, progress: note.progress + dt * speed }));
  const missed = notes.filter((note) => note.progress > 1).length;
  notes = notes.filter((note) => note.progress <= 1);
  const lives = Math.max(0, run.lives - missed);
  let spawnMs = run.spawnMs - dt;
  let seed = run.seed;
  let nextId = run.nextId;
  while (spawnMs <= 0 && remainingMs > 0) {
    const random = randomStep(seed);
    seed = random.seed;
    notes.push({ id: nextId++, key: Math.floor(random.value * 12), progress: 0 });
    spawnMs += spawnInterval(remainingMs);
  }
  const phase = lives <= 0 ? "gameover" : remainingMs <= 0 ? "complete" : run.phase;
  return {
    ...run,
    phase,
    notes,
    remainingMs,
    spawnMs,
    seed,
    nextId,
    lives,
    combo: missed ? 0 : run.combo,
    misses: run.misses + missed,
    judgement: missed ? "miss" : run.judgement,
  };
};

export const hitNote = (run: PianoRun, key: number): PianoRun => {
  if (run.phase !== "playing" || key < 0 || key >= 12) return run;
  const candidate = run.notes
    .filter((note) => note.key === key)
    .map((note) => ({ note, distance: Math.abs(note.progress - HIT_LINE) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!candidate || candidate.distance > 0.18) return run;
  const perfect = candidate.distance <= 0.065;
  const judgement: Judgement = perfect ? "perfect" : "good";
  const combo = run.combo + 1;
  const base = perfect ? 120 : 70;
  return {
    ...run,
    notes: run.notes.filter((note) => note.id !== candidate.note.id),
    judgement,
    combo,
    bestCombo: Math.max(run.bestCombo, combo),
    perfects: run.perfects + (perfect ? 1 : 0),
    goods: run.goods + (perfect ? 0 : 1),
    score: run.score + base + Math.min(500, combo * 12),
  };
};

