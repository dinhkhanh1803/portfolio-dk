import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync("app/tools/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

async function loadEngine() {
  return await import("../app/tools/image-editor-engine.ts");
}

test("Image Editor is routed from tools page", () => {
  assert.match(page, /import ImageEditorWorkbench from "\.\/image-editor-workbench"/);
  assert.match(page, /activeCollection\.id === "image-editor" \? <ImageEditorWorkbench \/>/);
});

test("image editor engine builds filters, transforms, and resize sizes", async () => {
  const engine = await loadEngine();
  assert.equal(
    engine.buildImageFilter({ brightness: 120, contrast: 80, saturation: 135, blur: 2 }),
    "brightness(120%) contrast(80%) saturate(135%) blur(2px)",
  );
  assert.equal(
    engine.buildImageTransform({ rotate: 90, flipX: true, flipY: false }),
    "rotate(90deg) scaleX(-1) scaleY(1)",
  );
  assert.deepEqual(
    engine.calculateResize({ width: 1200, height: 800 }, { width: 600, keepAspect: true }),
    { width: 600, height: 400 },
  );
  assert.equal(engine.getMimeType("jpg"), "image/jpeg");
});

test("Image Editor workbench has practical image editing controls", () => {
  const workbench = readFileSync("app/tools/image-editor-workbench.tsx", "utf8");
  for (const text of [
    "Load sample image",
    "Download image",
    "Copy filter CSS",
    "Resize",
    "Adjust",
    "Transform",
    "Export",
  ]) {
    assert.ok(workbench.includes(text), `missing ${text}`);
  }
  assert.match(workbench, /className="image-editor-workbench/);
  assert.match(workbench, /canvas\.toBlob/);
});

test("Image Editor CSS prevents cutoff and matches existing tool card style", () => {
  for (const selector of [
    ".image-editor-workbench",
    ".image-editor-layout",
    ".image-editor-preview-card",
    ".image-editor-dropzone",
    ".image-editor-stage",
  ]) {
    assert.ok(css.includes(selector), `missing ${selector}`);
  }
  assert.match(css, /\.image-editor-layout\s*\{[\s\S]*grid-template-columns: minmax\(280px, 0\.9fr\) minmax\(320px, 1\.2fr\)/);
  assert.match(css, /\.image-editor-tabs\s*\{[\s\S]*flex-wrap: wrap/);
});