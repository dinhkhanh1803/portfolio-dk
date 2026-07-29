import type { Difficulty, MatchMode } from "./pong-engine";

export const SETTINGS_KEY = "pong:settings:v1";
export const STATS_KEY = "pong:stats:v1";
export const MUTED_KEY = "pong:muted";
export const MOTION_KEY = "pong:reduced-motion";

export type PongSettings = {
  mode: MatchMode;
  targetScore: 5 | 7 | 11;
  difficulty: Difficulty;
};

export type PongStats = {
  soloWins: number;
  soloLosses: number;
  leftWins: number;
  rightWins: number;
};

export const DEFAULT_SETTINGS: PongSettings = {
  mode: "ai",
  targetScore: 7,
  difficulty: "normal",
};

export const DEFAULT_STATS: PongStats = {
  soloWins: 0,
  soloLosses: 0,
  leftWins: 0,
  rightWins: 0,
};

const isCount = (value: unknown) =>
  typeof value === "number"
  && Number.isSafeInteger(value)
  && value >= 0;

export function parseSettings(raw: string | null): PongSettings {
  try {
    const value = JSON.parse(raw ?? "");
    if (
      (value.mode === "ai" || value.mode === "local")
      && (value.targetScore === 5 || value.targetScore === 7 || value.targetScore === 11)
      && (value.difficulty === "easy"
        || value.difficulty === "normal"
        || value.difficulty === "hard")
    ) {
      return {
        mode: value.mode,
        targetScore: value.targetScore,
        difficulty: value.difficulty,
      };
    }
  } catch {
    // Invalid persistence falls back to defaults.
  }
  return { ...DEFAULT_SETTINGS };
}

export function parseStats(raw: string | null): PongStats {
  try {
    const value = JSON.parse(raw ?? "");
    if (
      isCount(value.soloWins)
      && isCount(value.soloLosses)
      && isCount(value.leftWins)
      && isCount(value.rightWins)
    ) {
      return {
        soloWins: value.soloWins,
        soloLosses: value.soloLosses,
        leftWins: value.leftWins,
        rightWins: value.rightWins,
      };
    }
  } catch {
    // Invalid persistence falls back to defaults.
  }
  return { ...DEFAULT_STATS };
}

export function parseBoolean(raw: string | null, fallback: boolean) {
  return raw === "true" ? true : raw === "false" ? false : fallback;
}

export function safeRead(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWrite(key: string, value: string) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
