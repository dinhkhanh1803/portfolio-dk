"use client";

import { Check, Clipboard, Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { type LoremFlavor, type LoremMode, type MockField, type MockFieldType, type MockFormat, type SequenceKind, formatMockRows, generateLorem, generateMockRows, generateSequence } from "./content-mock-engine";

type Mode = "lorem" | "lorem-advanced" | "schema" | "random" | "sequence";
const tabs: { id: Mode; label: string; description: string }[] = [
  { id: "lorem", label: "Lorem Ipsum", description: "Generate placeholder paragraphs with flavor, sentence, and export controls." },
  { id: "lorem-advanced", label: "Lorem Ipsum Generator", description: "Create paragraphs, sentences, or words with optional HTML wrapping." },
  { id: "schema", label: "Mock Data Generator", description: "Build a reusable data schema, generate realistic records, and export JSON, CSV, or SQL." },
  { id: "random", label: "Random Data Generator", description: "Choose ready-made fields for quick client-side test data." },
  { id: "sequence", label: "Number Sequence Generator", description: "Generate arithmetic, geometric, Fibonacci, prime, and classic number sequences." },
];
const types: MockFieldType[] = ["Full Name", "Email", "Phone", "Company", "City", "Country", "UUID", "Date", "Integer", "Boolean", "Lorem sentence"];
const defaultSchema: MockField[] = [
  { key: "fullName", type: "Full Name" }, { key: "email", type: "Email" }, { key: "phone", type: "Phone" },
  { key: "company", type: "Company" }, { key: "city", type: "City" }, { key: "country", type: "Country" },
];
const quickFields: MockField[] = [
  { key: "name", type: "Full Name" }, { key: "email", type: "Email" }, { key: "phone", type: "Phone" }, { key: "uuid", type: "UUID" }, { key: "date", type: "Date" }, { key: "city", type: "City" }, { key: "company", type: "Company" }, { key: "sentence", type: "Lorem sentence" }, { key: "integer", type: "Integer" }, { key: "active", type: "Boolean" },
];
const sequences: { type: SequenceKind; hint: string }[] = [
  { type: "Arithmetic", hint: "a, a+d, a+2d" }, { type: "Geometric", hint: "a, a*r, a*r^2" }, { type: "Fibonacci", hint: "0, 1, 1, 2, 3" }, { type: "Prime", hint: "2, 3, 5, 7, 11" }, { type: "Triangular", hint: "1, 3, 6, 10" }, { type: "Square", hint: "1, 4, 9, 16" }, { type: "Cube", hint: "1, 8, 27, 64" }, { type: "Powers", hint: "b^0, b^1, b^2" },
];

const copy = async (value: string, setCopied: (key: string) => void, key: string) => { await navigator.clipboard.writeText(value); setCopied(key); window.setTimeout(() => setCopied(""), 1300); };
const download = (value: string, filename: string) => { const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); };
function CodeOutput({ value, copied, setCopied, file = "generated-data.txt" }: { value: string; copied: string; setCopied: (key: string) => void; file?: string }) {
  return <section className="content-code-output"><header><strong>Output</strong><div><button type="button" onClick={() => copy(value, setCopied, "output")}>{copied === "output" ? <Check size={14} /> : <Clipboard size={14} />} Copy</button><button type="button" onClick={() => download(value, file)}><Download size={14} /> Download</button></div></header><pre>{value}</pre></section>;
}

