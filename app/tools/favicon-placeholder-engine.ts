export type PlaceholderOptions = {
  width: number;
  height: number;
  background: string;
  color: string;
  text: string;
  fontSize: number;
};

export type PicsumOptions = {
  width: number;
  height: number;
  blur: number;
  grayscale: boolean;
  seed: string;
};

export function escapeSvgText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function clampDimension(value: number, fallback = 400) {
  return Math.max(1, Math.min(4096, Number.isFinite(value) ? Math.round(value) : fallback));
}

export function createPlaceholderSvg(options: PlaceholderOptions) {
  const width = clampDimension(options.width);
  const height = clampDimension(options.height);
  const text = escapeSvgText(options.text || `${width}×${height}`);
  const fontSize = Math.max(8, Math.min(240, Number.isFinite(options.fontSize) ? Math.round(options.fontSize) : Math.round(Math.min(width, height) / 7)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${text}"><rect width="100%" height="100%" fill="${options.background}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${options.color}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700">${text}</text></svg>`;
}

export function createPlaceholderDataUrl(options: PlaceholderOptions) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createPlaceholderSvg(options))}`;
}

export function createPicsumUrl(options: PicsumOptions) {
  const width = clampDimension(options.width, 600);
  const height = clampDimension(options.height, 400);
  const base = options.seed.trim() ? `https://picsum.photos/seed/${encodeURIComponent(options.seed.trim())}/${width}/${height}` : `https://picsum.photos/${width}/${height}`;
  const params = new URLSearchParams();
  if (options.grayscale) params.set("grayscale", "");
  if (options.blur > 0) params.set("blur", String(Math.max(1, Math.min(10, Math.round(options.blur)))));
  const query = params.toString().replace("grayscale=", "grayscale");
  return query ? `${base}?${query}` : base;
}

export function faviconSizes() {
  return [16, 32, 48, 64, 128, 192] as const;
}
