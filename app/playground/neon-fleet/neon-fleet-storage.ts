import type { Difficulty } from "./neon-fleet-data.ts";

export type DifficultyStats = {
  played: number;
  won: number;
  bestAccuracy: number;
  fastestVictoryMs: number | null;
};

export type FleetStats = {
  version: 1;
  byDifficulty: Record<Difficulty, DifficultyStats>;
};

export const STATS_KEY = "dk-neon-fleet-stats-v1";
export const MUTE_KEY = "dk-neon-fleet-muted";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

const emptyDifficulty = (): DifficultyStats => ({
  played: 0,
  won: 0,
  bestAccuracy: 0,
  fastestVictoryMs: null,
});

const createDefaultStats = (): FleetStats => ({
  version: 1,
  byDifficulty: {
    easy: emptyDifficulty(),
    normal: emptyDifficulty(),
    hard: emptyDifficulty(),
  },
});

export const DEFAULT_STATS: FleetStats = createDefaultStats();

const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);

const isDifficultyStats = (value: unknown): value is DifficultyStats => {
  if (!value || typeof value !== "object") return false;
  const stats = value as DifficultyStats;
  return Number.isFinite(stats.played)
    && Number.isInteger(stats.played)
    && stats.played >= 0
    && Number.isFinite(stats.won)
    && Number.isInteger(stats.won)
    && stats.won >= 0
    && stats.won <= stats.played
    && Number.isFinite(stats.bestAccuracy)
    && stats.bestAccuracy >= 0
    && stats.bestAccuracy <= 100
    && (stats.fastestVictoryMs === null
      || (Number.isFinite(stats.fastestVictoryMs) && stats.fastestVictoryMs > 0));
};

const isFleetStats = (value: unknown): value is FleetStats => {
  if (!value || typeof value !== "object") return false;
  const stats = value as FleetStats;
  return stats.version === 1
    && Boolean(stats.byDifficulty)
    && typeof stats.byDifficulty === "object"
    && DIFFICULTIES.every((difficulty) => isDifficultyStats(stats.byDifficulty[difficulty]));
};

const copyStats = (stats: FleetStats): FleetStats => ({
  version: 1,
  byDifficulty: {
    easy: { ...stats.byDifficulty.easy },
    normal: { ...stats.byDifficulty.normal },
    hard: { ...stats.byDifficulty.hard },
  },
});

export const parseStats = (raw: string | null): FleetStats => {
  try {
    const parsed: unknown = JSON.parse(raw ?? "");
    return isFleetStats(parsed) ? copyStats(parsed) : createDefaultStats();
  } catch {
    return createDefaultStats();
  }
};

type MatchResult = {
  won: boolean;
  accuracy: number;
  durationMs: number;
};

const isMatchResult = (value: unknown): value is MatchResult => {
  if (!value || typeof value !== "object") return false;
  const result = value as MatchResult;
  return typeof result.won === "boolean"
    && Number.isFinite(result.accuracy)
    && Number.isFinite(result.durationMs);
};

const boundedAccuracy = (accuracy: number) => Math.min(100, Math.max(0, Math.round(accuracy)));

export const recordMatch = (
  stats: FleetStats,
  difficulty: Difficulty,
  result: MatchResult,
): FleetStats => {
  if (!isFleetStats(stats) || !isDifficulty(difficulty) || !isMatchResult(result)) return stats;

  const current = stats.byDifficulty[difficulty];
  const duration = result.won && result.durationMs > 0 ? result.durationMs : null;
  return {
    ...copyStats(stats),
    byDifficulty: {
      ...copyStats(stats).byDifficulty,
      [difficulty]: {
        played: current.played + 1,
        won: current.won + (result.won ? 1 : 0),
        bestAccuracy: Math.max(current.bestAccuracy, boundedAccuracy(result.accuracy)),
        fastestVictoryMs: duration === null
          ? current.fastestVictoryMs
          : Math.min(current.fastestVictoryMs ?? duration, duration),
      },
    },
  };
};

const browserStorage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const safeRead = (key: string): string | null => {
  try {
    return browserStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const safeWrite = (key: string, value: string): boolean => {
  try {
    const storage = browserStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
