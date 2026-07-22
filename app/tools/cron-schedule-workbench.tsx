"use client";

import { Check, Clipboard, Clock3, RotateCcw } from "lucide-react";
import { useState } from "react";
import styles from "./cron-schedule-workbench.module.css";
import { cronFields, cronPresets, describeCron, describeCronField, getNextRuns, parseCronExpression } from "./cron-schedule-engine";

type Mode = "generator" | "editor" | "explainer" | "next-runs";
const tabs: { id: Mode; label: string; description: string }[] = [
  { id: "generator", label: "Cron Tools", description: "Generate standard five-field cron expressions with presets and editable fields." },
  { id: "editor", label: "Crontab Visual Editor", description: "Build a schedule field by field and verify the upcoming local run times." },
  { id: "explainer", label: "Crontab Explainer", description: "Paste a cron expression to inspect the plain-language meaning and field breakdown." },
  { id: "next-runs", label: "Cron Next-Run Preview", description: "Preview the next ten executions in your browser's local timezone." },
];

const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
const formatRun = (date: Date) => new Intl.DateTimeFormat(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);

export default function CronScheduleWorkbench() {
  const [mode, setMode] = useState<Mode>("generator");
  const [expression, setExpression] = useState("*/5 * * * *");
  const [, setRefreshKey] = useState(0);
  const active = tabs.find((tab) => tab.id === mode)!;
  const parsed = parseCronExpression(expression);
  const runs = parsed.valid ? getNextRuns(expression, new Date(), 10) : [];
  const setField = (index: number, value: string) => {
    const next = parsed.fields.length === 5 ? [...parsed.fields] : ["*", "*", "*", "*", "*"];
    next[index] = value.trim() || "*";
    setExpression(next.join(" "));
  };
  const copy = async () => { await navigator.clipboard.writeText(expression); };
  return <section className={`cron-workbench ${styles.scope}`}>
    <div className="data-format-tabs cron-tabs" role="tablist">{tabs.map((tab) => <button role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)} key={tab.id}>{tab.label}</button>)}</div>
    <div className="cron-intro"><h2>{active.label}</h2><p>{active.description}</p></div>
    <PresetRow onSelect={setExpression} />
    {mode === "generator" || mode === "editor" ? <>
      <section className="cron-expression-card"><div><label htmlFor="cron-expression">Cron expression</label><input id="cron-expression" value={expression} onChange={(event) => setExpression(event.target.value)} spellCheck={false} /><small>{localZone()}</small></div><button className="cron-copy" onClick={() => void copy()}><Clipboard size={14} />Copy</button></section>
      <section className="cron-fields">{cronFields.map((field, index) => <label key={field.key}><span>{field.label}<small>{field.min}–{field.max}</small></span><input value={parsed.fields[index] ?? ""} onChange={(event) => setField(index, event.target.value)} placeholder="*" spellCheck={false} /></label>)}</section>
      <ScheduleSummary expression={expression} valid={parsed.valid} error={parsed.error} />
      {mode === "editor" && <RunList runs={runs} onRefresh={() => setRefreshKey((key) => key + 1)} />}
    </> : mode === "explainer" ? <>
      <section className="cron-expression-card"><div><label htmlFor="cron-explainer">Cron expression</label><input id="cron-explainer" value={expression} onChange={(event) => setExpression(event.target.value)} spellCheck={false} /><small>Format: minute hour day-of-month month day-of-week</small></div><button className="cron-copy" onClick={() => void copy()}><Clipboard size={14} />Copy</button></section>
      <ScheduleSummary expression={expression} valid={parsed.valid} error={parsed.error} />
      {parsed.valid && <section className="cron-breakdown">{cronFields.map((field, index) => <article key={field.key}><span>{field.label}</span><code>{parsed.fields[index]}</code><p>{describeCronField(index, parsed.fields[index]!)}</p><small>{field.min}–{field.max}</small></article>)}</section>}
    </> : <>
      <section className="cron-expression-card"><div><label htmlFor="cron-preview">Cron expression</label><input id="cron-preview" value={expression} onChange={(event) => setExpression(event.target.value)} spellCheck={false} /><small>Calculated in {localZone()}</small></div><button className="cron-copy" onClick={() => void copy()}><Clipboard size={14} />Copy</button></section>
      <ScheduleSummary expression={expression} valid={parsed.valid} error={parsed.error} />
      <RunList runs={runs} onRefresh={() => setRefreshKey((key) => key + 1)} />
    </>}
  </section>;
}

function PresetRow({ onSelect }: { onSelect: (value: string) => void }) {
  return <div className="cron-presets"><span>Quick presets</span>{cronPresets.map((preset) => <button onClick={() => onSelect(preset.value)} key={preset.value}>{preset.label}</button>)}</div>;
}

function ScheduleSummary({ expression, valid, error }: { expression: string; valid: boolean; error?: string }) {
  return <section className={`cron-summary ${valid ? "" : "is-error"}`}><Clock3 size={17} /><div><strong>{valid ? describeCron(expression) : "Invalid cron expression"}</strong><p>{valid ? "Uses the standard five-field crontab format." : error}</p></div></section>;
}

function RunList({ runs, onRefresh }: { runs: Date[]; onRefresh: () => void }) {
  return <section className="cron-runs"><header><div><strong>Next {runs.length || 10} runs</strong><small>{localZone()}</small></div><button onClick={onRefresh} aria-label="Refresh next run times"><RotateCcw size={14} />Refresh</button></header>{runs.length ? <ol>{runs.map((run) => <li key={run.toISOString()}><Check size={14} /><time dateTime={run.toISOString()}>{formatRun(run)}</time></li>)}</ol> : <p>Enter a valid expression to calculate the next executions.</p>}</section>;
}