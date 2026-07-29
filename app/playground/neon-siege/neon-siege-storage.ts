export const PROGRESS_KEY = "neon-siege:progress:v1";
export const MUTED_KEY = "neon-siege:muted";

export type SiegeProgress = {
  version: 1;
  bestScore: number;
  campaignComplete: boolean;
  highestWave: number;
  endlessUnlocked: boolean;
  bestEndlessWave: number;
};

export const DEFAULT_PROGRESS: SiegeProgress = {
  version: 1,
  bestScore: 0,
  campaignComplete: false,
  highestWave: 0,
  endlessUnlocked: false,
  bestEndlessWave: 0,
};

export function parseProgress(raw: string | null): SiegeProgress {
  try {
    const value = JSON.parse(raw ?? "");
    if (
      value && typeof value === "object"
      && value.version === 1
      && Number.isSafeInteger(value.bestScore) && value.bestScore >= 0
      && typeof value.campaignComplete === "boolean"
      && Number.isSafeInteger(value.highestWave) && value.highestWave >= 0 && value.highestWave <= 12
      && typeof value.endlessUnlocked === "boolean"
      && Number.isSafeInteger(value.bestEndlessWave) && value.bestEndlessWave >= 0 && value.bestEndlessWave <= 999
      && (!value.endlessUnlocked || value.campaignComplete)
    ) return { ...value };
  } catch {
    // Corrupt storage falls back to a safe new profile.
  }
  return { ...DEFAULT_PROGRESS };
}

export function safeRead(key: string) {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function safeWrite(key: string, value: string) {
  if (typeof window === "undefined") return false;
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
}