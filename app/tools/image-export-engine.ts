export type ImageExportMode = "png-webp" | "jpg-png" | "compress";
export type ImageOutputFormat = "image/webp" | "image/png" | "image/jpeg";

export type ImageExportSettings = {
  mode: ImageExportMode;
  format: ImageOutputFormat;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  keepAspect: boolean;
  fillBackground: boolean;
  backgroundColor: string;
  stripMetadata: boolean;
};

export const modePresets: Record<ImageExportMode, ImageExportSettings> = {
  "png-webp": {
    mode: "png-webp",
    format: "image/webp",
    quality: 0.86,
    maxWidth: 0,
    maxHeight: 0,
    keepAspect: true,
    fillBackground: false,
    backgroundColor: "#ffffff",
    stripMetadata: true,
  },
  "jpg-png": {
    mode: "jpg-png",
    format: "image/png",
    quality: 1,
    maxWidth: 0,
    maxHeight: 0,
    keepAspect: true,
    fillBackground: false,
    backgroundColor: "#ffffff",
    stripMetadata: true,
  },
  compress: {
    mode: "compress",
    format: "image/webp",
    quality: 0.72,
    maxWidth: 1600,
    maxHeight: 1600,
    keepAspect: true,
    fillBackground: true,
    backgroundColor: "#ffffff",
    stripMetadata: true,
  },
};

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function formatPercentChange(original: number, next: number) {
  if (!original || !next) return "0%";
  const change = ((original - next) / original) * 100;
  const rounded = Math.round(change);
  if (rounded > 0) return `-${rounded}%`;
  if (rounded < 0) return `+${Math.abs(rounded)}%`;
  return "0%";
}

export function extensionForMime(mime: ImageOutputFormat) {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  return "png";
}

export function labelForMime(mime: ImageOutputFormat) {
  if (mime === "image/webp") return "WebP";
  if (mime === "image/jpeg") return "JPEG";
  return "PNG";
}

export function outputFileName(sourceName: string, settings: Pick<ImageExportSettings, "mode" | "format">) {
  const base = (sourceName || "image").replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "image";
  const suffix = settings.mode === "compress" ? "compressed" : "converted";
  return `${base}-${suffix}.${extensionForMime(settings.format)}`;
}

export function calculateTargetSize(width: number, height: number, settings: Pick<ImageExportSettings, "maxWidth" | "maxHeight" | "keepAspect">) {
  const safeWidth = Math.max(1, Math.round(width || 1));
  const safeHeight = Math.max(1, Math.round(height || 1));
  const maxWidth = Math.max(0, Math.round(settings.maxWidth || 0));
  const maxHeight = Math.max(0, Math.round(settings.maxHeight || 0));

  if (!maxWidth && !maxHeight) return { width: safeWidth, height: safeHeight, scale: 1 };

  if (!settings.keepAspect) {
    return {
      width: maxWidth || safeWidth,
      height: maxHeight || safeHeight,
      scale: maxWidth ? maxWidth / safeWidth : maxHeight / safeHeight,
    };
  }

  const widthRatio = maxWidth ? maxWidth / safeWidth : 1;
  const heightRatio = maxHeight ? maxHeight / safeHeight : 1;
  const scale = Math.min(1, widthRatio, heightRatio);
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
    scale,
  };
}

export function normalizeHex(value: string) {
  const clean = value.trim().replace(/^#/, "");
  const expanded = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return "#ffffff";
  return `#${expanded.toLowerCase()}`;
}

export function buildImageExportSummary(originalBytes: number, outputBytes: number, width: number, height: number, format: ImageOutputFormat) {
  return [
    `Format: ${labelForMime(format)}`,
    `Size: ${formatBytes(originalBytes)} → ${formatBytes(outputBytes)} (${formatPercentChange(originalBytes, outputBytes)})`,
    `Dimensions: ${width} × ${height}`,
    "Metadata: stripped by canvas re-encode",
  ].join("\n");
}

export function getSampleExportSvgDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14b8a6"/>
      <stop offset="0.48" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#f97316"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="16%" r="50%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="700" rx="46" fill="url(#bg)"/>
  <circle cx="780" cy="120" r="210" fill="url(#glow)"/>
  <rect x="90" y="105" width="820" height="490" rx="42" fill="#081923" opacity="0.25"/>
  <path d="M135 475 C230 330 360 390 460 260 C578 105 715 350 870 190 L870 552 L135 552 Z" fill="#fff" opacity="0.24"/>
  <text x="120" y="190" font-family="Inter, system-ui, sans-serif" font-size="58" font-weight="900" fill="#ffffff">Image Export</text>
  <text x="120" y="246" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#ffffff" opacity="0.86">Convert, compress, resize, and download locally.</text>
  <g transform="translate(650 340)">
    <rect x="0" y="0" width="170" height="120" rx="22" fill="#ffffff" opacity="0.9"/>
    <circle cx="52" cy="43" r="20" fill="#14b8a6"/>
    <path d="M22 96 L74 61 L103 83 L133 52 L153 96 Z" fill="#0f172a" opacity="0.75"/>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
