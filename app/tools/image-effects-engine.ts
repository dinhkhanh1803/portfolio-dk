export type ImageEffectSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  sepia: number;
  grayscale: number;
  blur: number;
  vignette: number;
  grain: number;
  pixelate: number;
};

export type ImageEffectPresetName = "natural" | "cinematic" | "vintage" | "noir" | "cyberpunk" | "warmGlow" | "frost" | "polaroid" | "glitch";

export const defaultImageEffectSettings: ImageEffectSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
  pixelate: 0,
};

export const imageEffectPresets: Record<ImageEffectPresetName, ImageEffectSettings> = {
  natural: defaultImageEffectSettings,
  cinematic: { brightness: 96, contrast: 124, saturation: 116, hueRotate: -8, sepia: 8, grayscale: 0, blur: 0, vignette: 38, grain: 8, pixelate: 0 },
  vintage: { brightness: 105, contrast: 92, saturation: 82, hueRotate: -12, sepia: 42, grayscale: 0, blur: 0, vignette: 28, grain: 18, pixelate: 0 },
  noir: { brightness: 94, contrast: 142, saturation: 0, hueRotate: 0, sepia: 0, grayscale: 100, blur: 0, vignette: 54, grain: 22, pixelate: 0 },
  cyberpunk: { brightness: 108, contrast: 134, saturation: 180, hueRotate: 42, sepia: 0, grayscale: 0, blur: 0, vignette: 26, grain: 6, pixelate: 0 },
  warmGlow: { brightness: 112, contrast: 106, saturation: 126, hueRotate: -18, sepia: 24, grayscale: 0, blur: 0, vignette: 18, grain: 6, pixelate: 0 },
  frost: { brightness: 118, contrast: 90, saturation: 72, hueRotate: 18, sepia: 0, grayscale: 0, blur: 1, vignette: 12, grain: 0, pixelate: 0 },
  polaroid: { brightness: 110, contrast: 88, saturation: 86, hueRotate: -4, sepia: 18, grayscale: 0, blur: 0, vignette: 20, grain: 12, pixelate: 0 },
  glitch: { brightness: 106, contrast: 152, saturation: 210, hueRotate: 78, sepia: 0, grayscale: 0, blur: 0, vignette: 15, grain: 30, pixelate: 18 },
};

export function clampEffectNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeImageEffectSettings(settings: Partial<ImageEffectSettings> = {}): ImageEffectSettings {
  return {
    brightness: clampEffectNumber(settings.brightness ?? defaultImageEffectSettings.brightness, 0, 220),
    contrast: clampEffectNumber(settings.contrast ?? defaultImageEffectSettings.contrast, 0, 260),
    saturation: clampEffectNumber(settings.saturation ?? defaultImageEffectSettings.saturation, 0, 300),
    hueRotate: clampEffectNumber(settings.hueRotate ?? defaultImageEffectSettings.hueRotate, -360, 360),
    sepia: clampEffectNumber(settings.sepia ?? defaultImageEffectSettings.sepia, 0, 100),
    grayscale: clampEffectNumber(settings.grayscale ?? defaultImageEffectSettings.grayscale, 0, 100),
    blur: clampEffectNumber(settings.blur ?? defaultImageEffectSettings.blur, 0, 24),
    vignette: clampEffectNumber(settings.vignette ?? defaultImageEffectSettings.vignette, 0, 100),
    grain: clampEffectNumber(settings.grain ?? defaultImageEffectSettings.grain, 0, 100),
    pixelate: clampEffectNumber(settings.pixelate ?? defaultImageEffectSettings.pixelate, 0, 40),
  };
}

export function buildImageEffectFilter(settings: Partial<ImageEffectSettings> = {}) {
  const value = normalizeImageEffectSettings(settings);
  return [
    `brightness(${value.brightness}%)`,
    `contrast(${value.contrast}%)`,
    `saturate(${value.saturation}%)`,
    `hue-rotate(${value.hueRotate}deg)`,
    `sepia(${value.sepia}%)`,
    `grayscale(${value.grayscale}%)`,
    `blur(${value.blur}px)`,
  ].join(" ");
}

export function buildImageEffectOverlay(settings: Partial<ImageEffectSettings> = {}) {
  const value = normalizeImageEffectSettings(settings);
  const vignetteOpacity = Number((value.vignette / 100).toFixed(2));
  const grainOpacity = Number((value.grain / 100).toFixed(2));
  const background = [
    `radial-gradient(circle at center, transparent ${Math.max(35, 82 - value.vignette / 2)}%, rgba(0, 0, 0, ${Math.min(0.82, vignetteOpacity)}) 100%)`,
    `repeating-radial-gradient(circle at 17% 23%, rgba(255,255,255,${Math.min(0.25, grainOpacity)}) 0 1px, transparent 1px 3px)`,
    `repeating-linear-gradient(90deg, rgba(0,0,0,${Math.min(0.18, grainOpacity / 1.5)}) 0 1px, transparent 1px 4px)`,
  ].join(", ");
  return { background, opacity: Number(Math.min(1, Math.max(vignetteOpacity, grainOpacity)).toFixed(2)) };
}

export function buildImageEffectCss(settings: Partial<ImageEffectSettings> = {}) {
  const value = normalizeImageEffectSettings(settings);
  const filter = buildImageEffectFilter(value);
  const overlay = buildImageEffectOverlay(value);
  const pixelated = value.pixelate > 0 ? "\n  image-rendering: pixelated;" : "";
  return `.image-effect {\n  position: relative;\n  overflow: hidden;\n}\n\n.image-effect img {\n  filter: ${filter};${pixelated}\n}\n\n.image-effect::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  background: ${overlay.background};\n  opacity: ${overlay.opacity};\n  mix-blend-mode: overlay;\n}`;
}

export function getSampleEffectsImageDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="780" viewBox="0 0 1200 780">
  <defs>
    <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0ea5e9"/><stop offset="0.45" stop-color="#7c3aed"/><stop offset="1" stop-color="#f97316"/></linearGradient>
    <radialGradient id="light" cx="32%" cy="22%" r="42%"><stop offset="0" stop-color="#fef3c7" stop-opacity=".95"/><stop offset="1" stop-color="#fef3c7" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="780" fill="url(#sky)"/>
  <rect width="1200" height="780" fill="url(#light)"/>
  <circle cx="930" cy="160" r="80" fill="#ffffff" opacity=".24"/>
  <path d="M0 625 C180 500 290 660 500 560 C690 470 820 575 1200 410 L1200 780 L0 780 Z" fill="#07111f" opacity=".54"/>
  <path d="M180 608 L340 365 L520 608 Z" fill="#0f172a" opacity=".76"/>
  <path d="M420 608 L650 270 L900 608 Z" fill="#111827" opacity=".82"/>
  <rect x="70" y="70" width="430" height="150" rx="34" fill="#ffffff" opacity=".16"/>
  <text x="96" y="132" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="800">Image Effects Sample</text>
  <text x="98" y="184" fill="#e0f2fe" font-family="Inter, system-ui, sans-serif" font-size="24">Preset filters, grain, vignette, pixelate</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}