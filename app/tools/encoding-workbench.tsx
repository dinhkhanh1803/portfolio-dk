"use client";

import { ArrowLeftRight, Check, Clipboard, Download, Eraser, FileUp, FlaskConical, Play } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { type ByteEncoding, type EncodingDirection, type EncodingKind, decodeBytes, encodeBytes, transformEncoding } from "./encoding-engine";

const tabs: { id: EncodingKind; label: string; hint: string; sample: string }[] = [
  { id: "base64", label: "Base64", hint: "Encode Unicode text to Base64 and decode it back safely.", sample: "Xin chao DK Coder" },
  { id: "base32", label: "Base32", hint: "Encode and decode RFC 4648 Base32 text.", sample: "DK Tools RFC 4648" },
  { id: "url", label: "URL", hint: "Encode URL components or decode percent-encoded values.", sample: "https://dkcoder.vn/search?q=tools demo" },
  { id: "html", label: "HTML Entities", hint: "Escape special characters before embedding text in HTML.", sample: '<button aria-label="Open">Tools & Apps</button>' },
  { id: "binary", label: "Text / Binary", hint: "Convert UTF-8 text to binary, hex, decimal, or Base64 bytes.", sample: "DK ok" },
  { id: "data-uri", label: "Data URL", hint: "Create or decode embeddable data: URLs from raw text or uploaded files.", sample: "Hello from DK Tools!" },
];
const separators = { space: " ", newline: "\n", none: "" } as const;

