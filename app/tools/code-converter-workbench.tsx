"use client";

import { Check, Clipboard, Download, Eraser, FlaskConical } from "lucide-react";
import { useState } from "react";
import {
  cssToTailwind,
  curlToFetch,
  dockerRunToCompose,
  figmaTokensToCss,
  htmlToJsx,
  jsonToGoStruct,
  jsonToTypeScript,
  jsonToZodSchema,
  sqlToTypeScript,
  svgToJsx,
} from "./code-converter-engine";

type CodeMode = "json-ts" | "json-zod" | "json-go" | "sql-ts" | "html-jsx" | "svg-jsx" | "css-tailwind" | "curl-fetch" | "docker-compose" | "figma-tokens";
type Tab = { id: CodeMode; label: string; description: string; inputLabel: string; outputLabel: string; extension: string; sample: string };

const jsonSample = '{\n  "id": 1,\n  "name": "Lan",\n  "active": true,\n  "tags": ["dev", "tools"],\n  "profile": { "score": 10 }\n}';
const tabs: Tab[] = [
  { id: "json-ts", label: "JSON to TypeScript", description: "Infer TypeScript interfaces from a JSON object.", inputLabel: "JSON Input", outputLabel: "TypeScript Output", extension: "ts", sample: jsonSample },
  { id: "json-zod", label: "JSON to Zod Schema", description: "Create browser-local Zod schemas from representative JSON.", inputLabel: "JSON Input", outputLabel: "Zod Output", extension: "ts", sample: jsonSample },
  { id: "json-go", label: "JSON to Go Struct", description: "Generate Go structs with json tags from JSON.", inputLabel: "JSON Input", outputLabel: "Go Output", extension: "go", sample: jsonSample },
  { id: "sql-ts", label: "SQL to TypeScript", description: "Convert CREATE TABLE columns into a TypeScript interface.", inputLabel: "SQL Input", outputLabel: "TypeScript Output", extension: "ts", sample: "CREATE TABLE users (\n  id integer primary key,\n  email varchar(255) not null,\n  active boolean,\n  created_at timestamp\n);" },
  { id: "html-jsx", label: "HTML to JSX", description: "Convert common HTML attributes to React JSX attributes.", inputLabel: "HTML Input", outputLabel: "JSX Output", extension: "tsx", sample: '<label class="field" for="email">\n  <input tabindex="1" readonly>\n</label>' },
  { id: "svg-jsx", label: "SVG to JSX", description: "Camel-case SVG attributes for React components.", inputLabel: "SVG Input", outputLabel: "JSX Output", extension: "tsx", sample: '<svg viewBox="0 0 24 24" stroke-width="2" fill-rule="evenodd">\n  <path d="M4 12h16" stroke-linecap="round" />\n</svg>' },
  { id: "css-tailwind", label: "CSS to Tailwind", description: "Map common CSS declarations to Tailwind utility classes.", inputLabel: "CSS Input", outputLabel: "Tailwind Output", extension: "txt", sample: "display: flex;\nalign-items: center;\njustify-content: space-between;\npadding: 1rem;\ncolor: #ffffff;" },
  { id: "curl-fetch", label: "cURL to Fetch", description: "Convert a cURL request into a fetch snippet.", inputLabel: "cURL Input", outputLabel: "Fetch Output", extension: "ts", sample: "curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"name\":\"Lan\"}'" },
  { id: "docker-compose", label: "Docker Run to Compose", description: "Convert common docker run flags to docker-compose YAML.", inputLabel: "Docker Run Input", outputLabel: "Compose Output", extension: "yaml", sample: "docker run -d --name web -p 8080:80 -e NODE_ENV=production nginx:alpine" },
  { id: "figma-tokens", label: "Figma Token Converter", description: "Flatten Figma Tokens JSON into CSS custom properties.", inputLabel: "Token JSON Input", outputLabel: "CSS Variables Output", extension: "css", sample: '{\n  "color": { "primary": { "value": "#147d7a" } },\n  "spacing": { "md": { "value": "16px" } }\n}' },
];

export default function CodeConverterWorkbench() {
  const [mode, setMode] = useState<CodeMode>(tabs[0]!.id);
  const [input, setInput] = useState(tabs[0]!.sample);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const active = tabs.find((tab) => tab.id === mode)!;

  const resetOutput = () => { setOutput(""); setError(""); setCopied(false); };
  const selectMode = (next: CodeMode) => { const nextTab = tabs.find((tab) => tab.id === next)!; setMode(next); setInput(nextTab.sample); setOutput(""); setError(""); setCopied(false); };
  const sample = () => { setInput(active.sample); resetOutput(); };
  const clear = () => { setInput(active.sample); resetOutput(); };

  const run = () => {
    try {
      const result = mode === "json-ts" ? jsonToTypeScript(input, "Root")
        : mode === "json-zod" ? jsonToZodSchema(input, "Root")
        : mode === "json-go" ? jsonToGoStruct(input, "Root")
        : mode === "sql-ts" ? sqlToTypeScript(input, "Row")
        : mode === "html-jsx" ? htmlToJsx(input)
        : mode === "svg-jsx" ? svgToJsx(input)
        : mode === "css-tailwind" ? cssToTailwind(input)
        : mode === "curl-fetch" ? curlToFetch(input)
        : mode === "docker-compose" ? dockerRunToCompose(input)
        : figmaTokensToCss(input);
      setOutput(result);
      setError("");
      setCopied(false);
    } catch (reason) {
      setOutput("");
      setError(reason instanceof Error ? reason.message : "Unable to convert this input.");
    }
  };

  const copy = async () => { if (!output) return; await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  const download = () => { if (!output) return; const link = document.createElement("a"); const blob = new Blob([output], { type: "text/plain;charset=utf-8" }); link.href = URL.createObjectURL(blob); link.download = `dk-tools-${mode}.${active.extension}`; link.click(); URL.revokeObjectURL(link.href); };

  return <section className="data-format-workbench code-converter-workbench">
    <div className="data-format-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => selectMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="data-format-intro"><div><span>Code conversion lab</span><h2>{active.label}</h2><p>{active.description} All processing stays local in your browser.</p></div></div>
    <div className="data-format-options"><span className="data-format-option-spacer" /><button onClick={sample}><FlaskConical size={15} />Sample</button><button onClick={clear}><Eraser size={15} />Clear</button></div>
    <div className="data-format-editors">
      <label className="data-format-editor"><span><b>{active.inputLabel}</b><small>{input.length.toLocaleString()} chars</small></span><textarea spellCheck={false} value={input} onChange={(event) => { setInput(event.target.value); resetOutput(); }} placeholder={`Paste or type ${active.inputLabel.toLowerCase()}...`} /></label>
      <div className="data-format-actions"><button className="is-primary" onClick={run}>Convert</button><small>No data leaves your device</small></div>
      <label className="data-format-editor"><span><b>{active.outputLabel}</b><small>{output.length.toLocaleString()} chars</small></span><textarea spellCheck={false} readOnly value={output} placeholder="Result will appear here..." /><div className="data-output-actions"><button disabled={!output} onClick={copy}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button><button disabled={!output} onClick={download}><Download size={15} />Download .{active.extension}</button></div></label>
    </div>
    {error ? <p className="data-format-error" role="alert">{error}</p> : null}
  </section>;
}