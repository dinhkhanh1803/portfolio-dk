import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildImageExportSummary,
  calculateTargetSize,
  extensionForMime,
  formatBytes,
  formatPercentChange,
  getSampleExportSvgDataUrl,
  labelForMime,
  normalizeHex,
  outputFileName,
} from "../app/tools/image-export-engine.ts";

test("image export engine formats bytes, deltas, and file names", () => {
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatPercentChange(1000, 700), "-30%");
  assert.equal(formatPercentChange(1000, 1250), "+25%");
  assert.equal(extensionForMime("image/webp"), "webp");
  assert.equal(labelForMime("image/jpeg"), "JPEG");
  assert.equal(outputFileName("Hero Image.PNG", { mode: "png-webp", format: "image/webp" }), "Hero-Image-converted.webp");
  assert.equal(outputFileName("photo.jpg", { mode: "compress", format: "image/jpeg" }), "photo-compressed.jpg");
});

test("image export engine calculates target dimensions safely", () => {
  assert.deepEqual(calculateTargetSize(4000, 2000, { maxWidth: 1600, maxHeight: 1000, keepAspect: true }), { width: 1600, height: 800, scale: 0.4 });
  assert.deepEqual(calculateTargetSize(4000, 2000, { maxWidth: 1200, maxHeight: 900, keepAspect: false }), { width: 1200, height: 900, scale: 0.3 });
  assert.deepEqual(calculateTargetSize(640, 360, { maxWidth: 0, maxHeight: 0, keepAspect: true }), { width: 640, height: 360, scale: 1 });
});

test("image export engine normalizes colors and sample assets", () => {
  assert.equal(normalizeHex("abc"), "#aabbcc");
  assert.equal(normalizeHex("bad-value"), "#ffffff");
  assert.ok(getSampleExportSvgDataUrl().startsWith("data:image/svg+xml;charset=utf-8,"));
  assert.match(buildImageExportSummary(2000, 1000, 800, 600, "image/webp"), /Format: WebP/);
  assert.match(buildImageExportSummary(2000, 1000, 800, 600, "image/webp"), /Dimensions: 800/);
});

test("image export workbench is registered and styled", () => {
  const page = readFileSync("app/tools/page.tsx", "utf8");
  const workbench = readFileSync("app/tools/image-export-workbench.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");

  assert.match(page, /ImageExportWorkbench/);
  assert.match(page, /activeCollection\.id === "image-export"/);
  assert.match(workbench, /PNG to WebP/);
  assert.match(workbench, /JPG to PNG/);
  assert.match(workbench, /Image Compressor/);
  assert.match(workbench, /Download result/);
  assert.match(css, /\.image-export-workbench/);
  assert.match(css, /\.image-export-layout/);
});
