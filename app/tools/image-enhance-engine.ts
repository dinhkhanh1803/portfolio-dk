export type ImageEnhanceMode = "sharpen" | "upscale" | "background-cleanup";

export type SharpenSettings = {
  amount: number;
  previewBoost: number;
};

export type UpscaleSettings = {
  scale: number;
  smoothing: boolean;
};

export type BackgroundCleanupSettings = {
  color: string;
  tolerance: number;
  edgeSoftness: number;
  autoSample: boolean;
  checkerboard: boolean;
};

export const defaultSharpenSettings: SharpenSettings = {
  amount: 0.45,
  previewBoost: 12,
};

export const defaultUpscaleSettings: UpscaleSettings = {
  scale: 2,
  smoothing: true,
};

export const defaultBackgroundCleanupSettings: BackgroundCleanupSettings = {
  color: "#ffffff",
  tolerance: 34,
  edgeSoftness: 12,
  autoSample: true,
  checkerboard: true,
};

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function scaleDimensions(width: number, height: number, scale: number) {
  const safeWidth = Math.max(1, Math.round(width || 1));
  const safeHeight = Math.max(1, Math.round(height || 1));
  const safeScale = clampNumber(scale, 1, 4);
  const nextWidth = Math.max(1, Math.round(safeWidth * safeScale));
  const nextHeight = Math.max(1, Math.round(safeHeight * safeScale));
  return { width: nextWidth, height: nextHeight, pixels: nextWidth * nextHeight };
}

export function buildSharpenKernel(amount: number) {
  const safeAmount = Number(clampNumber(amount, 0, 1).toFixed(3));
  const center = Number((1 + safeAmount * 4).toFixed(3));
  const edge = Number((-safeAmount).toFixed(3));
  return [0, edge, 0, edge, center, edge, 0, edge, 0];
}

export function buildSharpenPreviewCss(settings: SharpenSettings) {
  const amount = clampNumber(settings.amount, 0, 1);
  const boost = clampNumber(settings.previewBoost, 0, 35);
  return `contrast(${Math.round(100 + amount * boost)}%) saturate(${Math.round(100 + amount * 8)}%)`;
}

export function parseHexColor(value: string) {
  const normalized = value.trim().replace(/^#/, "");
  const expanded = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return { r: 255, g: 255, b: 255 };
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((channel) => clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

export function normalizeCleanupSettings(settings: Partial<BackgroundCleanupSettings>): BackgroundCleanupSettings {
  return {
    color: settings.color && /^#?[0-9a-fA-F]{3,6}$/.test(settings.color) ? (settings.color.startsWith("#") ? settings.color : `#${settings.color}`) : defaultBackgroundCleanupSettings.color,
    tolerance: Math.round(clampNumber(settings.tolerance ?? defaultBackgroundCleanupSettings.tolerance, 0, 120)),
    edgeSoftness: Math.round(clampNumber(settings.edgeSoftness ?? defaultBackgroundCleanupSettings.edgeSoftness, 0, 50)),
    autoSample: Boolean(settings.autoSample ?? defaultBackgroundCleanupSettings.autoSample),
    checkerboard: Boolean(settings.checkerboard ?? defaultBackgroundCleanupSettings.checkerboard),
  };
}

export function downloadFileName(sourceName: string, mode: ImageEnhanceMode) {
  const cleanBase = sourceName.trim().replace(/\.[a-z0-9]+$/i, "") || "enhanced-image";
  return `${cleanBase}-${mode}.png`;
}

export function formatPixels(pixels: number) {
  if (pixels >= 1_000_000) return `${(pixels / 1_000_000).toFixed(2)} MP`;
  if (pixels >= 1_000) return `${Math.round(pixels / 1_000)}K px`;
  return `${pixels} px`;
}

export function buildEnhanceCss(mode: ImageEnhanceMode, sharpen: SharpenSettings, upscale: UpscaleSettings, cleanup: BackgroundCleanupSettings) {
  if (mode === "sharpen") {
    return `.enhanced-image {
  filter: ${buildSharpenPreviewCss(sharpen)};
  image-rendering: auto;
}`;
  }

  if (mode === "upscale") {
    return `.enhanced-image {
  width: ${upscale.scale * 100}%;
  image-rendering: ${upscale.smoothing ? "auto" : "pixelated"};
}`;
  }

  const normalized = normalizeCleanupSettings(cleanup);
  return `.transparent-image {
  background-color: transparent;
  /* removed background near ${normalized.color} with tolerance ${normalized.tolerance} */
}`;
}

export function getSampleEnhanceImageDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="620" viewBox="0 0 960 620">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5fd3ff"/>
      <stop offset="0.55" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#f97316"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="34%" r="48%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="620" fill="#ffffff"/>
  <rect x="46" y="42" width="868" height="536" rx="56" fill="url(#sky)"/>
  <circle cx="250" cy="218" r="88" fill="#facc15" opacity="0.92"/>
  <circle cx="694" cy="170" r="118" fill="url(#glow)"/>
  <path d="M115 488 C235 330 356 368 455 248 C566 113 714 286 845 148 L845 540 L115 540 Z" fill="#09212a" opacity="0.56"/>
  <path d="M142 522 C246 414 376 438 502 326 C626 216 724 378 846 292 L846 540 L142 540 Z" fill="#ffffff" opacity="0.26"/>
  <text x="92" y="114" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="44" font-weight="800">Image Enhance Sample</text>
  <text x="92" y="164" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="22" opacity="0.86">Sharpen details, upscale, or remove the white background.</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
