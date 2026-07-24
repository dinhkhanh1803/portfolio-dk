import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Calculators collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");
  assert.match(page, /import CalculatorsWorkbench from "\.\/calculators-workbench"/);
  assert.match(page, /activeCollection\.id === "calculators" \? <CalculatorsWorkbench \/>/);
  for (const label of ["Percentage Calculator", "Aspect Ratio Calculator", "Compound Interest", "Loan Payment", "Discount Calculator", "Tip Splitter", "Unit Price", "Ohm Law"]) {
    assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Calculators workbench exposes calculator-specific controls instead of raw textarea layout", () => {
  const workbench = read("app/tools/calculators-workbench.tsx");
  for (const token of ["calculator-tabs", "calculator-result-card", "calculator-summary-grid", "copyResult", "downloadResult", "renderControls"]) {
    assert.match(workbench, new RegExp(token));
  }
  assert.doesNotMatch(workbench, /<textarea/);
});

test("Calculators engine contains practical formulas and formatted outputs", () => {
  const engine = read("app/tools/calculators-engine.ts");
  for (const symbol of ["calculatePercentage", "calculateAspectRatio", "calculateCompoundInterest", "calculateLoanPayment", "calculateDiscount", "calculateTipSplit", "calculateUnitPrice", "calculateOhmLaw"]) {
    assert.match(engine, new RegExp(`export function ${symbol}`));
  }
  assert.match(engine, /gcd/);
  assert.match(engine, /monthlyPayment/);
});

test("Calculators styling is scoped, responsive, and theme-aware", () => {
  const css = read("app/globals.css");
  for (const selector of [".calculators-workbench", ".calculator-layout", ".calculator-result-card", ".calculator-summary-grid"]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /\[data-theme="dark"\] \.calculator-result-card/);
  assert.match(css, /tools-main\.is-detail[^{]+\.calculators-workbench/);
  assert.match(css, /:is\([^)]*\.calculator-tabs/);
});
