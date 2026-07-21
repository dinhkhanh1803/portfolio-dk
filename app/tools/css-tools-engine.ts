export type Rgb = { r: number; g: number; b: number };
const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, Math.round(value)));
export function hexToRgb(hex: string): Rgb {
  const clean = hex.trim().replace(/^#/, "");
  const value = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error("Enter a valid HEX color.");
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
}
export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((part) => clamp(part).toString(16).padStart(2, "0")).join("")}`;
}
const rgbToHsl = ({ r, g, b }: Rgb) => {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) {
    if (max === rr) h = 60 * (((gg - bb) / d) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
  }
  return { h: Math.round((h + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};
const rgbToCmyk = ({ r, g, b }: Rgb) => {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return { c: Math.round((1 - rr - k) / (1 - k) * 100), m: Math.round((1 - gg - k) / (1 - k) * 100), y: Math.round((1 - bb - k) / (1 - k) * 100), k: Math.round(k * 100) };
};
export function colorFormats(hex: string, alpha = 100) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  return {
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    rgba: `${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha}%`,
    hsl: `${hsl.h}, ${hsl.s}%, ${hsl.l}%`,
    hsla: `${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha}%`,
    cmyk: `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`,
    cssVariables: `--color: ${rgbToHex(rgb.r, rgb.g, rgb.b)};\n--color-rgb: ${rgb.r} ${rgb.g} ${rgb.b};`,
  };
}
const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const next = value / 255;
    return next <= 0.03928 ? next / 12.92 : ((next + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export function contrastRatio(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}
export function gradientCss(type: "linear" | "radial" | "conic", direction: number, colors: string[]) {
  const stops = colors.map((color, index) => `${color} ${Math.round(index / Math.max(colors.length - 1, 1) * 100)}%`).join(", ");
  const head = type === "linear" ? `linear-gradient(${direction}deg` : type === "radial" ? "radial-gradient(circle" : `conic-gradient(from ${direction}deg`;
  return `background: ${head}, ${stops});`;
}
export type ShadowOptions = { x: number; y: number; blur: number; spread: number; color: string; opacity: number; inset: boolean };
export function shadowCss({ x, y, blur, spread, color, opacity, inset }: ShadowOptions) {
  const { r, g, b } = hexToRgb(color);
  return `box-shadow: ${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)});`;
}
export type GridOptions = { columns: string; rows: string; gap: number; justifyItems: string; alignItems: string; justifyContent: string; alignContent: string };
export function gridCss(options: GridOptions) {
  return `.grid {\n  display: grid;\n  grid-template-columns: ${options.columns};\n  grid-template-rows: ${options.rows};\n  gap: ${options.gap}px;\n  justify-items: ${options.justifyItems};\n  align-items: ${options.alignItems};\n  justify-content: ${options.justifyContent};\n  align-content: ${options.alignContent};\n}`;
}
export type AnimationOptions = { name: string; duration: number; delay: number; timing: string; iteration: string; direction: string; fillMode: string };
const keyframes: Record<string, string> = {
  fadeIn: "from { opacity: 0; }\n  to { opacity: 1; }",
  fadeOut: "from { opacity: 1; }\n  to { opacity: 0; }",
  slideInLeft: "from { opacity: 0; transform: translateX(-36px); }\n  to { opacity: 1; transform: translateX(0); }",
  bounce: "0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-24px); }",
  pulse: "0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.08); }",
  spin: "to { transform: rotate(360deg); }",
};
export function animationCss(options: AnimationOptions) {
  const frames = keyframes[options.name] ?? keyframes.fadeIn;
  return `.my-element {\n  animation: ${options.name} ${options.duration}ms ${options.timing} ${options.delay}ms ${options.iteration} ${options.direction} ${options.fillMode};\n}\n\n@keyframes ${options.name} {\n  ${frames}\n}`;
}
const scaleNames = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"];
export function typeScaleCss(basePx: number, ratio: number, above: number, below: number, unit: "rem" | "px") {
  const start = -below;
  return Array.from({ length: above + below + 1 }, (_, index) => {
    const step = start + index;
    const name = scaleNames[index] ?? `step-${step}`;
    const px = basePx * ratio ** step;
    const value = unit === "rem" ? `${(px / basePx).toFixed(3)}rem` : `${Math.round(px * 100) / 100}px`;
    return `  --text-${name}: ${value};`;
  }).join("\n").replace(/^/, ":root {\n").concat("\n}");
}

export type FontFaceOptions = { family: string; weight: string; style: string; display: string; urls: Partial<Record<"woff2" | "woff" | "ttf" | "otf", string>>; unicodeRange?: string };
export function fontFaceCss(options: FontFaceOptions) {
  const formats: Record<string, string> = { woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" };
  const src = Object.entries(options.urls).filter(([, url]) => url).map(([format, url]) => `url("${url}") format("${formats[format] ?? format}")`).join(",\n       ");
  return `@font-face {\n  font-family: "${options.family}";\n  src: ${src || "url(\"/fonts/font.woff2\") format(\"woff2\")"};\n  font-weight: ${options.weight};\n  font-style: ${options.style};\n  font-display: ${options.display};${options.unicodeRange ? `\n  unicode-range: ${options.unicodeRange};` : ""}\n}`;
}

export function fontStackCss(primary: string, category: string, includeOsFonts: boolean) {
  const stacks: Record<string, string[]> = {
    "sans-serif": ["Arial", "Helvetica", "sans-serif"],
    serif: ["Georgia", "Times New Roman", "serif"],
    monospace: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
    cursive: ["Brush Script MT", "cursive"],
    fantasy: ["Impact", "fantasy"],
  };
  const os = includeOsFonts ? ["-apple-system", "BlinkMacSystemFont", "Segoe UI"] : [];
  return `font-family: ${[primary, ...os, ...(stacks[category] ?? stacks["sans-serif"])].join(", ")};`;
}

export function lineClampCss(lines: number, ellipsis: boolean) {
  return `display: -webkit-box;\n-webkit-box-orient: vertical;\n-webkit-line-clamp: ${lines};\noverflow: hidden;${ellipsis ? "\ntext-overflow: ellipsis;" : ""}`;
}

export function letterSpacingCss(value: number, unit: "px" | "em") {
  return `letter-spacing: ${value}${unit};`;
}

export function textWrapCss(whiteSpace: string, overflow: string, width: number, lineHeight: number) {
  return `.text-wrap {\n  width: ${width}px;\n  max-width: 100%;\n  white-space: ${whiteSpace};\n  overflow: ${overflow === "visible" ? "visible" : "hidden"};\n  text-overflow: ${overflow};\n  line-height: ${lineHeight};\n}`;
}

export function writingModeCss(mode: string, direction: "ltr" | "rtl", orientation: string) {
  return `.writing-mode {\n  writing-mode: ${mode};\n  direction: ${direction};${mode === "horizontal-tb" ? "" : `\n  text-orientation: ${orientation};`}\n}`;
}

export function textEffectCss(effect: string, text: string, fontSize: number, fontWeight: number, family: string, angle: number, colors: string[]) {
  const background = gradientCss("linear", angle, colors).replace("background: ", "").replace(";", "");
  const base = `font-size: ${fontSize}px;\n  font-weight: ${fontWeight};\n  font-family: ${family};`;
  if (effect === "neon") return `.text-effect {\n  ${base}\n  color: ${colors[0]};\n  text-shadow: 0 0 8px ${colors[0]}, 0 0 22px ${colors[1] ?? colors[0]};\n}`;
  if (effect === "glitch") return `.text-effect::before { content: "${text}"; }\n.text-effect {\n  ${base}\n  color: ${colors[0]};\n  text-shadow: 2px 0 ${colors[1] ?? "#ff00ff"}, -2px 0 #00ffff;\n}`;
  if (effect === "stroke") return `.text-effect {\n  ${base}\n  color: transparent;\n  -webkit-text-stroke: 2px ${colors[0]};\n}`;
  return `.text-effect {\n  ${base}\n  background: ${background};\n  -webkit-background-clip: text;\n  color: transparent;\n}`;
}
export type TextShadowLayer = { x: number; y: number; blur: number; color: string };
export function textShadowCss(layers: TextShadowLayer[]) {
  return `text-shadow: ${layers.map((layer) => `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.color}`).join(", ")};`;
}

