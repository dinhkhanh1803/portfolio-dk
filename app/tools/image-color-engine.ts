export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const namedCssColors: Array<{ name: string; hex: string }> = [
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#ffffff" },
  { name: "red", hex: "#ff0000" },
  { name: "lime", hex: "#00ff00" },
  { name: "blue", hex: "#0000ff" },
  { name: "cornflowerblue", hex: "#6495ed" },
  { name: "steelblue", hex: "#4682b4" },
  { name: "dodgerblue", hex: "#1e90ff" },
  { name: "slateblue", hex: "#6a5acd" },
  { name: "cadetblue", hex: "#5f9ea0" },
  { name: "seagreen", hex: "#2e8b57" },
  { name: "mediumseagreen", hex: "#3cb371" },
  { name: "tomato", hex: "#ff6347" },
  { name: "coral", hex: "#ff7f50" },
  { name: "gold", hex: "#ffd700" },
  { name: "orchid", hex: "#da70d6" },
  { name: "rebeccapurple", hex: "#663399" },
  { name: "hotpink", hex: "#ff69b4" },
  { name: "gray", hex: "#808080" },
  { name: "slategray", hex: "#708090" },
];

export function clampByte(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function normalizeHex(hex: string) {
  const clean = String(hex || "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return `#${clean.split("").map((char) => char + char).join("").toLowerCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean.toLowerCase()}`;
  return null;
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex(rgb: Rgb) {
  return `#${[rgb.r, rgb.g, rgb.b].map((part) => clampByte(part).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = clampByte(rgb.r) / 255;
  const g = clampByte(rgb.g) / 255;
  const b = clampByte(rgb.b) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function linearize(channel: number) {
  const c = clampByte(channel) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: Rgb | string) {
  const rgb = typeof color === "string" ? hexToRgb(color) : color;
  if (!rgb) return 0;
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

export function contrastRatio(foreground: Rgb | string, background: Rgb | string) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function mixColors(from: string | Rgb, to: string | Rgb, amount: number) {
  const a = typeof from === "string" ? hexToRgb(from) : from;
  const b = typeof to === "string" ? hexToRgb(to) : to;
  if (!a || !b) return "#000000";
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

export function buildTintsAndShades(hex: string, steps = 5) {
  const base = normalizeHex(hex) || "#3b82f6";
  const count = Math.max(1, Math.min(10, Math.round(steps)));
  const tints = Array.from({ length: count }, (_, index) => mixColors(base, "#ffffff", (index + 1) / (count + 1)));
  const shades = Array.from({ length: count }, (_, index) => mixColors(base, "#000000", (index + 1) / (count + 1)));
  return { base, tints, shades };
}

function distance(a: Rgb, b: Rgb) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export function nearestCssColor(hex: string) {
  const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  return namedCssColors
    .map((item) => ({ ...item, distance: Math.round(distance(rgb, hexToRgb(item.hex)!)) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function quantizeColor(rgb: Rgb, bucket = 24) {
  const step = Math.max(8, Math.min(64, Math.round(bucket)));
  return rgbToHex({
    r: Math.round(clampByte(rgb.r) / step) * step,
    g: Math.round(clampByte(rgb.g) / step) * step,
    b: Math.round(clampByte(rgb.b) / step) * step,
  });
}

export function extractPaletteFromPixels(pixels: Rgb[], maxColors = 6) {
  const counts = new Map<string, { color: string; count: number; exactCount: number; vividness: number }>();
  for (const pixel of pixels) {
    const exact = rgbToHex(pixel);
    const key = quantizeColor(pixel);
    const hsl = rgbToHsl(pixel);
    const current = counts.get(key);
    const vividness = hsl.s + Math.abs(hsl.l - 50);
    if (!current) {
      counts.set(key, { color: exact, count: 1, exactCount: 1, vividness });
    } else {
      counts.set(key, {
        color: current.color,
        count: current.count + 1,
        exactCount: current.exactCount + (current.color === exact ? 1 : 0),
        vividness: Math.max(current.vividness, vividness),
      });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.exactCount - a.exactCount || b.count - a.count || b.vividness - a.vividness)
    .slice(0, Math.max(1, Math.min(12, maxColors)))
    .map((item) => item.color);
}

export function buildPaletteCss(palette: string[]) {
  const lines = palette.map((color, index) => `  --image-color-${index + 1}: ${normalizeHex(color) || color};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function buildPaletteJson(palette: string[]) {
  return JSON.stringify(palette.map((color, index) => ({ name: `color-${index + 1}`, hex: normalizeHex(color) || color })), null, 2);
}

export function buildDuotoneCss(shadow: string, highlight: string, intensity: number) {
  const opacity = Math.min(1, Math.max(0, intensity / 100));
  return [
    `background: linear-gradient(135deg, ${normalizeHex(shadow) || shadow}, ${normalizeHex(highlight) || highlight});`,
    `mix-blend-mode: color;`,
    `opacity: ${Number(opacity.toFixed(2))};`,
  ].join("\n");
}

export function getSampleColorImageDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
  <rect width="900" height="540" fill="#0f172a"/>
  <circle cx="170" cy="140" r="120" fill="#3b82f6"/>
  <circle cx="390" cy="250" r="150" fill="#8b5cf6" opacity="0.92"/>
  <circle cx="650" cy="150" r="110" fill="#ec4899" opacity="0.9"/>
  <rect x="520" y="290" width="260" height="150" rx="36" fill="#10b981"/>
  <path d="M0 430 C150 360 260 500 430 420 C610 340 700 420 900 310 L900 540 L0 540 Z" fill="#f59e0b" opacity="0.86"/>
  <text x="54" y="502" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="800">Sample palette</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
