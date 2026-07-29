import { LEVELS } from "./neon-breaker-levels.ts";

export const PROGRESS_KEY = "neon-breaker:progress:v1";
export const MUTED_KEY = "neon-breaker:muted";
export const MOTION_KEY = "neon-breaker:reduced-motion";

export type BreakerProgress = {
  bestScore: number;
  unlockedLevel: number;
};

export const DEFAULT_PROGRESS: BreakerProgress = {
  bestScore: 0,
  unlockedLevel: 1,
};

export function parseProgress(raw: string | null): BreakerProgress {
  try {
    const value = JSON.parse(raw ?? "");
    if (
      Number.isSafeInteger(value.bestScore)
      && value.bestScore >= 0
      && Number.isInteger(value.unlockedLevel)
      && value.unlockedLevel >= 1
      && value.unlockedLevel <= LEVELS.length
    ) {
      return { bestScore: value.bestScore, unlockedLevel: value.unlockedLevel };
    }
  } catch {
    // Invalid persistence falls back to a fresh run.
  }
  return { ...DEFAULT_PROGRESS };
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
