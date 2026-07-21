"use client";

import { Check, Clipboard, Download, Eraser, FlaskConical, Lock, Play, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type HashAlgorithm,
  type HashResult,
  type SriAlgorithm,
  decodeJwt,
  decryptText,
  encryptText,
  generateHmacDigest,
  generatePassword,
  generateShaDigest,
  generateSri,
  hashText,
  inspectJwt,
} from "./crypto-engine";

type CryptoMode = "hash" | "text-hash" | "hmac" | "sri" | "jwt-debugger" | "jwt-inspector" | "encrypt" | "password";
type EncryptDirection = "encrypt" | "decrypt";
type CryptoTab = { id: CryptoMode; label: string; title: string; description: string; sample: string };

const jwtSample = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRLIENvZGVyIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature";
const encryptedSample = "Type text here, choose Encrypt, then generate an AES-GCM payload.";

const tabs: CryptoTab[] = [
  { id: "hash", label: "Hash Generator", title: "SHA Hash Generator", description: "Generate SHA digests with hex, Base64, and Base64URL output formats.", sample: "DK Tools\nHash this message locally." },
  { id: "text-hash", label: "Text Hash Generator", title: "Hash Text", description: "Compute SHA-1, SHA-256, SHA-384, SHA-512 plus CRC32 and djb2 checksums for text.", sample: "DK Tools\nHash this message locally." },
  { id: "hmac", label: "HMAC Generator", title: "HMAC Generator", description: "Sign a message with a secret key using Web Crypto HMAC.", sample: "amount=125000&currency=VND&order=DK-2026" },
  { id: "sri", label: "SRI Hash Generator", title: "SRI Hash Generator", description: "Create Subresource Integrity values for scripts, styles, and static assets.", sample: "console.log('DK Tools');" },
  { id: "jwt-debugger", label: "JWT Debugger", title: "JWT Debugger", description: "Decode JWT header and payload locally. This does not verify the signature.", sample: jwtSample },
  { id: "jwt-inspector", label: "JWT Inspector", title: "JWT Inspector", description: "Inspect common JWT claims, timestamps, and expiration state without sending the token away.", sample: jwtSample },
  { id: "encrypt", label: "Text Encrypt / Decrypt", title: "Text Encrypt / Decrypt", description: "Encrypt or decrypt text locally with AES-GCM and a passphrase-derived key.", sample: encryptedSample },
  { id: "password", label: "Password", title: "Password Generator", description: "Generate strong random passwords with configurable character sets.", sample: "Use the options above, then generate a password." },
];

const hashOptions: HashAlgorithm[] = ["SHA-256", "SHA-384", "SHA-512", "SHA-1"];
const sriOptions: SriAlgorithm[] = ["SHA-384", "SHA-256", "SHA-512"];

