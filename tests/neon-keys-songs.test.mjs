import assert from "node:assert/strict";
import test from "node:test";
import {
  PIANO_SONGS,
  getPianoSong,
  songDurationMs,
} from "../app/playground/neon-keys/neon-keys-songs.ts";
import {
  createPianoRun,
  startPianoRun,
  tickPianoRun,
} from "../app/playground/neon-keys/neon-keys-engine.ts";

test("ships six valid authored piano songs", () => {
  assert.equal(PIANO_SONGS.length, 6);
  for (const song of PIANO_SONGS) {
    assert.ok(song.id && song.title && song.composer);
    assert.ok(["easy", "normal", "hard"].includes(song.difficulty));
    assert.ok(song.bpm >= 80 && song.bpm <= 160);
    assert.ok(song.chart.length >= 16);
    assert.ok(song.chart.every((note, index) =>
      note.key >= 0 && note.key < 12 &&
      note.beat >= 0 &&
      (index === 0 || note.beat >= song.chart[index - 1].beat)));
    assert.ok(songDurationMs(song) > 5_000);
  }
  assert.equal(getPianoSong("missing").id, "ode-to-joy");
});

test("creates a run for the selected song", () => {
  const run = createPianoRun("jingle-bells");
  assert.equal(run.songId, "jingle-bells");
  assert.equal(run.remainingMs, songDurationMs(getPianoSong("jingle-bells")));
  assert.equal(run.chartIndex, 0);
});

test("different songs expose different authored charts", () => {
  assert.notDeepEqual(
    getPianoSong("ode-to-joy").chart.map((note) => note.key),
    getPianoSong("jingle-bells").chart.map((note) => note.key),
  );
});

test("spawns authored notes by beat and completes after the chart", () => {
  let run = startPianoRun(createPianoRun("ode-to-joy"));
  run = tickPianoRun(run, 2_000);
  assert.deepEqual(run.notes.slice(0, 3).map((note) => note.key), [4, 4, 5]);
  assert.ok(run.chartIndex >= 3);
  assert.ok(run.notes[0].progress > run.notes[1].progress);
  assert.ok(run.notes[1].progress > run.notes[2].progress);
  run = tickPianoRun({ ...run, lives: 99 }, run.remainingMs);
  assert.equal(run.phase, "complete");
});
