"use client";

import { Clipboard, Download, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { REGEX_PATTERNS, buildFlags, evaluateRegex, explainRegex, replaceRegex } from "./regex-tools-engine";

type RegexTab = "tester" | "replace" | "library";

export const REGEX_SAMPLE_TEXT = `Contact Lan at lan@example.com or Minh at minh@dk.tools.
Project links:
- https://dk.tools
- https://example.com/docs
Colors: #3b82f6, #0f766e, #fff
Repeated words: tools tools should stay useful useful.`;

const tabs: Array<{ id: RegexTab; label: string }> = [
  { id: "tester", label: "Regex Tester" },
  { id: "replace", label: "Regex Replacer" },
  { id: "library", label: "Pattern Library" },
];

export default function RegexToolsWorkbench() {
  const [tab, setTab] = useState<RegexTab>("tester");
  const [pattern, setPattern] = useState(String.raw`[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}`);
  const [text, setText] = useState(REGEX_SAMPLE_TEXT);
  const [replacement, setReplacement] = useState("[email]");
  const [flags, setFlags] = useState({ global: true, ignoreCase: true, multiline: false, dotAll: false, unicode: true });

  const flagString = useMemo(() => buildFlags(flags), [flags]);
  const result = useMemo(() => evaluateRegex(pattern, flagString, text), [flagString, pattern, text]);
  const replaced = useMemo(() => replaceRegex(pattern, flagString, text, replacement), [flagString, pattern, replacement, text]);
  const explanation = useMemo(() => explainRegex(pattern), [pattern]);
  const report = useMemo(() => JSON.stringify({ pattern, flags: flagString, total: result.total, matches: result.matches, replacementPreview: replaced }, null, 2), [flagString, pattern, replaced, result.matches, result.total]);

  const applyPattern = (id: string) => {
    const item = REGEX_PATTERNS.find((entry) => entry.id === id);
    if (!item) return;
    setPattern(item.pattern);
    setText(item.sample);
    setFlags({
      global: item.flags.includes("g"),
      ignoreCase: item.flags.includes("i"),
      multiline: item.flags.includes("m"),
      dotAll: item.flags.includes("s"),
      unicode: item.flags.includes("u"),
    });
  };

  const copy = async (value: string) => {
    await navigator.clipboard?.writeText(value);
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "regex-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderResults = () => {
    if (!result.valid) return <section className="regex-error-card">Invalid regex: {result.error}</section>;

    if (tab === "replace") return (
      <section className="text-tool-panel regex-preview-card">
        <span>Replacement preview <b>{result.total} matches</b></span>
        <pre>{replaced || "Replacement output appears here..."}</pre>
        <div className="text-tool-output-actions">
          <button type="button" onClick={() => copy(replaced)}><Clipboard size={15} /> Copy replacement</button>
        </div>
      </section>
    );

    return (
      <section className="regex-match-list">
        <div className="regex-card-title"><h3>Matches</h3><span>{result.total} found</span></div>
        {result.matches.length ? result.matches.map((match, index) => <article className="regex-match-card" key={`${match.index}-${index}`}>
          <header><b>#{index + 1}</b><code>{match.match}</code><span>@ {match.index}</span></header>
          <p><em>{match.before}</em><mark>{match.match}</mark><em>{match.after}</em></p>
          {(match.groups.length || Object.keys(match.namedGroups).length) ? <div className="regex-groups">
            <strong>Groups</strong>
            {match.groups.map((group) => <span key={group.index}>${group.index}: {group.value || "∅"}</span>)}
            {Object.entries(match.namedGroups).map(([name, value]) => <span key={name}>{name}: {value || "∅"}</span>)}
          </div> : null}
        </article>) : <div className="regex-empty">No matches yet. Adjust your pattern, flags, or sample text.</div>}
      </section>
    );
  };

  return (
    <section className="regex-tools-workbench">
      <div className="data-format-tabs text-tool-tabs regex-tools-tabs" role="tablist">
        {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>

      <header className="text-tool-intro">
        <div>
          <h2>{tab === "replace" ? "Regex Replacer" : tab === "library" ? "Pattern Library" : "Regex Tester"}</h2>
          <p>Test JavaScript regular expressions, inspect matches and groups, preview replacements, and start from practical patterns.</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={() => applyPattern("email")}><FlaskConical size={15} /> Sample</button>
          <button type="button" onClick={() => setText("")}><Eraser size={15} /> Clear text</button>
          <button type="button" onClick={() => copy(`/${pattern}/${flagString}`)}><Clipboard size={15} /> Copy regex</button>
          <button type="button" onClick={downloadReport}><Download size={15} /> Download .json</button>
        </div>
      </header>

      <section className="text-tool-control-card regex-control-card">
        <label className="regex-pattern-field">Pattern<input value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} /></label>
        <label className="regex-flags-field">Flags<input value={flagString} readOnly /></label>
        {Object.entries(flags).map(([key, value]) => <label className="text-tool-check regex-flag-toggle" key={key}>
          <input type="checkbox" checked={value} onChange={(event) => setFlags((current) => ({ ...current, [key]: event.target.checked }))} /> {key}
        </label>)}
        {tab === "replace" ? <label className="regex-replace-field">Replace with<input value={replacement} onChange={(event) => setReplacement(event.target.value)} /></label> : null}
      </section>

      {tab === "library" ? <section className="regex-pattern-grid">
        {REGEX_PATTERNS.map((item) => <button className="regex-pattern-card" type="button" key={item.id} onClick={() => applyPattern(item.id)}>
          <strong>{item.name}</strong>
          <code>/{item.pattern}/{item.flags}</code>
          <span>{item.description}</span>
        </button>)}
      </section> : null}

      <div className="regex-tools-layout">
        <label className="text-tool-panel regex-input-panel">
          <span>Test text <b>{text.length} chars</b></span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </label>

        <div className="regex-output-column">
          {renderResults()}
          <section className="regex-cheatsheet">
            <h3>Pattern cheatsheet</h3>
            <div>{explanation.map((item) => <span key={item}>{item}</span>)}</div>
          </section>
        </div>
      </div>
    </section>
  );
}
