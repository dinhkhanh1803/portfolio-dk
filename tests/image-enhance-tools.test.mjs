import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildSharpenKernel,
  downloadFileName,
  scaleDimensions,
} from '../app/tools/image-enhance-engine.ts';

test('scaleDimensions preserves aspect ratio and rounds dimensions', () => {
  assert.deepEqual(scaleDimensions(641, 479, 2), { width: 1282, height: 958, pixels: 1228156 });
  assert.deepEqual(scaleDimensions(320, 180, 1.5), { width: 480, height: 270, pixels: 129600 });
});

test('buildSharpenKernel creates a normalized cross kernel', () => {
  assert.deepEqual(buildSharpenKernel(0), [0, 0, 0, 0, 1, 0, 0, 0, 0]);
  assert.deepEqual(buildSharpenKernel(0.5), [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0]);
});

test('downloadFileName keeps the source name and appends mode suffix', () => {
  assert.equal(downloadFileName('hero.photo.jpg', 'background-cleanup'), 'hero.photo-background-cleanup.png');
  assert.equal(downloadFileName('', 'upscale'), 'enhanced-image-upscale.png');
});

test('page routes Image Enhance & Style to its dedicated workbench', async () => {
  const page = await readFile(new URL('../app/tools/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /import ImageEnhanceWorkbench from "\.\/image-enhance-workbench"/);
  assert.match(page, /activeCollection\.id === "image-enhance" \? <ImageEnhanceWorkbench \/>/);
});
