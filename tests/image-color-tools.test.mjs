import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildPaletteCss,
  buildTintsAndShades,
  contrastRatio,
  extractPaletteFromPixels,
  hexToRgb,
  nearestCssColor,
  rgbToHex,
  rgbToHsl,
} from "../app/tools/image-color-engine.ts";

test("converts color formats and calculates accessible contrast", () => {
  assert.deepEqual(hexToRgb("#3b82f6"), { r: 59, g: 130, b: 246 });
  assert.equal(rgbToHex({ r: 59, g: 130, b: 246 }), "#3b82f6");
  assert.deepEqual(rgbToHsl({ r: 59, g: 130, b: 246 }), { h: 217, s: 91, l: 60 });
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
});

test("extracts a stable palette from sampled image pixels", () => {
  const palette = extractPaletteFromPixels([
    { r: 59, g: 130, b: 246 },
    { r: 58, g: 131, b: 245 },
    { r: 236, g: 72, b: 153 },
    { r: 16, g: 185, b: 129 },
    { r: 16, g: 185, b: 129 },
  ], 3);

  assert.equal(palette.length, 3);
  assert.equal(palette[0], "#10b981");
  assert.ok(palette.includes("#3b82f6"));
  assert.match(buildPaletteCss(palette), /--image-color-1: #10b981;/);
});

test("builds tint and shade ramps plus nearest CSS color metadata", () => {
  const ramp = buildTintsAndShades("#3b82f6", 4);
  assert.equal(ramp.tints.length, 4);
  assert.equal(ramp.shades.length, 4);
  assert.equal(ramp.base, "#3b82f6");
  assert.equal(nearestCssColor("#6495ed").name, "cornflowerblue");
});

test("image color workbench is routed and exposes picker, palette, duotone, and tint tools", () => {
  const page = readFileSync("app/tools/page.tsx", "utf8");
  const workbench = readFileSync("app/tools/image-color-workbench.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");

  assert.match(page, /import ImageColorWorkbench from "\.\/image-color-workbench";/);
  assert.match(page, /activeCollection\.id === "image-color" \? <ImageColorWorkbench \/>/);

  for (const label of ["Color Picker", "Palette", "Duotone", "Tint & Shade", "Load sample image", "Copy palette"]) {
    assert.ok(workbench.includes(label), `missing ${label}`);
  }
  assert.match(workbench, /getImageData/);
  assert.match(css, /\.image-color-workbench/);
  assert.match(css, /\.image-color-layout/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.image-color-layout/);
});