export type CssFilterOptions = { blur: number; brightness: number; contrast: number; grayscale: number; hueRotate: number; invert: number; opacity: number; saturate: number; sepia: number };
export function filterValue(options: CssFilterOptions) {
  return `blur(${options.blur}px) brightness(${options.brightness}%) contrast(${options.contrast}%) grayscale(${options.grayscale}%) hue-rotate(${options.hueRotate}deg) invert(${options.invert}%) opacity(${options.opacity}%) saturate(${options.saturate}%) sepia(${options.sepia}%)`;
}
export function filterCss(options: CssFilterOptions) {
  return `filter: ${filterValue(options)};`;
}
export function backdropFilterCss(options: CssFilterOptions) {
  return `backdrop-filter: ${filterValue(options)};\n-webkit-backdrop-filter: ${filterValue(options)};`;
}

export type GlassmorphismOptions = { blur: number; opacity: number; radius: number; borderWidth: number; borderOpacity: number; color: string; saturate: number; brightness: number };
export function glassmorphismCss(options: GlassmorphismOptions) {
  const { r, g, b } = hexToRgb(options.color);
  return `.glass-card {\n  background: rgba(${r}, ${g}, ${b}, ${(options.opacity / 100).toFixed(2)});\n  backdrop-filter: blur(${options.blur}px) saturate(${options.saturate}%);\n  -webkit-backdrop-filter: blur(${options.blur}px) saturate(${options.saturate}%);\n  border: ${options.borderWidth}px solid rgba(${r}, ${g}, ${b}, ${(options.borderOpacity / 100).toFixed(2)});\n  border-radius: ${options.radius}px;\n  filter: brightness(${options.brightness}%);\n}`;
}

