import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  buildFrameTimes,
  calculateAspectSize,
  createContactSheetLayout,
  encodeGif,
  normalizeTrimRange,
} from "../app/tools/video-tools-engine.ts";

test("video engine normalizes trim ranges and frame sampling", () => {
  assert.deepEqual(normalizeTrimRange(12, -2, 30), {
    startSec: 0,
    endSec: 12,
    durationSec: 12,
  });
  assert.deepEqual(normalizeTrimRange(12, 8, 4), {
    startSec: 8,
    endSec: 8.1,
    durationSec: 0.1,
  });

  assert.deepEqual(buildFrameTimes(1, 2, 4), [1, 1.25, 1.5, 1.75, 2]);
  assert.equal(buildFrameTimes(0, 60, 30, 120).length, 120);
});

test("video engine preserves aspect ratio and builds contact sheets", () => {
  assert.deepEqual(calculateAspectSize(1920, 1080, 640), {
    width: 640,
    height: 360,
  });
  assert.deepEqual(createContactSheetLayout(7, 320, 180, 3, 12), {
    columns: 3,
    rows: 3,
    width: 984,
    height: 564,
  });
});

test("GIF encoder creates a multi-frame GIF89a file", () => {
  const red = new Uint8ClampedArray([
    255, 0, 0, 255,
    255, 0, 0, 255,
    255, 0, 0, 255,
    255, 0, 0, 255,
  ]);
  const blue = new Uint8ClampedArray([
    0, 0, 255, 255,
    0, 0, 255, 255,
    0, 0, 255, 255,
    0, 0, 255, 255,
  ]);
  const bytes = encodeGif({
    width: 2,
    height: 2,
    frames: [
      { rgba: red, delayCs: 8 },
      { rgba: blue, delayCs: 8 },
    ],
  });

  assert.equal(new TextDecoder().decode(bytes.slice(0, 6)), "GIF89a");
  assert.deepEqual(Array.from(bytes.slice(6, 10)), [2, 0, 2, 0]);
  assert.equal(bytes.at(-1), 0x3b);
  assert.equal(bytes.filter((value) => value === 0x2c).length, 2);
});

test("video tools are integrated through a scoped, responsive workbench", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const workbench = readFileSync(resolve("app/tools/video-tools-workbench.tsx"), "utf8");
  const styles = readFileSync(resolve("app/tools/video-tools-workbench.module.css"), "utf8");

  assert.match(page, /import VideoToolsWorkbench from "\.\/video-tools-workbench"/);
  assert.match(page, /activeCollection\.id === "video-tools" \? <VideoToolsWorkbench \/>/);
  assert.match(workbench, /Video Trimmer/);
  assert.match(workbench, /GIF Maker/);
  assert.match(workbench, /Thumbnail Extractor/);
  assert.match(workbench, /Create demo clip/);
  assert.match(styles, /grid-template-columns/);
  assert.match(styles, /@media \(max-width: 900px\)/);
});
