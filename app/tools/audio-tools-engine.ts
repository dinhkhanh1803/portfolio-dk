export type AudioChannelData = Float32Array[];

export type AudioSummary = {
  durationSec: number;
  sampleRate: number;
  channels: number;
  frameCount: number;
  peak: number;
  peakDb: number;
  rms: number;
  rmsDb: number;
  crestFactor: number;
  wavBytes: number;
};

export type WaveformBucket = { min: number; max: number; rms: number };

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, seconds || 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);
  return `${minutes}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function dbToGain(db: number) {
  return 10 ** (db / 20);
}

export function gainToDb(gain: number) {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain);
}

export function analyzeChannels(channels: AudioChannelData, sampleRate: number): AudioSummary {
  const frameCount = channels[0]?.length ?? 0;
  let peak = 0;
  let sumSquares = 0;
  let sampleCount = 0;

  for (const channel of channels) {
    for (let i = 0; i < channel.length; i += 1) {
      const abs = Math.abs(channel[i] ?? 0);
      peak = Math.max(peak, abs);
      sumSquares += abs * abs;
      sampleCount += 1;
    }
  }

  const rms = sampleCount ? Math.sqrt(sumSquares / sampleCount) : 0;
  return {
    durationSec: sampleRate ? frameCount / sampleRate : 0,
    sampleRate,
    channels: channels.length,
    frameCount,
    peak,
    peakDb: gainToDb(peak),
    rms,
    rmsDb: gainToDb(rms),
    crestFactor: rms ? peak / rms : 0,
    wavBytes: 44 + frameCount * Math.max(1, channels.length) * 2,
  };
}

export function buildWaveformPeaks(channels: AudioChannelData, bucketCount = 96): WaveformBucket[] {
  const mono = mixToMono(channels);
  if (!mono.length || bucketCount <= 0) return [];
  const buckets: WaveformBucket[] = [];
  const bucketSize = Math.max(1, Math.ceil(mono.length / bucketCount));

  for (let start = 0; start < mono.length; start += bucketSize) {
    let min = 1;
    let max = -1;
    let sumSquares = 0;
    const end = Math.min(mono.length, start + bucketSize);
    for (let i = start; i < end; i += 1) {
      const value = mono[i] ?? 0;
      min = Math.min(min, value);
      max = Math.max(max, value);
      sumSquares += value * value;
    }
    buckets.push({ min, max, rms: Math.sqrt(sumSquares / Math.max(1, end - start)) });
  }
  return buckets;
}

export function mixToMono(channels: AudioChannelData) {
  const frameCount = channels[0]?.length ?? 0;
  const mono = new Float32Array(frameCount);
  if (!frameCount || !channels.length) return mono;
  for (let i = 0; i < frameCount; i += 1) {
    let sum = 0;
    for (const channel of channels) sum += channel[i] ?? 0;
    mono[i] = sum / channels.length;
  }
  return mono;
}

export function trimChannels(channels: AudioChannelData, sampleRate: number, startSec: number, endSec: number) {
  const frameCount = channels[0]?.length ?? 0;
  const start = clamp(Math.floor(startSec * sampleRate), 0, frameCount);
  const end = clamp(Math.floor(endSec * sampleRate), start, frameCount);
  return channels.map((channel) => channel.slice(start, end));
}

export function applyFade(channels: AudioChannelData, sampleRate: number, fadeInSec: number, fadeOutSec: number) {
  const frameCount = channels[0]?.length ?? 0;
  const fadeIn = clamp(Math.floor(fadeInSec * sampleRate), 0, frameCount);
  const fadeOut = clamp(Math.floor(fadeOutSec * sampleRate), 0, frameCount);
  return channels.map((channel) => {
    const next = new Float32Array(channel);
    for (let i = 0; i < fadeIn; i += 1) next[i] *= i / Math.max(1, fadeIn);
    for (let i = 0; i < fadeOut; i += 1) {
      const index = frameCount - 1 - i;
      if (index >= 0) next[index] *= i / Math.max(1, fadeOut);
    }
    return next;
  });
}

export function normalizeChannels(channels: AudioChannelData, targetDb = -1) {
  const peak = analyzeChannels(channels, 44100).peak;
  if (!peak) return { channels: channels.map((channel) => new Float32Array(channel)), gain: 1 };
  const gain = dbToGain(targetDb) / peak;
  return {
    gain,
    channels: channels.map((channel) => {
      const next = new Float32Array(channel.length);
      for (let i = 0; i < channel.length; i += 1) next[i] = clamp((channel[i] ?? 0) * gain, -1, 1);
      return next;
    }),
  };
}

export function encodeWavBytes(channels: AudioChannelData, sampleRate: number) {
  const channelCount = Math.max(1, channels.length);
  const frameCount = channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < frameCount; i += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const value = clamp(channels[channelIndex]?.[i] ?? 0, -1, 1);
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  }
  return new Uint8Array(buffer);
}

export function buildAudioCommands(fileName: string, startSec: number, endSec: number, fadeInSec: number, fadeOutSec: number, normalize: boolean) {
  const input = quoteShell(fileName || "input.wav");
  const duration = Math.max(0, endSec - startSec);
  const filters = [fadeInSec > 0 ? `afade=t=in:st=0:d=${round(fadeInSec)}` : "", fadeOutSec > 0 ? `afade=t=out:st=${round(Math.max(0, duration - fadeOutSec))}:d=${round(fadeOutSec)}` : "", normalize ? "loudnorm=I=-16:TP=-1.5:LRA=11" : ""].filter(Boolean).join(",");
  const trim = `-ss ${round(startSec)} -t ${round(duration)}`;
  const filter = filters ? ` -af ${quoteShell(filters)}` : "";
  return {
    wav: `ffmpeg -i ${input} ${trim}${filter} output.wav`,
    mp3: `ffmpeg -i ${input} ${trim}${filter} -codec:a libmp3lame -b:a 192k output.mp3`,
    ogg: `ffmpeg -i ${input} ${trim}${filter} -codec:a libopus -b:a 128k output.ogg`,
  };
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

function quoteShell(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function round(value: number) {
  return Number(value.toFixed(3));
}
