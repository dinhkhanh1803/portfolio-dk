import { getPianoSong, songDurationMs } from "./neon-keys-songs.ts";

export const CHALLENGE_MS = 60_000;
export const HIT_LINE = 0.86;
export type PianoPhase = "ready" | "playing" | "paused" | "gameover" | "complete";
export type Judgement = "idle" | "perfect" | "good" | "miss";
export type FallingNote = { id: number; key: number; progress: number };
export type PianoRun = {
  phase: PianoPhase;
  songId: string;
  elapsedMs: number;
  chartIndex: number;
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


export const createPianoRun = (songOrSeed: string | number = "ode-to-joy"): PianoRun => {
  const song = getPianoSong(typeof songOrSeed === "string" ? songOrSeed : undefined);
  const seed = typeof songOrSeed === "number" ? songOrSeed : Date.now();
  return {
    phase: "ready",
    songId: song.id,
    elapsedMs: 0,
    chartIndex: 0,
  notes: [],
  remainingMs: songDurationMs(song),
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
  };
};

export const startPianoRun = (run: PianoRun): PianoRun =>
  run.phase === "ready" ? { ...run, phase: "playing" } : run;

export const togglePianoPause = (run: PianoRun): PianoRun =>
  run.phase === "playing" ? { ...run, phase: "paused" } : run.phase === "paused" ? { ...run, phase: "playing" } : run;

const NOTE_TRAVEL_MS = 2_400;

export const tickPianoRun = (run: PianoRun, elapsedMs: number): PianoRun => {
  if (run.phase !== "playing" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return run;
  const dt = Math.min(CHALLENGE_MS, elapsedMs);
  const remainingMs = Math.max(0, run.remainingMs - dt);
  const nextElapsedMs = run.elapsedMs + dt;
  let notes = run.notes.map((note) => ({ ...note, progress: note.progress + dt / NOTE_TRAVEL_MS }));
  const missed = notes.filter((note) => note.progress > 1).length;
  notes = notes.filter((note) => note.progress <= 1);
  const lives = Math.max(0, run.lives - missed);
  let nextId = run.nextId;
  let chartIndex = run.chartIndex;
  const song = getPianoSong(run.songId);
  while (
    chartIndex < song.chart.length &&
    song.chart[chartIndex].beat * 60_000 / song.bpm <= nextElapsedMs
  ) {
    const scheduledMs = song.chart[chartIndex].beat * 60_000 / song.bpm;
    notes.push({ id: nextId++, key: song.chart[chartIndex].key, progress: Math.max(0, (nextElapsedMs - scheduledMs) / NOTE_TRAVEL_MS) });
    chartIndex += 1;
  }
  const completed = remainingMs <= 0 && chartIndex === song.chart.length;
  if (completed) notes = [];
  const phase = lives <= 0 ? "gameover" : completed ? "complete" : run.phase;
  return {
    ...run,
    phase,
    notes,
    remainingMs,
    elapsedMs: nextElapsedMs,
    chartIndex,
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

