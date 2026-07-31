# Neon Fleet Battleship Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the eighth playable portfolio game as a responsive, accessible classic Battleship match against three deterministic AI difficulties.

**Architecture:** Keep rules and AI as pure TypeScript modules, with browser-only concerns isolated in small storage, audio, and React adapters. Render both 10×10 boards as semantic button grids so mouse, touch, and keyboard share one interaction model; React timers handle presentation delays only and never own game rules.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Lucide icons, Web Audio API, localStorage, Node test runner, ESLint.

---

## File Map

- Create `app/playground/neon-fleet/neon-fleet-data.ts`: board, fleet, difficulty, coordinate, and state types.
- Create `app/playground/neon-fleet/neon-fleet-engine.ts`: placement, auto-placement, shot resolution, turns, and terminal states.
- Create `app/playground/neon-fleet/neon-fleet-ai.ts`: Easy, Normal, and Hard legal target selection.
- Create `app/playground/neon-fleet/neon-fleet-storage.ts`: versioned match statistics and mute preference.
- Create `app/playground/neon-fleet/neon-fleet-audio.ts`: lazy Web Audio cues.
- Create `app/playground/neon-fleet/neon-fleet-game.tsx`: setup and combat UI orchestration.
- Create `app/playground/neon-fleet/neon-fleet.module.css`: responsive light/dark naval console.
- Create `app/playground/neon-fleet/page.tsx`: route metadata and game mount.
- Modify `app/playground/page.tsx`: eighth game card and `fleet` visual.
- Modify `app/playground/playground.module.css`: fleet card illustration.
- Create `tests/neon-fleet-data.test.mjs`: board/fleet contracts.
- Create `tests/neon-fleet-engine.test.mjs`: placement and combat rules.
- Create `tests/neon-fleet-ai.test.mjs`: AI legality and strategy.
- Create `tests/neon-fleet-ui.test.mjs`: UI, storage, audio, route, and hub contracts.

### Task 1: Board and Fleet Domain

**Files:**
- Create: `app/playground/neon-fleet/neon-fleet-data.ts`
- Create: `tests/neon-fleet-data.test.mjs`

- [ ] **Step 1: Write the failing domain test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { BOARD_SIZE, FLEET, DIFFICULTIES, cellKey, parseCellKey } from "../app/playground/neon-fleet/neon-fleet-data.ts";

test("defines the classic 10x10 fleet and three difficulties", () => {
  assert.equal(BOARD_SIZE, 10);
  assert.deepEqual(FLEET.map((ship) => ship.length), [5, 4, 3, 3, 2]);
  assert.deepEqual(Object.keys(DIFFICULTIES), ["easy", "normal", "hard"]);
});

test("cell keys round-trip", () => {
  assert.equal(cellKey({ x: 6, y: 1 }), "6:1");
  assert.deepEqual(parseCellKey("6:1"), { x: 6, y: 1 });
});
```

- [ ] **Step 2: Run the domain test and confirm RED**

Run: `node tests/neon-fleet-data.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `neon-fleet-data.ts`.

- [ ] **Step 3: Implement domain constants and types**

```ts
export const BOARD_SIZE = 10;
export type Cell = { x: number; y: number };
export type Orientation = "horizontal" | "vertical";
export type Difficulty = "easy" | "normal" | "hard";
export type MatchPhase = "setup" | "playerTurn" | "aiTurn" | "victory" | "defeat";
export type ShotResult = "miss" | "hit" | "sunk";
export type ShipId = "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer";
export type ShipDefinition = { id: ShipId; name: string; length: number };
export type PlacedShip = ShipDefinition & { orientation: Orientation; cells: Cell[]; hits: string[] };
export type BoardState = { ships: PlacedShip[]; shots: Record<string, ShotResult> };

export const FLEET: ShipDefinition[] = [
  { id: "carrier", name: "Carrier", length: 5 },
  { id: "battleship", name: "Battleship", length: 4 },
  { id: "cruiser", name: "Cruiser", length: 3 },
  { id: "submarine", name: "Submarine", length: 3 },
  { id: "destroyer", name: "Destroyer", length: 2 },
];

export const DIFFICULTIES = {
  easy: { label: "Easy" },
  normal: { label: "Normal" },
  hard: { label: "Hard" },
} as const;

export const cellKey = (cell: Cell) => `${cell.x}:${cell.y}`;
export const parseCellKey = (key: string): Cell => {
  const [x, y] = key.split(":").map(Number);
  return { x, y };
};
```

- [ ] **Step 4: Run the domain test and confirm GREEN**

Run: `node tests/neon-fleet-data.test.mjs`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the domain**

```bash
git add app/playground/neon-fleet/neon-fleet-data.ts tests/neon-fleet-data.test.mjs
git commit -m "feat(games): define Neon Fleet domain"
```

### Task 2: Fleet Placement Engine

**Files:**
- Create: `app/playground/neon-fleet/neon-fleet-engine.ts`
- Create: `tests/neon-fleet-engine.test.mjs`

