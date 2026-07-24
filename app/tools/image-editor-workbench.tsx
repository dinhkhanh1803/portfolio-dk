"use client";

import { Copy, Download, ImagePlus, RotateCcw, RotateCw, Sparkles, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  buildEditedFilename,
  buildImageFilter,
  buildImageTransform,
  calculateResize,
  defaultImageFilters,
  defaultImageTransform,
  getMimeType,
  getSampleImageDataUrl,
  type ImageFilterSettings,
  type ImageFormat,
  type ImageSize,
  type ImageTransformSettings,
} from "./image-editor-engine";

const sampleUrl = getSampleImageDataUrl();

const formatOptions: Array<{ label: string; value: ImageFormat }> = [
  { label: "PNG", value: "png" },
  { label: "JPG", value: "jpg" },
  { label: "WebP", value: "webp" },
];

function ControlRange({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="image-editor-range">
      <span>
        {label}
        <strong>{value}{suffix}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function ImageEditorWorkbench() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageSrc, setImageSrc] = useState(sampleUrl);
  const [fileName, setFileName] = useState("dk-tools-sample.svg");
  const [originalSize, setOriginalSize] = useState<ImageSize>({ width: 1200, height: 800 });
  const [targetSize, setTargetSize] = useState<ImageSize>({ width: 1200, height: 800 });
  const [keepAspect, setKeepAspect] = useState(true);
  const [filters, setFilters] = useState<ImageFilterSettings>(defaultImageFilters);
  const [transform, setTransform] = useState<ImageTransformSettings>(defaultImageTransform);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState(92);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("Sample image is ready to edit.");

  const filterCss = useMemo(() => buildImageFilter(filters), [filters]);
  const transformCss = useMemo(() => buildImageTransform(transform), [transform]);
  const outputName = useMemo(() => buildEditedFilename(fileName, format), [fileName, format]);

  const updateFilter = (key: keyof ImageFilterSettings, value: number) => setFilters((current) => ({ ...current, [key]: value }));
  const updateTransform = (patch: Partial<ImageTransformSettings>) => setTransform((current) => ({ ...current, ...patch }));

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

  function loadSampleImage() {
    setImageSrc(sampleUrl);
    setFileName("dk-tools-sample.svg");
    setOriginalSize({ width: 1200, height: 800 });
    setTargetSize({ width: 1200, height: 800 });
    setStatus("Sample image is ready to edit.");
  }

  function resetEdits() {
    setFilters(defaultImageFilters);
    setTransform(defaultImageTransform);
    setTargetSize(originalSize);
    setKeepAspect(true);
    setFormat("png");
    setQuality(92);
    setStatus("Edits reset.");
  }

  function changeTargetWidth(width: number) {
    const next = calculateResize(originalSize, { width, keepAspect });
    setTargetSize(keepAspect ? next : { ...targetSize, width: Math.max(1, width || 1) });
  }

  function changeTargetHeight(height: number) {
    const next = calculateResize(originalSize, { height, keepAspect });
    setTargetSize(keepAspect ? next : { ...targetSize, height: Math.max(1, height || 1) });
  }

  async function copyFilterCss() {
    const css = `filter: ${filterCss};\ntransform: ${transformCss};`;
    await navigator.clipboard?.writeText(css);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function renderToCanvas() {
    const img = imageRef.current;
    if (!img) throw new Error("No image loaded");
    const rotate = ((transform.rotate % 360) + 360) % 360;
    const swap = rotate === 90 || rotate === 270;
    const canvas = document.createElement("canvas");
    canvas.width = swap ? targetSize.height : targetSize.width;
    canvas.height = swap ? targetSize.width : targetSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filterCss;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
    ctx.drawImage(img, -targetSize.width / 2, -targetSize.height / 2, targetSize.width, targetSize.height);
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
        anchor.download = outputName;
        anchor.click();
        URL.revokeObjectURL(url);
        setStatus(`${outputName} exported locally.`);
      }, getMimeType(format), quality / 100);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not export image.");
    }
  }

  return (
    <section className="image-editor-workbench text-manipulation-workbench">
      <div className="tool-subtabs image-editor-tabs" role="tablist" aria-label="Image editor sections">
        <button className="active" type="button">Resize</button>
        <button type="button">Adjust</button>
        <button type="button">Transform</button>
        <button type="button">Export</button>
      </div>

      <div className="text-tool-heading-row">
        <div>
          <p className="eyebrow">Browser local image lab</p>
          <h2>Image Editor</h2>
          <p className="muted">Upload, resize, adjust filters, rotate, flip, and export images locally in your browser.</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={loadSampleImage}><Sparkles size={16} /> Load sample image</button>
          <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload image</button>
          <button type="button" onClick={resetEdits}><RotateCcw size={16} /> Reset</button>
        </div>
      </div>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" onChange={loadFile} />

      <div className="image-editor-layout">
        <div className="image-editor-controls text-tool-control-card">
          <div className="image-editor-dropzone" onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
            <ImagePlus size={28} />
            <strong>Drop or choose an image</strong>
            <span>PNG, JPG, WebP, SVG. Nothing is uploaded.</span>
          </div>

          <div className="image-editor-control-section">
            <h3>Resize</h3>
            <div className="image-editor-size-grid">
              <label>Width <input value={targetSize.width} type="number" min={1} onChange={(event) => changeTargetWidth(Number(event.target.value))} /></label>
              <label>Height <input value={targetSize.height} type="number" min={1} onChange={(event) => changeTargetHeight(Number(event.target.value))} /></label>
            </div>
            <label className="image-editor-check"><input type="checkbox" checked={keepAspect} onChange={(event) => setKeepAspect(event.target.checked)} /> Keep aspect ratio</label>
            <p className="muted small">Original: {originalSize.width} × {originalSize.height}px</p>
          </div>

          <div className="image-editor-control-section">
            <h3>Adjust</h3>
            <ControlRange label="Brightness" value={filters.brightness} min={0} max={250} suffix="%" onChange={(value) => updateFilter("brightness", value)} />
            <ControlRange label="Contrast" value={filters.contrast} min={0} max={250} suffix="%" onChange={(value) => updateFilter("contrast", value)} />
            <ControlRange label="Saturation" value={filters.saturation} min={0} max={300} suffix="%" onChange={(value) => updateFilter("saturation", value)} />
            <ControlRange label="Blur" value={filters.blur} min={0} max={24} suffix="px" onChange={(value) => updateFilter("blur", value)} />
          </div>

          <div className="image-editor-control-section">
            <h3>Transform</h3>
            <div className="image-editor-button-grid">
              <button type="button" onClick={() => updateTransform({ rotate: transform.rotate - 90 })}><RotateCcw size={16} /> Rotate left</button>
              <button type="button" onClick={() => updateTransform({ rotate: transform.rotate + 90 })}><RotateCw size={16} /> Rotate right</button>
              <button type="button" className={transform.flipX ? "active" : ""} onClick={() => updateTransform({ flipX: !transform.flipX })}>Flip X</button>
              <button type="button" className={transform.flipY ? "active" : ""} onClick={() => updateTransform({ flipY: !transform.flipY })}>Flip Y</button>
            </div>
          </div>
        </div>

        <div className="image-editor-preview-card text-tool-panel">
          <div className="image-editor-preview-header">
            <div>
              <h3>Live preview</h3>
              <p className="muted small">{status}</p>
            </div>
            <div className="text-tool-actions compact">
              <button type="button" onClick={copyFilterCss}><Copy size={16} /> {copied ? "Copied" : "Copy filter CSS"}</button>
              <button type="button" onClick={downloadImage}><Download size={16} /> Download image</button>
            </div>
          </div>

          <div className="image-editor-stage">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Editable preview"
              style={{ filter: filterCss, transform: transformCss }}
              onLoad={(event) => {
                const next = { width: event.currentTarget.naturalWidth || 1200, height: event.currentTarget.naturalHeight || 800 };
                setOriginalSize(next);
                setTargetSize((current) => current.width === 1200 && current.height === 800 ? next : current);
              }}
            />
          </div>

          <div className="image-editor-export-row">
            <label>Format
              <select value={format} onChange={(event) => setFormat(event.target.value as ImageFormat)}>
                {formatOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </label>
            <ControlRange label="Quality" value={quality} min={10} max={100} suffix="%" onChange={setQuality} />
          </div>

          <pre className="image-editor-css-output">{`filter: ${filterCss};\ntransform: ${transformCss};\nwidth: ${targetSize.width}px;\nheight: ${targetSize.height}px;`}</pre>
        </div>
      </div>
    </section>
  );
}