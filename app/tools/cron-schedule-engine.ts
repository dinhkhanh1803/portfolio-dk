export const cronFields = [
  { key: "minute", label: "Minute", min: 0, max: 59 },
  { key: "hour", label: "Hour", min: 0, max: 23 },
  { key: "dayOfMonth", label: "Day of month", min: 1, max: 31 },
  { key: "month", label: "Month", min: 1, max: 12 },
  { key: "dayOfWeek", label: "Day of week", min: 0, max: 7 },
] as const;

export type CronFieldKey = (typeof cronFields)[number]["key"];
export type CronParseResult = { valid: boolean; fields: string[]; error?: string };

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function validatePart(value: string, min: number, max: number) {
  const [base, rawStep] = value.split("/");
  if (value.split("/").length > 2 || (rawStep !== undefined && (!/^\d+$/.test(rawStep) || Number(rawStep) < 1))) return false;
  const values = base.split(",");
  return values.every((part) => {
    if (part === "*") return true;
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) return Number(range[1]) >= min && Number(range[2]) <= max && Number(range[1]) <= Number(range[2]);
    return /^\d+$/.test(part) && Number(part) >= min && Number(part) <= max;
  });
}

export function parseCronExpression(expression: string): CronParseResult {
  const fields = expression.trim().split(/\s+/).filter(Boolean);
  if (fields.length !== 5) return { valid: false, fields, error: "Cron expressions need exactly five fields: minute hour day-of-month month day-of-week." };
  for (let index = 0; index < fields.length; index++) {
    const meta = cronFields[index]!;
    if (!validatePart(fields[index]!, meta.min, meta.max)) return { valid: false, fields, error: `Invalid ${meta.label.toLowerCase()} field: ${fields[index]}.` };
  }
  return { valid: true, fields };
}

function fieldMatches(token: string, value: number, min: number, max: number) {
  return token.split(",").some((part) => {
    const [base, stepRaw] = part.split("/");
    const step = stepRaw ? Number(stepRaw) : 1;
    const [start, end] = base === "*" ? [min, max] : base!.includes("-") ? base!.split("-").map(Number) : [Number(base), Number(base)];
    return value >= start! && value <= end! && (value - start!) % step === 0;
  });
}

function dayDescription(token: string) {
  if (token === "*") return "every day";
  if (token === "1-5") return "Monday through Friday";
  if (/^\d$/.test(token)) return weekdays[Number(token)]!;
  return token.split(",").map((value) => weekdays[Number(value)] ?? value).join(", ");
}

export function describeCron(expression: string) {
  const parsed = parseCronExpression(expression);
  if (!parsed.valid) return parsed.error!;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parsed.fields;
  if (minute!.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") return `Every ${minute!.slice(2)} minutes.`;
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") return "Every minute.";
  const time = hour === "*" ? null : `${hour!.padStart(2, "0")}:${minute!.padStart(2, "0")}`;
  const calendar = [dayOfMonth !== "*" ? `on day ${dayOfMonth} of the month` : "", month !== "*" ? `in month ${month}` : "", dayOfWeek !== "*" ? dayDescription(dayOfWeek!) : ""].filter(Boolean).join(", ");
  if (time) return `At ${time}${calendar ? `, ${calendar}` : " every day"}.`;
  return `Every hour${calendar ? `, ${calendar}` : ""}.`;
}

export function describeCronField(index: number, token: string) {
  const field = cronFields[index]!;
  if (token === "*") return `Every ${field.label.toLowerCase()}`;
  if (token.startsWith("*/")) return `Every ${token.slice(2)} ${field.label.toLowerCase()}s`;
  if (index === 4) return dayDescription(token);
  if (token.includes("-")) return `${field.label} ${token}`;
  return `${field.label}: ${token}`;
}

export function getNextRuns(expression: string, from = new Date(), count = 10) {
  const parsed = parseCronExpression(expression);
  if (!parsed.valid || count < 1) return [] as Date[];
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parsed.fields;
  const current = new Date(from);
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);
  const runs: Date[] = [];
  const maxIterations = 525_960 * 5;
  for (let index = 0; index < maxIterations && runs.length < count; index++) {
    const dateDay = current.getDay();
    const minuteOk = fieldMatches(minute!, current.getMinutes(), 0, 59);
    const hourOk = fieldMatches(hour!, current.getHours(), 0, 23);
    const monthOk = fieldMatches(month!, current.getMonth() + 1, 1, 12);
    const domOk = fieldMatches(dayOfMonth!, current.getDate(), 1, 31);
    const dowOk = fieldMatches(dayOfWeek!, dateDay, 0, 7) || (dateDay === 0 && fieldMatches(dayOfWeek!, 7, 0, 7));
    const dayOk = dayOfMonth === "*" || dayOfWeek === "*" ? domOk && dowOk : domOk || dowOk;
    if (minuteOk && hourOk && monthOk && dayOk) runs.push(new Date(current));
    current.setMinutes(current.getMinutes() + 1);
  }
  return runs;
}

export const cronPresets = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 min", value: "*/5 * * * *" },
  { label: "Every 15 min", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Daily 9 AM", value: "0 9 * * *" },
  { label: "Weekdays 9 AM", value: "0 9 * * 1-5" },
  { label: "Weekly Monday", value: "0 9 * * 1" },
  { label: "Monthly 1st", value: "0 0 1 * *" },
] as const;