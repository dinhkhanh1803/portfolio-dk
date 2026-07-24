"use client";

import { Copy, Download, Eye, ImagePlus, Palette, Pipette, Sparkles, Upload } from "lucide-react";
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildDuotoneCss,
  buildPaletteCss,
  buildPaletteJson,
  buildTintsAndShades,
  contrastRatio,
  extractPaletteFromPixels,
  getSampleColorImageDataUrl,
  hexToRgb,
  nearestCssColor,
  rgbToHex,
  rgbToHsl,
} from "./image-color-engine";

type ImageColorTab = "picker" | "palette" | "duotone" | "ramps";

const sampleImage = getSampleColorImageDataUrl();

function copyText(text: string) {
  return navigator.clipboard?.writeText(text);
}

function ColorChip({ color, label, onSelect }: { color: string; label?: string; onSelect?: (color: string) => void }) {
  const hsl = hexToRgb(color) ? rgbToHsl(hexToRgb(color)!) : { h: 0, s: 0, l: 0 };
  return (
    <button className="image-color-chip" type="button" onClick={() => onSelect?.(color)} title={`${color} · hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}>
      <span style={{ backgroundColor: color }} />
      <strong>{label || color}</strong>
      <small>{color}</small>
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="image-color-field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export default function ImageColorWorkbench() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<ImageColorTab>("picker");
  const [imageSrc, setImageSrc] = useState(sampleImage);
  const [pickedColor, setPickedColor] = useState("#3b82f6");
  const [palette, setPalette] = useState(["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"]);
  const [shadowColor, setShadowColor] = useState("#111827");
  const [highlightColor, setHighlightColor] = useState("#f8fafc");
  const [duotoneIntensity, setDuotoneIntensity] = useState(74);
  const [status, setStatus] = useState("Sample image loaded. Click the preview to pick a color.");

  const rgb = hexToRgb(pickedColor) || { r: 59, g: 130, b: 246 };
  const hsl = rgbToHsl(rgb);
  const nearest = nearestCssColor(pickedColor);
  const ramp = useMemo(() => buildTintsAndShades(pickedColor, 5), [pickedColor]);
  const paletteCss = useMemo(() => buildPaletteCss(palette), [palette]);
  const paletteJson = useMemo(() => buildPaletteJson(palette), [palette]);
  const duotoneCss = useMemo(() => buildDuotoneCss(shadowColor, highlightColor, duotoneIntensity), [shadowColor, highlightColor, duotoneIntensity]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = 900;
    const height = 540;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, width, height);
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    context.drawImage(image, x, y, drawWidth, drawHeight);
    extractPaletteFromCanvas(canvas);
  }

  function extractPaletteFromCanvas(canvas = canvasRef.current) {
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixels = [];
    for (let index = 0; index < imageData.length; index += 4 * 180) {
      const alpha = imageData[index + 3];
      if (alpha > 40) pixels.push({ r: imageData[index], g: imageData[index + 1], b: imageData[index + 2] });
    }
    const nextPalette = extractPaletteFromPixels(pixels, 6);
    if (nextPalette.length) setPalette(nextPalette);
  }

  function pickColor(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
    const [r, g, b] = context.getImageData(x, y, 1, 1).data;
    const nextColor = rgbToHex({ r, g, b });
    setPickedColor(nextColor);
    setStatus(`Picked ${nextColor} at ${x}, ${y}.`);
  }

  function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Please upload a PNG, JPG, WebP, SVG, or other image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setStatus(`${file.name} loaded locally. Click the image to sample a pixel.`);
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    setImageSrc(sampleImage);
    setPickedColor("#3b82f6");
    setPalette(["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"]);
    setStatus("Sample image loaded. Click the preview to pick a color.");
  }

  async function downloadPalette() {
    const blob = new Blob([paletteJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "image-palette.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    if (image.complete) drawCanvas();
  }, [imageSrc]);

  return (
    <section className="image-color-workbench text-manipulation-workbench">
      <div className="tool-subtabs image-color-tabs" role="tablist" aria-label="Image color tool sections">
        <button className={activeTab === "picker" ? "active" : ""} type="button" onClick={() => setActiveTab("picker")}><Pipette size={15} /> Color Picker</button>
        <button className={activeTab === "palette" ? "active" : ""} type="button" onClick={() => setActiveTab("palette")}><Palette size={15} /> Palette</button>
        <button className={activeTab === "duotone" ? "active" : ""} type="button" onClick={() => setActiveTab("duotone")}><Eye size={15} /> Duotone</button>
        <button className={activeTab === "ramps" ? "active" : ""} type="button" onClick={() => setActiveTab("ramps")}><Sparkles size={15} /> Tint & Shade</button>
      </div>

      <div className="text-tool-heading-row">
        <div>
          <p className="eyebrow">Browser local color lab</p>
          <h2>Image Color Tools</h2>
          <p className="muted">Pick pixels from images, extract palettes, inspect contrast, generate tints/shades, and export copy-ready color tokens.</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={loadSampleImage}><Sparkles size={16} /> Load sample image</button>
          <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload image</button>
          <button type="button" onClick={() => copyText(paletteCss)}><Copy size={16} /> Copy palette</button>
          <button type="button" onClick={downloadPalette}><Download size={16} /> Download JSON</button>
        </div>
      </div>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" onChange={loadFile} />
      <img ref={imageRef} className="sr-only" alt="Loaded image source" src={imageSrc} onLoad={drawCanvas} />

      <div className="image-color-layout">
        <div className="image-color-preview-card text-tool-panel">
          <div className="image-color-canvas-header">
            <div>
              <h3>Live image preview</h3>
              <p className="muted small">{status}</p>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}><ImagePlus size={16} /> Choose image</button>
          </div>
          <div className={`image-color-canvas-shell ${activeTab === "duotone" ? "duotone" : ""}`} style={activeTab === "duotone" ? { ["--duotone-shadow" as string]: shadowColor, ["--duotone-highlight" as string]: highlightColor, ["--duotone-opacity" as string]: duotoneIntensity / 100 } : undefined}>
            <canvas ref={canvasRef} onClick={pickColor} aria-label="Click image preview to pick a color" />
          </div>
        </div>

        <div className="image-color-inspector text-tool-control-card">
          {activeTab === "picker" && (
            <div className="image-color-section">
              <h3>Picked color</h3>
              <div className="image-color-picked" style={{ backgroundColor: pickedColor }}>
                <span>{pickedColor}</span>
              </div>
              <div className="image-color-details">
                <button type="button" onClick={() => copyText(pickedColor)}>HEX <strong>{pickedColor}</strong></button>
                <button type="button" onClick={() => copyText(`${rgb.r}, ${rgb.g}, ${rgb.b}`)}>RGB <strong>{rgb.r}, {rgb.g}, {rgb.b}</strong></button>
                <button type="button" onClick={() => copyText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>HSL <strong>{hsl.h}, {hsl.s}%, {hsl.l}%</strong></button>
              </div>
              <div className="image-color-metrics">
                <span>Nearest CSS name <strong>{nearest.name}</strong></span>
                <span>Contrast on white <strong>{contrastRatio(pickedColor, "#ffffff")}:1</strong></span>
                <span>Contrast on black <strong>{contrastRatio(pickedColor, "#000000")}:1</strong></span>
              </div>
            </div>
          )}

          {activeTab === "palette" && (
            <div className="image-color-section">
              <h3>Extracted palette</h3>
              <div className="image-color-palette-grid">
                {palette.map((color, index) => <ColorChip key={`${color}-${index}`} color={color} label={`Color ${index + 1}`} onSelect={setPickedColor} />)}
              </div>
              <pre className="image-color-output">{paletteCss}</pre>
              <pre className="image-color-output compact">{paletteJson}</pre>
            </div>
          )}

          {activeTab === "duotone" && (
            <div className="image-color-section">
              <h3>Duotone overlay</h3>
              <ColorField label="Shadow" value={shadowColor} onChange={setShadowColor} />
              <ColorField label="Highlight" value={highlightColor} onChange={setHighlightColor} />
              <label className="image-color-range">
                <span>Intensity <strong>{duotoneIntensity}%</strong></span>
                <input type="range" min={0} max={100} value={duotoneIntensity} onChange={(event) => setDuotoneIntensity(Number(event.target.value))} />
              </label>
              <pre className="image-color-output">{duotoneCss}</pre>
            </div>
          )}

          {activeTab === "ramps" && (
            <div className="image-color-section">
              <h3>Tint & Shade</h3>
              <ColorField label="Base color" value={pickedColor} onChange={setPickedColor} />
              <p className="muted small">Tint mixes toward white. Shade mixes toward black.</p>
              <h4>Tints</h4>
              <div className="image-color-swatch-row">{ramp.tints.map((color) => <ColorChip key={color} color={color} onSelect={setPickedColor} />)}</div>
              <h4>Base</h4>
              <div className="image-color-swatch-row"><ColorChip color={ramp.base} onSelect={setPickedColor} /></div>
              <h4>Shades</h4>
              <div className="image-color-swatch-row">{ramp.shades.map((color) => <ColorChip key={color} color={color} onSelect={setPickedColor} />)}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