export type NeumorphismOptions = { background: string; distance: number; blur: number; intensity: number; radius: number; size: number; shape: "flat" | "concave" | "convex" | "pressed" };
export function neumorphismCss(options: NeumorphismOptions) {
  const inset = options.shape === "pressed" ? "inset " : "";
  const surface = options.shape === "concave" ? `linear-gradient(145deg, rgba(0,0,0,0.04), rgba(255,255,255,0.32)), ${options.background}` : options.shape === "convex" ? `linear-gradient(145deg, rgba(255,255,255,0.38), rgba(0,0,0,0.04)), ${options.background}` : options.background;
  return `.neumorphism {\n  width: ${options.size}px;\n  height: ${options.size}px;\n  border-radius: ${options.radius}px;\n  background: ${surface};\n  box-shadow: ${inset}${options.distance}px ${options.distance}px ${options.blur}px rgba(0, 0, 0, ${(options.intensity / 100).toFixed(2)}), ${inset}-${options.distance}px -${options.distance}px ${options.blur}px rgba(255, 255, 255, 0.75);\n}`;
}

export function mixBlendCss(mode: string, background: string, foreground: string) {
  return `.blend-stage {\n  background: ${background};\n}\n.blended-element {\n  background: ${foreground};\n  mix-blend-mode: ${mode};\n}`;
}

export function maskCss(shape: string, size: number, feather: number, color: string) {
  const mask = shape === "stripe" ? `linear-gradient(45deg, #000 0 ${size}%, transparent ${size + feather}% 100%)` : shape === "diamond" ? `linear-gradient(45deg, transparent 28%, #000 30% 70%, transparent 72%)` : `radial-gradient(${shape === "circle" ? "circle" : "ellipse"}, #000 ${size}%, transparent ${size + feather}%)`;
  return `.masked-element {\n  background: ${color};\n  mask-image: ${mask};\n  -webkit-mask-image: ${mask};\n}`;
}
export type BorderRadiusOptions = { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number; unit: "px" | "%" };
export function borderRadiusCss(options: BorderRadiusOptions) {
  const values = [options.topLeft, options.topRight, options.bottomRight, options.bottomLeft].map((value) => `${value}${options.unit}`);
  return `border-radius: ${values.join(" ")};`;
}

export type BorderOptions = { width: number; style: string; color: string; radius: number };
export function borderCss(options: BorderOptions) {
  return `border: ${options.width}px ${options.style} ${options.color};\nborder-radius: ${options.radius}px;`;
}

export type OutlineOptions = { width: number; style: string; color: string; offset: number };
export function outlineCss(options: OutlineOptions) {
  return `outline: ${options.width}px ${options.style} ${options.color};\noutline-offset: ${options.offset}px;`;
}

export function clipPathCss(shape: string, inset = 12) {
  const shapes: Record<string, string> = {
    circle: "circle(42% at 50% 50%)",
    ellipse: "ellipse(46% 34% at 50% 50%)",
    diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    pentagon: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
    hexagon: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)",
    star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%)",
    chevron: "polygon(18% 0%, 100% 0%, 82% 50%, 100% 100%, 18% 100%, 0% 50%)",
  };
  return `clip-path: ${shape === "inset" ? `inset(${inset}% round ${Math.round(inset / 2)}px)` : shapes[shape] ?? shapes.circle};`;
}

export type TriangleOptions = { direction: "up" | "right" | "down" | "left"; width: number; height: number; color: string };
export function triangleCss(options: TriangleOptions) {
  const horizontal = Math.round(options.width / 2);
  if (options.direction === "up") return `.triangle {\n  width: 0;\n  height: 0;\n  border-left: ${horizontal}px solid transparent;\n  border-right: ${horizontal}px solid transparent;\n  border-bottom: ${options.height}px solid ${options.color};\n}`;
  if (options.direction === "down") return `.triangle {\n  width: 0;\n  height: 0;\n  border-left: ${horizontal}px solid transparent;\n  border-right: ${horizontal}px solid transparent;\n  border-top: ${options.height}px solid ${options.color};\n}`;
  const vertical = Math.round(options.height / 2);
  return `.triangle {\n  width: 0;\n  height: 0;\n  border-top: ${vertical}px solid transparent;\n  border-bottom: ${vertical}px solid transparent;\n  border-${options.direction === "right" ? "left" : "right"}: ${options.width}px solid ${options.color};\n}`;
}

export function objectFitCss(fit: string, position: string) {
  return `object-fit: ${fit};\nobject-position: ${position};`;
}

export type ScrollbarOptions = { size: number; thumb: string; track: string; radius: number };
export function scrollbarCss(options: ScrollbarOptions) {
  return `.scroll-area {\n  scrollbar-width: thin;\n  scrollbar-color: ${options.thumb} ${options.track};\n}\n.scroll-area::-webkit-scrollbar {\n  width: ${options.size}px;\n  height: ${options.size}px;\n}\n.scroll-area::-webkit-scrollbar-track {\n  background: ${options.track};\n  border-radius: ${options.radius}px;\n}\n.scroll-area::-webkit-scrollbar-thumb {\n  background: ${options.thumb};\n  border-radius: ${options.radius}px;\n}`;
}