- [ ] **Step 1: Write failing placement tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { autoPlaceFleet, createMatch, placeShip, removeShip } from "../app/playground/neon-fleet/neon-fleet-engine.ts";

test("places, rejects overlap, and removes a ship", () => {
  const match = createMatch("normal", 42);
  const first = placeShip(match, "carrier", { x: 1, y: 2 }, "horizontal");
  assert.equal(first.player.ships.length, 1);
  assert.equal(first.player.ships[0].cells.length, 5);
  assert.equal(placeShip(first, "battleship", { x: 3, y: 2 }, "vertical"), first);
  assert.equal(removeShip(first, "carrier").player.ships.length, 0);
});

test("auto placement is deterministic and valid", () => {
  const a = autoPlaceFleet(createMatch("hard", 99));
  const b = autoPlaceFleet(createMatch("hard", 99));
  assert.deepEqual(a.player.ships, b.player.ships);
  assert.equal(a.player.ships.length, 5);
  assert.equal(new Set(a.player.ships.flatMap((ship) => ship.cells.map((cell) => `${cell.x}:${cell.y}`))).size, 17);
});
```

- [ ] **Step 2: Run placement tests and confirm RED**

Run: `node tests/neon-fleet-engine.test.mjs`

Expected: FAIL because `neon-fleet-engine.ts` does not exist.

- [ ] **Step 3: Implement seeded match and placement**

```ts
import { BOARD_SIZE, FLEET, cellKey, type BoardState, type Cell, type Difficulty, type MatchPhase, type Orientation, type ShipId } from "./neon-fleet-data.ts";

export type FleetMatch = {
  difficulty: Difficulty;
  phase: MatchPhase;
  player: BoardState;
  enemy: BoardState;
  seed: number;
  turn: number;
  event: string;
};

const emptyBoard = (): BoardState => ({ ships: [], shots: {} });
const nextRandom = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

export const createMatch = (difficulty: Difficulty = "normal", seed = 20260729): FleetMatch => ({
  difficulty, phase: "setup", player: emptyBoard(), enemy: emptyBoard(),
  seed: seed >>> 0, turn: 0, event: "Place your fleet",
});

const cellsFor = (origin: Cell, length: number, orientation: Orientation) =>
  Array.from({ length }, (_, index) => ({
    x: origin.x + (orientation === "horizontal" ? index : 0),
    y: origin.y + (orientation === "vertical" ? index : 0),
  }));

const validCells = (board: BoardState, cells: Cell[]) =>
  cells.every((cell) => cell.x >= 0 && cell.x < BOARD_SIZE && cell.y >= 0 && cell.y < BOARD_SIZE)
  && !cells.some((cell) => board.ships.some((ship) => ship.cells.some((placed) => cellKey(placed) === cellKey(cell))));

export const placeShip = (match: FleetMatch, shipId: ShipId, origin: Cell, orientation: Orientation): FleetMatch => {
  if (match.phase !== "setup" || match.player.ships.some((ship) => ship.id === shipId)) return match;
  const definition = FLEET.find((ship) => ship.id === shipId);
  if (!definition) return match;
  const cells = cellsFor(origin, definition.length, orientation);
  if (!validCells(match.player, cells)) return match;
  return { ...match, player: { ...match.player, ships: [...match.player.ships, { ...definition, orientation, cells, hits: [] }] } };
};

export const removeShip = (match: FleetMatch, shipId: ShipId): FleetMatch => ({
  ...match, player: { ...match.player, ships: match.player.ships.filter((ship) => ship.id !== shipId) },
});

export const autoPlaceFleet = (match: FleetMatch): FleetMatch => {
  let next = { ...match, player: emptyBoard() };
  for (const ship of FLEET) {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const xRandom = nextRandom(next.seed);
      const yRandom = nextRandom(xRandom.seed);
      const directionRandom = nextRandom(yRandom.seed);
      next = { ...next, seed: directionRandom.seed };
      const placed = placeShip(next, ship.id, {
        x: Math.floor(xRandom.value * BOARD_SIZE),
        y: Math.floor(yRandom.value * BOARD_SIZE),
      }, directionRandom.value < .5 ? "horizontal" : "vertical");
      if (placed !== next) { next = placed; break; }
    }
  }
  return next;
};
```

- [ ] **Step 4: Run placement tests and confirm GREEN**

Run: `node tests/neon-fleet-engine.test.mjs`

Expected: placement tests pass.

- [ ] **Step 5: Commit placement**

```bash
git add app/playground/neon-fleet/neon-fleet-engine.ts tests/neon-fleet-engine.test.mjs
git commit -m "feat(games): add Battleship placement engine"
```

### Task 3: Combat and Terminal Rules

**Files:**
- Modify: `app/playground/neon-fleet/neon-fleet-engine.ts`
- Modify: `tests/neon-fleet-engine.test.mjs`

- [ ] **Step 1: Append failing combat tests**

```js
test("starts only with complete fleets and alternates one shot per side", () => {
  const ready = autoPlaceEnemy(autoPlaceFleet(createMatch("normal", 17)));
  const started = startBattle(ready);
  assert.equal(started.phase, "playerTurn");
  const fired = firePlayerShot(started, { x: 0, y: 0 });
  assert.equal(fired.phase, "aiTurn");
  assert.equal(firePlayerShot(fired, { x: 1, y: 0 }), fired);
});

