"use client";

/* eslint-disable @next/next/no-img-element */

import { Check, Clipboard, Download, ImagePlus, RefreshCw, Upload } from "lucide-react";
import { DragEvent, useMemo, useRef, useState } from "react";
import { createPicsumUrl, createPlaceholderDataUrl, createPlaceholderSvg, faviconSizes } from "./favicon-placeholder-engine";

type Mode = "favicon" | "emoji" | "image" | "css" | "placeholder" | "url";
type Shape = "square" | "rounded" | "circle";

const tabs: { id: Mode; label: string; description: string }[] = [
  { id: "favicon", label: "Favicon Generator", description: "Upload an image, crop it into standard browser and PWA icon sizes, then download each PNG locally." },
  { id: "emoji", label: "Emoji Favicon Generator", description: "Turn an emoji or short label into an app-ready favicon with selectable background and shape." },
  { id: "image", label: "Image Favicon Generator", description: "Prepare an uploaded image as individual favicon PNG assets at the sizes your app needs." },
  { id: "css", label: "CSS Placeholder Generator", description: "Create a lightweight SVG placeholder, ready as CSS, data URL, or a downloadable image." },
  { id: "placeholder", label: "Placeholder Image Generator", description: "Build downloadable SVG or PNG placeholders for mockups, cards, social images, and content states." },
  { id: "url", label: "Placeholder Image URL", description: "Compose a predictable Picsum image URL with dimensions, blur, grayscale, and optional seed." },
];

const quickEmoji = ["🚀", "✨", "🔥", "⚡", "💎", "🎯", "🎵", "💻", "🌈", "🍀", "🌸", "⭐", "❤️", "💜", "✅"];
const presetSizes = [[1280, 720, "16:9"], [800, 600, "4:3"], [500, 500, "1:1"], [1200, 300, "Banner"], [150, 150, "Thumbnail"], [1200, 630, "OG image"]] as const;

const copyText = async (text: string, setCopied: (value: boolean) => void) => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  window.setTimeout(() => setCopied(false), 1400);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
};

const downloadSvg = (svg: string, filename: string) => downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="favicon-copy" type="button" onClick={() => void copyText(value, setCopied)}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied" : label}</button>;
}

export default function FaviconPlaceholderWorkbench() {
  const [mode, setMode] = useState<Mode>("favicon");
  const active = tabs.find((tab) => tab.id === mode)!;
  return <section className="favicon-workbench">
    <div className="data-format-tabs favicon-tabs" role="tablist">{tabs.map((tab) => <button role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)} key={tab.id}>{tab.label}</button>)}</div>
    <div className="favicon-intro"><h2>{active.label}</h2><p>{active.description}</p></div>
    {mode === "favicon" && <ImageFaviconPanel title="Favicon Generator" />}
    {mode === "image" && <ImageFaviconPanel title="Image Favicon Generator" />}
    {mode === "emoji" && <EmojiFaviconPanel />}
    {mode === "css" && <PlaceholderPanel cssOnly />}
    {mode === "placeholder" && <PlaceholderPanel />}
    {mode === "url" && <PicsumPanel />}
  </section>;
}

