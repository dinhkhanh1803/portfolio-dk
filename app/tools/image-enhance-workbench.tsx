"use client";

import { Download, ImagePlus, RotateCcw, Scissors, Sparkles, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildEnhanceCss,
  buildSharpenKernel,
  defaultBackgroundCleanupSettings,
  defaultSharpenSettings,
  defaultUpscaleSettings,
  downloadFileName,
  formatPixels,
  getSampleEnhanceImageDataUrl,
  normalizeCleanupSettings,
  parseHexColor,
  rgbToHex,
  scaleDimensions,
  type BackgroundCleanupSettings,
  type ImageEnhanceMode,
  type SharpenSettings,
  type UpscaleSettings,
} from "./image-enhance-engine";

const modeLabels: Array<{ id: ImageEnhanceMode; label: string; description: string }> = [
  { id: "sharpen", label: "Sharpen", description: "Recover local detail with a convolution pass" },
  { id: "upscale", label: "Upscale", description: "Resize to 2x, 3x, or 4x with smoothing controls" },
  { id: "background-cleanup", label: "Background Cleanup", description: "Remove a flat background color to transparent PNG" },
];

const sampleImage = getSampleEnhanceImageDataUrl();

function RangeControl({ label, value, min, max, step = 1, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="image-enhance-range">
      <span>{label}<strong>{value}{suffix}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load this image."));
    image.src = src;
  });
}

function applySharpen(source: HTMLImageElement, settings: SharpenSettings) {
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth || source.width;
  canvas.height = source.naturalHeight || source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not supported in this browser.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const original = new Uint8ClampedArray(imageData.data);
  const kernel = buildSharpenKernel(settings.amount);
  const width = canvas.width;
  const height = canvas.height;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const outputIndex = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        let value = 0;
        let kernelIndex = 0;
        for (let ky = -1; ky <= 1; ky += 1) {
          for (let kx = -1; kx <= 1; kx += 1) {
            const inputIndex = ((y + ky) * width + (x + kx)) * 4 + channel;
            value += original[inputIndex] * kernel[kernelIndex];
            kernelIndex += 1;
          }
        }
        imageData.data[outputIndex + channel] = Math.max(0, Math.min(255, value));
      }
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function applyUpscale(source: HTMLImageElement, settings: UpscaleSettings) {
  const originalWidth = source.naturalWidth || source.width;
  const originalHeight = source.naturalHeight || source.height;
  const next = scaleDimensions(originalWidth, originalHeight, settings.scale);
  const canvas = document.createElement("canvas");
  canvas.width = next.width;
  canvas.height = next.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser.");
  context.imageSmoothingEnabled = settings.smoothing;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function applyBackgroundCleanup(source: HTMLImageElement, settings: BackgroundCleanupSettings) {
  const normalized = normalizeCleanupSettings(settings);
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth || source.width;
  canvas.height = source.naturalHeight || source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not supported in this browser.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const sampled = normalized.autoSample
    ? {
        r: imageData.data[0],
        g: imageData.data[1],
        b: imageData.data[2],
      }
    : parseHexColor(normalized.color);
  const tolerance = normalized.tolerance;
  const softness = Math.max(1, normalized.edgeSoftness);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const distance = Math.sqrt(
      (imageData.data[index] - sampled.r) ** 2 +
      (imageData.data[index + 1] - sampled.g) ** 2 +
      (imageData.data[index + 2] - sampled.b) ** 2,
    );
    if (distance <= tolerance) {
      imageData.data[index + 3] = 0;
    } else if (distance <= tolerance + softness) {
      const ratio = (distance - tolerance) / softness;
      imageData.data[index + 3] = Math.round(imageData.data[index + 3] * ratio);
    }
  }

  context.putImageData(imageData, 0, 0);
  return { canvas, sampledHex: rgbToHex(sampled.r, sampled.g, sampled.b) };
}

