export type GifFrame = {
  rgba: Uint8ClampedArray;
  delayCs: number;
};

export type GifOptions = {
  width: number;
  height: number;
  frames: GifFrame[];
  loop?: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

export function normalizeTrimRange(
  duration: number,
  start: number,
  end: number,
  minimumDuration = 0.1,
) {
  const safeDuration = Math.max(minimumDuration, Number.isFinite(duration) ? duration : minimumDuration);
  const startSec = clamp(start, 0, safeDuration);
  const requestedEnd = clamp(end, 0, safeDuration);
  const endSec = Math.min(safeDuration, Math.max(requestedEnd, startSec + minimumDuration));
  return {
    startSec: Number(startSec.toFixed(3)),
    endSec: Number(endSec.toFixed(3)),
    durationSec: Number((endSec - startSec).toFixed(3)),
  };
}

export function buildFrameTimes(
  start: number,
  end: number,
  framesPerSecond: number,
  maximumFrames = 180,
) {
  const safeStart = Math.max(0, Number.isFinite(start) ? start : 0);
  const safeEnd = Math.max(safeStart, Number.isFinite(end) ? end : safeStart);
  const fps = clamp(framesPerSecond, 1, 30);
  const step = 1 / fps;
  const times: number[] = [];
  for (let time = safeStart; time <= safeEnd + 1e-7 && times.length < maximumFrames; time += step) {
    times.push(Number(Math.min(time, safeEnd).toFixed(4)));
  }
  if (times.length < maximumFrames && times.at(-1) !== safeEnd) {
    times.push(Number(safeEnd.toFixed(4)));
  }
  return times;
}

export function calculateAspectSize(sourceWidth: number, sourceHeight: number, targetWidth: number) {
  const width = Math.max(1, Math.round(targetWidth));
  const ratio = sourceWidth > 0 && sourceHeight > 0 ? sourceHeight / sourceWidth : 9 / 16;
  return { width, height: Math.max(1, Math.round(width * ratio)) };
}

export function createContactSheetLayout(
  frameCount: number,
  thumbnailWidth: number,
  thumbnailHeight: number,
  requestedColumns = 3,
  gap = 12,
) {
  const columns = Math.max(1, Math.min(Math.ceil(Math.max(1, frameCount)), Math.round(requestedColumns)));
  const rows = Math.max(1, Math.ceil(frameCount / columns));
  return {
    columns,
    rows,
    width: columns * thumbnailWidth + Math.max(0, columns - 1) * gap,
    height: rows * thumbnailHeight + Math.max(0, rows - 1) * gap,
  };
}

function writeWord(target: number[], value: number) {
  target.push(value & 0xff, (value >> 8) & 0xff);
}

function buildPalette() {
  const palette: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    const red = ((index >> 5) & 0x07) * 255 / 7;
    const green = ((index >> 2) & 0x07) * 255 / 7;
    const blue = (index & 0x03) * 255 / 3;
    palette.push(Math.round(red), Math.round(green), Math.round(blue));
  }
  return palette;
}

function rgbaToPaletteIndices(rgba: Uint8ClampedArray, pixelCount: number) {
  const indices = new Uint8Array(pixelCount);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4;
    indices[pixel] =
      ((rgba[offset] >> 5) << 5) |
      ((rgba[offset + 1] >> 5) << 2) |
      (rgba[offset + 2] >> 6);
  }
  return indices;
}

function encodeLzw(indices: Uint8Array) {
  const minimumCodeSize = 8;
  const clearCode = 1 << minimumCodeSize;
  const endCode = clearCode + 1;
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  let codeSize = minimumCodeSize + 1;
  let nextCode = endCode + 1;
  let dictionary = new Map<string, number>();

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 0xff);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  };

  const reset = () => {
    dictionary = new Map();
    codeSize = minimumCodeSize + 1;
    nextCode = endCode + 1;
  };

  emit(clearCode);
  if (indices.length) {
    let prefix = indices[0];
    for (let offset = 1; offset < indices.length; offset += 1) {
      const suffix = indices[offset];
      const key = `${prefix}:${suffix}`;
      const known = dictionary.get(key);
      if (known !== undefined) {
        prefix = known;
        continue;
      }

      emit(prefix);
      if (nextCode < 4096) {
        dictionary.set(key, nextCode);
        nextCode += 1;
        if (nextCode === 1 << codeSize && codeSize < 12) codeSize += 1;
      } else {
        emit(clearCode);
        reset();
      }
      prefix = suffix;
    }
    emit(prefix);
  }
  emit(endCode);
  if (bitCount > 0) bytes.push(bitBuffer & 0xff);

  const blocks: number[] = [minimumCodeSize];
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const block = bytes.slice(offset, offset + 255);
    blocks.push(block.length, ...block);
  }
  blocks.push(0);
  return blocks;
}

export function encodeGif({ width, height, frames, loop = 0 }: GifOptions) {
  const safeWidth = clamp(Math.round(width), 1, 65535);
  const safeHeight = clamp(Math.round(height), 1, 65535);
  if (!frames.length) throw new Error("At least one frame is required.");
  const expectedLength = safeWidth * safeHeight * 4;
  if (frames.some((frame) => frame.rgba.length !== expectedLength)) {
    throw new Error("Every GIF frame must match the requested dimensions.");
  }

  const output = [...new TextEncoder().encode("GIF89a")];
  writeWord(output, safeWidth);
  writeWord(output, safeHeight);
  output.push(0xf7, 0, 0, ...buildPalette());

  output.push(0x21, 0xff, 0x0b, ...new TextEncoder().encode("NETSCAPE2.0"), 0x03, 0x01);
  writeWord(output, clamp(Math.round(loop), 0, 65535));
  output.push(0);

  for (const frame of frames) {
    output.push(0x21, 0xf9, 0x04, 0x00);
    writeWord(output, clamp(Math.round(frame.delayCs), 1, 65535));
    output.push(0, 0);
    output.push(0x2c);
    writeWord(output, 0);
    writeWord(output, 0);
    writeWord(output, safeWidth);
    writeWord(output, safeHeight);
    output.push(0);
    output.push(...encodeLzw(rgbaToPaletteIndices(frame.rgba, safeWidth * safeHeight)));
  }
  output.push(0x3b);
  return new Uint8Array(output);
}
