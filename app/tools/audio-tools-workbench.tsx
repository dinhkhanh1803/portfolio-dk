"use client";

import { Copy, Download, FileAudio, Gauge, Music2, RotateCcw, Scissors, SlidersHorizontal, Upload, WandSparkles, Waves } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  analyzeChannels,
  buildAudioCommands,
  buildWaveformPeaks,
  encodeWavBytes,
  formatDuration,
  applyFade,
  normalizeChannels,
  trimChannels,
  type AudioChannelData,
} from "./audio-tools-engine";

type LoadedAudio = {
  name: string;
  sampleRate: number;
  channels: AudioChannelData;
  sourceUrl?: string;
};

const tabs = [
  { id: "trimmer", label: "Audio Trimmer", icon: Scissors },
  { id: "waveform", label: "Waveform", icon: Waves },
  { id: "converter", label: "Format Converter", icon: FileAudio },
] as const;

type AudioTab = (typeof tabs)[number]["id"];

export default function AudioToolsWorkbench() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<AudioTab>("trimmer");
  const [audio, setAudio] = useState<LoadedAudio>(() => createDemoAudio());
  const [startSec, setStartSec] = useState(0.25);
  const [endSec, setEndSec] = useState(3.5);
  const [fadeInSec, setFadeInSec] = useState(0.08);
  const [fadeOutSec, setFadeOutSec] = useState(0.16);
  const [shouldNormalize, setShouldNormalize] = useState(true);
  const [targetDb, setTargetDb] = useState(-1);
  const [processedUrl, setProcessedUrl] = useState("");
  const [notice, setNotice] = useState("Demo tone loaded. Upload an audio file or process this sample.");

  const summary = useMemo(() => analyzeChannels(audio.channels, audio.sampleRate), [audio]);
  const safeEnd = Math.min(endSec || summary.durationSec, summary.durationSec);
  const waveform = useMemo(() => buildWaveformPeaks(audio.channels, 110), [audio]);
  const processedChannels = useMemo(() => {
    let channels = trimChannels(audio.channels, audio.sampleRate, startSec, safeEnd);
    channels = applyFade(channels, audio.sampleRate, fadeInSec, fadeOutSec);
    if (shouldNormalize) channels = normalizeChannels(channels, targetDb).channels;
    return channels;
  }, [audio, startSec, safeEnd, fadeInSec, fadeOutSec, shouldNormalize, targetDb]);
  const processedSummary = useMemo(() => analyzeChannels(processedChannels, audio.sampleRate), [processedChannels, audio.sampleRate]);
  const commands = useMemo(() => buildAudioCommands(audio.name, startSec, safeEnd, fadeInSec, fadeOutSec, shouldNormalize), [audio.name, startSec, safeEnd, fadeInSec, fadeOutSec, shouldNormalize]);

  const loadDemo = () => {
    revoke(processedUrl);
    revoke(audio.sourceUrl);
    const demo = createDemoAudio();
    setAudio(demo);
    setStartSec(0.25);
    setEndSec(3.5);
    setFadeInSec(0.08);
    setFadeOutSec(0.16);
    setProcessedUrl("");
    setNotice("Demo tone loaded with stereo sine waves, fade-ready edges, and known raw audio data.");
  };

  const loadFile = async (file: File) => {
    try {
      const context = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
      const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) => new Float32Array(decoded.getChannelData(index)));
      revoke(processedUrl);
      revoke(audio.sourceUrl);
      setAudio({ name: file.name, sampleRate: decoded.sampleRate, channels, sourceUrl: URL.createObjectURL(file) });
      setStartSec(0);
      setEndSec(decoded.duration);
      setProcessedUrl("");
      setNotice(`Loaded ${file.name}. All analysis and WAV rendering stays in your browser.`);
      await context.close();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not decode this audio file in the browser.");
    }
  };

  const processWav = () => {
    const bytes = encodeWavBytes(processedChannels, audio.sampleRate);
    revoke(processedUrl);
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    setProcessedUrl(url);
    setNotice(`Rendered ${formatBytes(bytes.byteLength)} WAV locally. Ready to preview or download.`);
  };

  const downloadWav = () => {
    const bytes = encodeWavBytes(processedChannels, audio.sampleRate);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${baseName(audio.name)}-processed.wav`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
  };

  const copyText = async (value: string, message = "Copied.") => {
    await navigator.clipboard?.writeText(value);
    setNotice(message);
  };

  return (
    <section className="audio-tools-workbench text-manipulation-workbench">
      <div className="tool-subtabs audio-tools-tabs" role="tablist" aria-label="Audio tools">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}><Icon size={15} />{tab.label}</button>;
        })}
      </div>

      <header className="audio-tools-header">
        <span><Music2 size={15} /> Browser audio lab</span>
        <h2>{activeTab === "waveform" ? "Waveform Analyzer" : activeTab === "converter" ? "Audio Format Converter" : "Audio Trimmer"}</h2>
        <p>Upload audio, inspect waveform data, trim, fade, normalize, and export a ready WAV file without sending media to a server.</p>
      </header>

      <div className="audio-tools-toolbar">
        <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload audio</button>
        <button type="button" onClick={loadDemo}><WandSparkles size={16} /> Load demo tone</button>
        <button type="button" onClick={() => copyText(JSON.stringify(summary, null, 2), "Audio stats copied as JSON.")}><Copy size={16} /> Copy stats</button>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(event) => event.target.files?.[0] && loadFile(event.target.files[0])} />
      </div>

      <div className="audio-tools-layout">
        <aside className="audio-tools-controls text-tool-control-card">
          <div className="audio-tools-file-card">
            <FileAudio size={22} />
            <div><strong>{audio.name}</strong><span>{formatDuration(summary.durationSec)} · {summary.channels} ch · {summary.sampleRate.toLocaleString()} Hz</span></div>
          </div>

          <StatsGrid summary={summary} />

          {activeTab !== "waveform" && <div className="audio-tools-panel">
            <h3><Scissors size={16} /> Trim range</h3>
            <NumberField label="Start" value={startSec} min={0} max={summary.durationSec} step={0.01} suffix="s" onChange={setStartSec} />
            <NumberField label="End" value={safeEnd} min={startSec} max={summary.durationSec} step={0.01} suffix="s" onChange={setEndSec} />
            <p className="audio-tools-help">Raw demo range: start at 0.25s, end at 3.50s. For uploads, drag the values around the speech/music section you want to keep.</p>
          </div>}

          {activeTab !== "waveform" && <div className="audio-tools-panel">
            <h3><SlidersHorizontal size={16} /> Processing</h3>
            <NumberField label="Fade in" value={fadeInSec} min={0} max={3} step={0.01} suffix="s" onChange={setFadeInSec} />
            <NumberField label="Fade out" value={fadeOutSec} min={0} max={3} step={0.01} suffix="s" onChange={setFadeOutSec} />
            <label className="audio-tools-check"><input type="checkbox" checked={shouldNormalize} onChange={(event) => setShouldNormalize(event.target.checked)} /> Normalize peak</label>
            <NumberField label="Target peak" value={targetDb} min={-12} max={0} step={0.5} suffix="dB" onChange={setTargetDb} />
          </div>}

          <div className="audio-tools-actions">
            <button type="button" onClick={processWav}><Gauge size={16} /> Process WAV</button>
            <button type="button" onClick={downloadWav}><Download size={16} /> Download WAV</button>
            <button type="button" onClick={loadDemo}><RotateCcw size={16} /> Reset</button>
          </div>
        </aside>

        <main className="audio-tools-output text-tool-panel">
          <div className="audio-tools-preview-card">
            <div className="audio-tools-preview-head"><h3>Waveform preview</h3><span>{waveform.length} buckets · output {formatDuration(processedSummary.durationSec)}</span></div>
            <WaveformSvg buckets={waveform} />
            <div className="audio-tools-audio-row">
              {audio.sourceUrl ? <audio controls src={audio.sourceUrl} /> : <span>Demo tone is generated in memory. Click Process WAV to preview the rendered file.</span>}
              {processedUrl && <audio controls src={processedUrl} />}
            </div>
          </div>

          {activeTab === "waveform" && <div className="audio-tools-panel audio-tools-wide-panel">
            <h3>Analysis details</h3>
            <div className="audio-tools-analysis-grid">
              <Metric label="Duration" value={formatDuration(summary.durationSec)} />
              <Metric label="Frames" value={summary.frameCount.toLocaleString()} />
              <Metric label="Peak" value={`${summary.peak.toFixed(3)} (${formatDb(summary.peakDb)})`} />
              <Metric label="RMS" value={`${summary.rms.toFixed(3)} (${formatDb(summary.rmsDb)})`} />
              <Metric label="Crest factor" value={summary.crestFactor.toFixed(2)} />
              <Metric label="WAV size" value={formatBytes(summary.wavBytes)} />
            </div>
          </div>}

          {activeTab === "converter" && <div className="audio-tools-panel audio-tools-wide-panel">
            <div className="audio-tools-code-head"><h3>Format conversion commands</h3><button type="button" onClick={() => copyText(Object.values(commands).join("\n"), "FFmpeg commands copied.")}><Copy size={15} /> Copy all</button></div>
            <pre>{commands.wav}</pre>
            <pre>{commands.mp3}</pre>
            <pre>{commands.ogg}</pre>
            <p className="audio-tools-help">Browsers can reliably render WAV locally. MP3/OGG/AAC encoding usually needs FFmpeg, so this tool generates production-ready commands for those formats.</p>
          </div>}

          {activeTab === "trimmer" && <div className="audio-tools-panel audio-tools-wide-panel">
            <div className="audio-tools-code-head"><h3>Processed output</h3><button type="button" onClick={() => copyText(commands.wav, "WAV command copied.")}><Copy size={15} /> Copy command</button></div>
            <div className="audio-tools-analysis-grid">
              <Metric label="Output duration" value={formatDuration(processedSummary.durationSec)} />
              <Metric label="Output peak" value={formatDb(processedSummary.peakDb)} />
              <Metric label="Output size" value={formatBytes(processedSummary.wavBytes)} />
            </div>
          </div>}

          <p className="audio-tools-notice">{notice}</p>
        </main>
      </div>
    </section>
  );
}

function NumberField({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="audio-tools-number"><span>{label}<b>{value.toFixed(step < 0.1 ? 2 : 1)}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><input type="number" min={min} max={max} step={step} value={Number(value.toFixed(3))} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function StatsGrid({ summary }: { summary: ReturnType<typeof analyzeChannels> }) {
  return <div className="audio-tools-stats"><Metric label="Duration" value={formatDuration(summary.durationSec)} /><Metric label="Peak" value={formatDb(summary.peakDb)} /><Metric label="RMS" value={formatDb(summary.rmsDb)} /><Metric label="Size" value={formatBytes(summary.wavBytes)} /></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="audio-tools-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function WaveformSvg({ buckets }: { buckets: Array<{ min: number; max: number; rms: number }> }) {
  const width = Math.max(1, buckets.length) * 5;
  return <svg className="audio-tools-waveform" viewBox={`0 0 ${width} 120`} preserveAspectRatio="none" role="img" aria-label="Audio waveform">
    <line x1="0" y1="60" x2={width} y2="60" />
    {buckets.map((bucket, index) => {
      const top = 60 - Math.max(Math.abs(bucket.max), bucket.rms) * 54;
      const bottom = 60 + Math.max(Math.abs(bucket.min), bucket.rms) * 54;
      return <rect key={index} x={index * 5 + 1} y={top} width="3" height={Math.max(2, bottom - top)} rx="1.5" />;
    })}
  </svg>;
}

function createDemoAudio(): LoadedAudio {
  const sampleRate = 44100;
  const durationSec = 4;
  const frames = sampleRate * durationSec;
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t / 0.25, (durationSec - t) / 0.35);
    left[i] = Math.sin(2 * Math.PI * 220 * t) * 0.42 * envelope;
    right[i] = Math.sin(2 * Math.PI * 330 * t) * 0.32 * envelope;
  }
  return { name: "dk-tools-demo-tone.wav", sampleRate, channels: [left, right] };
}

function formatDb(db: number) {
  return Number.isFinite(db) ? `${db.toFixed(1)} dB` : "-∞ dB";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function baseName(name: string) {
  return (name || "audio").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "audio";
}

function revoke(url?: string) {
  if (url) URL.revokeObjectURL(url);
}
