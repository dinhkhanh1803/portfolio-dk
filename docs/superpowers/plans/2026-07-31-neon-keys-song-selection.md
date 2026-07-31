# Neon Keys Song Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six selectable public-domain songs with authored falling-note charts, song metadata, preview audio, per-song records, and chart-driven completion to Neon Keys.

**Architecture:** A new `neon-keys-songs.ts` owns immutable song metadata and chart validation. The existing pure engine consumes a song definition and advances an authored chart using elapsed milliseconds. The React game renders song cards, handles preview audio, and resets the run when selection changes.

**Tech Stack:** TypeScript, React 19, Next.js App Router, CSS Modules, Web Audio API, Node test runner.

---

### Task 1: Song catalog and validation

**Files:**
- Create: `app/playground/neon-keys/neon-keys-songs.ts`
- Modify: `tests/neon-keys-engine.test.mjs`

- [ ] **Step 1: Write the failing catalog test**

Add imports for `PIANO_SONGS`, `getPianoSong`, and `songDurationMs`, then assert:

```js
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
```

- [ ] **Step 2: Run test to verify RED**

Run: `node tests/neon-keys-engine.test.mjs`
Expected: FAIL because `neon-keys-songs.ts` does not exist.

- [ ] **Step 3: Implement the catalog**

Create these exported types and functions:

```ts
export type SongDifficulty = "easy" | "normal" | "hard";
export type SongNote = { beat: number; key: number };
export type PianoSong = {
  id: string; title: string; composer: string;
  difficulty: SongDifficulty; bpm: number; chart: SongNote[];
};
const melody = (keys: number[]) => keys.map((key, beat) => ({ beat, key }));
export const PIANO_SONGS: readonly PianoSong[] = [
  { id: "ode-to-joy", title: "Ode to Joy", composer: "L. van Beethoven",
    difficulty: "easy", bpm: 96,
    chart: melody([4,4,5,7,7,5,4,2,0,0,2,4,4,2,2,4,4,5,7,7,5,4,2,0,0,2,4,2,0,0]) },
  { id: "twinkle", title: "Twinkle Twinkle Little Star", composer: "Traditional",
    difficulty: "easy", bpm: 90,
    chart: melody([0,0,7,7,9,9,7,5,5,4,4,2,2,0,7,7,5,5,4,4,2]) },
  { id: "happy-birthday", title: "Happy Birthday", composer: "Traditional",
    difficulty: "normal", bpm: 108,
    chart: melody([0,0,2,0,5,4,0,0,2,0,7,5,0,0,12-1,9,5,4,2,10,10,9,5,7,5]) },
  { id: "jingle-bells", title: "Jingle Bells", composer: "James Lord Pierpont",
    difficulty: "normal", bpm: 120,
    chart: melody([4,4,4,4,4,4,4,7,0,2,4,5,5,5,5,5,4,4,4,4,2,2,4,2,7]) },
  { id: "fur-elise", title: "Für Elise", composer: "L. van Beethoven",
    difficulty: "hard", bpm: 132,
    chart: melody([11,10,11,10,11,7,10,9,5,0,4,5,7,0,4,7,9,4,8,9,11,4,11,10,11,10,11,7]) },
  { id: "turkish-march", title: "Turkish March", composer: "W. A. Mozart",
    difficulty: "hard", bpm: 144,
    chart: melody([9,8,6,5,4,5,6,8,9,11,9,8,6,5,4,2,4,5,6,8,6,5,4,2,0,2,4,5]) },
export const getPianoSong = (id?: string) =>
  PIANO_SONGS.find((song) => song.id === id) ?? PIANO_SONGS[0];
export const songDurationMs = (song: PianoSong) =>
  Math.ceil((song.chart.at(-1)!.beat + 6) * 60_000 / song.bpm);
```

The six complete charts use chromatic key indexes `0..11` and non-decreasing beat positions for Ode to Joy, Twinkle Twinkle, Happy Birthday, Jingle Bells, Für Elise, and Turkish March.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node tests/neon-keys-engine.test.mjs`
Expected: all catalog and existing engine tests pass.

### Task 2: Chart-driven rhythm engine

**Files:**
- Modify: `app/playground/neon-keys/neon-keys-engine.ts`
- Modify: `tests/neon-keys-engine.test.mjs`

- [ ] **Step 1: Write failing chart behavior tests**

```js
test("creates a run for the selected song", () => {
  const run = createPianoRun("jingle-bells");
  assert.equal(run.songId, "jingle-bells");
  assert.equal(run.remainingMs, songDurationMs(getPianoSong("jingle-bells")));
  assert.equal(run.chartIndex, 0);
});