test("duplicate shots are ignored and the last ship cell ends the match", () => {
  const ready = autoPlaceEnemy(autoPlaceFleet(createMatch("easy", 4)));
  const started = startBattle(ready);
  const targetCells = started.enemy.ships.flatMap((ship) => ship.cells);
  const beforeLast = targetCells.slice(0, -1).reduce(
    (state, cell) => ({ ...firePlayerShot({ ...state, phase: "playerTurn" }, cell), phase: "playerTurn" }),
    started,
  );
  const won = firePlayerShot(beforeLast, targetCells.at(-1));
  assert.equal(won.phase, "victory");
});
```

- [ ] **Step 2: Run combat tests and confirm RED**

Run: `node tests/neon-fleet-engine.test.mjs`

Expected: FAIL because combat exports are missing.

- [ ] **Step 3: Implement enemy placement and shot resolution**

```ts
export const autoPlaceEnemy = (match: FleetMatch): FleetMatch => {
  const mirrored = autoPlaceFleet({ ...match, player: match.enemy });
  return { ...mirrored, player: match.player, enemy: mirrored.player };
};

export const startBattle = (match: FleetMatch): FleetMatch =>
  match.player.ships.length === FLEET.length && match.enemy.ships.length === FLEET.length
    ? { ...match, phase: "playerTurn", event: "Your turn" }
    : match;

const allSunk = (board: BoardState) =>
  board.ships.length === FLEET.length && board.ships.every((ship) => ship.hits.length === ship.length);

const fireAtBoard = (board: BoardState, cell: Cell) => {
  const key = cellKey(cell);
  if (board.shots[key]) return null;
  const ship = board.ships.find((candidate) => candidate.cells.some((part) => cellKey(part) === key));
  const ships = ship
    ? board.ships.map((candidate) => candidate.id === ship.id
      ? { ...candidate, hits: [...candidate.hits, key] }
      : candidate)
    : board.ships;
  const updatedShip = ships.find((candidate) => candidate.id === ship?.id);
  const result = !ship ? "miss" : updatedShip?.hits.length === updatedShip?.length ? "sunk" : "hit";
  return { board: { ships, shots: { ...board.shots, [key]: result } }, result };
};

export const firePlayerShot = (match: FleetMatch, cell: Cell): FleetMatch => {
  if (match.phase !== "playerTurn") return match;
  const resolved = fireAtBoard(match.enemy, cell);
  if (!resolved) return match;
  const victory = allSunk(resolved.board);
  return {
    ...match, enemy: resolved.board, turn: match.turn + 1,
    phase: victory ? "victory" : "aiTurn",
    event: victory ? "Enemy fleet destroyed" : resolved.result.toUpperCase(),
  };
};

export const fireAiShot = (match: FleetMatch, cell: Cell): FleetMatch => {
  if (match.phase !== "aiTurn") return match;
  const resolved = fireAtBoard(match.player, cell);
  if (!resolved) return match;
  const defeat = allSunk(resolved.board);
  return {
    ...match, player: resolved.board,
    phase: defeat ? "defeat" : "playerTurn",
    event: defeat ? "Your fleet was destroyed" : `AI ${resolved.result}`,
  };
};
```

- [ ] **Step 4: Run engine tests and confirm GREEN**

Run: `node tests/neon-fleet-engine.test.mjs`

Expected: all placement and combat tests pass.

- [ ] **Step 5: Commit combat**

```bash
git add app/playground/neon-fleet/neon-fleet-engine.ts tests/neon-fleet-engine.test.mjs
git commit -m "feat(games): add Battleship combat rules"
```

### Task 4: Deterministic AI

**Files:**
- Create: `app/playground/neon-fleet/neon-fleet-ai.ts`
- Create: `tests/neon-fleet-ai.test.mjs`

- [ ] **Step 1: Write failing AI tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { chooseAiShot } from "../app/playground/neon-fleet/neon-fleet-ai.ts";

test("every difficulty selects an in-bounds untried cell deterministically", () => {
  for (const difficulty of ["easy", "normal", "hard"]) {
    const knowledge = { shots: { "0:0": "miss" }, remainingLengths: [5, 4, 3, 3, 2] };
    const a = chooseAiShot(difficulty, knowledge, 81);
    const b = chooseAiShot(difficulty, knowledge, 81);
    assert.deepEqual(a, b);
    assert.ok(a.cell.x >= 0 && a.cell.x < 10 && a.cell.y >= 0 && a.cell.y < 10);
    assert.notDeepEqual(a.cell, { x: 0, y: 0 });
  }
});

test("Normal targets an orthogonal neighbor after a hit", () => {
  const result = chooseAiShot("normal", { shots: { "4:4": "hit" }, remainingLengths: [3, 2] }, 10);
  assert.equal(Math.abs(result.cell.x - 4) + Math.abs(result.cell.y - 4), 1);
});

test("Hard extends an aligned hit line without hidden fleet data", () => {
  const knowledge = { shots: { "3:5": "hit", "4:5": "hit", "2:5": "miss" }, remainingLengths: [4, 3] };
  assert.deepEqual(chooseAiShot("hard", knowledge, 20).cell, { x: 5, y: 5 });
});
```

