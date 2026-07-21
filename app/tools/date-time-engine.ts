export function timestampToIso(value: number) {
  const milliseconds = value > 9999999999 ? value : value * 1000;
  return new Date(milliseconds).toISOString();
}
export function isoToTimestamp(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) throw new Error("Invalid date string.");
  return Math.floor(time / 1000);
}
export function timezoneConvert(value: string, timeZone: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date string.");
  return new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date).replace(",", ",");
}
export function durationBreakdown(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return { days, hours, minutes, seconds };
}
export function dateDifference(start: string, end: string) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("Invalid date range.");
  const milliseconds = Math.abs(b - a);
  return { days: milliseconds / 86400000, hours: milliseconds / 3600000, milliseconds };
}
export function formatDateExplorer(value: string, locale = "en-US", style: "short" | "medium" | "long" | "full" = "medium") {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date string.");
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: "UTC" }).format(date);
}