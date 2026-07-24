export type ImageFormat = "png" | "jpg" | "webp";

export type ImageFilterSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
};

export type ImageTransformSettings = {
  rotate: number;
  flipX: boolean;
  flipY: boolean;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type ResizeOptions = {
  width?: number;
  height?: number;
  keepAspect?: boolean;
};

export const defaultImageFilters: ImageFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
};

export const defaultImageTransform: ImageTransformSettings = {
  rotate: 0,
  flipX: false,
  flipY: false,
};

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeImageFilters(settings: Partial<ImageFilterSettings>): ImageFilterSettings {
  return {
    brightness: clampNumber(settings.brightness ?? defaultImageFilters.brightness, 0, 250),
    contrast: clampNumber(settings.contrast ?? defaultImageFilters.contrast, 0, 250),
    saturation: clampNumber(settings.saturation ?? defaultImageFilters.saturation, 0, 300),
    blur: clampNumber(settings.blur ?? defaultImageFilters.blur, 0, 40),
  };
}

export function buildImageFilter(settings: Partial<ImageFilterSettings>) {
  const normalized = normalizeImageFilters(settings);
  return `brightness(${normalized.brightness}%) contrast(${normalized.contrast}%) saturate(${normalized.saturation}%) blur(${normalized.blur}px)`;
}

export function buildImageTransform(settings: Partial<ImageTransformSettings>) {
  const rotate = clampNumber(settings.rotate ?? 0, -360, 360);
  const scaleX = settings.flipX ? -1 : 1;
  const scaleY = settings.flipY ? -1 : 1;
  return `rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
}

export function calculateResize(original: ImageSize, options: ResizeOptions): ImageSize {
  const sourceWidth = Math.max(1, Math.round(original.width || 1));
  const sourceHeight = Math.max(1, Math.round(original.height || 1));
  const nextWidth = options.width ? Math.max(1, Math.round(options.width)) : undefined;
  const nextHeight = options.height ? Math.max(1, Math.round(options.height)) : undefined;

  if (options.keepAspect) {
    if (nextWidth && !nextHeight) {
      return { width: nextWidth, height: Math.max(1, Math.round((nextWidth / sourceWidth) * sourceHeight)) };
    }
    if (nextHeight && !nextWidth) {
      return { width: Math.max(1, Math.round((nextHeight / sourceHeight) * sourceWidth)), height: nextHeight };
    }
    if (nextWidth && nextHeight) {
      return { width: nextWidth, height: Math.max(1, Math.round((nextWidth / sourceWidth) * sourceHeight)) };
    }
  }

  return {
    width: nextWidth ?? sourceWidth,
    height: nextHeight ?? sourceHeight,
  };
}

export function getMimeType(format: ImageFormat) {
  if (format === "jpg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

export function getFileExtension(format: ImageFormat) {
  return format === "jpg" ? "jpg" : format;
}

export function safeFileBaseName(name: string) {
  return (name || "edited-image")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "edited-image";
}

export function buildEditedFilename(name: string, format: ImageFormat) {
  return `${safeFileBaseName(name)}-edited.${getFileExtension(format)}`;
}

export function getSampleImageDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="0.55" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#10b981"/>
    </linearGradient>
    <radialGradient id="sun" cx="30%" cy="25%" r="35%">
      <stop offset="0" stop-color="#fff7ad" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#fff7ad" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect width="1200" height="800" fill="url(#sun)"/>
  <circle cx="930" cy="170" r="84" fill="#ffffff" opacity="0.24"/>
  <path d="M0 630 C220 520 340 700 560 600 C760 510 900 590 1200 480 L1200 800 L0 800 Z" fill="#062b3b" opacity="0.48"/>
  <text x="72" y="116" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="58" font-weight="800">DK Tools Sample</text>
  <text x="76" y="172" fill="#dff7ff" font-family="Inter, system-ui, sans-serif" font-size="28">Resize, adjust, transform, export locally</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}