export default function ContentMockWorkbench() {
  const [mode, setMode] = useState<Mode>("lorem");
  const [copied, setCopied] = useState("");
  const [loremCount, setLoremCount] = useState(3);
  const [sentences, setSentences] = useState(5);
  const [flavor, setFlavor] = useState<LoremFlavor>("classic");
  const [includeStart, setIncludeStart] = useState(true);
  const [loremHtml, setLoremHtml] = useState(false);
  const [advancedMode, setAdvancedMode] = useState<LoremMode>("paragraphs");
  const [advancedCount, setAdvancedCount] = useState(3);
  const [advancedHtml, setAdvancedHtml] = useState(false);
  const [schema, setSchema] = useState<MockField[]>(defaultSchema);
  const [schemaRows, setSchemaRows] = useState(10);
  const [schemaFormat, setSchemaFormat] = useState<MockFormat>("JSON");
  const [schemaOutput, setSchemaOutput] = useState("");
  const [selectedQuick, setSelectedQuick] = useState<string[]>(["name", "email", "phone"]);
  const [quickRows, setQuickRows] = useState(10);
  const [quickFormat, setQuickFormat] = useState<MockFormat>("JSON");
  const [quickOutput, setQuickOutput] = useState("");
  const [sequenceType, setSequenceType] = useState<SequenceKind>("Arithmetic");
  const [sequenceCount, setSequenceCount] = useState(10);
  const [sequenceStart, setSequenceStart] = useState(1);
  const [sequenceStep, setSequenceStep] = useState(1);
  const [sequenceFormat, setSequenceFormat] = useState<"Comma" | "Space" | "Newline" | "JSON Array">("Comma");
  const active = tabs.find((tab) => tab.id === mode)!;
  const loremOutput = useMemo(() => generateLorem({ mode: "paragraphs", count: loremCount, sentencesPerParagraph: sentences, includeStart, flavor, html: loremHtml }), [loremCount, sentences, includeStart, flavor, loremHtml]);
  const advancedOutput = useMemo(() => generateLorem({ mode: advancedMode, count: advancedCount, sentencesPerParagraph: sentences, includeStart, flavor, html: advancedHtml }), [advancedMode, advancedCount, sentences, includeStart, flavor, advancedHtml]);
  const sequenceValues = useMemo(() => generateSequence(sequenceType, sequenceCount, sequenceStart, sequenceStep), [sequenceType, sequenceCount, sequenceStart, sequenceStep]);
  const sequenceOutput = sequenceFormat === "JSON Array" ? JSON.stringify(sequenceValues, null, 2) : sequenceValues.join(sequenceFormat === "Comma" ? ", " : sequenceFormat === "Space" ? " " : "\n");
  const updateField = (index: number, patch: Partial<MockField>) => setSchema((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  const generateSchema = () => setSchemaOutput(formatMockRows(generateMockRows(schema, schemaRows), schemaFormat));
  const quickSchema = quickFields.filter((field) => selectedQuick.includes(field.key));
  const generateQuick = () => setQuickOutput(formatMockRows(generateMockRows(quickSchema, quickRows), quickFormat));

  const renderLorem = () => <><div className="content-control-card content-inline-controls"><label>Paragraphs <b>{loremCount}</b><input type="range" min="1" max="20" value={loremCount} onChange={(event) => setLoremCount(Number(event.target.value))} /></label><label>Sentences per paragraph <b>{sentences}</b><input type="range" min="1" max="12" value={sentences} onChange={(event) => setSentences(Number(event.target.value))} /></label><label>Flavor<select value={flavor} onChange={(event) => setFlavor(event.target.value as LoremFlavor)}><option value="classic">Classic Latin</option><option value="tech">Tech product</option><option value="friendly">Friendly</option></select></label><label className="content-check"><input type="checkbox" checked={includeStart} onChange={(event) => setIncludeStart(event.target.checked)} />Start with Lorem ipsum</label><label>Format<select value={loremHtml ? "HTML" : "Plain Text"} onChange={(event) => setLoremHtml(event.target.value === "HTML")}><option>Plain Text</option><option>HTML</option></select></label></div><CodeOutput value={loremOutput} copied={copied} setCopied={setCopied} file={loremHtml ? "lorem.html" : "lorem.txt"} /></>;
  const renderAdvanced = () => <><div className="content-control-card"><div className="content-segmented">{(["paragraphs", "sentences", "words"] as LoremMode[]).map((item) => <button type="button" className={advancedMode === item ? "is-active" : ""} onClick={() => setAdvancedMode(item)} key={item}>{item[0]!.toUpperCase() + item.slice(1)}</button>)}</div><label>{advancedMode[0]!.toUpperCase() + advancedMode.slice(1)} <b>{advancedCount}</b><input type="range" min="1" max={advancedMode === "words" ? 200 : 30} value={advancedCount} onChange={(event) => setAdvancedCount(Number(event.target.value))} /></label><label className="content-check"><input type="checkbox" checked={includeStart} onChange={(event) => setIncludeStart(event.target.checked)} />Start with Lorem ipsum</label><label className="content-check"><input type="checkbox" checked={advancedHtml} onChange={(event) => setAdvancedHtml(event.target.checked)} />Wrap in p tags</label></div><CodeOutput value={advancedOutput} copied={copied} setCopied={setCopied} file={advancedHtml ? "placeholder.html" : "placeholder.txt"} /></>;
  const renderSchema = () => <><section className="content-schema"><header><strong>Schema ({schema.length} fields)</strong><button type="button" onClick={() => setSchema((current) => [...current, { key: `field${current.length + 1}`, type: "Full Name" }])}><Plus size={14} /> Add field</button></header>{schema.map((field, index) => <div className="content-schema-row" key={`${field.key}-${index}`}><input aria-label={`Field ${index + 1} name`} value={field.key} onChange={(event) => updateField(index, { key: event.target.value })} /><select aria-label={`Field ${index + 1} type`} value={field.type} onChange={(event) => updateField(index, { type: event.target.value as MockFieldType })}>{types.map((type) => <option key={type}>{type}</option>)}</select><button type="button" aria-label={`Remove ${field.key}`} disabled={schema.length === 1} onClick={() => setSchema((current) => current.filter((_, fieldIndex) => fieldIndex !== index))}><Trash2 size={15} /></button></div>)}</section><div className="content-control-card content-inline-controls"><label>Rows <b>{schemaRows}</b><input type="range" min="1" max="100" value={schemaRows} onChange={(event) => setSchemaRows(Number(event.target.value))} /></label><div className="content-segmented">{(["JSON", "CSV", "SQL"] as MockFormat[]).map((item) => <button type="button" className={schemaFormat === item ? "is-active" : ""} onClick={() => setSchemaFormat(item)} key={item}>{item}</button>)}</div><button className="content-primary" type="button" onClick={generateSchema}><RefreshCw size={15} /> Generate</button></div><CodeOutput value={schemaOutput || "Click Generate to produce realistic mock records."} copied={copied} setCopied={setCopied} file={`mock-data.${schemaFormat === "JSON" ? "json" : schemaFormat.toLowerCase()}`} /></>;
  const renderQuick = () => <><div className="content-quick-grid"><section className="content-control-card"><strong>Fields</strong><div className="content-checkbox-grid">{quickFields.map((field) => <label className="content-check" key={field.key}><input type="checkbox" checked={selectedQuick.includes(field.key)} onChange={(event) => setSelectedQuick((current) => event.target.checked ? [...current, field.key] : current.filter((key) => key !== field.key))} />{field.type}</label>)}</div><label>Rows <b>{quickRows}</b><input type="range" min="1" max="100" value={quickRows} onChange={(event) => setQuickRows(Number(event.target.value))} /></label><label>Format<select value={quickFormat} onChange={(event) => setQuickFormat(event.target.value as MockFormat)}>{(["JSON", "CSV", "SQL"] as MockFormat[]).map((item) => <option key={item}>{item}</option>)}</select></label><button className="content-primary" type="button" disabled={!quickSchema.length} onClick={generateQuick}>Generate</button></section><CodeOutput value={quickOutput || "Click Generate to produce fake data."} copied={copied} setCopied={setCopied} file={`random-data.${quickFormat === "JSON" ? "json" : quickFormat.toLowerCase()}`} /></div></>;
  const renderSequence = () => <div className="content-sequence-grid"><section className="content-control-card"><strong>Sequence type</strong><div className="content-sequence-types">{sequences.map(({ type, hint }) => <button type="button" className={sequenceType === type ? "is-active" : ""} onClick={() => setSequenceType(type)} key={type}><b>{type}</b><small>{hint}</small></button>)}</div><label>Count (max 200)<input type="number" min="1" max="200" value={sequenceCount} onChange={(event) => setSequenceCount(Number(event.target.value))} /></label><div className="content-field-row"><label>Start (a)<input type="number" value={sequenceStart} onChange={(event) => setSequenceStart(Number(event.target.value))} /></label><label>Step (d)<input type="number" value={sequenceStep} onChange={(event) => setSequenceStep(Number(event.target.value))} /></label></div><div className="content-segmented">{(["Comma", "Space", "Newline", "JSON Array"] as const).map((item) => <button type="button" className={sequenceFormat === item ? "is-active" : ""} onClick={() => setSequenceFormat(item)} key={item}>{item}</button>)}</div></section><div><CodeOutput value={sequenceOutput} copied={copied} setCopied={setCopied} file="number-sequence.txt" /><div className="content-stat-grid"><article><span>First</span><b>{sequenceValues[0]}</b></article><article><span>Last</span><b>{sequenceValues.at(-1)}</b></article><article><span>Sum</span><b>{sequenceValues.reduce((sum, value) => sum + value, 0)}</b></article><article><span>Min / Max</span><b>{Math.min(...sequenceValues)} / {Math.max(...sequenceValues)}</b></article></div></div></div>;
  return <section className="content-mock-workbench"><div className="data-format-tabs content-mock-tabs" role="tablist">{tabs.map((tab) => <button type="button" role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)} key={tab.id}>{tab.label}</button>)}</div><div className="content-mock-intro"><h2>{active.label}</h2><p>{active.description}</p></div>{mode === "lorem" ? renderLorem() : mode === "lorem-advanced" ? renderAdvanced() : mode === "schema" ? renderSchema() : mode === "random" ? renderQuick() : renderSequence()}</section>;
}