test("spawns authored notes by beat and completes after the chart", () => {
  let run = startPianoRun(createPianoRun("ode-to-joy"));
  run = tickPianoRun(run, 2_000);
  assert.deepEqual(run.notes.map((note) => note.key), [4, 4, 5]);
  assert.ok(run.chartIndex >= 3);
  run = tickPianoRun({ ...run, lives: 99 }, run.remainingMs);
  assert.equal(run.phase, "complete");
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `node tests/neon-keys-engine.test.mjs`
Expected: FAIL because runs do not contain `songId` or `chartIndex`.

- [ ] **Step 3: Implement minimal chart scheduling**

Change `PianoRun` to include:

```ts
songId: string;
elapsedMs: number;
chartIndex: number;
```

Change `createPianoRun(songId = "ode-to-joy")` to use `getPianoSong` and `songDurationMs`. In `tickPianoRun`, compute note event time with:

```ts
const eventMs = note.beat * 60_000 / song.bpm;
const travelMs = 2_400;
while (chartIndex < song.chart.length &&
       song.chart[chartIndex].beat * 60_000 / song.bpm <= elapsedMs + travelMs) {
  notes.push({ id: nextId++, key: song.chart[chartIndex].key, progress: 0 });
  chartIndex += 1;
}
```

Advance note progress by `dt / travelMs`, count misses as before, and complete only when `chartIndex === song.chart.length`, `notes.length === 0`, and elapsed time reaches the song duration.

- [ ] **Step 4: Run engine tests to verify GREEN**

Run: `node tests/neon-keys-engine.test.mjs`
Expected: all engine tests pass.

### Task 3: Song selector, preview, and per-song best

**Files:**
- Modify: `app/playground/neon-keys/neon-keys-game.tsx`
- Modify: `app/playground/neon-keys/neon-keys.module.css`
- Modify: `tests/neon-keys-ui.test.mjs`

- [ ] **Step 1: Write failing UI contract tests**

```js
assert.match(game, /PIANO_SONGS\.map/);
assert.match(game, /previewSong/);
assert.match(game, /song\.difficulty/);
assert.match(game, /createPianoRun\(selectedSongId\)/);
assert.match(game, /dk-neon-keys-best-v2/);
assert.match(styles, /\.songPicker/);
assert.match(styles, /\.songCard/);
```

- [ ] **Step 2: Run test to verify RED**

Run: `node tests/neon-keys-ui.test.mjs`
Expected: FAIL because the selector and preview are absent.

- [ ] **Step 3: Implement selector and preview**

Import the song catalog. Add `selectedSongId`, render six song buttons in Challenge mode, and display title, composer, difficulty, BPM, and formatted duration. Selecting a card calls:

```ts
setSelectedSongId(song.id);
setGame(createPianoRun(song.id));
```

Add a preview button that schedules the first eight notes with `window.setTimeout`, using the existing `tone` callback. Cancel preview timers when selecting another song or unmounting.

Store best scores as a JSON object under `dk-neon-keys-best-v2`:

```ts
type BestMap = Record<string, number>;
const best = Math.max(bestScores[selectedSongId] ?? 0, game.score);
```

Update responsive CSS so song cards scroll horizontally on small screens, preserve readable light/dark contrast, and expose a clear selected state.

- [ ] **Step 4: Run UI tests and lint**

Run: `node tests/neon-keys-ui.test.mjs`
Expected: both UI tests pass.

Run: `npx eslint app/playground/neon-keys`
Expected: no errors.

### Task 4: Verification and demo refresh

**Files:**
- Modify: none unless verification finds a defect

- [ ] **Step 1: Run targeted verification**

Run:

```powershell
node tests\neon-keys-engine.test.mjs
node tests\neon-keys-ui.test.mjs
npx eslint app/playground/neon-keys app/playground/page.tsx
npx tsc --noEmit
```

Expected: all commands pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: build succeeds and `/playground/neon-keys` is statically generated.

- [ ] **Step 3: Browser smoke test**

Open `http://localhost:3018/playground/neon-keys`, verify six song cards, choose Jingle Bells, start the run, confirm authored notes appear, preview produces no popup, Free Play still works, and light/dark switching updates the page.

- [ ] **Step 4: Commit**

```powershell
git add app/playground/neon-keys tests/neon-keys-engine.test.mjs tests/neon-keys-ui.test.mjs docs/superpowers/plans/2026-07-31-neon-keys-song-selection.md
git commit -m "feat(games): add songs to Neon Keys"
```