export default function ImageEnhanceWorkbench() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<ImageEnhanceMode>("sharpen");
  const [imageSrc, setImageSrc] = useState(sampleImage);
  const [fileName, setFileName] = useState("image-enhance-sample.svg");
  const [dimensions, setDimensions] = useState({ width: 960, height: 620 });
  const [processedSrc, setProcessedSrc] = useState("");
  const [status, setStatus] = useState("Sample loaded. Choose an enhancement mode and tune the controls.");
  const [sampledColor, setSampledColor] = useState("#ffffff");
  const [sharpen, setSharpen] = useState(defaultSharpenSettings);
  const [upscale, setUpscale] = useState(defaultUpscaleSettings);
  const [cleanup, setCleanup] = useState(defaultBackgroundCleanupSettings);

  const scaled = useMemo(() => scaleDimensions(dimensions.width, dimensions.height, upscale.scale), [dimensions, upscale.scale]);
  const generatedCss = useMemo(() => buildEnhanceCss(mode, sharpen, upscale, cleanup), [cleanup, mode, sharpen, upscale]);

  async function processImage(nextMode = mode) {
    try {
      const image = await loadImage(imageSrc);
      setDimensions({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      let canvas: HTMLCanvasElement;
      let message = "Preview updated.";

      if (nextMode === "sharpen") {
        canvas = applySharpen(image, sharpen);
        message = "Sharpened preview rendered locally.";
      } else if (nextMode === "upscale") {
        canvas = applyUpscale(image, upscale);
        message = `Upscaled to ${upscale.scale}x (${canvas.width} × ${canvas.height}).`;
      } else {
        const result = applyBackgroundCleanup(image, cleanup);
        canvas = result.canvas;
        setSampledColor(result.sampledHex);
        message = cleanup.autoSample ? `Background sampled from top-left: ${result.sampledHex}.` : `Removed colors near ${cleanup.color}.`;
      }

      setProcessedSrc(canvas.toDataURL("image/png"));
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not process this image.");
    }
  }

  useEffect(() => {
    processImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, imageSrc, sharpen.amount, sharpen.previewBoost, upscale.scale, upscale.smoothing, cleanup.color, cleanup.tolerance, cleanup.edgeSoftness, cleanup.autoSample]);

  function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Please choose a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setFileName(file.name);
      setStatus(`${file.name} loaded locally.`);
    };
    reader.readAsDataURL(file);
  }

  function loadSample() {
    setImageSrc(sampleImage);
    setFileName("image-enhance-sample.svg");
    setStatus("Sample image loaded.");
  }

  function reset() {
    setMode("sharpen");
    setSharpen(defaultSharpenSettings);
    setUpscale(defaultUpscaleSettings);
    setCleanup(defaultBackgroundCleanupSettings);
    loadSample();
  }

  async function copyCss() {
    await navigator.clipboard?.writeText(generatedCss);
    setStatus("CSS copied to clipboard.");
  }

  function downloadImage() {
    if (!processedSrc) return;
    const anchor = document.createElement("a");
    anchor.href = processedSrc;
    anchor.download = downloadFileName(fileName, mode);
    anchor.click();
    setStatus("PNG exported locally.");
  }

  return (
    <section className="image-enhance-workbench text-manipulation-workbench">
      <div className="tool-subtabs image-enhance-tabs" role="tablist" aria-label="Image enhance modes">
        {modeLabels.map((item) => (
          <button key={item.id} className={mode === item.id ? "active" : ""} type="button" onClick={() => setMode(item.id)}>
            {item.id === "background-cleanup" ? <Scissors size={15} /> : <WandSparkles size={15} />}
            {item.label}
          </button>
        ))}
      </div>

      <div className="text-tool-heading-row">
        <div>
          <p className="eyebrow">Browser local image lab</p>
          <h2>Image Enhance & Style</h2>
          <p className="muted">Sharpen, upscale, and clean flat backgrounds from images directly in your browser. No upload, no server processing.</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={loadSample}><Sparkles size={16} /> Sample</button>
          <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload image</button>
          <button type="button" onClick={reset}><RotateCcw size={16} /> Reset</button>
        </div>
      </div>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" onChange={loadFile} />

      <div className="image-enhance-layout">
        <div className="image-enhance-controls text-tool-control-card">
          <button className="image-enhance-dropzone" type="button" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={30} />
            <strong>Choose an image</strong>
            <span>PNG, JPG, WebP, GIF, SVG. Processing stays local.</span>
          </button>

          <div className="image-enhance-mode-card">
            <h3>{modeLabels.find((item) => item.id === mode)?.label}</h3>
            <p>{modeLabels.find((item) => item.id === mode)?.description}</p>

            {mode === "sharpen" ? (
              <>
                <RangeControl label="Sharpness amount" value={sharpen.amount} min={0} max={1} step={0.05} onChange={(value) => setSharpen((current) => ({ ...current, amount: value }))} />
                <RangeControl label="Preview contrast boost" value={sharpen.previewBoost} min={0} max={35} suffix="%" onChange={(value) => setSharpen((current) => ({ ...current, previewBoost: value }))} />
                <div className="image-enhance-note">Best for slightly soft screenshots, icons, and UI captures. Avoid extreme values on noisy photos.</div>
              </>
            ) : null}

            {mode === "upscale" ? (
              <>
                <div className="image-enhance-choice-grid">
                  {[1.5, 2, 3, 4].map((scale) => (
                    <button key={scale} className={upscale.scale === scale ? "active" : ""} type="button" onClick={() => setUpscale((current) => ({ ...current, scale }))}>{scale}x</button>
                  ))}
                </div>
                <label className="image-enhance-check"><input type="checkbox" checked={upscale.smoothing} onChange={(event) => setUpscale((current) => ({ ...current, smoothing: event.target.checked }))} /> Smooth edges</label>
                <div className="image-enhance-stat"><span>Output size</span><strong>{scaled.width} × {scaled.height}</strong><em>{formatPixels(scaled.pixels)}</em></div>
              </>
            ) : null}

            {mode === "background-cleanup" ? (
              <>
                <label className="image-enhance-check"><input type="checkbox" checked={cleanup.autoSample} onChange={(event) => setCleanup((current) => ({ ...current, autoSample: event.target.checked }))} /> Auto sample top-left background</label>
                <label className="image-enhance-color-row">
                  <span>Target color</span>
                  <input type="color" value={cleanup.autoSample ? sampledColor : cleanup.color} disabled={cleanup.autoSample} onChange={(event) => setCleanup((current) => ({ ...current, color: event.target.value }))} />
                  <code>{cleanup.autoSample ? sampledColor : cleanup.color}</code>
                </label>
                <RangeControl label="Tolerance" value={cleanup.tolerance} min={0} max={120} onChange={(value) => setCleanup((current) => ({ ...current, tolerance: value }))} />
                <RangeControl label="Edge softness" value={cleanup.edgeSoftness} min={0} max={50} suffix="px" onChange={(value) => setCleanup((current) => ({ ...current, edgeSoftness: value }))} />
                <label className="image-enhance-check"><input type="checkbox" checked={cleanup.checkerboard} onChange={(event) => setCleanup((current) => ({ ...current, checkerboard: event.target.checked }))} /> Show transparency grid</label>
              </>
            ) : null}
          </div>
        </div>

        <div className="image-enhance-output text-tool-panel">
          <div className="image-enhance-preview-header">
            <div>
              <h3>Before / After preview</h3>
              <p className="muted small">{status}</p>
            </div>
            <div className="text-tool-actions compact">
              <button type="button" onClick={copyCss}>Copy CSS</button>
              <button type="button" onClick={downloadImage}><Download size={16} /> Download PNG</button>
            </div>
          </div>

          <div className="image-enhance-preview-grid">
            <figure>
              <figcaption>Original <span>{dimensions.width} × {dimensions.height}</span></figcaption>
              <div className="image-enhance-canvas-wrap"><img src={imageSrc} alt="Original preview" /></div>
            </figure>
            <figure>
              <figcaption>Processed <span>{mode === "upscale" ? `${scaled.width} × ${scaled.height}` : `${dimensions.width} × ${dimensions.height}`}</span></figcaption>
              <div className={cleanup.checkerboard && mode === "background-cleanup" ? "image-enhance-canvas-wrap checker" : "image-enhance-canvas-wrap"}>
                {processedSrc ? <img src={processedSrc} alt="Enhanced preview" /> : <span>Preview will appear here...</span>}
              </div>
            </figure>
          </div>

          <div className="image-enhance-code-card">
            <div className="image-enhance-code-head">
              <h3>Generated CSS note</h3>
              <button type="button" onClick={copyCss}>Copy</button>
            </div>
            <pre>{generatedCss}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