function ImageFaviconPanel({ title }: { title: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string>("");
  const [error, setError] = useState("");
  const readFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a PNG, JPEG, WebP, GIF, or SVG image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be 10 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(String(reader.result)); setError(""); };
    reader.readAsDataURL(file);
  };
  const onDrop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); readFile(event.dataTransfer.files[0]); };
  const exportPng = (size: number) => {
    if (!image) return;
    const source = new Image();
    source.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = size; canvas.height = size;
      const context = canvas.getContext("2d"); if (!context) return;
      const scale = Math.max(size / source.width, size / source.height);
      const width = source.width * scale; const height = source.height * scale;
      context.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
      canvas.toBlob((blob) => blob && downloadBlob(blob, `favicon-${size}x${size}.png`), "image/png");
    };
    source.src = image;
  };
  return <div className="favicon-upload-flow">
    {!image ? <button className="favicon-dropzone" type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}><ImagePlus size={44} /><strong>Upload an image</strong><span>Drag & drop or click to browse</span><small>PNG, JPG, WebP, GIF, or SVG · max 10 MB</small><b><Upload size={15} />Choose image</b></button> : <>
      <div className="favicon-image-actions"><button type="button" onClick={() => inputRef.current?.click()}><Upload size={14} />Replace image</button><button type="button" onClick={() => { setImage(""); setError(""); }}><RefreshCw size={14} />Clear</button></div>
      <div className="favicon-image-grid">{faviconSizes().map((size) => <article key={size}><div><img src={image} alt={`Favicon preview ${size} pixels`} /></div><span>{size}×{size}</span><button type="button" onClick={() => exportPng(size)}><Download size={13} />PNG</button></article>)}</div>
    </>}
    <input ref={inputRef} className="favicon-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => readFile(event.target.files?.[0])} />
    {error && <p className="favicon-error" role="alert">{error}</p>}
    <p className="favicon-note">{title} keeps every transformation in your browser; only the original image is used to make exported PNGs.</p>
  </div>;
}

function EmojiFaviconPanel() {
  const [emoji, setEmoji] = useState("🚀"); const [background, setBackground] = useState("#15252d"); const [shape, setShape] = useState<Shape>("rounded"); const [scale, setScale] = useState(76);
  const svg = useMemo(() => emojiSvg(emoji, background, shape, scale), [emoji, background, shape, scale]);
  const downloadPng = (size: number) => rasterizeSvg(svg, size, `emoji-favicon-${size}.png`);
  return <div className="favicon-emoji-flow"><div className="favicon-settings">
    <label>Emoji or text (up to 2 characters)<input value={emoji} maxLength={4} onChange={(event) => setEmoji(event.target.value)} /></label>
    <span>Quick pick</span><div className="favicon-emoji-picks">{quickEmoji.map((value) => <button type="button" className={emoji === value ? "is-active" : ""} onClick={() => setEmoji(value)} key={value}>{value}</button>)}</div>
    <label>Background<input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label>
    <span>Shape</span><div className="favicon-segmented">{(["square", "rounded", "circle"] as Shape[]).map((value) => <button type="button" className={shape === value ? "is-active" : ""} onClick={() => setShape(value)} key={value}>{value}</button>)}</div>
    <label>Font size <b>{scale}%</b><input type="range" min="45" max="92" value={scale} onChange={(event) => setScale(Number(event.target.value))} /></label>
  </div><div className="favicon-emoji-preview"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt="Emoji favicon preview" /><div>{faviconSizes().map((size) => <button type="button" onClick={() => downloadPng(size)} key={size}>{size}px</button>)}</div><CopyButton value={svg} label="Copy SVG" /></div></div>;
}