export default function CryptoWorkbench() {
  const [mode, setMode] = useState<CryptoMode>(tabs[0]!.id);
  const [input, setInput] = useState(tabs[0]!.sample);
  const [output, setOutput] = useState("");
  const [results, setResults] = useState<HashResult[]>([]);
  const [error, setError] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [sriAlgorithm, setSriAlgorithm] = useState<SriAlgorithm>("SHA-384");
  const [secret, setSecret] = useState("dk-secret-key");
  const [cryptoPassword, setCryptoPassword] = useState("strong-local-password");
  const [direction, setDirection] = useState<EncryptDirection>("encrypt");
  const [passwordLength, setPasswordLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [copied, setCopied] = useState("");

  const active = tabs.find((tab) => tab.id === mode)!;
  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputBytes = useMemo(() => new TextEncoder().encode(output).length, [output]);
  const inputLabel = mode === "password" ? "Password Notes" : mode === "jwt-debugger" || mode === "jwt-inspector" ? "JWT Input" : mode === "sri" ? "Asset Content Input" : "Raw Input";
  const outputLabel = mode === "jwt-debugger" || mode === "jwt-inspector" ? "JWT Output" : mode === "encrypt" && direction === "encrypt" ? "Encrypted Output" : mode === "encrypt" ? "Decrypted Output" : mode === "sri" ? "SRI Output" : "Result Output";

  const resetOutput = () => { setOutput(""); setResults([]); setError(""); setCopied(""); };
  const selectMode = (next: CryptoMode) => { const nextTab = tabs.find((tab) => tab.id === next)!; setMode(next); setInput(nextTab.sample); setOutput(""); setResults([]); setError(""); setCopied(""); };
  const sample = () => { setInput(active.sample); resetOutput(); };
  const clear = () => { setInput(active.sample); resetOutput(); };

  const run = async () => {
    try {
      let result = "";
      let nextResults: HashResult[] = [];
      if (mode === "hash") {
        const digest = await generateShaDigest(input, algorithm);
        nextResults = [{ label: algorithm, kind: "cryptographic", ...digest }];
        result = JSON.stringify(digest, null, 2);
      }
      if (mode === "text-hash") {
        nextResults = await hashText(input);
        result = nextResults.map((item) => item.label + ": " + item.hex).join("\n");
      }
      if (mode === "hmac") {
        const digest = await generateHmacDigest(input, secret, algorithm);
        nextResults = [{ label: algorithm + " HMAC", kind: "cryptographic", ...digest }];
        result = JSON.stringify(digest, null, 2);
      }
      if (mode === "sri") result = await generateSri(input, sriAlgorithm);
      if (mode === "jwt-debugger") result = JSON.stringify(decodeJwt(input), null, 2);
      if (mode === "jwt-inspector") result = JSON.stringify(inspectJwt(input), null, 2);
      if (mode === "encrypt") result = direction === "encrypt" ? await encryptText(input, cryptoPassword) : await decryptText(input, cryptoPassword);
      if (mode === "password") result = generatePassword({ length: passwordLength, uppercase, lowercase, numbers, symbols });
      setOutput(result);
      setResults(nextResults);
      setError("");
      setCopied("");
    } catch (reason) {
      setOutput("");
      setResults([]);
      setError(reason instanceof Error ? reason.message : "Unable to process this input.");
    }
  };

  const copyValue = async (value: string, key: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  };

  const download = () => {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "dk-tools-" + mode + ".txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return <section className="crypto-workbench">
    <div className="crypto-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => selectMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="crypto-intro"><div><span>Crypto lab</span><h2>{active.title}</h2><p>{active.description} All processing stays in your browser.</p></div><ShieldCheck size={25} /></div>
    <div className="crypto-options">
      {(mode === "hash" || mode === "hmac") ? <label>Algorithm<select value={algorithm} onChange={(event) => { setAlgorithm(event.target.value as HashAlgorithm); resetOutput(); }}>{hashOptions.map((item) => <option key={item}>{item}</option>)}</select></label> : null}
      {mode === "sri" ? <label>Algorithm<select value={sriAlgorithm} onChange={(event) => { setSriAlgorithm(event.target.value as SriAlgorithm); resetOutput(); }}>{sriOptions.map((item) => <option key={item}>{item}</option>)}</select></label> : null}
      {mode === "hmac" ? <label>Secret<input value={secret} onChange={(event) => { setSecret(event.target.value); resetOutput(); }} placeholder="secret key" /></label> : null}
      {mode === "encrypt" ? <><label>Mode<select value={direction} onChange={(event) => { const next = event.target.value as EncryptDirection; setDirection(next); setInput(next === "encrypt" ? encryptedSample : output || "Paste encrypted JSON payload here."); resetOutput(); }}><option value="encrypt">Encrypt</option><option value="decrypt">Decrypt</option></select></label><label>Password<input value={cryptoPassword} onChange={(event) => { setCryptoPassword(event.target.value); resetOutput(); }} placeholder="passphrase" /></label></> : null}
      {mode === "password" ? <><label>Length<input type="number" min={4} max={128} value={passwordLength} onChange={(event) => { setPasswordLength(Number(event.target.value)); resetOutput(); }} /></label><label className="crypto-check"><input type="checkbox" checked={uppercase} onChange={(event) => { setUppercase(event.target.checked); resetOutput(); }} />Uppercase</label><label className="crypto-check"><input type="checkbox" checked={lowercase} onChange={(event) => { setLowercase(event.target.checked); resetOutput(); }} />Lowercase</label><label className="crypto-check"><input type="checkbox" checked={numbers} onChange={(event) => { setNumbers(event.target.checked); resetOutput(); }} />Numbers</label><label className="crypto-check"><input type="checkbox" checked={symbols} onChange={(event) => { setSymbols(event.target.checked); resetOutput(); }} />Symbols</label></> : null}
      <span className="crypto-option-spacer" /><button onClick={sample}><FlaskConical size={15} />Sample</button><button onClick={clear}><Eraser size={15} />Clear</button>
    </div>
    <div className="crypto-editor-grid">
      <label className="crypto-editor"><span><b>{inputLabel}</b><small>{input.length.toLocaleString()} chars | {inputBytes} bytes</small></span><textarea spellCheck={false} value={input} onChange={(event) => { setInput(event.target.value); resetOutput(); }} placeholder={"Paste or type " + inputLabel.toLowerCase() + "..."} /></label>
      <div className="crypto-actions"><button className="is-primary" onClick={run}><Play size={15} />Generate</button><small>No data leaves your device</small></div>
      <label className="crypto-editor"><span><b>{outputLabel}</b><small>{output.length.toLocaleString()} chars | {outputBytes} bytes</small></span><textarea spellCheck={false} readOnly value={output} placeholder="Result will appear here..." /><div className="crypto-output-actions"><button disabled={!output} onClick={() => copyValue(output, "output")}>{copied === "output" ? <Check size={15} /> : <Clipboard size={15} />}{copied === "output" ? "Copied" : "Copy"}</button><button disabled={!output} onClick={download}><Download size={15} />Download .txt</button></div></label>
    </div>
    {results.length ? <div className="crypto-result-list" aria-label="Digest results">{results.map((item) => <article key={item.label} className="crypto-result-row"><div><b>{item.label}</b><small>{item.note || item.kind}</small></div><code>{item.hex}</code><button onClick={() => copyValue(item.hex, item.label)}>{copied === item.label ? <Check size={14} /> : <Clipboard size={14} />}</button></article>)}</div> : null}
    {error ? <p className="crypto-error" role="alert"><Lock size={14} />{error}</p> : null}
  </section>;
}