- [ ] **Step 2: Run AI tests and confirm RED**

Run: `node tests/neon-fleet-ai.test.mjs`

Expected: FAIL because the AI module is missing.

- [ ] **Step 3: Implement hunt, target, and probability selection**

```ts
import { BOARD_SIZE, cellKey, parseCellKey, type Cell, type Difficulty, type ShotResult } from "./neon-fleet-data.ts";

export type AiKnowledge = {
  shots: Record<string, ShotResult>;
  remainingLengths: number[];
};

const neighbors = (cell: Cell) => [
  { x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y },
  { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 },
].filter((item) => item.x >= 0 && item.x < BOARD_SIZE && item.y >= 0 && item.y < BOARD_SIZE);

const legalCells = (shots: Record<string, ShotResult>) =>
  Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE),
  })).filter((cell) => !shots[cellKey(cell)]);

const seededIndex = (seed: number, length: number) => {
  const nextSeed = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: nextSeed, index: nextSeed % length };
};

const targetCandidates = (shots: Record<string, ShotResult>) => {
  const hits = Object.entries(shots).filter(([, result]) => result === "hit").map(([key]) => parseCellKey(key));
  if (hits.length >= 2) {
    const sameRow = hits.every((cell) => cell.y === hits[0].y);
    const sameColumn = hits.every((cell) => cell.x === hits[0].x);
    if (sameRow) {
      const xs = hits.map((cell) => cell.x);
      return [{ x: Math.min(...xs) - 1, y: hits[0].y }, { x: Math.max(...xs) + 1, y: hits[0].y }]
        .filter((cell) => cell.x >= 0 && cell.x < BOARD_SIZE && !shots[cellKey(cell)]);
    }
    if (sameColumn) {
      const ys = hits.map((cell) => cell.y);
      return [{ x: hits[0].x, y: Math.min(...ys) - 1 }, { x: hits[0].x, y: Math.max(...ys) + 1 }]
        .filter((cell) => cell.y >= 0 && cell.y < BOARD_SIZE && !shots[cellKey(cell)]);
    }
  }
  return hits.flatMap(neighbors).filter((cell) => !shots[cellKey(cell)]);
};

const probabilityCells = (knowledge: AiKnowledge) => {
  const score = new Map<string, number>();
  for (const length of knowledge.remainingLengths) {
    for (let y = 0; y < BOARD_SIZE; y += 1) for (let x = 0; x < BOARD_SIZE; x += 1) {
      for (const horizontal of [true, false]) {
        const cells = Array.from({ length }, (_, index) => ({ x: x + (horizontal ? index : 0), y: y + (horizontal ? 0 : index) }));
        if (cells.every((cell) => cell.x < BOARD_SIZE && cell.y < BOARD_SIZE && knowledge.shots[cellKey(cell)] !== "miss")) {
          cells.filter((cell) => !knowledge.shots[cellKey(cell)]).forEach((cell) => score.set(cellKey(cell), (score.get(cellKey(cell)) ?? 0) + 1));
        }
      }
    }
  }
  const best = Math.max(...score.values(), 0);
  return legalCells(knowledge.shots).filter((cell) => (score.get(cellKey(cell)) ?? 0) === best);
};

export const chooseAiShot = (difficulty: Difficulty, knowledge: AiKnowledge, seed: number) => {
  const targets = difficulty === "easy" ? [] : targetCandidates(knowledge.shots);
  const candidates = targets.length
    ? targets
    : difficulty === "hard" ? probabilityCells(knowledge) : legalCells(knowledge.shots);
  const choice = seededIndex(seed, candidates.length);
  return { cell: candidates[choice.index], seed: choice.seed };
};
```

- [ ] **Step 4: Run AI tests and confirm GREEN**

Run: `node tests/neon-fleet-ai.test.mjs`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Commit AI**

```bash
git add app/playground/neon-fleet/neon-fleet-ai.ts tests/neon-fleet-ai.test.mjs
git commit -m "feat(games): add Battleship AI"
```

### Task 5: Persistence and Audio Adapters

**Files:**
- Create: `app/playground/neon-fleet/neon-fleet-storage.ts`
- Create: `app/playground/neon-fleet/neon-fleet-audio.ts`
- Create: `tests/neon-fleet-ui.test.mjs`

- [ ] **Step 1: Write failing adapter tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATS, parseStats, recordMatch } from "../app/playground/neon-fleet/neon-fleet-storage.ts";
import { createFleetAudio } from "../app/playground/neon-fleet/neon-fleet-audio.ts";