export default function EncodingWorkbench() {
  const [kind, setKind] = useState<EncodingKind>(tabs[0]!.id);
  const [direction, setDirection] = useState<EncodingDirection>("encode");
  const [input, setInput] = useState(tabs[0]!.sample);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [byteEncoding, setByteEncoding] = useState<ByteEncoding>("binary");
  const [separator, setSeparator] = useState<keyof typeof separators>("space");
  const [mime, setMime] = useState("text/plain;charset=utf-8");
  const [dataUriBase64, setDataUriBase64] = useState(true);
  const [copied, setCopied] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const active = tabs.find((tab) => tab.id === kind)!;
  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputBytes = useMemo(() => new TextEncoder().encode(output).length, [output]);

  const resetOutput = () => { setOutput(""); setError(""); setCopied(""); };
  const clear = () => { setInput(active.sample); resetOutput(); };
  const sample = () => { setInput(active.sample); resetOutput(); };
  const changeKind = (next: EncodingKind) => { const nextTab = tabs.find((tab) => tab.id === next)!; setKind(next); setInput(nextTab.sample); setOutput(""); setError(""); setCopied(""); setDirection("encode"); };

  const run = () => {
    try {
      const result = kind === "binary"
        ? direction === "encode" ? encodeBytes(input, byteEncoding, separators[separator]) : decodeBytes(input, byteEncoding)
        : transformEncoding(kind, direction, input, { urlSafe, mime, dataUriBase64 });
      setOutput(result); setError(""); setCopied("");
    } catch (reason) {
      setOutput(""); setError(reason instanceof Error ? reason.message : "Unable to process this input.");
    }
  };

  const loadFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File is larger than the 5 MB limit."); return; }
    const reader = new FileReader();
    reader.onload = () => { setInput(String(reader.result ?? "")); setMime(file.type || "application/octet-stream"); setOutput(""); setError(""); setDirection("decode"); };
    reader.onerror = () => setError("Unable to read this file.");
    reader.readAsDataURL(file);
  };
  const copyText = async (value: string, id = "output") => { if (!value) return; await navigator.clipboard.writeText(value); setCopied(id); window.setTimeout(() => setCopied(""), 1400); };
  const download = () => { if (!output) return; const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = kind + "-result.txt"; link.click(); URL.revokeObjectURL(url); };

  return <section className={"encoding-workbench " + (kind === "data-uri" ? "is-data-uri" : "")}>
    <div className="encoding-tabs" role="tablist">{tabs.map((tab) => <button role="tab" aria-selected={kind === tab.id} className={kind === tab.id ? "is-active" : ""} onClick={() => changeKind(tab.id)} key={tab.id}>{tab.label}</button>)}</div>
    <div className="encoding-intro">
      <div><span>Encoding lab</span><h2>{kind === "data-uri" ? "Data URL Encoder / Decoder" : active.label + " Encoder / Decoder"}</h2><p>{active.hint} All processing stays local in your browser.</p></div>
      <div className="encoding-direction"><button className={direction === "encode" ? "is-active" : ""} onClick={() => { setDirection("encode"); resetOutput(); }}>Encode</button><button className={direction === "decode" ? "is-active" : ""} onClick={() => { setDirection("decode"); resetOutput(); }}>Decode</button></div>
    </div>
    <div className="encoding-options">
      {kind === "base64" && <label><input type="checkbox" checked={urlSafe} onChange={(event) => { setUrlSafe(event.target.checked); resetOutput(); }} /> URL-safe Base64</label>}
      {kind === "binary" && <><label>Format <select value={byteEncoding} onChange={(event) => { setByteEncoding(event.target.value as ByteEncoding); resetOutput(); }}><option value="binary">Binary</option><option value="hex">Hex</option><option value="decimal">Decimal</option><option value="base64">Base64</option></select></label>{direction === "encode" && byteEncoding !== "base64" && <label>Separator <select value={separator} onChange={(event) => { setSeparator(event.target.value as keyof typeof separators); resetOutput(); }}><option value="space">Space</option><option value="newline">New line</option><option value="none">None</option></select></label>}</>}
      {kind === "data-uri" && <><label>MIME <input value={mime} onChange={(event) => { setMime(event.target.value); resetOutput(); }} /></label><label><input type="checkbox" checked={dataUriBase64} onChange={(event) => { setDataUriBase64(event.target.checked); resetOutput(); }} /> Base64 payload</label><button onClick={() => fileInput.current?.click()}><FileUp size={15} />Upload file</button><input ref={fileInput} className="encoding-file-input" type="file" onChange={(event) => loadFile(event.target.files?.[0])} /></>}
      <span className="encoding-option-spacer" /><button onClick={sample}><FlaskConical size={15}/> Sample</button><button onClick={clear}><Eraser size={15}/> Clear</button>
    </div>
    <div className="encoding-editor-grid">
      <label className="encoding-editor"><span><b>{kind === "data-uri" && direction === "decode" ? "Data URL Input" : "Raw Input"}</b><small>{input.length} chars | {inputBytes} bytes</small></span><textarea spellCheck={false} value={input} onChange={(event) => { setInput(event.target.value); resetOutput(); }} placeholder={direction === "encode" ? "Paste or type raw text..." : "Paste encoded data..."} /></label>
      <div className="encoding-actions"><button className="is-primary" onClick={run}><Play size={16}/> {direction === "encode" ? "Encode" : "Decode"}</button><button disabled={!output} onClick={() => { setInput(output); setOutput(input); setDirection(direction === "encode" ? "decode" : "encode"); setError(""); }}><ArrowLeftRight size={16}/> Swap</button></div>
      <label className="encoding-editor"><span><b>{direction === "encode" ? "Encoded Output" : "Decoded Output"}</b><small>{output.length} chars | {outputBytes} bytes</small></span><textarea spellCheck={false} value={output} readOnly placeholder="Result will appear here..." /><div className="encoding-output-actions"><button type="button" disabled={!output} onClick={() => copyText(output)}>{copied === "output" ? <Check size={15}/> : <Clipboard size={15}/>} {copied === "output" ? "Copied" : "Copy"}</button><button type="button" disabled={!output} onClick={download}><Download size={15}/> Download .txt</button></div></label>
    </div>
    {error && <p className="encoding-error" role="alert">{error}</p>}
  </section>;
}
