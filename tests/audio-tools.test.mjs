import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  analyzeChannels,
  applyFade,
  buildAudioCommands,
  buildWaveformPeaks,
  encodeWavBytes,
  formatDuration,
  normalizeChannels,
  trimChannels,
} from "../app/tools/audio-tools-engine.ts";

test("audio engine analyzes, trims, fades, normalizes, and encodes WAV locally", () => {
  const channel = new Float32Array([0, 0.5, -1, 0.25]);
  const summary = analyzeChannels([channel], 4);

  assert.equal(formatDuration(65.4321), "1:05.432");
  assert.equal(summary.durationSec, 1);
  assert.equal(summary.channels, 1);
  assert.equal(summary.peak, 1);
  assert.equal(summary.frameCount, 4);

  const buckets = buildWaveformPeaks([channel], 2);
  assert.equal(buckets.length, 2);
  assert.ok(buckets[0].max > 0);

  const trimmed = trimChannels([channel], 4, 0.25, 0.75);
  assert.deepEqual(Array.from(trimmed[0]), [0.5, -1]);

  const faded = applyFade([new Float32Array([1, 1, 1, 1])], 4, 0.5, 0.5);
  assert.equal(faded[0][0], 0);
  assert.equal(faded[0][3], 0);

  const normalized = normalizeChannels([new Float32Array([0.25, -0.25])], -6).channels[0];
  assert.ok(Math.abs(Math.max(...Array.from(normalized).map(Math.abs)) - 0.501) < 0.01);

  const wav = encodeWavBytes([channel], 4);
  assert.equal(new TextDecoder().decode(wav.slice(0, 4)), "RIFF");
  assert.equal(new TextDecoder().decode(wav.slice(8, 12)), "WAVE");
});

test("audio tools are wired to the tools page with scoped CSS", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const workbench = readFileSync(resolve("app/tools/audio-tools-workbench.tsx"), "utf8");
  const styles = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(page, /import AudioToolsWorkbench from "\.\/audio-tools-workbench"/);
  assert.match(page, /activeCollection\.id === "audio-tools" \? <AudioToolsWorkbench \/>/);
  assert.match(workbench, /Audio Trimmer/);
  assert.match(workbench, /Waveform Analyzer/);
  assert.match(workbench, /Format conversion commands/);
  assert.match(styles, /\.audio-tools-workbench/);
  assert.match(styles, /\.audio-tools-layout\{display:grid/);
});

test("audio conversion commands include practical ffmpeg targets", () => {
  const commands = buildAudioCommands("voice memo.wav", 1, 8, 0.1, 0.2, true);
  assert.match(commands.wav, /ffmpeg -i "voice memo\.wav"/);
  assert.match(commands.wav, /-ss 1 -t 7/);
  assert.match(commands.mp3, /libmp3lame/);
  assert.match(commands.ogg, /libopus/);
});


