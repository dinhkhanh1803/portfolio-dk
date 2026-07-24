"use client";

import { Clipboard, Download, Eraser, FlaskConical } from "lucide-react";
import { useState } from "react";
import {
  CalculatorResult,
  calculateAspectRatio,
  calculateCompoundInterest,
  calculateDiscount,
  calculateLoanPayment,
  calculateOhmLaw,
  calculatePercentage,
  calculateTipSplit,
  calculateUnitPrice,
  serializeResult,
} from "./calculators-engine";

type CalculatorTab = "percentage" | "aspect" | "compound" | "loan" | "discount" | "tip" | "unit" | "ohm";

type NumberKey = "part" | "whole" | "changeFrom" | "changeTo" | "width" | "height" | "targetWidth" | "principal" | "rate" | "years" | "compounds" | "monthlyContribution" | "loanPrincipal" | "loanRate" | "loanYears" | "price" | "discount" | "tax" | "bill" | "tip" | "people" | "totalPrice" | "quantity" | "voltage" | "current" | "resistance";

const tabs: Array<{ id: CalculatorTab; label: string; description: string }> = [
  { id: "percentage", label: "Percentage Calculator", description: "Find percentage of a total, percent-of-value, and percent change in one place." },
  { id: "aspect", label: "Aspect Ratio Calculator", description: "Simplify image or video ratios and calculate matching dimensions." },
  { id: "compound", label: "Compound Interest", description: "Estimate future value with compound periods and optional monthly contributions." },
  { id: "loan", label: "Loan Payment", description: "Calculate monthly payment, total paid, and total interest for a loan." },
  { id: "discount", label: "Discount Calculator", description: "Calculate discount, tax, and final checkout price." },
  { id: "tip", label: "Tip Splitter", description: "Split a bill with tip across multiple people." },
  { id: "unit", label: "Unit Price", description: "Compare packages by price per item, kg, GB, hour, or custom unit." },
  { id: "ohm", label: "Ohm Law", description: "Solve voltage, current, resistance, and power for electronics/game-dev tuning." },
];

const defaults: Record<NumberKey, number> = {
  part: 25, whole: 200, changeFrom: 120, changeTo: 150,
  width: 1920, height: 1080, targetWidth: 1280,
  principal: 10000, rate: 7, years: 10, compounds: 12, monthlyContribution: 150,
  loanPrincipal: 250000, loanRate: 6.5, loanYears: 30,
  price: 129.99, discount: 20, tax: 8,
  bill: 86.4, tip: 18, people: 4,
  totalPrice: 24.99, quantity: 12,
  voltage: 12, current: 2, resistance: 6,
};

