"use client";

import { Check, Clipboard, Download, Eraser, FlaskConical, KeyRound, Play, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { type HashAlgorithm, checksum, generateHmac, generatePassword, generateShaHash } from "./crypto-engine";

type CryptoMode = "sha" | "hmac" | "checksum" | "password";

type CryptoTab = { id: CryptoMode; label: string; description: string; sample: string };
const tabs: CryptoTab[] = [
  { id: "sha", label: "SHA Hash", description: "Generate SHA-1, SHA-256, SHA-384, or SHA-512 digests locally in the browser.", sample: "DK Tools\nHash this message locally." },
  { id: "hmac", label: "HMAC", description: "Sign a message with a secret key using Web Crypto HMAC.", sample: "amount=125000&currency=VND&order=DK-2026" },
  { id: "checksum", label: "Checksum", description: "Create a quick additive checksum for lightweight integrity checks.", sample: "ABC" },
  { id: "password", label: "Password", description: "Generate strong random passwords with configurable character sets.", sample: "Password output is generated from the options on the right." },
];

export default function CryptoWorkbench() {
  const [mode, setMode] = useState<CryptoMode>(tabs[0]!.id);
  const [input, setInput] = useState(tabs[0]!.sample);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [secret, setSecret] = useState("dk-secret-key");
  const [passwordLength, setPasswordLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [copied, setCopied] = useState(false);
  const active = tabs.find((tab) => tab.id === mode)!;
  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputBytes = useMemo(() => new TextEncoder().encode(output).length, [output]);
  const inputLabel = mode === "password" ? "Password Notes" : mode === "hmac" ? "Message Input" : "Raw Input";
  const outputLabel = mode === "password" ? "Password Output" : mode === "checksum" ? "Checksum Output" : "Hex Digest Output";

  const resetOutput = () => { setOutput(""); setError(""); setCopied(false); };
  const clear = () => { setInput(active.sample); resetOutput(); };
  const selectMode = (next: CryptoMode) => { const nextTab = tabs.find((tab) => tab.id === next)!; setMode(next); setInput(nextTab.sample); setOutput(""); setError(""); setCopied(false); };
  const sample = () => { setInput(active.sample); resetOutput(); };

  const run = async () => {
    try {
      let result = "";
      if (mode === "sha") result = await generateShaHash(input, algorithm);
      if (mode === "hmac") result = await generateHmac(input, secret, algorithm);
      if (mode === "checksum") result = checksum(input);
      if (mode === "password") result = generatePassword({ length: passwordLength, uppercase, lowercase, numbers, symbols });
      setOutput(result); setError(""); setCopied(false);
    } catch (reason) {
      setOutput(""); setError(reason instanceof Error ? reason.message : "Unable to process this input.");
    }
  };

  const copy = async () => { if (!output) return; await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  const download = () => { if (!output) return; const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "dk-tools-" + mode + ".txt"; link.click(); URL.revokeObjectURL(url); };

  return <section className="crypto-workbench">
    <div className="crypto-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => selectMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="crypto-intro"><div><span>Crypto lab</span><h2>{active.label} Generator</h2><p>{active.description} No data leaves your device.</p></div><ShieldCheck size={25} /></div>
    <div className="crypto-options">
      {(mode === "sha" || mode === "hmac") ? <label>Algorithm<select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option><option>SHA-1</option></select></label> : null}
      {mode === "hmac" ? <label>Secret<input value={secret} onChange={(event) => { setSecret(event.target.value); resetOutput(); }} placeholder="secret key" /></label> : null}
      {mode === "password" ? <><label>Length<input type="number" min={4} max={128} value={passwordLength} onChange={(event) => setPasswordLength(Number(event.target.value))} /></label><label className="crypto-check"><input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />Uppercase</label><label className="crypto-check"><input type="checkbox" checked={lowercase} onChange={(event) => setLowercase(event.target.checked)} />Lowercase</label><label className="crypto-check"><input type="checkbox" checked={numbers} onChange={(event) => setNumbers(event.target.checked)} />Numbers</label><label className="crypto-check"><input type="checkbox" checked={symbols} onChange={(event) => setSymbols(event.target.checked)} />Symbols</label></> : null}
      <span className="crypto-option-spacer" /><button onClick={sample}><FlaskConical size={15} />Sample</button><button onClick={clear}><Eraser size={15} />Clear</button>
    </div>
    <div className="crypto-editor-grid">
      <label className="crypto-editor"><span><b>{inputLabel}</b><small>{input.length.toLocaleString()} chars | {inputBytes} bytes</small></span><textarea spellCheck={false} value={input} onChange={(event) => { setInput(event.target.value); resetOutput(); }} placeholder={"Paste or type " + inputLabel.toLowerCase() + "..."} /></label>
      <div className="crypto-actions"><button className="is-primary" onClick={run}><Play size={16} />Generate</button><small><KeyRound size={13} /> Browser-only processing</small></div>
      <label className="crypto-editor"><span><b>{outputLabel}</b><small>{output.length.toLocaleString()} chars | {outputBytes} bytes</small></span><textarea spellCheck={false} readOnly value={output} placeholder="Result will appear here..." /><div className="crypto-output-actions"><button disabled={!output} onClick={copy}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button><button disabled={!output} onClick={download}><Download size={15} />Download .txt</button></div></label>
    </div>
    {error ? <p className="crypto-error" role="alert">{error}</p> : null}
  </section>;
}
