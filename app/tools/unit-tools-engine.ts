export type UnitCategory = "length" | "weight" | "area" | "volume" | "time" | "speed" | "digital" | "energy" | "pressure" | "frequency";
const factors: Record<UnitCategory, Record<string, number>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
  weight: { mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 },
  area: { "m2": 1, "km2": 1000000, "cm2": 0.0001, acre: 4046.8564224, hectare: 10000 },
  volume: { ml: 0.001, l: 1, "m3": 1000, gal: 3.785411784 },
  time: { ms: 0.001, s: 1, min: 60, h: 3600, day: 86400 },
  speed: { "m/s": 1, "km/h": 0.2777777778, mph: 0.44704, knot: 0.514444 },
  digital: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600 },
  pressure: { Pa: 1, kPa: 1000, bar: 100000, psi: 6894.757293 },
  frequency: { Hz: 1, kHz: 1000, MHz: 1000000, GHz: 1000000000 },
};
export function convertUnit(value: number, category: UnitCategory, from: string, to: string) {
  const group = factors[category];
  if (!group[from] || !group[to]) throw new Error("Unsupported unit conversion.");
  return value * group[from] / group[to];
}
export function convertTemperature(value: number, from: "C" | "F" | "K", to: "C" | "F" | "K") {
  const c = from === "C" ? value : from === "F" ? (value - 32) * 5 / 9 : value - 273.15;
  return to === "C" ? c : to === "F" ? c * 9 / 5 + 32 : c + 273.15;
}
export function convertCssUnit(value: number, from: "px" | "rem" | "em" | "%", to: "px" | "rem" | "em" | "%", base = 16) {
  const px = from === "px" ? value : from === "%" ? value / 100 * base : value * base;
  return to === "px" ? px : to === "%" ? px / base * 100 : px / base;
}
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : Math.abs(a);
export function aspectRatio(width: number, height: number) {
  const divisor = gcd(width, height);
  return { ratio: `${width / divisor}:${height / divisor}`, decimal: width / height };
}
export function formatNumberExplorer(value: number, locale = "en-US", style: "decimal" | "currency" | "percent" = "decimal", currency = "USD") {
  return new Intl.NumberFormat(locale, { style, currency: style === "currency" ? currency : undefined, maximumFractionDigits: 2 }).format(value);
}