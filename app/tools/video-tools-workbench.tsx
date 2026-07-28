"use client";

import {
  Clock3,
  Copy,
  Download,
  Film,
  FileVideo2,
  Grid3X3,
  Image as ImageIcon,
  LoaderCircle,
  Play,
  RotateCcw,
  Scissors,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildFrameTimes,
  calculateAspectSize,
  createContactSheetLayout,
  encodeGif,
  normalizeTrimRange,
} from "./video-tools-engine";
import styles from "./video-tools-workbench.module.css";

const tabs = [
  { id: "trimmer", label: "Video Trimmer", icon: Scissors },
  { id: "gif", label: "GIF Maker", icon: Film },
  { id: "thumbnail", label: "Thumbnail Extractor", icon: ImageIcon },
] as const;

type TabId = (typeof tabs)[number]["id"];
type VideoMeta = {
  name: string;
  type: string;
  size: number;
  duration: number;
  width: number;
  height: number;
};
type CapturedFrame = { url: string; blob: Blob; time: number };

const emptyMeta: VideoMeta = {
  name: "No video loaded",
  type: "video/*",
  size: 0,
  duration: 0,
  width: 0,
  height: 0,
};

export default function VideoToolsWorkbench() {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<{ sourceUrl: string; outputUrl: string; frameUrls: string[] }>({
    sourceUrl: "",
    outputUrl: "",
    frameUrls: [],
  });  const [tab, setTab] = useState<TabId>("trimmer");
  const [sourceUrl, setSourceUrl] = useState("");
  const [meta, setMeta] = useState<VideoMeta>(emptyMeta);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [gifFps, setGifFps] = useState(8);
  const [gifWidth, setGifWidth] = useState(480);
  const [thumbnailCount, setThumbnailCount] = useState(6);
  const [thumbnailWidth, setThumbnailWidth] = useState(480);
  const [thumbnailFormat, setThumbnailFormat] = useState<"image/png" | "image/jpeg">("image/png");
  const [outputUrl, setOutputUrl] = useState("");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [status, setStatus] = useState("Upload a video or create the built-in demo clip to begin.");
  const [busy, setBusy] = useState(false);

  const range = useMemo(
    () => normalizeTrimRange(Math.max(meta.duration, 0.1), startSec, endSec || meta.duration || 0.1),
    [endSec, meta.duration, startSec],
  );
  const estimatedGifFrames = buildFrameTimes(range.startSec, range.endSec, gifFps, 120).length;

  useEffect(() => {
    cleanupRef.current = {
      sourceUrl,
      outputUrl,
      frameUrls: frames.map((frame) => frame.url),
    };
  }, [frames, outputUrl, sourceUrl]);

  useEffect(() => () => {
    const resources = cleanupRef.current;
    if (resources.sourceUrl) URL.revokeObjectURL(resources.sourceUrl);
    if (resources.outputUrl) URL.revokeObjectURL(resources.outputUrl);
    resources.frameUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const clearOutput = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    setOutputUrl("");
    setOutputBlob(null);
    setFrames([]);
  };

  const loadVideo = (blob: Blob, name: string) => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    clearOutput();
    setSourceUrl(URL.createObjectURL(blob));
    setMeta({ ...emptyMeta, name, type: blob.type || "video/webm", size: blob.size });
    setStartSec(0);
    setEndSec(0);
    setStatus(`${name} loaded locally. Reading video metadata…`);
  };

  const handleMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    setMeta((current) => ({
      ...current,
      duration,
      width: video.videoWidth,
      height: video.videoHeight,
    }));
    setEndSec(duration);
    setStatus(`Ready: ${formatDuration(duration)}, ${video.videoWidth} × ${video.videoHeight}.`);
  };

  const createDemoClip = async () => {
    if (!window.MediaRecorder) {
      setStatus("MediaRecorder is not supported in this browser. Upload a video instead.");
      return;
    }
    setBusy(true);
    setStatus("Rendering a 3-second 960 × 540 demo clip…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 540;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      const stream = canvas.captureStream(24);
      const recorder = createRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      });
      const started = performance.now();
      recorder.start(120);
      await new Promise<void>((resolve) => {
        const paint = (now: number) => {
          const progress = Math.min(1, (now - started) / 3000);
          drawDemoFrame(context, canvas, progress);
          if (progress < 1) requestAnimationFrame(paint);
          else resolve();
        };
        requestAnimationFrame(paint);
      });
      recorder.stop();
      const blob = await done;
      stream.getTracks().forEach((track) => track.stop());
      loadVideo(blob, "dk-video-demo.webm");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create the demo clip.");
    } finally {
      setBusy(false);
    }
  };

  const exportTrimmedVideo = async () => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    setBusy(true);
    clearOutput();
    setStatus("Rendering the selected video range to WebM…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 540;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      const stream = canvas.captureStream(30);
      const recorder = createRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      const finished = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      });
      await seekVideo(video, range.startSec);
      video.muted = true;
      await video.play();
      recorder.start(120);
      await new Promise<void>((resolve) => {
        const render = () => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (video.currentTime >= range.endSec || video.ended) resolve();
          else requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
      });
      video.pause();
      recorder.stop();
      const blob = await finished;
      stream.getTracks().forEach((track) => track.stop());
      publishOutput(blob);
      setStatus(`Trimmed WebM ready (${formatBytes(blob.size)}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not export this range.");
    } finally {
      setBusy(false);
    }
  };

  const createGif = async () => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    setBusy(true);
    clearOutput();
    setStatus("Sampling frames and encoding GIF locally…");
    try {
      const size = calculateAspectSize(video.videoWidth, video.videoHeight, gifWidth);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas is unavailable.");
      const times = buildFrameTimes(range.startSec, range.endSec, gifFps, 120);
      const gifFrames = [];
      for (const time of times) {
        await seekVideo(video, time);
        context.drawImage(video, 0, 0, size.width, size.height);
        gifFrames.push({
          rgba: context.getImageData(0, 0, size.width, size.height).data,
          delayCs: Math.max(2, Math.round(100 / gifFps)),
        });
      }
      const bytes = encodeGif({ width: size.width, height: size.height, frames: gifFrames });
      const blob = new Blob([bytes], { type: "image/gif" });
      publishOutput(blob);
      setStatus(`Animated GIF ready: ${times.length} frames, ${size.width} × ${size.height}, ${formatBytes(blob.size)}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not encode this GIF.");
    } finally {
      setBusy(false);
    }
  };

  const extractThumbnails = async () => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    setBusy(true);
    clearOutput();
    setStatus("Extracting thumbnails from the selected range…");
    try {
      const size = calculateAspectSize(video.videoWidth, video.videoHeight, thumbnailWidth);
      const count = Math.max(1, Math.min(12, thumbnailCount));
      const times = Array.from({ length: count }, (_, index) =>
        range.startSec + (range.durationSec * index) / Math.max(1, count - 1),
      );
      const nextFrames: CapturedFrame[] = [];
      for (const time of times) {
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        await seekVideo(video, time);
        context.drawImage(video, 0, 0, size.width, size.height);
        context.fillStyle = "rgba(4, 20, 28, .72)";
        context.fillRect(12, size.height - 42, 92, 28);
        context.fillStyle = "#fff";
        context.font = "600 14px system-ui";
        context.fillText(formatDuration(time), 24, size.height - 23);
        const blob = await canvasToBlob(canvas, thumbnailFormat, 0.9);
        nextFrames.push({ time, blob, url: URL.createObjectURL(blob) });
      }
      setFrames(nextFrames);
      const contactSheet = await buildContactSheet(nextFrames, size.width, size.height, thumbnailFormat);
      publishOutput(contactSheet);
      setStatus(`${count} thumbnails and a contact sheet are ready.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not extract thumbnails.");
    } finally {
      setBusy(false);
    }
  };

  const publishOutput = (blob: Blob) => {
    setOutputBlob(blob);
    setOutputUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(blob);
    });
  };

  const downloadOutput = () => {
    if (!outputUrl || !outputBlob) return;
    const extension = outputBlob.type === "image/gif" ? "gif" : outputBlob.type === "image/jpeg" ? "jpg" : outputBlob.type === "image/png" ? "png" : "webm";
    downloadUrl(outputUrl, `${baseName(meta.name)}-${tab}.${extension}`);
  };

  return (
    <section className={styles.workbench}>
      <nav className={styles.tabs} aria-label="Video tools">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={tab === item.id ? styles.active : ""} onClick={() => setTab(item.id)}>
              <Icon size={15} /> {item.label}
            </button>
          );
        })}
      </nav>

      <header className={styles.header}>
        <div>
          <span className={styles.kicker}><FileVideo2 size={14} /> Browser-local video studio</span>
          <h2>{tabs.find((item) => item.id === tab)?.label}</h2>
          <p>Trim clips, create real animated GIF files, and extract timestamped thumbnails without uploading media to a server.</p>
        </div>
        <div className={styles.toolbar}>
          <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload video</button>
          <button type="button" onClick={createDemoClip} disabled={busy}><WandSparkles size={16} /> Create demo clip</button>
          <button type="button" onClick={clearOutput}><RotateCcw size={16} /> Clear output</button>
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) loadVideo(file, file.name);
          }} />
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.controls}>
          <section className={styles.card}>
            <h3>Source video</h3>
            <div className={styles.fileSummary}>
              <FileVideo2 size={22} />
              <div><strong>{meta.name}</strong><span>{meta.width || "—"} × {meta.height || "—"} · {formatDuration(meta.duration)} · {formatBytes(meta.size)}</span></div>
            </div>
            <p className={styles.rawHint}>Demo raw data: 960 × 540 WebM, 3 seconds, 24 FPS, animated gradient + timestamp.</p>
          </section>

          <section className={styles.card}>
            <h3><Clock3 size={16} /> Timeline range</h3>
            <NumberRange label="Start" value={range.startSec} maximum={Math.max(meta.duration, 0.1)} onChange={setStartSec} />
            <NumberRange label="End" value={range.endSec} maximum={Math.max(meta.duration, 0.1)} onChange={setEndSec} />
            <div className={styles.rangeStats}><span>Selected</span><strong>{formatDuration(range.durationSec)}</strong></div>
          </section>

          {tab === "gif" && (
            <section className={styles.card}>
              <h3>GIF settings</h3>
              <NumberRange label="Frames / second" value={gifFps} minimum={2} maximum={15} step={1} onChange={setGifFps} />
              <label className={styles.field}>Output width<input type="number" min={160} max={960} value={gifWidth} onChange={(event) => setGifWidth(clampNumber(event.target.value, 160, 960))} /></label>
              <p className={styles.rawHint}>{estimatedGifFrames} sampled frames (safety limit: 120). A 256-color browser encoder keeps the result portable.</p>
            </section>
          )}

          {tab === "thumbnail" && (
            <section className={styles.card}>
              <h3>Thumbnail settings</h3>
              <NumberRange label="Frame count" value={thumbnailCount} minimum={1} maximum={12} step={1} onChange={setThumbnailCount} />
              <label className={styles.field}>Thumbnail width<input type="number" min={160} max={1280} value={thumbnailWidth} onChange={(event) => setThumbnailWidth(clampNumber(event.target.value, 160, 1280))} /></label>
              <div className={styles.segmented}>
                <button type="button" className={thumbnailFormat === "image/png" ? styles.selected : ""} onClick={() => setThumbnailFormat("image/png")}>PNG</button>
                <button type="button" className={thumbnailFormat === "image/jpeg" ? styles.selected : ""} onClick={() => setThumbnailFormat("image/jpeg")}>JPG</button>
              </div>
            </section>
          )}

          <button
            type="button"
            className={styles.primary}
            disabled={!sourceUrl || busy}
            onClick={tab === "trimmer" ? exportTrimmedVideo : tab === "gif" ? createGif : extractThumbnails}
          >
            {busy ? <LoaderCircle className={styles.spin} size={17} /> : tab === "trimmer" ? <Scissors size={17} /> : tab === "gif" ? <Film size={17} /> : <Grid3X3 size={17} />}
            {busy ? "Processing…" : tab === "trimmer" ? "Render selected clip" : tab === "gif" ? "Create animated GIF" : "Extract thumbnails"}
          </button>
        </aside>

        <div className={styles.stageColumn}>
          <section className={styles.previewCard}>
            <div className={styles.panelHeading}><h3>Live preview</h3><span>{sourceUrl ? `${formatDuration(range.startSec)} – ${formatDuration(range.endSec)}` : "Waiting for source"}</span></div>
            <div className={styles.videoFrame}>
              {sourceUrl ? (
                <video ref={videoRef} src={sourceUrl} controls playsInline onLoadedMetadata={handleMetadata} />
              ) : (
                <button type="button" className={styles.emptyState} onClick={createDemoClip}>
                  <Play size={28} /><strong>Create a sample or upload video</strong><span>The sample gives every tab usable input immediately.</span>
                </button>
              )}
            </div>
          </section>

          <section className={styles.outputCard}>
            <div className={styles.panelHeading}>
              <div><h3>Generated output</h3><p>{status}</p></div>
              <div className={styles.outputActions}>
                <button type="button" disabled={!outputUrl} onClick={downloadOutput}><Download size={15} /> Download</button>
                <button type="button" disabled={!outputUrl} onClick={() => outputUrl && navigator.clipboard?.writeText(outputUrl)}><Copy size={15} /> Copy blob URL</button>
              </div>
            </div>
            <div className={styles.outputPreview}>
              {!outputUrl && <div className={styles.outputPlaceholder}><Film size={25} /><span>Your rendered clip, GIF, or contact sheet appears here.</span></div>}
              {outputUrl && tab === "trimmer" && <video src={outputUrl} controls playsInline />}
              {outputUrl && tab !== "trimmer" && <img src={outputUrl} alt={tab === "gif" ? "Generated animated GIF" : "Generated thumbnail contact sheet"} />}
            </div>
          </section>

          {tab === "thumbnail" && frames.length > 0 && (
            <section className={styles.galleryCard}>
              <div className={styles.panelHeading}><h3>Individual frames</h3><span>{frames.length} files</span></div>
              <div className={styles.gallery}>
                {frames.map((frame, index) => (
                  <button type="button" key={frame.url} onClick={() => downloadUrl(frame.url, `${baseName(meta.name)}-${index + 1}.${thumbnailFormat === "image/png" ? "png" : "jpg"}`)}>
                    <img src={frame.url} alt={`Thumbnail at ${formatDuration(frame.time)}`} />
                    <span>{formatDuration(frame.time)} <Download size={13} /></span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function NumberRange({ label, value, minimum = 0, maximum, step = 0.05, onChange }: { label: string; value: number; minimum?: number; maximum: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className={styles.range}>
      <span>{label}<strong>{Number(value.toFixed(2))}</strong></span>
      <input type="range" min={minimum} max={maximum} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function createRecorder(stream: MediaStream) {
  const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  return new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
}

function drawDemoFrame(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) {
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${180 + progress * 90} 72% 42%)`);
  gradient.addColorStop(0.55, `hsl(${245 + progress * 50} 82% 58%)`);
  gradient.addColorStop(1, `hsl(${25 + progress * 80} 92% 62%)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const x = 130 + progress * 700;
  context.fillStyle = "rgba(255,255,255,.2)";
  context.beginPath();
  context.arc(x, 205 + Math.sin(progress * Math.PI * 4) * 70, 86, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff";
  context.font = "700 54px system-ui";
  context.fillText("DK Video Lab", 56, 82);
  context.font = "500 24px ui-monospace";
  context.fillText(`00:0${(progress * 3).toFixed(2)}`, 58, 485);
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < 0.015) {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The browser could not seek this video frame."));
    }, 5000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", complete);
      video.removeEventListener("error", fail);
    };
    const complete = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error("Could not decode the requested video frame."));
    };
    video.addEventListener("seeked", complete, { once: true });
    video.addEventListener("error", fail, { once: true });
    video.currentTime = Math.min(time, Math.max(0, video.duration - 0.001));
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode this image.")), type, quality);
  });
}

async function buildContactSheet(frames: CapturedFrame[], frameWidth: number, frameHeight: number, type: "image/png" | "image/jpeg") {
  const previewWidth = Math.min(320, frameWidth);
  const previewHeight = Math.round(frameHeight * previewWidth / frameWidth);
  const layout = createContactSheetLayout(frames.length, previewWidth, previewHeight, Math.min(3, frames.length), 12);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.fillStyle = "#07161c";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < frames.length; index += 1) {
    const image = await loadImage(frames[index].url);
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    context.drawImage(image, column * (previewWidth + 12), row * (previewHeight + 12), previewWidth, previewHeight);
  }
  return canvasToBlob(canvas, type, 0.9);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not assemble the contact sheet."));
    image.src = source;
  });
}

function downloadUrl(url: string, name: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00.00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "video";
}

function clampNumber(value: string, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Number(value) || minimum));
}
