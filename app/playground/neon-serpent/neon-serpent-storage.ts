export const PROGRESS_KEY = "neon-serpent:progress:v1";
export const MUTED_KEY = "neon-serpent:muted";

export type SerpentProgress = {
  version: 1;
  bestScore: number;
  highestStage: number;
  campaignComplete: boolean;
  endlessUnlocked: boolean;
  bestEndlessWave: number;
};

export const DEFAULT_PROGRESS: SerpentProgress = {
  version: 1,
  bestScore: 0,
  highestStage: 1,
  campaignComplete: false,
  endlessUnlocked: false,
  bestEndlessWave: 0,
};

export function parseProgress(raw: string | null): SerpentProgress {
  try {
    const value = JSON.parse(raw ?? "");
    if (
      value && typeof value === "object" && value.version === 1
      && Number.isSafeInteger(value.bestScore) && value.bestScore >= 0
      && Number.isSafeInteger(value.highestStage) && value.highestStage >= 1 && value.highestStage <= 8
      && typeof value.campaignComplete === "boolean"
      && typeof value.endlessUnlocked === "boolean"
      && Number.isSafeInteger(value.bestEndlessWave) && value.bestEndlessWave >= 0 && value.bestEndlessWave <= 999
      && (!value.endlessUnlocked || value.campaignComplete)
    ) return { ...value };
  } catch {
    // Corrupt storage starts a safe profile.
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
