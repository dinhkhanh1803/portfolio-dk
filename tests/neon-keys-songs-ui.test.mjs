import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Neon Keys renders song selection, preview, and per-song records", async () => {
  const [game, styles] = await Promise.all([
    read("app/playground/neon-keys/neon-keys-song-game.tsx"),
    read("app/playground/neon-keys/neon-keys-song.module.css"),
  ]);
  assert.match(game, /PIANO_SONGS\.map/);
  assert.match(game, /previewSong/);
  assert.match(game, /\.difficulty/);
  assert.match(game, /createPianoRun\(selectedSongId\)/);
  assert.match(game, /dk-neon-keys-best-v2/);
  assert.match(styles, /\.songPicker/);
  assert.match(styles, /\.songCard/);
  assert.match(styles, /\.selectedSong/);
});
