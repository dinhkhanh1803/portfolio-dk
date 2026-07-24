"use client";

import { Copy, Download, ImagePlus, RotateCcw, Sparkles, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  buildImageEffectCss,
  buildImageEffectFilter,
  buildImageEffectOverlay,
  defaultImageEffectSettings,
  getSampleEffectsImageDataUrl,
  imageEffectPresets,
  normalizeImageEffectSettings,
  type ImageEffectPresetName,
  type ImageEffectSettings,
} from "./image-effects-engine";

const sampleImage = getSampleEffectsImageDataUrl();

const presetLabels: Array<{ key: ImageEffectPresetName; label: string; description: string }> = [
  { key: "natural", label: "Natural", description: "Clean original" },
  { key: "cinematic", label: "Cinematic", description: "Deep contrast + vignette" },
  { key: "vintage", label: "Vintage", description: "Sepia and soft grain" },
  { key: "noir", label: "Noir", description: "Black and white drama" },
  { key: "cyberpunk", label: "Cyberpunk", description: "High saturation neon" },
  { key: "warmGlow", label: "Warm Glow", description: "Soft warm highlights" },
  { key: "frost", label: "Frost", description: "Cool low contrast" },
  { key: "polaroid", label: "Polaroid", description: "Washed instant photo" },
  { key: "glitch", label: "Glitch", description: "Pixelate + noisy color" },
];

