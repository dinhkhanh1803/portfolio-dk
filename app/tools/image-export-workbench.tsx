"use client";

import { Copy, Download, FileImage, ImagePlus, RotateCcw, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildImageExportSummary,
  calculateTargetSize,
  formatBytes,
  formatPercentChange,
  getSampleExportSvgDataUrl,
  labelForMime,
  modePresets,
  normalizeHex,
  outputFileName,
  type ImageExportMode,
  type ImageExportSettings,
  type ImageOutputFormat,
} from "./image-export-engine";

const modes: Array<{ id: ImageExportMode; label: string; title: string; description: string }> = [
  { id: "png-webp", label: "PNG to WebP", title: "PNG to WebP Converter", description: "Convert transparent PNG artwork to compact WebP files in your browser." },
  { id: "jpg-png", label: "JPG to PNG", title: "JPG to PNG Converter", description: "Re-encode JPG images as PNG for editing, transparency workflows, or lossless archives." },
  { id: "compress", label: "Image Compressor", title: "Image Compressor", description: "Resize and compress images with quality controls before downloading." },
];

const formatChoices: Array<{ value: ImageOutputFormat; label: string; helper: string }> = [
  { value: "image/webp", label: "WebP", helper: "Best size" },
  { value: "image/png", label: "PNG", helper: "Lossless" },
  { value: "image/jpeg", label: "JPEG", helper: "Photos" },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load this image."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ImageOutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not export this image."));
      },
      format,
      format === "image/png" ? undefined : quality,
    );
  });
}

function estimateDataUrlBytes(value: string) {
  const [, payload = value] = value.split(",");
  return Math.max(1, Math.round((payload.length * 3) / 4));
}

