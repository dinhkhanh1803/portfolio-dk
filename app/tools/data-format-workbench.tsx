"use client";

import { Check, Clipboard, Download, Eraser, FileUp, FlaskConical, Table2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { csvToJson, csvToMarkdown, csvToSql, jsonToCsv, jsonToXml, jsonToYaml, markdownToJson, markdownToNotionBlocks, xmlToJson, yamlToJson } from "./data-format-engine";

type Mode = "csv-json" | "json-csv" | "csv-sql" | "csv-markdown" | "yaml-json" | "json-yaml" | "json-xml" | "xml-json" | "markdown-json" | "markdown-notion";
type Delimiter = "," | ";" | "\t" | "|";

const tabs: { id: Mode; label: string; description: string; sample: string }[] = [
  { id: "csv-json", label: "CSV -> JSON", description: "Convert CSV rows into JSON records with header, delimiter, trim, and empty-cell controls.", sample: "name,email,role\nLan,lan@example.com,Developer\nMinh,minh@example.com,Designer" },
  { id: "json-csv", label: "JSON -> CSV", description: "Export an array of JSON objects to CSV for Excel, Sheets, imports, and reports.", sample: '[\n  { "name": "Lan", "role": "Developer" },\n  { "name": "Minh", "role": "Designer", "active": true }\n]' },
  { id: "csv-sql", label: "CSV -> SQL", description: "Generate INSERT statements for PostgreSQL, MySQL, or SQLite.", sample: "name,email\nLan,lan@example.com\nMinh,minh@example.com" },
  { id: "csv-markdown", label: "CSV -> Markdown", description: "Turn CSV data into a clean Markdown table.", sample: "name,role\nLan,Developer\nMinh,Designer" },
  { id: "yaml-json", label: "YAML -> JSON", description: "Convert common YAML objects and lists into formatted JSON.", sample: "name: Lan\ntags:\n  - dev\n  - tools\nprofile:\n  active: true\n  score: 10" },
  { id: "json-yaml", label: "JSON -> YAML", description: "Convert JSON objects, arrays, strings, numbers, booleans, and null into readable YAML.", sample: '{\n  "name": "Lan",\n  "tags": ["dev", "tools"],\n  "profile": { "active": true, "score": 10 }\n}' },
  { id: "json-xml", label: "JSON -> XML", description: "Generate escaped XML from JSON using a configurable root element.", sample: '{\n  "user": { "name": "Lan", "active": true, "note": "A&B" }\n}' },
  { id: "xml-json", label: "XML -> JSON", description: "Parse simple nested XML documents into JSON.", sample: "<root>\n  <user>\n    <name>Lan</name>\n    <active>true</active>\n  </user>\n</root>" },
  { id: "markdown-json", label: "Markdown -> JSON", description: "Convert Markdown tables into reusable JSON records.", sample: "| Name | Role |\n| --- | --- |\n| Lan | Developer |\n| Minh | Designer |" },
  { id: "markdown-notion", label: "Markdown -> Notion", description: "Export Markdown headings, lists, and paragraphs as Notion-style block JSON.", sample: "# Launch plan\n- Build converter\n- Verify UI\nPlain note" },
];

const delimiters: { value: Delimiter; label: string }[] = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];

