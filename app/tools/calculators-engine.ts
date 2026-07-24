export type Metric = { label: string; value: string; hint?: string };
export type CalculatorResult = { title: string; primary: string; formula: string; metrics: Metric[]; notes?: string[] };

const safe = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
export const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(safe(value));
export const formatMoney = (value: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(safe(value));

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

export function calculatePercentage(part: number, whole: number, changeFrom: number, changeTo: number): CalculatorResult {
  const percentOfWhole = whole === 0 ? 0 : (part / whole) * 100;
  const valueFromPercent = (part / 100) * whole;
  const percentChange = changeFrom === 0 ? 0 : ((changeTo - changeFrom) / changeFrom) * 100;
  return {
    title: "Percentage Calculator",
    primary: `${formatNumber(percentOfWhole)}%`,
    formula: `${formatNumber(part)} / ${formatNumber(whole)} × 100`,
    metrics: [
      { label: "Part of whole", value: `${formatNumber(percentOfWhole)}%`, hint: `${formatNumber(part)} is this percent of ${formatNumber(whole)}` },
      { label: "Percent of value", value: formatNumber(valueFromPercent), hint: `${formatNumber(part)}% of ${formatNumber(whole)}` },
      { label: "Percent change", value: `${formatNumber(percentChange)}%`, hint: `${formatNumber(changeFrom)} → ${formatNumber(changeTo)}` },
    ],
  };
}

export function calculateAspectRatio(width: number, height: number, targetWidth: number): CalculatorResult {
  const divisor = gcd(width, height);
  const ratioW = Math.trunc(width / divisor);
  const ratioH = Math.trunc(height / divisor);
  const targetHeight = width === 0 ? 0 : (targetWidth * height) / width;
  return {
    title: "Aspect Ratio Calculator",
    primary: `${ratioW}:${ratioH}`,
    formula: `${formatNumber(width)} × ${formatNumber(height)} simplified by gcd ${divisor}`,
    metrics: [
      { label: "Simplified ratio", value: `${ratioW}:${ratioH}` },
      { label: "Decimal", value: formatNumber(width / Math.max(height, 1), 4) },
      { label: "Height for target width", value: `${formatNumber(targetHeight)}px`, hint: `${formatNumber(targetWidth)}px wide` },
    ],
  };
}

export function calculateCompoundInterest(principal: number, annualRate: number, years: number, compoundsPerYear: number, monthlyContribution = 0, currency = "USD"): CalculatorResult {
  const periods = Math.max(1, Math.round(compoundsPerYear * years));
  const rate = annualRate / 100 / Math.max(compoundsPerYear, 1);
  const principalFuture = principal * Math.pow(1 + rate, periods);
  const contributionFuture = rate === 0 ? monthlyContribution * 12 * years : monthlyContribution * ((Math.pow(1 + rate, periods) - 1) / rate) * (12 / Math.max(compoundsPerYear, 1));
  const total = principalFuture + contributionFuture;
  const invested = principal + monthlyContribution * 12 * years;
  return {
    title: "Compound Interest",
    primary: formatMoney(total, currency),
    formula: `A = P(1 + r/n)^(nt) + contributions`,
    metrics: [
      { label: "Future value", value: formatMoney(total, currency) },
      { label: "Total invested", value: formatMoney(invested, currency) },
      { label: "Interest earned", value: formatMoney(total - invested, currency) },
      { label: "Periods", value: String(periods) },
    ],
  };
}

export function calculateLoanPayment(principal: number, annualRate: number, years: number, currency = "USD"): CalculatorResult {
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = monthlyRate === 0 ? principal / months : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPaid = monthlyPayment * months;
  return {
    title: "Loan Payment",
    primary: formatMoney(monthlyPayment, currency),
    formula: `M = P[r(1+r)^n] / [(1+r)^n - 1]`,
    metrics: [
      { label: "Monthly payment", value: formatMoney(monthlyPayment, currency) },
      { label: "Total paid", value: formatMoney(totalPaid, currency) },
      { label: "Total interest", value: formatMoney(totalPaid - principal, currency) },
      { label: "Payments", value: `${months} months` },
    ],
  };
}

export function calculateDiscount(price: number, discountPercent: number, taxPercent: number, currency = "USD"): CalculatorResult {
  const discount = price * discountPercent / 100;
  const subtotal = price - discount;
  const tax = subtotal * taxPercent / 100;
  const finalPrice = subtotal + tax;
  return {
    title: "Discount Calculator",
    primary: formatMoney(finalPrice, currency),
    formula: `(price - discount) + tax`,
    metrics: [
      { label: "Discount amount", value: formatMoney(discount, currency) },
      { label: "After discount", value: formatMoney(subtotal, currency) },
      { label: "Tax", value: formatMoney(tax, currency) },
      { label: "Final price", value: formatMoney(finalPrice, currency) },
    ],
  };
}

export function calculateTipSplit(bill: number, tipPercent: number, people: number, currency = "USD"): CalculatorResult {
  const tip = bill * tipPercent / 100;
  const total = bill + tip;
  const perPerson = total / Math.max(people, 1);
  return {
    title: "Tip Splitter",
    primary: formatMoney(perPerson, currency),
    formula: `(bill + tip) / people`,
    metrics: [
      { label: "Tip amount", value: formatMoney(tip, currency) },
      { label: "Total", value: formatMoney(total, currency) },
      { label: "Per person", value: formatMoney(perPerson, currency) },
      { label: "People", value: String(Math.max(people, 1)) },
    ],
  };
}

export function calculateUnitPrice(totalPrice: number, quantity: number, unitLabel = "item", currency = "USD"): CalculatorResult {
  const unit = totalPrice / Math.max(quantity, 1);
  return {
    title: "Unit Price",
    primary: `${formatMoney(unit, currency)} / ${unitLabel || "unit"}`,
    formula: `total price / quantity`,
    metrics: [
      { label: "Unit price", value: formatMoney(unit, currency) },
      { label: "Quantity", value: formatNumber(quantity) },
      { label: "Total", value: formatMoney(totalPrice, currency) },
    ],
  };
}

export function calculateOhmLaw(voltage: number, current: number, resistance: number, mode: "voltage" | "current" | "resistance" | "power"): CalculatorResult {
  const computedVoltage = mode === "voltage" ? current * resistance : voltage;
  const computedCurrent = mode === "current" ? voltage / Math.max(resistance, Number.EPSILON) : current;
  const computedResistance = mode === "resistance" ? voltage / Math.max(current, Number.EPSILON) : resistance;
  const power = mode === "power" ? voltage * current : computedVoltage * computedCurrent;
  return {
    title: "Ohm Law",
    primary: mode === "voltage" ? `${formatNumber(computedVoltage)} V` : mode === "current" ? `${formatNumber(computedCurrent)} A` : mode === "resistance" ? `${formatNumber(computedResistance)} Ω` : `${formatNumber(power)} W`,
    formula: `V = I × R, P = V × I`,
    metrics: [
      { label: "Voltage", value: `${formatNumber(computedVoltage)} V` },
      { label: "Current", value: `${formatNumber(computedCurrent)} A` },
      { label: "Resistance", value: `${formatNumber(computedResistance)} Ω` },
      { label: "Power", value: `${formatNumber(power)} W` },
    ],
  };
}

export function serializeResult(result: CalculatorResult) {
  return [
    result.title,
    result.primary,
    `Formula: ${result.formula}`,
    ...result.metrics.map((metric) => `${metric.label}: ${metric.value}${metric.hint ? ` (${metric.hint})` : ""}`),
  ].join("\n");
}