function EffectRange({ label, value, min, max, suffix = "", onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="image-effects-range">
      <span>{label}<strong>{value}{suffix}</strong></span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function ImageEffectsWorkbench() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState(sampleImage);
  const [fileName, setFileName] = useState("image-effects-sample.svg");
  const [settings, setSettings] = useState<ImageEffectSettings>(imageEffectPresets.cinematic);
  const [activePreset, setActivePreset] = useState<ImageEffectPresetName>("cinematic");
  const [status, setStatus] = useState("Sample image loaded. Pick a preset or tune each effect manually.");

  const filterCss = useMemo(() => buildImageEffectFilter(settings), [settings]);
  const overlay = useMemo(() => buildImageEffectOverlay(settings), [settings]);
  const generatedCss = useMemo(() => buildImageEffectCss(settings), [settings]);
  const normalized = useMemo(() => normalizeImageEffectSettings(settings), [settings]);

  function updateSetting(key: keyof ImageEffectSettings, value: number) {
    setSettings((current) => normalizeImageEffectSettings({ ...current, [key]: value }));
    setActivePreset("natural");
  }

  function applyPreset(key: ImageEffectPresetName) {
    setActivePreset(key);
    setSettings(imageEffectPresets[key]);
    setStatus(`${presetLabels.find((preset) => preset.key === key)?.label || key} preset applied.`);
  }

  function reset() {
    setSettings(defaultImageEffectSettings);
    setActivePreset("natural");
    setStatus("Effects reset.");
  }

  function loadSample() {
    setImageSrc(sampleImage);
    setFileName("image-effects-sample.svg");
    applyPreset("cinematic");
    setStatus("Sample image loaded.");
  }

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
      setStatus(`${file.name} loaded locally. No upload happened.`);
    };
    reader.readAsDataURL(file);
  }

  async function copyCss() {
    await navigator.clipboard?.writeText(generatedCss);
    setStatus("CSS copied to clipboard.");
  }

  function renderToCanvas() {
    const image = imageRef.current;
    if (!image) throw new Error("No image loaded.");
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || 1200;
    canvas.height = image.naturalHeight || 780;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported in this browser.");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.filter = filterCss;
    context.imageSmoothingEnabled = normalized.pixelate === 0;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (normalized.vignette > 0) {
      const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.18, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.68);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.78, normalized.vignette / 115)})`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (normalized.grain > 0) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const strength = normalized.grain / 100;
      for (let index = 0; index < imageData.data.length; index += 4 * 3) {
        const noise = (Math.random() - 0.5) * 52 * strength;
        imageData.data[index] = Math.max(0, Math.min(255, imageData.data[index] + noise));
        imageData.data[index + 1] = Math.max(0, Math.min(255, imageData.data[index + 1] + noise));
        imageData.data[index + 2] = Math.max(0, Math.min(255, imageData.data[index + 2] + noise));
      }
      context.putImageData(imageData, 0, 0);
    }

    return canvas;
  }

  function downloadImage() {
    try {
      const canvas = renderToCanvas();
      canvas.toBlob((blob) => {
        if (!blob) {
          setStatus("Could not export this image.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${fileName.replace(/\.[a-z0-9]+$/i, "") || "image"}-effects.png`;
        anchor.click();
        URL.revokeObjectURL(url);
        setStatus("Filtered PNG exported locally.");
      }, "image/png");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not export image.");
    }
  }

  return (
    <section className="image-effects-workbench text-manipulation-workbench">
      <div className="tool-subtabs image-effects-tabs" role="tablist" aria-label="Image effects sections">
        <button className="active" type="button"><WandSparkles size={15} /> Presets</button>
        <button type="button">Filters</button>
        <button type="button">Overlays</button>
        <button type="button">Export</button>
      </div>

      <div className="text-tool-heading-row">
        <div>
          <p className="eyebrow">Browser local effects lab</p>
          <h2>Image Effects</h2>
          <p className="muted">Apply creative filters, vignette, grain, pixelation, and export PNG or copy ready-to-use CSS without uploading your image.</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={loadSample}><Sparkles size={16} /> Load sample</button>
          <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload image</button>
          <button type="button" onClick={reset}><RotateCcw size={16} /> Reset</button>
        </div>
      </div>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" onChange={loadFile} />

      <div className="image-effects-layout">
        <div className="image-effects-controls text-tool-control-card">
          <button className="image-effects-dropzone" type="button" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={28} />
            <strong>Choose an image</strong>
            <span>PNG, JPG, WebP, SVG. Everything stays in your browser.</span>
          </button>

          <div className="image-effects-section">
            <h3>Effect presets</h3>
            <div className="image-effects-preset-grid">
              {presetLabels.map((preset) => (
                <button key={preset.key} className={activePreset === preset.key ? "active" : ""} type="button" onClick={() => applyPreset(preset.key)}>
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="image-effects-section">
            <h3>Filter controls</h3>
            <EffectRange label="Brightness" value={normalized.brightness} min={0} max={220} suffix="%" onChange={(value) => updateSetting("brightness", value)} />
            <EffectRange label="Contrast" value={normalized.contrast} min={0} max={260} suffix="%" onChange={(value) => updateSetting("contrast", value)} />
            <EffectRange label="Saturation" value={normalized.saturation} min={0} max={300} suffix="%" onChange={(value) => updateSetting("saturation", value)} />
            <EffectRange label="Hue" value={normalized.hueRotate} min={-360} max={360} suffix="°" onChange={(value) => updateSetting("hueRotate", value)} />
            <EffectRange label="Sepia" value={normalized.sepia} min={0} max={100} suffix="%" onChange={(value) => updateSetting("sepia", value)} />
            <EffectRange label="Grayscale" value={normalized.grayscale} min={0} max={100} suffix="%" onChange={(value) => updateSetting("grayscale", value)} />
            <EffectRange label="Blur" value={normalized.blur} min={0} max={24} suffix="px" onChange={(value) => updateSetting("blur", value)} />
          </div>

          <div className="image-effects-section">
            <h3>Texture overlays</h3>
            <EffectRange label="Vignette" value={normalized.vignette} min={0} max={100} suffix="%" onChange={(value) => updateSetting("vignette", value)} />
            <EffectRange label="Grain" value={normalized.grain} min={0} max={100} suffix="%" onChange={(value) => updateSetting("grain", value)} />
            <EffectRange label="Pixelate" value={normalized.pixelate} min={0} max={40} suffix="px" onChange={(value) => updateSetting("pixelate", value)} />
          </div>
        </div>

        <div className="image-effects-preview-card text-tool-panel">
          <div className="image-effects-preview-header">
            <div>
              <h3>Live preview</h3>
              <p className="muted small">{status}</p>
            </div>
            <div className="text-tool-actions compact">
              <button type="button" onClick={copyCss}><Copy size={16} /> Copy CSS</button>
              <button type="button" onClick={downloadImage}><Download size={16} /> Download image</button>
            </div>
          </div>

          <div className="image-effects-stage">
            <div className="image-effects-frame">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Image effects preview"
                style={{ filter: filterCss, imageRendering: normalized.pixelate > 0 ? "pixelated" : "auto" }}
              />
              <span className="image-effects-overlay" aria-hidden="true" style={{ background: overlay.background, opacity: overlay.opacity }} />
            </div>
          </div>

          <div className="image-effects-css-card">
            <div className="image-effects-css-head">
              <h3>Generated CSS</h3>
              <button type="button" onClick={copyCss}><Copy size={16} /> Copy CSS</button>
            </div>
            <pre>{generatedCss}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}