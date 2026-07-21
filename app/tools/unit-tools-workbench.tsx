"use client";

import { Check, Clipboard, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { aspectRatio, convertCssUnit, convertTemperature, convertUnit, formatNumberExplorer, type UnitCategory } from "./unit-tools-engine";

type Mode = "unit" | "css" | "temperature" | "aspect" | "format";
type Tab = { id: Mode; label: string; description: string; sample: string };
const tabs: Tab[] = [
  { id: "unit", label: "Unit Converter", description: "Convert between measurement units with category-aware From and To selectors.", sample: "1" },
  { id: "css", label: "CSS Unit Converter", description: "Convert px, rem, em, and percent using a configurable base size.", sample: "16" },
  { id: "temperature", label: "Temperature Converter", description: "Convert Celsius, Fahrenheit, and Kelvin without typed formulas.", sample: "100" },
  { id: "aspect", label: "Aspect Ratio Calculator", description: "Calculate simplified ratios and decimal values from width and height.", sample: "1920" },
  { id: "format", label: "Number Format Explorer", description: "Preview Intl.NumberFormat output with locale, style, and currency controls.", sample: "1234567.89" },
];
const unitGroups: Record<UnitCategory, { label: string; units: string[] }> = {
  length: { label: "Length", units: ["mm", "cm", "m", "km", "in", "ft", "yd", "mi"] },
  weight: { label: "Weight", units: ["mg", "g", "kg", "oz", "lb"] },
  area: { label: "Area", units: ["m2", "km2", "cm2", "acre", "hectare"] },
  volume: { label: "Volume", units: ["ml", "l", "m3", "gal"] },
  time: { label: "Time", units: ["ms", "s", "min", "h", "day"] },
  speed: { label: "Speed", units: ["m/s", "km/h", "mph", "knot"] },
  digital: { label: "Digital Storage", units: ["B", "KB", "MB", "GB", "TB"] },
  energy: { label: "Energy", units: ["J", "kJ", "cal", "kcal", "Wh"] },
  pressure: { label: "Pressure", units: ["Pa", "kPa", "bar", "psi"] },
  frequency: { label: "Frequency", units: ["Hz", "kHz", "MHz", "GHz"] },
};
const cssUnits = ["px", "rem", "em", "%"] as const;
const temperatures = ["C", "F", "K"] as const;
const copyText = async (value: string, setCopied: (value: string) => void, key: string) => {
  await navigator.clipboard.writeText(value);
  setCopied(key);
  window.setTimeout(() => setCopied(""), 1400);
};
function ResultCard({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return <div className="calculator-result-card"><span>{label}</span><strong>{value}</strong><button type="button" onClick={onCopy} aria-label={`Copy ${label}`}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></div>;
}

export default function UnitToolsWorkbench() {
  const [mode, setMode] = useState<Mode>("unit");
  const [category, setCategory] = useState<UnitCategory>("length");
  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("mm");
  const [toUnit, setToUnit] = useState("cm");
  const [cssValue, setCssValue] = useState("16");
  const [cssFrom, setCssFrom] = useState<(typeof cssUnits)[number]>("px");
  const [cssTo, setCssTo] = useState<(typeof cssUnits)[number]>("rem");
  const [cssBase, setCssBase] = useState("16");
  const [tempValue, setTempValue] = useState("100");
  const [tempFrom, setTempFrom] = useState<(typeof temperatures)[number]>("C");
  const [tempTo, setTempTo] = useState<(typeof temperatures)[number]>("F");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [formatValue, setFormatValue] = useState("1234567.89");
  const [locale, setLocale] = useState("en-US");
  const [style, setStyle] = useState<"decimal" | "currency" | "percent">("currency");
  const [currency, setCurrency] = useState("USD");
  const [copied, setCopied] = useState("");
  const active = tabs.find((tab) => tab.id === mode)!;

  const results = useMemo(() => {
    try {
      if (mode === "unit") {
        const result = convertUnit(Number(value), category, fromUnit, toUnit);
        return [["Result", String(result)], ["Formula", `${value} ${fromUnit} = ${result} ${toUnit}`]];
      }
      if (mode === "css") return [["Result", String(convertCssUnit(Number(cssValue), cssFrom, cssTo, Number(cssBase)))], ["Base size", `${cssBase}px`]];
      if (mode === "temperature") return [["Result", String(convertTemperature(Number(tempValue), tempFrom, tempTo))]];
      if (mode === "aspect") {
        const ratio = aspectRatio(Number(width), Number(height));
        return [["Ratio", ratio.ratio], ["Decimal", String(ratio.decimal)]];
      }
      return [["Formatted number", formatNumberExplorer(Number(formatValue), locale, style, currency)], ["JS snippet", `new Intl.NumberFormat("${locale}", { style: "${style}"${style === "currency" ? `, currency: "${currency}"` : ""} }).format(${formatValue})`]];
    } catch (reason) {
      return [["Error", reason instanceof Error ? reason.message : "Unable to process this input."]];
    }
  }, [category, cssBase, cssFrom, cssTo, cssValue, currency, formatValue, fromUnit, height, locale, mode, style, tempFrom, tempTo, tempValue, toUnit, value, width]);

  const changeCategory = (next: UnitCategory) => {
    const units = unitGroups[next].units;
    setCategory(next);
    setFromUnit(units[0]!);
    setToUnit(units[1] ?? units[0]!);
  };

  return <section className="data-format-workbench calculator-workbench">
    <div className="data-format-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)}>{tab.label}</button>)}</div>
    <div className="calculator-intro"><div><h2>{active.label}</h2><p>{active.description}</p></div><div className="calculator-toolbar"><button onClick={() => setValue(active.sample)}><FlaskConical size={15} />Sample</button><button onClick={() => setCopied("")}><Eraser size={15} />Clear state</button></div></div>
    <div className="calculator-panel">
      <div className="calculator-controls">
        {mode === "unit" && <><div className="calculator-segmented">{Object.entries(unitGroups).map(([key, group]) => <button key={key} className={category === key ? "is-active" : ""} onClick={() => changeCategory(key as UnitCategory)}>{group.label}</button>)}</div><label>From<input type="number" value={value} onChange={(event) => setValue(event.target.value)} /></label><label>Unit<select value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>{unitGroups[category].units.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>To<select value={toUnit} onChange={(event) => setToUnit(event.target.value)}>{unitGroups[category].units.map((unit) => <option key={unit}>{unit}</option>)}</select></label></>}
        {mode === "css" && <><label>Value<input type="number" value={cssValue} onChange={(event) => setCssValue(event.target.value)} /></label><label>From<select value={cssFrom} onChange={(event) => setCssFrom(event.target.value as (typeof cssUnits)[number])}>{cssUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>To<select value={cssTo} onChange={(event) => setCssTo(event.target.value as (typeof cssUnits)[number])}>{cssUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>Base px<input type="number" value={cssBase} onChange={(event) => setCssBase(event.target.value)} /></label></>}
        {mode === "temperature" && <><label>Value<input type="number" value={tempValue} onChange={(event) => setTempValue(event.target.value)} /></label><label>From<select value={tempFrom} onChange={(event) => setTempFrom(event.target.value as (typeof temperatures)[number])}>{temperatures.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>To<select value={tempTo} onChange={(event) => setTempTo(event.target.value as (typeof temperatures)[number])}>{temperatures.map((unit) => <option key={unit}>{unit}</option>)}</select></label></>}
        {mode === "aspect" && <><label>Width<input type="number" value={width} onChange={(event) => setWidth(event.target.value)} /></label><label>Height<input type="number" value={height} onChange={(event) => setHeight(event.target.value)} /></label></>}
        {mode === "format" && <><label>Number<input type="number" value={formatValue} onChange={(event) => setFormatValue(event.target.value)} /></label><label>Locale<select value={locale} onChange={(event) => setLocale(event.target.value)}>{["en-US", "vi-VN", "de-DE", "fr-FR", "ja-JP"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Style<select value={style} onChange={(event) => setStyle(event.target.value as "decimal" | "currency" | "percent")}>{["decimal", "currency", "percent"].map((item) => <option key={item}>{item}</option>)}</select></label>{style === "currency" && <label>Currency<input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>}</>}
      </div>
      <div className="calculator-results">{results.map(([label, result]) => <ResultCard key={label} label={label} value={result} copied={copied === label} onCopy={() => copyText(result, setCopied, label)} />)}</div>
    </div>
  </section>;
}