export default function DataFormatWorkbench() {
  const [mode, setMode] = useState<Mode>(tabs[0]!.id);
  const [input, setInput] = useState(tabs[0]!.sample);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [trim, setTrim] = useState(true);
  const [skipEmpty, setSkipEmpty] = useState(false);
  const [tableName, setTableName] = useState("imported_data");
  const [rootName, setRootName] = useState("root");
  const [dialect, setDialect] = useState<"postgres" | "mysql" | "sqlite">("postgres");
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const active = tabs.find((tab) => tab.id === mode)!;
  const isCsvInput = mode === "csv-json" || mode === "csv-sql" || mode === "csv-markdown";
  const isJsonInput = mode === "json-csv" || mode === "json-yaml" || mode === "json-xml";
  const isMarkdownInput = mode === "markdown-json" || mode === "markdown-notion";
  const outputLabel = mode.endsWith("csv") ? "CSV Output" : mode.endsWith("sql") ? "SQL Output" : mode.endsWith("markdown") ? "Markdown Output" : mode.endsWith("yaml") ? "YAML Output" : mode.endsWith("xml") ? "XML Output" : "JSON Output";
  const outputExtension = mode.endsWith("csv") ? "csv" : mode.endsWith("sql") ? "sql" : mode.endsWith("markdown") ? "md" : mode.endsWith("yaml") ? "yaml" : mode.endsWith("xml") ? "xml" : "json";
  const fileAccept = isJsonInput ? ".json,application/json" : isMarkdownInput ? ".md,.markdown,.txt,text/markdown,text/plain" : mode === "yaml-json" ? ".yaml,.yml,.txt,application/yaml,text/yaml,text/plain" : mode === "xml-json" ? ".xml,.txt,application/xml,text/xml,text/plain" : ".csv,.txt,text/csv,text/plain";
  const inputLabel = isJsonInput ? "JSON Input" : isMarkdownInput ? "Markdown Input" : mode === "yaml-json" ? "YAML Input" : mode === "xml-json" ? "XML Input" : "CSV Input";

  const preview = useMemo(() => {
    try {
      const parsed = output && outputExtension === "json" ? JSON.parse(output) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 5) as Record<string, string>[] : [];
    } catch { return []; }
  }, [output, outputExtension]);

  const clear = () => { setInput(active.sample); setOutput(""); setError(""); setCopied(false); };
  const selectMode = (next: Mode) => { const nextTab = tabs.find((tab) => tab.id === next)!; setMode(next); setInput(nextTab.sample); setOutput(""); setError(""); setCopied(false); };
  const sample = () => { setInput(active.sample); setOutput(""); setError(""); setCopied(false); };

  const run = () => {
    try {
      let result = "";
      if (mode === "csv-json") result = JSON.stringify(csvToJson(input, { delimiter, hasHeaders, trim, skipEmptyValues: skipEmpty }), null, 2);
      if (mode === "json-csv") result = jsonToCsv(JSON.parse(input), delimiter);
      if (mode === "csv-sql") result = csvToSql(input, { delimiter, hasHeaders, trim, skipEmptyValues: skipEmpty, tableName, dialect });
      if (mode === "csv-markdown") result = csvToMarkdown(input, { delimiter, trim });
      if (mode === "yaml-json") result = JSON.stringify(yamlToJson(input), null, 2);
      if (mode === "json-yaml") result = jsonToYaml(JSON.parse(input));
      if (mode === "json-xml") result = jsonToXml(JSON.parse(input), rootName);
      if (mode === "xml-json") result = JSON.stringify(xmlToJson(input), null, 2);
      if (mode === "markdown-json") result = JSON.stringify(markdownToJson(input), null, 2);
      if (mode === "markdown-notion") result = JSON.stringify(markdownToNotionBlocks(input), null, 2);
      setOutput(result); setError("");
    } catch (reason) { setOutput(""); setError(reason instanceof Error ? reason.message : "Unable to convert this input."); }
  };

  const loadFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File is larger than the 5 MB limit."); return; }
    const reader = new FileReader();
    reader.onload = () => { setInput(String(reader.result ?? "")); setOutput(""); setError(""); };
    reader.onerror = () => setError("Unable to read this file.");
    reader.readAsText(file);
  };
  const copy = async () => { if (!output) return; await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  const download = () => { if (!output) return; const link = document.createElement("a"); const blob = new Blob([output], { type: outputExtension === "json" ? "application/json" : "text/plain;charset=utf-8" }); link.href = URL.createObjectURL(blob); link.download = `dk-tools-${mode}.${outputExtension}`; link.click(); URL.revokeObjectURL(link.href); };

  return <section className="data-format-workbench">
    <div className="data-format-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => selectMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="data-format-intro"><div><span>Data conversion lab</span><h2>{active.label} Converter</h2><p>{active.description} All processing stays local in your browser.</p></div><Table2 size={25} /></div>
    <div className="data-format-options">
      {isCsvInput || mode === "json-csv" ? <label>Delimiter<select value={delimiter} onChange={(event) => setDelimiter(event.target.value as Delimiter)}>{delimiters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label> : null}
      {isCsvInput ? <><label className="data-check"><input type="checkbox" checked={hasHeaders} onChange={(event) => setHasHeaders(event.target.checked)} />First row is headers</label><label className="data-check"><input type="checkbox" checked={trim} onChange={(event) => setTrim(event.target.checked)} />Trim whitespace</label><label className="data-check"><input type="checkbox" checked={skipEmpty} onChange={(event) => setSkipEmpty(event.target.checked)} />Skip empty cells</label></> : null}
      {mode === "csv-sql" ? <><label>Table name<input value={tableName} onChange={(event) => setTableName(event.target.value)} /></label><label>SQL dialect<select value={dialect} onChange={(event) => setDialect(event.target.value as typeof dialect)}><option value="postgres">PostgreSQL</option><option value="mysql">MySQL</option><option value="sqlite">SQLite</option></select></label></> : null}
      {mode === "json-xml" ? <label>Root name<input value={rootName} onChange={(event) => setRootName(event.target.value)} /></label> : null}
      <span className="data-format-option-spacer" /><button onClick={sample}><FlaskConical size={15} />Sample</button><button onClick={clear}><Eraser size={15} />Clear</button>
    </div>
    <div className="data-format-editors">
      <label className="data-format-editor"><span><b>{inputLabel}</b><small>{input.length.toLocaleString()} chars</small></span><textarea spellCheck={false} value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Paste or type ${inputLabel.toLowerCase()}...`} /><div className="data-input-actions"><button onClick={() => fileInput.current?.click()}><FileUp size={15} />Upload file</button><input ref={fileInput} type="file" accept={fileAccept} onChange={(event) => loadFile(event.target.files?.[0])} /></div></label>
      <div className="data-format-actions"><button className="is-primary" onClick={run}>Convert</button><small>No data leaves your device</small></div>
      <label className="data-format-editor"><span><b>{outputLabel}</b><small>{output.length.toLocaleString()} chars</small></span><textarea spellCheck={false} readOnly value={output} placeholder="Result will appear here..." /><div className="data-output-actions"><button disabled={!output} onClick={copy}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button><button disabled={!output} onClick={download}><Download size={15} />Download .{outputExtension}</button></div></label>
    </div>
    {preview.length > 0 ? <div className="data-format-preview"><div><strong>Preview</strong><span>{preview.length === 5 ? "First 5 rows" : `${preview.length} rows`}</span></div><div className="data-format-table-wrap"><table><thead><tr>{Object.keys(preview[0]!).map((key) => <th key={key}>{key}</th>)}</tr></thead><tbody>{preview.map((row, index) => <tr key={index}>{Object.keys(preview[0]!).map((key) => <td key={key}>{row[key]}</td>)}</tr>)}</tbody></table></div></div> : null}
    {error ? <p className="data-format-error" role="alert">{error}</p> : null}
  </section>;
}