test("versioned stats reject malformed data and record one result", () => {
  assert.deepEqual(parseStats("{bad"), DEFAULT_STATS);
  const next = recordMatch(DEFAULT_STATS, "hard", { won: true, accuracy: 64, durationMs: 91000 });
  assert.equal(next.byDifficulty.hard.played, 1);
  assert.equal(next.byDifficulty.hard.won, 1);
  assert.equal(next.byDifficulty.hard.bestAccuracy, 64);
});

test("audio adapter exposes a safe lifecycle", () => {
  const audio = createFleetAudio();
  for (const key of ["unlock", "setMuted", "play", "dispose"]) assert.equal(typeof audio[key], "function");
  audio.setMuted(true);
  audio.play("hit");
  audio.dispose();
});
```

- [ ] **Step 2: Run adapter tests and confirm RED**

Run: `node tests/neon-fleet-ui.test.mjs`

Expected: FAIL because storage and audio modules are missing.

- [ ] **Step 3: Implement versioned statistics**

```ts
import type { Difficulty } from "./neon-fleet-data";

type DifficultyStats = { played: number; won: number; bestAccuracy: number; fastestVictoryMs: number | null };
export type FleetStats = { version: 1; byDifficulty: Record<Difficulty, DifficultyStats> };
const emptyDifficulty = (): DifficultyStats => ({ played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null });
export const DEFAULT_STATS: FleetStats = {
  version: 1,
  byDifficulty: { easy: emptyDifficulty(), normal: emptyDifficulty(), hard: emptyDifficulty() },
};
export const STATS_KEY = "dk-neon-fleet-stats-v1";
export const MUTE_KEY = "dk-neon-fleet-muted";

export const parseStats = (raw: string | null): FleetStats => {
  try {
    const value = JSON.parse(raw ?? "");
    if (value?.version !== 1 || !["easy", "normal", "hard"].every((key) => value.byDifficulty?.[key])) return DEFAULT_STATS;
    return value;
  } catch { return DEFAULT_STATS; }
};

export const recordMatch = (
  stats: FleetStats,
  difficulty: Difficulty,
  result: { won: boolean; accuracy: number; durationMs: number },
): FleetStats => {
  const current = stats.byDifficulty[difficulty];
  return {
    ...stats,
    byDifficulty: {
      ...stats.byDifficulty,
      [difficulty]: {
        played: current.played + 1,
        won: current.won + (result.won ? 1 : 0),
        bestAccuracy: Math.max(current.bestAccuracy, result.accuracy),
        fastestVictoryMs: result.won
          ? Math.min(current.fastestVictoryMs ?? result.durationMs, result.durationMs)
          : current.fastestVictoryMs,
      },
    },
  };
};
```

- [ ] **Step 4: Implement lazy Web Audio**

```ts
type Cue = "radar" | "miss" | "hit" | "sunk" | "victory" | "defeat" | "click";