export default function CalculatorsWorkbench() {
  const [tab, setTab] = useState<CalculatorTab>("percentage");
  const [values, setValues] = useState<Record<NumberKey, number>>(defaults);
  const [currency, setCurrency] = useState("USD");
  const [unitLabel, setUnitLabel] = useState("item");
  const [ohmMode, setOhmMode] = useState<"voltage" | "current" | "resistance" | "power">("power");

  const active = tabs.find((item) => item.id === tab) ?? tabs[0];
  const setNumber = (key: NumberKey, value: string) => setValues((current) => ({ ...current, [key]: Number(value) }));

  const result: CalculatorResult = (() => {
    if (tab === "aspect") return calculateAspectRatio(values.width, values.height, values.targetWidth);
    if (tab === "compound") return calculateCompoundInterest(values.principal, values.rate, values.years, values.compounds, values.monthlyContribution, currency);
    if (tab === "loan") return calculateLoanPayment(values.loanPrincipal, values.loanRate, values.loanYears, currency);
    if (tab === "discount") return calculateDiscount(values.price, values.discount, values.tax, currency);
    if (tab === "tip") return calculateTipSplit(values.bill, values.tip, values.people, currency);
    if (tab === "unit") return calculateUnitPrice(values.totalPrice, values.quantity, unitLabel, currency);
    if (tab === "ohm") return calculateOhmLaw(values.voltage, values.current, values.resistance, ohmMode);
    return calculatePercentage(values.part, values.whole, values.changeFrom, values.changeTo);
  })();

  const serialized = serializeResult(result);
  const copyResult = async () => navigator.clipboard?.writeText(serialized);
  const downloadResult = () => {
    const blob = new Blob([serialized], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const clearValues = () => setValues(Object.fromEntries(Object.keys(defaults).map((key) => [key, 0])) as Record<NumberKey, number>);

  const Field = ({ label, name, suffix }: { label: string; name: NumberKey; suffix?: string }) => (
    <label><span>{label}</span><div><input type="number" value={Number.isFinite(values[name]) ? values[name] : 0} onChange={(event) => setNumber(name, event.target.value)} />{suffix ? <em>{suffix}</em> : null}</div></label>
  );
  const Currency = () => <label><span>Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option><option>VND</option><option>EUR</option><option>JPY</option><option>KRW</option></select></label>;

  const renderControls = () => {
    if (tab === "aspect") return <><Field label="Width" name="width" suffix="px" /><Field label="Height" name="height" suffix="px" /><Field label="Target width" name="targetWidth" suffix="px" /></>;
    if (tab === "compound") return <><Field label="Principal" name="principal" /><Field label="Annual rate" name="rate" suffix="%" /><Field label="Years" name="years" /><Field label="Compounds/year" name="compounds" /><Field label="Monthly contribution" name="monthlyContribution" /><Currency /></>;
    if (tab === "loan") return <><Field label="Loan amount" name="loanPrincipal" /><Field label="Annual rate" name="loanRate" suffix="%" /><Field label="Years" name="loanYears" /><Currency /></>;
    if (tab === "discount") return <><Field label="Original price" name="price" /><Field label="Discount" name="discount" suffix="%" /><Field label="Tax" name="tax" suffix="%" /><Currency /></>;
    if (tab === "tip") return <><Field label="Bill" name="bill" /><Field label="Tip" name="tip" suffix="%" /><Field label="People" name="people" /><Currency /></>;
    if (tab === "unit") return <><Field label="Total price" name="totalPrice" /><Field label="Quantity" name="quantity" /><label><span>Unit label</span><input value={unitLabel} onChange={(event) => setUnitLabel(event.target.value)} /></label><Currency /></>;
    if (tab === "ohm") return <><div className="calculator-mode-row"><button className={ohmMode === "voltage" ? "is-active" : ""} onClick={() => setOhmMode("voltage")} type="button">Solve V</button><button className={ohmMode === "current" ? "is-active" : ""} onClick={() => setOhmMode("current")} type="button">Solve I</button><button className={ohmMode === "resistance" ? "is-active" : ""} onClick={() => setOhmMode("resistance")} type="button">Solve R</button><button className={ohmMode === "power" ? "is-active" : ""} onClick={() => setOhmMode("power")} type="button">Power</button></div><Field label="Voltage" name="voltage" suffix="V" /><Field label="Current" name="current" suffix="A" /><Field label="Resistance" name="resistance" suffix="Ω" /></>;
    return <><Field label="Part" name="part" /><Field label="Whole" name="whole" /><Field label="Change from" name="changeFrom" /><Field label="Change to" name="changeTo" /></>;
  };

  return <section className="calculators-workbench">
    <div className="data-format-tabs calculator-tabs" role="tablist">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)} key={item.id}>{item.label}</button>)}</div>
    <header className="calculator-heading"><div><h2>{active.label}</h2><p>{active.description}</p></div><div className="calculator-actions"><button type="button" onClick={() => setValues(defaults)}><FlaskConical size={15} /> Sample</button><button type="button" onClick={clearValues}><Eraser size={15} /> Clear</button></div></header>
    <div className="calculator-layout">
      <section className="calculator-control-card"><h3>Inputs</h3><div className="calculator-input-grid">{renderControls()}</div></section>
      <section className="calculator-result-card"><div className="calculator-result-top"><span>{result.title}</span><strong>{result.primary}</strong><code>{result.formula}</code></div><div className="calculator-summary-grid">{result.metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong>{metric.hint ? <small>{metric.hint}</small> : null}</article>)}</div><div className="calculator-output-actions"><button type="button" onClick={copyResult}><Clipboard size={15} /> Copy</button><button type="button" onClick={downloadResult}><Download size={15} /> Download</button></div></section>
    </div>
    <footer className="text-tool-stats"><span>Live calculations</span><span>No data leaves your browser</span><span>Copy-ready result summaries</span></footer>
  </section>;
}