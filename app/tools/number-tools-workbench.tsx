"use client";

import { Check, Clipboard, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { byteUnitConvert, convertBase, ipAddressConvert, numberBasePlayground, numberToRoman, numberToWords, romanToNumber } from "./number-tools-engine";

type Mode = "base" | "playground" | "roman" | "words" | "ip" | "bytes";
type Tab = { id: Mode; label: string; description: string; sample: string };
const tabs: Tab[] = [
  { id: "base", label: "Number Base Converter", description: "Convert a number across common bases, custom Base 36, grouped binary, and bitwise views.", sample: "255" },
  { id: "playground", label: "Number Base Playground", description: "Evaluate simple expressions using decimal, 0b binary, 0o octal, and 0x hexadecimal tokens.", sample: "0b1010 + 0x5" },
  { id: "roman", label: "Roman Numeral Converter", description: "Convert numbers to Roman numerals or Roman numerals back to decimal.", sample: "1994" },
  { id: "words", label: "Number to Words", description: "Spell whole numbers in English words for labels, invoices, and documentation.", sample: "1205" },
  { id: "ip", label: "IP Address Converter", description: "Convert IPv4 addresses into integer, binary octets, and hexadecimal notation.", sample: "192.168.1.1" },
  { id: "bytes", label: "Byte Unit Converter", description: "Convert storage values between B, KB, MB, GB, TB, KiB, MiB, and GiB.", sample: "1024" },
];

const baseOptions = [
  { label: "Binary (2)", value: 2 },
  { label: "Octal (8)", value: 8 },
  { label: "Decimal (10)", value: 10 },
  { label: "Hexadecimal (16)", value: 16 },
  { label: "Base 36", value: 36 },
];
const byteUnits = ["B", "KB", "MB", "GB", "TB", "KiB", "MiB", "GiB"];
const copyText = async (value: string, setCopied: (value: string) => void, key: string) => {
  await navigator.clipboard.writeText(value);
  setCopied(key);
  window.setTimeout(() => setCopied(""), 1400);
};

function ResultCard({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return <div className="calculator-result-card"><span>{label}</span><strong>{value}</strong><button type="button" onClick={onCopy} aria-label={`Copy ${label}`}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></div>;
}

export default function NumberToolsWorkbench() {
  const [mode, setMode] = useState<Mode>("base");
  const [numberValue, setNumberValue] = useState("255");
  const [inputBase, setInputBase] = useState(10);
  const [customBase, setCustomBase] = useState(36);
  const [expression, setExpression] = useState("0b1010 + 0x5");
  const [romanValue, setRomanValue] = useState("1994");
  const [wordValue, setWordValue] = useState("1205");
  const [ipValue, setIpValue] = useState("192.168.1.1");
  const [byteValue, setByteValue] = useState("1024");
  const [byteFrom, setByteFrom] = useState("B");
  const [byteTo, setByteTo] = useState("KB");
  const [copied, setCopied] = useState("");
  const active = tabs.find((tab) => tab.id === mode)!;

  const results = useMemo(() => {
    try {
      if (mode === "base") {
        const parsed = Number.parseInt(numberValue.trim().replace(/^0[xob]/i, ""), inputBase);
        if (!Number.isFinite(parsed)) throw new Error("Invalid number for selected base.");
        const common = convertBase(numberValue, inputBase);
        const grouped = common.binary.replace(/(.{4})/g, "$1 ").trim();
        const bytes = common.binary.padStart(Math.ceil(common.binary.length / 8) * 8, "0").match(/.{1,8}/g) ?? [];
        return [
          ["Binary", common.binary], ["Octal", common.octal], ["Decimal", common.decimal], ["Hex", common.hexadecimal],
          [`Base ${customBase}`, parsed.toString(customBase).toUpperCase()], ["Grouped binary", grouped],
          ["Byte breakdown", bytes.map((byte, index) => `B${index + 1}: ${byte}`).join("  ")],
          ["Bitwise view", `NOT (~x): ${~parsed} · x >> 1: ${parsed >> 1} · x & 0xFF: ${parsed & 0xff}`],
        ];
      }
      if (mode === "playground") return [["Decimal result", numberBasePlayground(expression)]];
      if (mode === "roman") return /^\d+$/.test(romanValue.trim()) ? [["Roman numeral", numberToRoman(Number(romanValue))]] : [["Decimal number", String(romanToNumber(romanValue))]];
      if (mode === "words") return [["Words", numberToWords(Number(wordValue))]];
      if (mode === "ip") {
        const converted = ipAddressConvert(ipValue);
        return [["Integer", String(converted.integer)], ["Binary octets", converted.binary], ["Hex", converted.hexadecimal]];
      }
      return [[`${byteFrom} → ${byteTo}`, String(byteUnitConvert(Number(byteValue), byteFrom, byteTo))]];
    } catch (reason) {
      return [["Error", reason instanceof Error ? reason.message : "Unable to process this input."]];
    }
  }, [byteFrom, byteTo, byteValue, customBase, expression, inputBase, ipValue, mode, numberValue, romanValue, wordValue]);

  const loadSample = () => {
    const sample = active.sample;
    if (mode === "base") setNumberValue(sample);
    if (mode === "playground") setExpression(sample);
    if (mode === "roman") setRomanValue(sample);
    if (mode === "words") setWordValue(sample);
    if (mode === "ip") setIpValue(sample);
    if (mode === "bytes") setByteValue(sample);
  };

  return <section className="data-format-workbench calculator-workbench">
    <div className="data-format-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="calculator-intro"><div><h2>{active.label}</h2><p>{active.description}</p></div><div className="calculator-toolbar"><button onClick={loadSample}><FlaskConical size={15} />Sample</button><button onClick={() => setCopied("")}><Eraser size={15} />Clear state</button></div></div>
    <div className="calculator-panel">
      <div className="calculator-controls">
        {mode === "base" && <><label>Number<input value={numberValue} onChange={(event) => setNumberValue(event.target.value)} /></label><label>Input base<select value={inputBase} onChange={(event) => setInputBase(Number(event.target.value))}>{baseOptions.map((base) => <option key={base.value} value={base.value}>{base.label}</option>)}</select></label><label>Custom base (2–36)<input type="number" min="2" max="36" value={customBase} onChange={(event) => setCustomBase(Number(event.target.value))} /></label></>}
        {mode === "playground" && <label className="is-wide">Expression<input value={expression} onChange={(event) => setExpression(event.target.value)} /></label>}
        {mode === "roman" && <label className="is-wide">Number or Roman numeral<input value={romanValue} onChange={(event) => setRomanValue(event.target.value)} /></label>}
        {mode === "words" && <label className="is-wide">Number<input type="number" value={wordValue} onChange={(event) => setWordValue(event.target.value)} /></label>}
        {mode === "ip" && <label className="is-wide">IPv4 address<input value={ipValue} onChange={(event) => setIpValue(event.target.value)} /></label>}
        {mode === "bytes" && <><label>Value<input type="number" value={byteValue} onChange={(event) => setByteValue(event.target.value)} /></label><label>From<select value={byteFrom} onChange={(event) => setByteFrom(event.target.value)}>{byteUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>To<select value={byteTo} onChange={(event) => setByteTo(event.target.value)}>{byteUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></label></>}
      </div>
      <div className="calculator-results">{results.map(([label, value]) => <ResultCard key={label} label={label} value={value} copied={copied === label} onCopy={() => copyText(value, setCopied, label)} />)}</div>
    </div>
  </section>;
}