export const createFleetAudio = () => {
  let context: AudioContext | null = null;
  let muted = false;
  const unlock = async () => {
    if (typeof window === "undefined") return;
    context ??= new AudioContext();
    if (context.state === "suspended") await context.resume();
  };
  const play = (cue: Cue) => {
    if (muted || !context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies: Record<Cue, number> = { radar: 280, miss: 150, hit: 90, sunk: 65, victory: 620, defeat: 110, click: 360 };
    oscillator.frequency.value = frequencies[cue];
    gain.gain.setValueAtTime(.05, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .17);
  };
  return {
    unlock,
    setMuted: (value: boolean) => { muted = value; },
    play,
    dispose: () => { void context?.close(); context = null; },
  };
};
```

- [ ] **Step 5: Run adapter tests and confirm GREEN**

Run: `node tests/neon-fleet-ui.test.mjs`

Expected: adapter tests pass.

- [ ] **Step 6: Commit adapters**

```bash
git add app/playground/neon-fleet/neon-fleet-storage.ts app/playground/neon-fleet/neon-fleet-audio.ts tests/neon-fleet-ui.test.mjs
git commit -m "feat(games): add Neon Fleet browser adapters"
```

### Task 6: Game UI and Route

**Files:**
- Create: `app/playground/neon-fleet/neon-fleet-game.tsx`
- Create: `app/playground/neon-fleet/neon-fleet.module.css`
- Create: `app/playground/neon-fleet/page.tsx`
- Modify: `tests/neon-fleet-ui.test.mjs`

- [ ] **Step 1: Append failing UI contract test**

```js
import { readFile } from "node:fs/promises";

test("game UI exposes setup, two semantic boards, theme, audio, and terminal overlays", async () => {
  const source = await readFile(new URL("../app/playground/neon-fleet/neon-fleet-game.tsx", import.meta.url), "utf8");
  for (const token of [
    "Your Fleet", "Enemy Waters", "Auto-place", "Rotate", "Start battle",
    "aria-label", "MutationObserver", "createFleetAudio", "recordMatch",
    '"victory"', '"defeat"',
  ]) assert.ok(source.includes(token), token);
});

test("route mounts Neon Fleet with metadata", async () => {
  const source = await readFile(new URL("../app/playground/neon-fleet/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Neon Fleet/);
  assert.match(source, /NeonFleetGame/);
});
```

- [ ] **Step 2: Run UI tests and confirm RED**

Run: `node tests/neon-fleet-ui.test.mjs`

Expected: FAIL with missing game and route files.

- [ ] **Step 3: Build the route and React orchestration**

Implement `page.tsx`:

```tsx
import type { Metadata } from "next";
import NeonFleetGame from "./neon-fleet-game";

export const metadata: Metadata = {
  title: "Neon Fleet — Battleship",
  description: "Place your fleet and outthink three levels of Battleship AI.",
};

export default function NeonFleetPage() {
  return <NeonFleetGame />;
}
```

Implement `neon-fleet-game.tsx` with these concrete state boundaries:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RefreshCw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { BOARD_SIZE, FLEET, cellKey, type Cell, type Difficulty, type Orientation, type ShipId } from "./neon-fleet-data";
import { chooseAiShot } from "./neon-fleet-ai";
import { autoPlaceEnemy, autoPlaceFleet, createMatch, fireAiShot, firePlayerShot, placeShip, removeShip, startBattle } from "./neon-fleet-engine";
import { createFleetAudio } from "./neon-fleet-audio";
import { DEFAULT_STATS, MUTE_KEY, STATS_KEY, parseStats, recordMatch } from "./neon-fleet-storage";
import styles from "./neon-fleet.module.css";

const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
  x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE),
}));

export default function NeonFleetGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [match, setMatch] = useState(() => createMatch("normal"));
  const [selectedShip, setSelectedShip] = useState<ShipId>("carrier");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dark, setDark] = useState(true);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const audioRef = useRef<ReturnType<typeof createFleetAudio> | null>(null);
  const startedAt = useRef(Date.now());
  const recorded = useRef(false);

  useEffect(() => {
    audioRef.current = createFleetAudio();
    setStats(parseStats(localStorage.getItem(STATS_KEY)));
    const storedMute = localStorage.getItem(MUTE_KEY) === "true";
    setMuted(storedMute); audioRef.current.setMuted(storedMute);
    const syncTheme = () => setDark(document.documentElement.dataset.theme !== "light");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => { observer.disconnect(); audioRef.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (match.phase !== "aiTurn" || paused) return;
    const timer = window.setTimeout(() => {
      const knowledge = {
        shots: match.player.shots,
        remainingLengths: match.player.ships.filter((ship) => ship.hits.length < ship.length).map((ship) => ship.length),
      };
      const choice = chooseAiShot(match.difficulty, knowledge, match.seed);
      setMatch((current) => fireAiShot({ ...current, seed: choice.seed }, choice.cell));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [match, paused]);

  useEffect(() => {
    if (!["victory", "defeat"].includes(match.phase) || recorded.current) return;
    recorded.current = true;
    const shots = Object.keys(match.enemy.shots).length;
    const hits = Object.values(match.enemy.shots).filter((value) => value !== "miss").length;
    const next = recordMatch(stats, match.difficulty, {
      won: match.phase === "victory",
      accuracy: shots ? Math.round(hits / shots * 100) : 0,
      durationMs: Date.now() - startedAt.current,
    });
    setStats(next); localStorage.setItem(STATS_KEY, JSON.stringify(next));
  }, [match, stats]);

  const reset = (nextDifficulty = difficulty) => {
    recorded.current = false; startedAt.current = Date.now();
    setDifficulty(nextDifficulty); setMatch(createMatch(nextDifficulty, Date.now()));
  };

  const begin = () => {
    const withEnemy = autoPlaceEnemy(match);
    setMatch(startBattle(withEnemy));
  };

  const playerFire = async (cell: Cell) => {
    if (paused || match.phase !== "playerTurn") return;
    await audioRef.current?.unlock();
    setMatch((current) => firePlayerShot(current, cell));
  };

  const renderBoard = (owner: "player" | "enemy") => {
    const board = match[owner];
    return (
      <div className={styles.board} role="grid" aria-label={owner === "player" ? "Your Fleet" : "Enemy Waters"}>
        {cells.map((cell) => {
          const key = cellKey(cell);
          const ship = board.ships.find((item) => item.cells.some((part) => cellKey(part) === key));
          const shot = board.shots[key];
          return (
            <button
              type="button"
              role="gridcell"
              key={key}
              data-ship={owner === "player" && ship ? "true" : undefined}
              data-shot={shot}
              aria-label={`${owner === "player" ? "Your" : "Enemy"} ${String.fromCharCode(65 + cell.y)}${cell.x + 1}, ${shot ?? "untried"}`}
              onClick={() => owner === "enemy" ? playerFire(cell) : match.phase === "setup" && setMatch(placeShip(match, selectedShip, cell, orientation))}
            />
          );
        })}
      </div>
    );
  };

  return (
    <main className={`${styles.page} ${dark ? styles.dark : styles.light}`}>
      <header className={styles.hero}>
        <div><p>GAME 08 · CLASSIC STRATEGY</p><h1>Neon Fleet</h1><p>Place your fleet, read the radar, and sink the AI armada.</p></div>
        <div className={styles.actions}>
          <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? <Play /> : <Pause />} {paused ? "Resume" : "Pause"}</button>
          <button type="button" onClick={() => { const value = !muted; setMuted(value); audioRef.current?.setMuted(value); localStorage.setItem(MUTE_KEY, String(value)); }}>{muted ? <VolumeX /> : <Volume2 />} {muted ? "Unmute" : "Mute"}</button>
          <button type="button" onClick={() => reset()}><RefreshCw /> Restart</button>
        </div>
      </header>
      <section className={styles.shell}>
        <div className={styles.status}><b>{match.event}</b><span>{match.difficulty.toUpperCase()}</span><span>TURN {match.turn}</span></div>
        {match.phase === "setup" && (
          <div className={styles.setup}>
            <div className={styles.difficulties}>{(["easy", "normal", "hard"] as Difficulty[]).map((item) => <button type="button" key={item} aria-pressed={difficulty === item} onClick={() => reset(item)}>{item}</button>)}</div>
            <div className={styles.dock}>{FLEET.map((ship) => <button type="button" key={ship.id} aria-pressed={selectedShip === ship.id} disabled={match.player.ships.some((placed) => placed.id === ship.id)} onClick={() => { removeShip(match, ship.id); setSelectedShip(ship.id); }}>{ship.name} · {ship.length}</button>)}</div>
            <button type="button" onClick={() => setOrientation((value) => value === "horizontal" ? "vertical" : "horizontal")}><RotateCw /> Rotate</button>
            <button type="button" onClick={() => setMatch(autoPlaceFleet(match))}>Auto-place</button>
            <button type="button" disabled={match.player.ships.length !== FLEET.length} onClick={begin}>Start battle</button>
          </div>
        )}
        <div className={styles.boards}>
          <section><h2>Your Fleet</h2>{renderBoard("player")}</section>
          <section><h2>Enemy Waters</h2>{renderBoard("enemy")}</section>
        </div>
        {["victory", "defeat"].includes(match.phase) && <div className={styles.overlay}><strong>{match.phase === "victory" ? "Victory" : "Defeat"}</strong><button type="button" onClick={() => reset()}>Rematch</button></div>}
        <p className={styles.srStatus} aria-live="polite">{match.event}</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add scoped responsive CSS**

Implement these required style contracts, then expand them without global selectors:

```css
.page { --water: #eaf7f5; --panel: #ffffff; --ink: #07343b; --line: #a9d5d1; --accent: #078e89; --danger: #d84f65; padding: clamp(18px, 4vw, 54px); color: var(--ink); }
.dark { --water: #06171d; --panel: #0d252c; --ink: #e9fffb; --line: #28515a; --accent: #35d7cb; --danger: #ff7188; }
.hero, .actions, .status, .setup, .dock, .difficulties { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.hero { justify-content: space-between; margin-bottom: 20px; }
.shell { position: relative; padding: clamp(14px, 2vw, 24px); border: 1px solid var(--line); border-radius: 28px; background: color-mix(in srgb, var(--panel) 92%, transparent); }
.boards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(18px, 3vw, 34px); }
.board { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); aspect-ratio: 1; border: 1px solid var(--line); background: var(--water); }
.board button { min-width: 0; border: 1px solid color-mix(in srgb, var(--line) 65%, transparent); background: transparent; position: relative; }
.board button[data-ship="true"] { background: color-mix(in srgb, var(--accent) 34%, var(--water)); }
.board button[data-shot="miss"]::after { content: ""; position: absolute; inset: 35%; border: 2px solid var(--ink); border-radius: 50%; }
.board button[data-shot="hit"], .board button[data-shot="sunk"] { background: color-mix(in srgb, var(--danger) 55%, var(--water)); }
.board button:focus-visible { outline: 3px solid var(--accent); outline-offset: -3px; z-index: 1; }
.overlay { position: absolute; inset: 0; display: grid; place-content: center; gap: 14px; text-align: center; background: color-mix(in srgb, var(--panel) 88%, transparent); border-radius: inherit; }
.srStatus { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 760px) { .boards { grid-template-columns: 1fr; } .boards section:last-child { order: -1; } }
@media (prefers-reduced-motion: reduce) { .page *, .page *::before, .page *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
```

- [ ] **Step 5: Run UI tests and scoped lint**

Run:

```bash
node tests/neon-fleet-ui.test.mjs
npx eslint app/playground/neon-fleet tests/neon-fleet*.test.mjs
```

Expected: UI tests pass and ESLint exits 0.

- [ ] **Step 6: Commit UI**

```bash
git add app/playground/neon-fleet tests/neon-fleet-ui.test.mjs
git commit -m "feat(games): build Neon Fleet Battleship"
```

### Task 7: Playground Integration

**Files:**
- Modify: `app/playground/page.tsx`
- Modify: `app/playground/playground.module.css`
- Modify: `tests/neon-fleet-ui.test.mjs`

- [ ] **Step 1: Append failing hub test**

```js
test("Playground exposes Neon Fleet as the eighth live game", async () => {
  const page = await readFile(new URL("../app/playground/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/playground/playground.module.css", import.meta.url), "utf8");
  assert.match(page, /\/playground\/neon-fleet/);
  assert.match(page, /Neon Fleet/);
  assert.match(page, /visual: "fleet"/);
  assert.match(css, /\.visualFleet/);
});
```

- [ ] **Step 2: Run the hub test and confirm RED**

Run: `node tests/neon-fleet-ui.test.mjs`

Expected: FAIL because no fleet card or visual exists.

- [ ] **Step 3: Add fleet to card types and game data**

Extend `GameCard.visual` with `"fleet"` and append:

```ts
{
  slug: "neon-fleet",
  href: "/playground/neon-fleet",
  title: "Neon Fleet",
  categories: ["Strategy", "Casual"],
  categoryLabel: "STRATEGY · BATTLESHIP · CLASSIC",
  description: language === "vi"
    ? "Đặt đội tàu, đọc tín hiệu radar và đánh chìm hạm đội AI qua ba cấp độ."
    : "Place your ships, read the radar, and sink the AI fleet across three difficulties.",
  features: [
    { icon: "brain", label: "3 AI levels" },
    { icon: "grid", label: "Classic 10×10" },
    { icon: "audio", label: "Web Audio" },
  ],
  visual: "fleet",
},
```

Add the fleet illustration branch beside existing visual branches:

```tsx
{game.visual === "fleet" && (
  <div className={styles.visualFleet} aria-hidden="true">
    <span /><span /><span /><i />
  </div>
)}
```

- [ ] **Step 4: Add the fleet card visual**

```css
.visualFleet { position: absolute; inset: 18% 10%; border-radius: 20px; overflow: hidden; background: repeating-linear-gradient(0deg, transparent 0 18px, rgba(80,220,210,.12) 19px), repeating-linear-gradient(90deg, transparent 0 18px, rgba(80,220,210,.12) 19px); }
.visualFleet span { position: absolute; height: 14px; border-radius: 999px 5px 5px 999px; background: linear-gradient(90deg, #35d7cb, #7ff1e7); box-shadow: 0 0 18px rgba(53,215,203,.42); }
.visualFleet span:nth-child(1) { width: 46%; left: 8%; top: 25%; }
.visualFleet span:nth-child(2) { width: 34%; right: 8%; top: 50%; }
.visualFleet span:nth-child(3) { width: 24%; left: 24%; bottom: 16%; }
.visualFleet i { position: absolute; width: 54px; aspect-ratio: 1; right: 14%; top: 9%; border: 2px solid #ff7188; border-radius: 50%; box-shadow: 0 0 20px #ff7188; }
```

- [ ] **Step 5: Run hub and full focused tests**

Run: `node --test tests/neon-fleet*.test.mjs`

Expected: all Neon Fleet tests pass.

- [ ] **Step 6: Commit hub integration**

```bash
git add app/playground/page.tsx app/playground/playground.module.css tests/neon-fleet-ui.test.mjs
git commit -m "feat(games): publish Neon Fleet"
```

### Task 8: Verification and Demo

**Files:**
- Modify only if a verification failure requires a targeted fix.

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/neon-fleet*.test.mjs`

Expected: all Neon Fleet tests pass, 0 fail.

- [ ] **Step 2: Run the complete regression suite**

Run: `npm test`

Expected: all repository tests pass, 0 fail.

- [ ] **Step 3: Run scoped lint and production build**

Run:

```bash
npx eslint app/playground/neon-fleet app/playground/page.tsx tests/neon-fleet*.test.mjs
npm run build
```

Expected: ESLint exits 0; Next.js build succeeds and lists `/playground/neon-fleet`.

- [ ] **Step 4: Start the demo**

Run: `npm run dev -- --port 3014`

Expected: Next.js reports ready at `http://localhost:3014`.

- [ ] **Step 5: Perform browser QA**

Open `http://localhost:3014/playground/neon-fleet` and verify:

1. Auto-place creates all five player ships.
2. Start battle activates Enemy Waters.
3. One enemy cell click produces one player result and one delayed AI shot.
4. Previously fired cells cannot fire again.
5. Pause stops the AI presentation timer and Resume restores it.
6. Light/dark switching keeps labels, water, hits, and controls readable.
7. At 390px viewport the boards stack without horizontal overflow.
8. Keyboard focus reaches all actionable cells with visible focus rings.
9. Console contains no errors.

- [ ] **Step 6: Request independent code review**

Review pure rules, AI hidden-information boundary, React timer cleanup, terminal persistence, accessibility, and responsive/theme behavior. Resolve every Important or Critical finding with a failing regression test first.

- [ ] **Step 7: Commit verification fixes if needed**

```bash
git add app/playground/neon-fleet app/playground/page.tsx app/playground/playground.module.css tests/neon-fleet*.test.mjs
git commit -m "fix(games): harden Neon Fleet gameplay"
```

- [ ] **Step 8: Record clean final state**

Run:

```bash
git status --short
git log -1 --oneline
```

Expected: clean status and the latest Neon Fleet commit.
