"use client";

import { Check, Clipboard, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { dateDifference, durationBreakdown, formatDateExplorer, isoToTimestamp, timestampToIso, timezoneConvert } from "./date-time-engine";

type Mode = "timestamp" | "timezone" | "duration" | "difference" | "format";
type Tab = { id: Mode; label: string; description: string; sample: string };
const tabs: Tab[] = [
  { id: "timestamp", label: "Timestamp Converter", description: "Convert Unix timestamps to ISO dates and ISO dates back to seconds.", sample: "1700000000" },
  { id: "timezone", label: "Timezone Converter", description: "Convert one date/time into a selected timezone without typing a combined raw string.", sample: "2024-01-01T00:00" },
  { id: "duration", label: "Duration Calculator", description: "Break a duration into days, hours, minutes, and seconds.", sample: "90061" },
  { id: "difference", label: "Date Difference Calculator", description: "Calculate the distance between two dates with day, hour, and millisecond output.", sample: "2024-01-01" },
  { id: "format", label: "Date Format Explorer", description: "Explore Intl.DateTimeFormat styles, locales, timezones, and a reusable JS snippet.", sample: "2026-07-21T08:01" },
];
const timezones = ["UTC", "Asia/Saigon", "Asia/Tokyo", "Europe/Berlin", "Europe/London", "America/New_York", "America/Los_Angeles"];
const locales = ["en-US", "vi-VN", "de-DE", "fr-FR", "ja-JP"];
const dateStyles = ["short", "medium", "long", "full"] as const;
const copyText = async (value: string, setCopied: (value: string) => void, key: string) => {
  await navigator.clipboard.writeText(value);
  setCopied(key);
  window.setTimeout(() => setCopied(""), 1400);
};
function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function ResultCard({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return <div className="calculator-result-card"><span>{label}</span><strong>{value}</strong><button type="button" onClick={onCopy} aria-label={`Copy ${label}`}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></div>;
}

export default function DateTimeWorkbench() {
  const [mode, setMode] = useState<Mode>("timestamp");
  const [timestamp, setTimestamp] = useState("1700000000");
  const [isoDate, setIsoDate] = useState("2024-01-01T00:00");
  const [targetTimezone, setTargetTimezone] = useState("Asia/Saigon");
  const [durationValue, setDurationValue] = useState("90061");
  const [durationUnit, setDurationUnit] = useState("seconds");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-01-31");
  const [formatDate, setFormatDate] = useState("2026-07-21T08:01");
  const [locale, setLocale] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC");
  const [style, setStyle] = useState<(typeof dateStyles)[number]>("full");
  const [copied, setCopied] = useState("");
  const active = tabs.find((tab) => tab.id === mode)!;

  const results = useMemo(() => {
    try {
      if (mode === "timestamp") return [["ISO date", timestampToIso(Number(timestamp))], ["Unix seconds", String(isoToTimestamp(timestampToIso(Number(timestamp))))]];
      if (mode === "timezone") return [["Converted time", timezoneConvert(new Date(isoDate).toISOString(), targetTimezone)], ["Target timezone", targetTimezone]];
      if (mode === "duration") {
        const multiplier = durationUnit === "minutes" ? 60 : durationUnit === "hours" ? 3600 : durationUnit === "days" ? 86400 : 1;
        const result = durationBreakdown(Number(durationValue) * multiplier);
        return [["Breakdown", `${result.days}d ${result.hours}h ${result.minutes}m ${result.seconds}s`], ["JSON", JSON.stringify(result)]];
      }
      if (mode === "difference") {
        const result = dateDifference(startDate, endDate);
        return [["Days", String(result.days)], ["Hours", String(result.hours)], ["Milliseconds", String(result.milliseconds)]];
      }
      const date = new Date(formatDate);
      const formatted = new Intl.DateTimeFormat(locale, { dateStyle: style, timeStyle: "medium", timeZone: timezone }).format(date);
      return [["Formatted Output", formatted], ["Date only", formatDateExplorer(date.toISOString(), locale, style)], ["JS Snippet", `new Intl.DateTimeFormat("${locale}", { dateStyle: "${style}", timeStyle: "medium", timeZone: "${timezone}" }).format(new Date("${date.toISOString()}"))`]];
    } catch (reason) {
      return [["Error", reason instanceof Error ? reason.message : "Unable to process this input."]];
    }
  }, [durationUnit, durationValue, endDate, formatDate, isoDate, locale, mode, startDate, style, targetTimezone, timestamp, timezone]);

  const useCurrentTime = () => {
    const now = new Date();
    setTimestamp(String(Math.floor(now.getTime() / 1000)));
    setIsoDate(toLocalInput(now));
    setFormatDate(toLocalInput(now));
  };

  return <section className="data-format-workbench calculator-workbench">
    <div className="data-format-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="calculator-intro"><div><h2>{active.label}</h2><p>{active.description}</p></div><div className="calculator-toolbar"><button onClick={useCurrentTime}>Use current time</button><button onClick={() => setTimestamp(active.sample)}><FlaskConical size={15} />Sample</button><button onClick={() => setCopied("")}><Eraser size={15} />Clear state</button></div></div>
    <div className="calculator-panel">
      <div className="calculator-controls">
        {mode === "timestamp" && <><label>Unix timestamp<input type="number" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} /></label><label>Input type<select value="seconds" onChange={() => undefined}><option>seconds</option><option>milliseconds</option></select></label></>}
        {mode === "timezone" && <><label>Date & Time<input type="datetime-local" value={isoDate} onChange={(event) => setIsoDate(event.target.value)} /></label><label>Timezone<select value={targetTimezone} onChange={(event) => setTargetTimezone(event.target.value)}>{timezones.map((zone) => <option key={zone}>{zone}</option>)}</select></label></>}
        {mode === "duration" && <><label>Duration<input type="number" value={durationValue} onChange={(event) => setDurationValue(event.target.value)} /></label><label>Unit<select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value)}>{["seconds", "minutes", "hours", "days"].map((unit) => <option key={unit}>{unit}</option>)}</select></label></>}
        {mode === "difference" && <><label>Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></>}
        {mode === "format" && <><label>Date & Time<input type="datetime-local" value={formatDate} onChange={(event) => setFormatDate(event.target.value)} /></label><label>Locale<select value={locale} onChange={(event) => setLocale(event.target.value)}>{locales.map((item) => <option key={item}>{item}</option>)}</select></label><label>Timezone<select value={timezone} onChange={(event) => setTimezone(event.target.value)}>{timezones.map((zone) => <option key={zone}>{zone}</option>)}</select></label><label>Date style<select value={style} onChange={(event) => setStyle(event.target.value as (typeof dateStyles)[number])}>{dateStyles.map((item) => <option key={item}>{item}</option>)}</select></label></>}
      </div>
      <div className="calculator-results">{results.map(([label, result]) => <ResultCard key={label} label={label} value={result} copied={copied === label} onCopy={() => copyText(result, setCopied, label)} />)}</div>
    </div>
  </section>;
}