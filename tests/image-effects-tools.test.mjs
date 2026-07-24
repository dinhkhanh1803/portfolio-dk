import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  buildImageEffectCss,
  buildImageEffectFilter,
  buildImageEffectOverlay,
  getSampleEffectsImageDataUrl,
  imageEffectPresets,
  normalizeImageEffectSettings,
} from "../app/tools/image-effects-engine.ts";

test("image effects engine clamps values and builds usable CSS filters", () => {
  const normalized = normalizeImageEffectSettings({ brightness: 999, contrast: -10, hueRotate: 720, grain: 999 });

  assert.equal(normalized.brightness, 220);
  assert.equal(normalized.contrast, 0);
  assert.equal(normalized.hueRotate, 360);
  assert.equal(normalized.grain, 100);

  const filter = buildImageEffectFilter(imageEffectPresets.vintage);
  assert.match(filter, /brightness\(105%\)/);
  assert.match(filter, /contrast\(92%\)/);
  assert.match(filter, /sepia\(42%\)/);
  assert.match(filter, /blur\(0px\)/);

  const overlay = buildImageEffectOverlay({ vignette: 60, grain: 18 });
  assert.match(overlay.background, /radial-gradient/);
  assert.ok(overlay.opacity > 0);

  const css = buildImageEffectCss(imageEffectPresets.cinematic);
  assert.match(css, /\.image-effect/);
  assert.match(css, /filter:/);
  assert.match(css, /\.image-effect::after/);
});

test("image effects sample is an inline image data url", () => {
  const sample = getSampleEffectsImageDataUrl();
  assert.match(sample, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.match(decodeURIComponent(sample), /Image Effects Sample/);
});

test("image effects workbench is routed and exposes practical controls", async () => {
  const [page, workbench, css] = await Promise.all([
    readFile(new URL("../app/tools/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tools/image-effects-workbench.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /ImageEffectsWorkbench/);
  assert.match(page, /activeCollection\.id === "image-effects"/);

  for (const label of [
    "Image Effects",
    "Cinematic",
    "Vintage",
    "Noir",
    "Cyberpunk",
    "Vignette",
    "Grain",
    "Pixelate",
    "Copy CSS",
    "Download image",
  ]) {
    assert.match(workbench, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(css, /\.image-effects-workbench/);
  assert.match(css, /\.image-effects-layout/);
  assert.match(css, /@media \(max-width: 920px\)/);
});