function PlaceholderPanel({ cssOnly = false }: { cssOnly?: boolean }) {
  const [width, setWidth] = useState(600); const [height, setHeight] = useState(400); const [background, setBackground] = useState("#e6e8eb"); const [color, setColor] = useState("#35424b"); const [text, setText] = useState(""); const [fontSize, setFontSize] = useState(0);
  const label = text || `${width}×${height}`; const resolvedSize = fontSize || Math.round(Math.min(width, height) / 7);
  const options = { width, height, background, color, text: label, fontSize: resolvedSize };
  const svg = createPlaceholderSvg(options); const dataUrl = createPlaceholderDataUrl(options);
  const css = `.placeholder {\n  width: ${width}px;\n  height: ${height}px;\n  background: ${background};\n  color: ${color};\n  display: grid;\n  place-items: center;\n  font: 700 ${resolvedSize}px/1 system-ui, sans-serif;\n}`;
  return <div className="placeholder-flow"><div className="favicon-settings placeholder-settings">
    {!cssOnly && <div className="favicon-preset-row">{presetSizes.map(([presetWidth, presetHeight, name]) => <button type="button" onClick={() => { setWidth(presetWidth); setHeight(presetHeight); }} key={name}>{name} ({presetWidth}×{presetHeight})</button>)}</div>}
    <div className="favicon-two-fields"><label>Width (px)<input type="number" min="1" max="4096" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><label>Height (px)<input type="number" min="1" max="4096" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label></div>
    <div className="favicon-two-fields"><label>Background<input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label><label>Text color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label></div>
    <label>Custom text<input value={text} placeholder={`${width}×${height}`} onChange={(event) => setText(event.target.value)} /></label><label>Font size <b>{fontSize || "Auto"}</b><input type="range" min="0" max="120" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
    <div className="favicon-action-row"><button type="button" onClick={() => downloadSvg(svg, "placeholder.svg")}><Download size={14} />Download SVG</button>{!cssOnly && <button type="button" onClick={() => rasterizeSvg(svg, Math.max(width, height), "placeholder.png", width, height)}><Download size={14} />Download PNG</button>}<CopyButton value={cssOnly ? css : dataUrl} label={cssOnly ? "Copy CSS" : "Copy data URL"} /></div>
  </div><div className="placeholder-output"><div className="placeholder-preview" style={{ background, color, aspectRatio: `${width}/${height}` }}><span style={{ fontSize: `clamp(14px, ${Math.min(12, Math.max(2, resolvedSize / 4))}vw, ${resolvedSize}px)` }}>{label}</span></div><CodeOutput title={cssOnly ? "CSS code" : "SVG / data URL"} value={cssOnly ? css : svg} /><CodeOutput title="Image URL" value={dataUrl} /></div></div>;
}

function PicsumPanel() {
  const [width, setWidth] = useState(600); const [height, setHeight] = useState(400); const [blur, setBlur] = useState(0); const [grayscale, setGrayscale] = useState(false); const [seed, setSeed] = useState(""); const [imageError, setImageError] = useState(false);
  const url = useMemo(() => createPicsumUrl({ width, height, blur, grayscale, seed }), [width, height, blur, grayscale, seed]);
  return <div className="picsum-flow"><div className="favicon-settings"><label>Width <b>{width}px</b><input type="range" min="100" max="1600" step="10" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><label>Height <b>{height}px</b><input type="range" min="100" max="1200" step="10" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label><label>Blur <b>{blur}</b><input type="range" min="0" max="10" value={blur} onChange={(event) => setBlur(Number(event.target.value))} /></label><label className="favicon-check"><input type="checkbox" checked={grayscale} onChange={(event) => setGrayscale(event.target.checked)} />Grayscale</label><label>Seed (optional)<input value={seed} placeholder="e.g. mountain" onChange={(event) => { setSeed(event.target.value); setImageError(false); }} /></label></div><div className="picsum-output"><div className="picsum-preview">{imageError ? <p>Preview could not load. The URL is still ready to copy and will fetch from Picsum where network access is available.</p> : <img src={url} onError={() => setImageError(true)} alt="Random placeholder from Picsum" />}</div><CodeOutput title="Image URL" value={url} /><CodeOutput title="HTML <img>" value={`<img src="${url}" width="${width}" height="${height}" alt="Placeholder image" />`} /><CodeOutput title="Markdown" value={`![Placeholder image](${url})`} /></div></div>;
}

function CodeOutput({ title, value }: { title: string; value: string }) { return <section className="favicon-code"><header><strong>{title}</strong><CopyButton value={value} /></header><pre>{value}</pre></section>; }

function emojiSvg(value: string, background: string, shape: Shape, scale: number) { const radius = shape === "circle" ? 256 : shape === "rounded" ? 92 : 0; return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="${radius}" fill="${background}"/><text x="256" y="270" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="${Math.round(scale * 5)}">${value || "✨"}</text></svg>`; }
function rasterizeSvg(svg: string, size: number, filename: string, width = size, height = size) { const source = new Image(); source.onload = () => { const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"); if (!context) return; context.drawImage(source, 0, 0, width, height); canvas.toBlob((blob) => blob && downloadBlob(blob, filename), "image/png"); }; source.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }
