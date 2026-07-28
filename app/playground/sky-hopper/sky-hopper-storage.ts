export const BEST_SCORE_KEY = "sky-hopper:best-score:v1";
export const MUTED_KEY = "sky-hopper:muted";
export const REDUCED_MOTION_KEY = "sky-hopper:reduced-motion";

export function readBestScore(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function readStoredBoolean(value: string | null, fallback: boolean) {
  return value === "true" ? true : value === "false" ? false : fallback;
}
