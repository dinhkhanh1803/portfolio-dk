/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { Check, Clipboard, Download, FileJson, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { diffJson, flattenJson, formatJson, inferJsonSchema, jsonArrayToTable, minifyJson, parseJson, queryJsonPath, tableToCsv } from "./json-tools-engine";

type Tab = "tools" | "path" | "pretty" | "table";
type Utility = "formatter" | "tree" | "flatten" | "pointer" | "diff" | "schema";

const sample = `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "price": 8.99 }
    ]
  },
  "active": true
}`;
const arraySample = `[
  { "id": 1, "name": "Lan", "role": "Developer", "active": true },
  { "id": 2, "name": "Minh", "role": "Designer", "active": false },
  { "id": 3, "name": "An", "role": "Product", "active": true }
]`;
const tabs: { id: Tab; label: string; description: string }[] = [
  { id: "tools", label: "JSON Tools", description: "Format, validate, explore, flatten, diff, and generate schemas locally." },
  { id: "path", label: "JSONPath Explorer", description: "Query JSON documents with a practical JSONPath subset and inspect each match." },
  { id: "pretty", label: "JSON Minify & Prettify", description: "Minify, pretty-print, sort keys, validate input, and export clean JSON." },
  { id: "table", label: "JSON to Table & CSV", description: "Turn JSON arrays into a sortable table and export a RFC-style CSV file." },
];
const copyText = async (value: string) => navigator.clipboard.writeText(value);

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="json-copy" type="button" onClick={() => { void copyText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied" : label}</button>;
}

function DownloadButton({ value, fileName, label = "Download" }: { value: string; fileName: string; label?: string }) {
  const download = () => { const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" })); anchor.download = fileName; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(anchor.href), 0); };
  return <button className="json-copy" type="button" onClick={download}><Download size={14} />{label}</button>;
}

export default function JsonToolsWorkbench() {
  const [tab, setTab] = useState<Tab>("tools");
  const [utility, setUtility] = useState<Utility>("formatter");
  const [input, setInput] = useState(sample);
  const [compareInput, setCompareInput] = useState('{\n  "store": { "book": [] },\n  "active": false,\n  "version": 2\n}');
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [path, setPath] = useState("$.store.book[*].author");
  const [pointer, setPointer] = useState("/store/book/0/title");
  const [tableInput, setTableInput] = useState(arraySample);
  const [tableSort, setTableSort] = useState<{ column: string; asc: boolean } | null>(null);
  const active = tabs.find((item) => item.id === tab)!;
  const parsed = useMemo(() => { try { return { value: parseJson(input), error: "" }; } catch (reason) { return { value: null, error: reason instanceof Error ? reason.message : "Invalid JSON" }; } }, [input]);
  const flattened = useMemo(() => parsed.value === null ? {} : flattenJson(parsed.value), [parsed]);
  const pathMatches = useMemo(() => parsed.value === null ? [] : queryJsonPath(parsed.value, path), [parsed, path]);
  const table = useMemo(() => { try { return { data: jsonArrayToTable(tableInput), error: "" }; } catch (reason) { return { data: null, error: reason instanceof Error ? reason.message : "Invalid JSON array" }; } }, [tableInput]);
  const sortedRows = useMemo(() => !table.data ? [] : !tableSort ? table.data.rows : [...table.data.rows].sort((left, right) => String(left[tableSort.column]).localeCompare(String(right[tableSort.column]), undefined, { numeric: true }) * (tableSort.asc ? 1 : -1)), [table, tableSort]);

  const execute = (operation: "format" | "minify" | "validate" | "schema") => {
    try {
      if (operation === "format") setOutput(formatJson(input, { indent, sortKeys }));
      if (operation === "minify") setOutput(minifyJson(input));
      if (operation === "validate") setOutput(`Valid JSON · ${new Blob([input]).size.toLocaleString()} bytes`);
      if (operation === "schema") setOutput(JSON.stringify(inferJsonSchema(parseJson(input)), null, 2));
      setError("");
    } catch (reason) { setOutput(""); setError(reason instanceof Error ? reason.message : "Unable to process JSON."); }
  };
  const loadSample = () => { setInput(sample); setOutput(""); setError(""); };
  const makeTable = () => { setTableInput(arraySample); setTableSort(null); };
  const pointerValue = pointer in flattened ? JSON.stringify(flattened[pointer], null, 2) : "Pointer not found in this JSON document.";
  const changes = useMemo(() => { try { return parsed.value === null ? [] : diffJson(parsed.value, parseJson(compareInput)); } catch { return []; } }, [parsed, compareInput]);

  const formatterPanel = () => <div className="json-work-grid">
    <section className="json-card json-input-card"><header><strong>JSON input</strong><div><button type="button" onClick={loadSample}>Load sample</button><button type="button" onClick={() => { setInput(""); setOutput(""); setError(""); }}>Clear</button></div></header><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></section>
    <section className="json-card json-output-card"><header><strong>{utility === "tree" ? "Tree viewer" : utility === "flatten" ? "Flattened output" : utility === "pointer" ? "Pointer result" : utility === "schema" ? "JSON schema" : utility === "diff" ? "JSON diff" : "Output"}</strong><CopyButton value={output || (utility === "flatten" ? JSON.stringify(flattened, null, 2) : utility === "pointer" ? pointerValue : utility === "schema" && parsed.value !== null ? JSON.stringify(inferJsonSchema(parsed.value), null, 2) : "")} /></header>{utility === "tree" ? <pre className="json-tree">{parsed.error || JSON.stringify(parsed.value, null, 2)}</pre> : utility === "flatten" ? <pre>{JSON.stringify(flattened, null, 2)}</pre> : utility === "pointer" ? <pre>{pointerValue}</pre> : utility === "schema" ? <pre>{parsed.error || (parsed.value ? JSON.stringify(inferJsonSchema(parsed.value), null, 2) : "")}</pre> : utility === "diff" ? <div className="json-diff-list">{changes.length ? changes.map((change, index) => <article className={`is-${change.type}`} key={`${change.path}-${index}`}><b>{change.type}</b><code>{change.path}</code><span>{change.type === "removed" ? JSON.stringify(change.before) : JSON.stringify(change.after)}</span></article>) : <p>{parsed.error ? "Fix the first JSON document to compare." : "No differences found."}</p>}</div> : <pre className={error ? "is-error" : ""}>{error || output || "Format, minify, or validate your JSON here."}</pre>}</section>
  </div>;

  const renderTools = () => <>
    <div className="json-subtabs">{(["formatter", "tree", "flatten", "pointer", "diff", "schema"] as Utility[]).map((item) => <button type="button" key={item} className={utility === item ? "is-active" : ""} onClick={() => { setUtility(item); setError(""); }}>{item === "tree" ? "Tree Viewer" : item === "flatten" ? "Flatten" : item === "pointer" ? "Pointer" : item === "diff" ? "Diff" : item === "schema" ? "Schema" : "Formatter"}</button>)}</div>
    {utility === "formatter" ? <section className="json-toolbar"><button type="button" className="json-primary" onClick={() => execute("format")}>Format</button><button type="button" onClick={() => execute("minify")}>Minify</button><button type="button" onClick={() => execute("validate")}>Validate</button><label><input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} /> Sort keys</label><label>Indent<select value={indent} onChange={(event) => setIndent(Number(event.target.value))}><option value={2}>2 spaces</option><option value={4}>4 spaces</option><option value={1}>Tab-like</option></select></label></section> : null}
    {utility === "pointer" ? <section className="json-toolbar"><label>JSON pointer<input value={pointer} onChange={(event) => setPointer(event.target.value)} placeholder="/store/book/0/title" /></label></section> : null}
    {utility === "diff" ? <section className="json-card json-compare"><header><strong>Compare with</strong><span>Second JSON document</span></header><textarea value={compareInput} onChange={(event) => setCompareInput(event.target.value)} spellCheck={false} /></section> : null}
    {utility === "schema" ? <section className="json-toolbar"><button type="button" className="json-primary" onClick={() => execute("schema")}>Generate schema</button><span>Uses the current document&apos;s values to infer JSON Schema types.</span></section> : null}
    {formatterPanel()}
  </>;

  const renderPath = () => <div className="json-path-layout"><section className="json-card json-path-query"><label>JSONPath expression<input value={path} onChange={(event) => setPath(event.target.value)} /></label><div className="json-chip-row">{[["All authors", "$.store.book[*].author"], ["Recursive author", "$..author"], ["Books under $10", "$.store.book[?(@.price < 10)]"], ["Last book", "$.store.book[-1]"]].map(([label, query]) => <button type="button" key={query} onClick={() => setPath(query)}>{label}</button>)}</div><button type="button" className="json-primary" onClick={loadSample}><RefreshCw size={14} /> Load sample JSON</button></section><section className="json-card json-path-results"><header><strong>Results</strong><span>{pathMatches.length} match{pathMatches.length === 1 ? "" : "es"}</span></header>{parsed.error ? <p className="json-error">{parsed.error}</p> : <div>{pathMatches.map((match, index) => <article key={`${match.path}-${index}`}><code>{match.path}</code><pre>{JSON.stringify(match.value, null, 2)}</pre></article>) || <p>No matches.</p>}</div>}</section><section className="json-card json-path-source"><header><strong>JSON input</strong></header><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></section></div>;

  const renderPretty = () => <><section className="json-toolbar json-pretty-toolbar"><label>Indent<select value={indent} onChange={(event) => setIndent(Number(event.target.value))}><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select></label><button type="button" className="json-primary" onClick={() => execute("format")}>Prettify</button><button type="button" onClick={() => execute("minify")}>Minify</button><button type="button" onClick={() => execute("format")}>Sort keys</button><button type="button" onClick={() => execute("validate")}>Validate</button><button type="button" onClick={loadSample}>Load sample</button></section><div className="json-work-grid"><section className="json-card json-input-card"><header><strong>Input</strong><span>{new Blob([input]).size} B</span></header><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></section><section className="json-card json-output-card"><header><strong>Output</strong><div><CopyButton value={output} /><DownloadButton value={output} fileName="formatted.json" /></div></header><pre className={error ? "is-error" : ""}>{error || output || "Output will appear here…"}</pre></section></div></>;

  const renderTable = () => <div className="json-table-layout"><section className="json-card json-table-input"><header><strong>JSON array input</strong><span>{tableInput.length} chars</span></header><textarea value={tableInput} onChange={(event) => setTableInput(event.target.value)} spellCheck={false} /><div><button type="button" className="json-primary" onClick={() => setTableInput(tableInput)}>Build table</button><button type="button" onClick={makeTable}>Load sample</button></div></section><section className="json-card json-table-output"><header><strong>Table preview</strong><div>{table.data ? <><CopyButton value={tableToCsv(table.data.columns, sortedRows)} label="Copy CSV" /><DownloadButton value={tableToCsv(table.data.columns, sortedRows)} fileName="json-export.csv" label="Download CSV" /></> : null}</div></header>{table.error ? <p className="json-error">{table.error}</p> : <div className="json-table-scroll"><table><thead><tr>{table.data?.columns.map((column) => <th key={column}><button type="button" onClick={() => setTableSort((current) => current?.column === column ? { column, asc: !current.asc } : { column, asc: true })}>{column}{tableSort?.column === column ? tableSort.asc ? " ↑" : " ↓" : ""}</button></th>)}</tr></thead><tbody>{sortedRows.map((row, index) => <tr key={index}>{table.data?.columns.map((column) => <td key={column}>{row[column]}</td>)}</tr>)}</tbody></table></div>}</section></div>;

  return <section className="json-workbench"><header className="json-intro"><span><FileJson size={15} /> Formatter tools</span><h2>{active.label}</h2><p>{active.description}</p></header><nav className="json-tabs">{tabs.map((item) => <button type="button" key={item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>{tab === "tools" ? renderTools() : null}{tab === "path" ? renderPath() : null}{tab === "pretty" ? renderPretty() : null}{tab === "table" ? renderTable() : null}</section>;
}