function RangeControl({ label, value, min, max, step = 1, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="image-export-range">
      <span>{label}<strong>{value}{suffix}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function ImageExportWorkbench() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<ImageExportMode>("png-webp");
  const [settings, setSettings] = useState<ImageExportSettings>(modePresets["png-webp"]);
  const [imageSrc, setImageSrc] = useState(getSampleExportSvgDataUrl());
  const [fileName, setFileName] = useState("image-export-sample.svg");
  const [sourceType, setSourceType] = useState("SVG sample");
  const [originalBytes, setOriginalBytes] = useState(estimateDataUrlBytes(getSampleExportSvgDataUrl()));
  const [originalSize, setOriginalSize] = useState({ width: 1000, height: 700 });
  const [outputUrl, setOutputUrl] = useState("");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputSize, setOutputSize] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState("Sample image loaded. Choose a mode, tune settings, then download the result.");
  const [isProcessing, setIsProcessing] = useState(false);

  const activeMode = modes.find((item) => item.id === mode) ?? modes[0];
  const summary = useMemo(() => outputBlob ? buildImageExportSummary(originalBytes, outputBlob.size, outputSize.width, outputSize.height, settings.format) : "Output summary will appear after processing.", [originalBytes, outputBlob, outputSize.height, outputSize.width, settings.format]);
  const targetSize = useMemo(() => calculateTargetSize(originalSize.width, originalSize.height, settings), [originalSize.height, originalSize.width, settings]);

  function applyMode(nextMode: ImageExportMode) {
    setMode(nextMode);
    setSettings(modePresets[nextMode]);
    setStatus(`${modes.find((item) => item.id === nextMode)?.label ?? "Mode"} settings loaded.`);
  }

  function updateSettings(patch: Partial<ImageExportSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  async function processImage() {
    try {
      setIsProcessing(true);
      const image = await loadImage(imageSrc);
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      setOriginalSize({ width: naturalWidth, height: naturalHeight });
      const nextSize = calculateTargetSize(naturalWidth, naturalHeight, settings);

      const canvas = document.createElement("canvas");
      canvas.width = nextSize.width;
      canvas.height = nextSize.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not supported in this browser.");

      if (settings.fillBackground || settings.format === "image/jpeg") {
        context.fillStyle = normalizeHex(settings.backgroundColor);
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await canvasToBlob(canvas, settings.format, settings.quality);
      setOutputBlob(blob);
      setOutputSize({ width: canvas.width, height: canvas.height });
      setOutputUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      setStatus(`${labelForMime(settings.format)} ready: ${formatBytes(blob.size)} (${formatPercentChange(originalBytes, blob.size)}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not process this image.");
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    processImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, settings.format, settings.quality, settings.maxWidth, settings.maxHeight, settings.keepAspect, settings.fillBackground, settings.backgroundColor]);

  useEffect(() => () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
  }, [outputUrl]);

  function loadFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Please choose a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setFileName(file.name);
      setSourceType(file.type || "Image file");
      setOriginalBytes(file.size);
      setStatus(`${file.name} loaded locally.`);
    };
    reader.readAsDataURL(file);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    loadFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    loadFile(event.dataTransfer.files?.[0]);
  }

  function loadSample() {
    const sample = getSampleExportSvgDataUrl();
    setImageSrc(sample);
    setFileName("image-export-sample.svg");
    setSourceType("SVG sample");
    setOriginalBytes(estimateDataUrlBytes(sample));
    setStatus("Sample image loaded.");
  }

  function reset() {
    setSettings(modePresets[mode]);
    loadSample();
  }

  function downloadOutput() {
    if (!outputBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(outputBlob);
    link.download = outputFileName(fileName, settings);
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Download started.");
  }

  function copyDataUrl() {
    if (!outputBlob) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await navigator.clipboard?.writeText(String(reader.result));
      setStatus("Output data URL copied.");
    };
    reader.readAsDataURL(outputBlob);
  }

  return (
    <section className="image-export-workbench text-manipulation-workbench">
      <div className="tool-subtabs image-export-tabs" role="tablist" aria-label="Image conversion tools">
        {modes.map((item) => (
          <button key={item.id} type="button" className={mode === item.id ? "is-active" : ""} onClick={() => applyMode(item.id)}>{item.label}</button>
        ))}
      </div>

      <div className="image-export-hero">
        <div>
          <p className="section-kicker">Browser local image lab</p>
          <h2>{activeMode.title}</h2>
          <p>{activeMode.description} No upload leaves your device.</p>
        </div>
        <div className="image-export-actions">
          <button type="button" className="utility-btn" onClick={loadSample}><WandSparkles size={16} /> Sample</button>
          <button type="button" className="utility-btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload image</button>
          <button type="button" className="utility-btn" onClick={reset}><RotateCcw size={16} /> Reset</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileInput} />
        </div>
      </div>

      <div className="image-export-layout">
        <div className="image-export-controls">
          <div className="image-export-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
            <ImagePlus size={34} />
            <strong>Drop an image here or click to browse</strong>
            <span>PNG, JPG, WebP, GIF, SVG. Everything is processed with Canvas.</span>
          </div>

          <div className="image-export-control-card">
            <h3>Output format</h3>
            <div className="image-export-choice-grid">
              {formatChoices.map((choice) => (
                <button key={choice.value} type="button" className={settings.format === choice.value ? "is-selected" : ""} onClick={() => updateSettings({ format: choice.value })}>
                  <strong>{choice.label}</strong>
                  <span>{choice.helper}</span>
                </button>
              ))}
            </div>
            {settings.format !== "image/png" ? (
              <RangeControl label="Quality" value={Math.round(settings.quality * 100)} min={10} max={100} suffix="%" onChange={(value) => updateSettings({ quality: value / 100 })} />
            ) : <p className="image-export-note">PNG is lossless, so quality is handled by the encoder.</p>}
          </div>

          <div className="image-export-control-card">
            <h3>Resize</h3>
            <div className="image-export-fields">
              <label>Max width<input type="number" min={0} value={settings.maxWidth} onChange={(event) => updateSettings({ maxWidth: Math.max(0, Number(event.target.value) || 0) })} /></label>
              <label>Max height<input type="number" min={0} value={settings.maxHeight} onChange={(event) => updateSettings({ maxHeight: Math.max(0, Number(event.target.value) || 0) })} /></label>
            </div>
            <label className="image-export-check"><input type="checkbox" checked={settings.keepAspect} onChange={(event) => updateSettings({ keepAspect: event.target.checked })} /> Keep aspect ratio</label>
            <p className="image-export-note">Target: {targetSize.width} x {targetSize.height}</p>
          </div>

          <div className="image-export-control-card">
            <h3>Background</h3>
            <label className="image-export-check"><input type="checkbox" checked={settings.fillBackground} onChange={(event) => updateSettings({ fillBackground: event.target.checked })} /> Fill transparent pixels</label>
            <div className="image-export-color-row">
              <input type="color" value={normalizeHex(settings.backgroundColor)} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} />
              <input value={settings.backgroundColor} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} />
            </div>
            <p className="image-export-note">JPEG always uses the selected background color.</p>
          </div>
        </div>

        <div className="image-export-output">
          <div className="image-export-preview-grid">
            <div className="image-export-preview-card">
              <div className="image-export-card-head"><span>Original</span><small>{originalSize.width} x {originalSize.height}</small></div>
              <div className="image-export-preview-frame"><img src={imageSrc} alt="Original image preview" /></div>
              <div className="image-export-meta"><FileImage size={15} /> {fileName} <span>{sourceType}</span> <strong>{formatBytes(originalBytes)}</strong></div>
            </div>
            <div className="image-export-preview-card">
              <div className="image-export-card-head"><span>Result</span><small>{outputSize.width || targetSize.width} x {outputSize.height || targetSize.height}</small></div>
              <div className="image-export-preview-frame">{outputUrl ? <img src={outputUrl} alt="Converted image preview" /> : <span>Result appears here</span>}</div>
              <div className="image-export-meta"><FileImage size={15} /> {labelForMime(settings.format)} <span>{outputBlob ? formatPercentChange(originalBytes, outputBlob.size) : "Waiting"}</span> <strong>{outputBlob ? formatBytes(outputBlob.size) : "0 B"}</strong></div>
            </div>
          </div>

          <div className="image-export-result-actions">
            <button type="button" className="primary-action" onClick={processImage} disabled={isProcessing}><WandSparkles size={16} /> {isProcessing ? "Processing..." : "Process image"}</button>
            <button type="button" className="utility-btn" onClick={downloadOutput} disabled={!outputBlob}><Download size={16} /> Download result</button>
            <button type="button" className="utility-btn" onClick={copyDataUrl} disabled={!outputBlob}><Copy size={16} /> Copy data URL</button>
          </div>

          <div className="image-export-code-card">
            <div className="image-export-card-head"><span>Export summary</span><small>{status}</small></div>
            <pre>{summary}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
