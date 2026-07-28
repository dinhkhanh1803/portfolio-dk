# Merge Foundry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, directly playable 5×5 turn-based merging puzzle at `/playground/merge-foundry` and promote it as the second game on the Games hub.

**Architecture:** A deterministic TypeScript engine owns all board, order, scoring, undo, and win/loss rules. A React client translates keyboard, swipe, and button inputs into engine transitions, renders CSS-driven animations, persists validated state, and delegates synthesized sound to an isolated Web Audio controller.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Lucide React, Web Audio API, Node test runner, ESLint.

---

## File Map

- Create `app/playground/merge-foundry/merge-foundry-engine.ts`: deterministic game rules and transition events.
- Create `app/playground/merge-foundry/merge-foundry-storage.ts`: versioned persistence validation.
- Create `app/playground/merge-foundry/merge-foundry-audio.ts`: synthesized game audio.
- Create `app/playground/merge-foundry/merge-foundry-game.tsx`: client state, inputs, rendering, persistence, and accessibility.
- Create `app/playground/merge-foundry/merge-foundry.module.css`: responsive Light/Dark shell, board, tiles, orders, and motion.
- Create `app/playground/merge-foundry/page.tsx`: route metadata and client mount.
- Create `tests/merge-foundry-engine.test.mjs`: engine, storage, route, style, and hub contracts.
- Modify `app/playground/page.tsx`: data-driven two-game search/filter listing.
- Modify `app/playground/playground.module.css`: second card artwork and multi-card grid behavior.
- Modify `.gitignore`: ignore `.superpowers/` visual-companion artifacts.

### Task 1: Deterministic Board Movement

**Files:**
- Create: `app/playground/merge-foundry/merge-foundry-engine.ts`
- Create: `tests/merge-foundry-engine.test.mjs`

- [ ] **Step 1: Write failing movement tests**

Create tests that import `moveBoard` and assert compaction, a single merge per tile, and all directions:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { moveBoard } from "../app/playground/merge-foundry/merge-foundry-engine.ts";

const board = (...cells) => cells;

test("slides and merges left without double-merging a result", () => {
  const input = board(
    1, 1, 1, 1, null,
    ...Array(20).fill(null),
  );
  const result = moveBoard(input, "left");
  assert.equal(result.changed, true);
  assert.deepEqual(result.board.slice(0, 5), [2, 2, null, null, null]);
  assert.deepEqual(result.merges.map((item) => item.tier), [2, 2]);
});

test("moves the same line consistently in all four directions", () => {
  const horizontal = board(1, null, 1, null, null, ...Array(20).fill(null));
  assert.deepEqual(moveBoard(horizontal, "right").board.slice(0, 5), [null, null, null, null, 2]);

  const vertical = Array(25).fill(null);
  vertical[0] = 1;
  vertical[10] = 1;
  assert.equal(moveBoard(vertical, "down").board[20], 2);
});
```

- [ ] **Step 2: Run the movement tests and verify RED**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: FAIL because `merge-foundry-engine.ts` does not exist.

- [ ] **Step 3: Implement board types and movement**

Define:

```ts
export type MaterialTier = 1 | 2 | 3 | 4 | 5;
export type Cell = MaterialTier | null;
export type Board = Cell[];
export type Direction = "up" | "down" | "left" | "right";
export type MergeEvent = { from: number[]; to: number; tier: MaterialTier };
export type BoardMove = {
  board: Board;
  changed: boolean;
  merges: MergeEvent[];
};

export function moveBoard(board: Board, direction: Direction): BoardMove
```

Validate that the input has exactly 25 cells. Transform each directional line into traversal order, remove nulls, combine adjacent equal tiers once, cap Prism at tier 5, and write the result back into a fresh 25-cell board. Return merge source/destination indexes for UI animation.

- [ ] **Step 4: Run movement tests and verify GREEN**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: PASS for movement tests.

- [ ] **Step 5: Commit movement engine**

```bash
git add app/playground/merge-foundry/merge-foundry-engine.ts tests/merge-foundry-engine.test.mjs
git commit -m "feat(games): add merge foundry movement engine"
```

### Task 2: Shift State, Orders, Scoring, Undo, and Persistence

**Files:**
- Modify: `app/playground/merge-foundry/merge-foundry-engine.ts`
- Create: `app/playground/merge-foundry/merge-foundry-storage.ts`
- Modify: `tests/merge-foundry-engine.test.mjs`

- [ ] **Step 1: Write failing state-transition tests**

Add tests for deterministic spawning, invalid moves, delivery, combo reset, undo, win, game over, and storage:

```js
test("valid moves spawn deterministically and invalid moves do nothing", () => {
  const state = createGame(1234);
  const first = slide(state, "left");
  const replay = slide(createGame(1234), "left");
  assert.deepEqual(first.state, replay.state);
  assert.equal(first.changed, true);

  const blocked = { ...state, board: Array(25).fill(5) };
  const invalid = slide(blocked, "left");
  assert.equal(invalid.changed, false);
  assert.equal(invalid.state, blocked);
});

test("delivery removes materials and advances progress", () => {
  const state = {
    ...createGame(7),
    board: [4, ...Array(24).fill(null)],
    orders: [{ id: "a", tier: 4, quantity: 1 }],
  };
  const result = deliverOrder(state, "a");
  assert.equal(result.delivered, true);
  assert.equal(result.state.board[0], null);
  assert.equal(result.state.completedOrders, 1);
  assert.ok(result.state.score > state.score);
});

test("undo restores the exact previous state and is consumed", () => {
  const state = createGame(42);
  const moved = slide(state, "left").state;
  const restored = undo(moved);
  assert.deepEqual(restored.board, state.board);
  assert.equal(restored.seed, state.seed);
  assert.equal(restored.undoAvailable, false);
});

test("saved shifts are versioned and validated", () => {
  const state = createGame(8);
  assert.deepEqual(parseSavedShift(JSON.stringify(state)), state);
  assert.equal(parseSavedShift("{bad"), null);
  assert.equal(parseSavedShift(JSON.stringify({ ...state, version: 99 })), null);
});
```

- [ ] **Step 2: Run transition tests and verify RED**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: FAIL because the state transition and storage exports are missing.

- [ ] **Step 3: Implement deterministic shift rules**

Add these public types and functions:

```ts
export type ShiftStatus = "playing" | "won" | "lost";
export type CraftingOrder = {
  id: string;
  tier: MaterialTier;
  quantity: 1 | 2;
};
export type UndoSnapshot = {
  board: Board;
  seed: number;
  score: number;
  combo: number;
  slidesSinceDelivery: number;
  completedOrders: number;
  orders: CraftingOrder[];
  status: ShiftStatus;
};
export type GameState = UndoSnapshot & {
  version: 1;
  moveCount: number;
  undoAvailable: boolean;
  undoSnapshot: UndoSnapshot | null;
};
export type SlideTransition = {
  state: GameState;
  changed: boolean;
  merges: MergeEvent[];
  spawnedIndex: number | null;
};

export function createGame(seed = Date.now() >>> 0): GameState;
export function slide(state: GameState, direction: Direction): SlideTransition;
export function canDeliver(state: GameState, orderId: string): boolean;
export function deliverOrder(
  state: GameState,
  orderId: string,
): { state: GameState; delivered: boolean };
export function undo(state: GameState): GameState;
export function hasMoves(board: Board): boolean;
```

Use a 32-bit seeded linear-congruential generator:

```ts
function nextRandom(seed: number) {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: nextSeed, value: nextSeed / 4294967296 };
}
```

Create two initial low-tier tiles, generate three deterministic orders, spawn only after a changed slide, reset delivery combo after three valid slides without delivery, win at eight delivered orders, and lose only when the board is full with no adjacent equal cells.

- [ ] **Step 4: Implement validated storage helpers**

Export:

```ts
export const SHIFT_KEY = "merge-foundry:shift:v1";
export const HIGH_SCORE_KEY = "merge-foundry:high-score";
export const MUTED_KEY = "merge-foundry:muted";
export const REDUCED_MOTION_KEY = "merge-foundry:reduced-motion";

export function parseSavedShift(serialized: string | null): GameState | null;
export function serializeShift(state: GameState): string;
```

`parseSavedShift` must catch JSON errors and reject wrong version, board length, cell tiers, status, seed, score, progress, order shape, and recursive undo data. It must return a fresh cloned value, not the parsed object reference.

- [ ] **Step 5: Run transition tests and verify GREEN**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: all engine and persistence tests PASS.

- [ ] **Step 6: Commit shift rules**

```bash
git add app/playground/merge-foundry/merge-foundry-engine.ts app/playground/merge-foundry/merge-foundry-storage.ts tests/merge-foundry-engine.test.mjs
git commit -m "feat(games): add merge foundry shift rules"
```

### Task 3: Synthesized Audio

**Files:**
- Create: `app/playground/merge-foundry/merge-foundry-audio.ts`
- Modify: `tests/merge-foundry-engine.test.mjs`

- [ ] **Step 1: Write a failing audio contract test**

```js
test("merge foundry audio supports gameplay cues and cleanup", () => {
  const source = readFileSync(
    "app/playground/merge-foundry/merge-foundry-audio.ts",
    "utf8",
  );
  assert.match(source, /class MergeFoundryAudio/);
  assert.match(source, /playSlide\(/);
  assert.match(source, /playMerge\(tier: MaterialTier\)/);
  assert.match(source, /playDelivery\(combo: number\)/);
  assert.match(source, /playInvalid\(/);
  assert.match(source, /playOutcome\(won: boolean\)/);
  assert.match(source, /setMuted\(muted: boolean\)/);
  assert.match(source, /dispose\(\)/);
});
```

- [ ] **Step 2: Run the audio test and verify RED**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: FAIL because the audio controller does not exist.

- [ ] **Step 3: Implement the Web Audio controller**

Create:

```ts
export class MergeFoundryAudio {
  private context: AudioContext | null = null;
  private muted = false;
  async unlock(): Promise<void>;
  setMuted(muted: boolean): void;
  playSlide(): void;
  playMerge(tier: MaterialTier): void;
  playDelivery(combo: number): void;
  playInvalid(): void;
  playOutcome(won: boolean): void;
  dispose(): void;
}
```

Create the context only after `unlock()`. Use short oscillator/noise envelopes, tier-based pitches, low output gain, and guarded calls so unsupported audio never throws into gameplay. `dispose()` closes the context and clears references.

- [ ] **Step 4: Run the audio test and verify GREEN**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: audio contract and engine tests PASS.

- [ ] **Step 5: Commit audio**

```bash
git add app/playground/merge-foundry/merge-foundry-audio.ts tests/merge-foundry-engine.test.mjs
git commit -m "feat(games): add merge foundry audio"
```

### Task 4: Playable Route and Accessible Client

**Files:**
- Create: `app/playground/merge-foundry/page.tsx`
- Create: `app/playground/merge-foundry/merge-foundry-game.tsx`
- Modify: `tests/merge-foundry-engine.test.mjs`

- [ ] **Step 1: Write a failing route contract test**

```js
test("merge foundry route exposes board, orders, controls, and persistence", () => {
  const page = readFileSync("app/playground/merge-foundry/page.tsx", "utf8");
  const game = readFileSync(
    "app/playground/merge-foundry/merge-foundry-game.tsx",
    "utf8",
  );
  assert.match(page, /MergeFoundryGame/);
  assert.match(page, /metadata/);
  assert.match(game, /role="grid"/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /pointerdown|onPointerDown/);
  assert.match(game, /localStorage/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /deliverOrder/);
  assert.match(game, /undo/);
});
```

- [ ] **Step 2: Run the route test and verify RED**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: FAIL because the route and client do not exist.

- [ ] **Step 3: Create route metadata**

Implement `page.tsx` as a server component:

```tsx
import type { Metadata } from "next";
import MergeFoundryGame from "./merge-foundry-game";

export const metadata: Metadata = {
  title: "Merge Foundry | DK Coder Games",
  description: "Slide, merge, and deliver materials in a calm strategy puzzle.",
};

export default function MergeFoundryPage() {
  return <MergeFoundryGame />;
}
```

- [ ] **Step 4: Implement client state and inputs**

The client must:

- hydrate a validated saved shift and preferences after mount;
- keep a `stateRef` synchronized with React state;
- dispatch one slide at a time and lock input for the 160 ms animation;
- support arrow keys, swipe threshold of 32 px, and four labeled direction buttons;
- expose explicit Deliver buttons only when `canDeliver` is true;
- expose Undo only when `undoAvailable && undoSnapshot`;
- persist after every slide, delivery, undo, restart, mute, and motion change;
- pause input while the document is hidden;
- update high score on win or loss;
- announce concise transition text through `<output aria-live="polite">`;
- render overlays for won and lost states with restart controls;
- provide Vietnamese and English copy through `useLanguage()`.

Use stable cell keys based on board indexes and add `data-tier`, `data-spawned`, and `data-merged` attributes for CSS animation. Material labels must be visible abbreviations, not color-only blocks.

- [ ] **Step 5: Run route tests and verify GREEN**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
npx eslint app/playground/merge-foundry/page.tsx app/playground/merge-foundry/merge-foundry-game.tsx
```

Expected: route contracts PASS and ESLint exits 0.

- [ ] **Step 6: Commit playable route**

```bash
git add app/playground/merge-foundry/page.tsx app/playground/merge-foundry/merge-foundry-game.tsx tests/merge-foundry-engine.test.mjs
git commit -m "feat(games): build merge foundry game"
```

### Task 5: Responsive Theme-Aware Visual System

**Files:**
- Create: `app/playground/merge-foundry/merge-foundry.module.css`
- Modify: `tests/merge-foundry-engine.test.mjs`

- [ ] **Step 1: Write a failing style contract test**

```js
test("merge foundry styles are responsive, themed, and motion-aware", () => {
  const css = readFileSync(
    "app/playground/merge-foundry/merge-foundry.module.css",
    "utf8",
  );
  assert.match(css, /\.gamePage\s*\{[\s\S]*?--foundry-bg:\s*#f4efe5/);
  assert.match(
    css,
    /:global\(\[data-theme="dark"\]\) \.gamePage\s*\{[\s\S]*?--foundry-bg:\s*#071116/,
  );
  assert.match(css, /\.board/);
  assert.match(css, /\.tile\\[data-tier="5"\\]/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
```

- [ ] **Step 2: Run the style test and verify RED**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: FAIL because the CSS Module does not exist.

- [ ] **Step 3: Implement the approved visual design**

Define light tokens on `.gamePage` and dark overrides on `:global([data-theme="dark"]) .gamePage`. Keep `.board` dark in both themes. Implement:

- a two-column desktop layout and order-first single-column mobile layout;
- a square 5×5 CSS grid with `clamp()` sizing and no horizontal overflow;
- slate, copper, silver, teal, and gold tier treatments;
- readable tier labels and distinct borders/shapes;
- slide, merge, spawn, delivery, and outcome animations;
- disabled, hover, active, and focus-visible states;
- reduced-motion overrides that remove particles, shake, and scale transitions.

- [ ] **Step 4: Run style, engine, and lint verification**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
npx eslint app/playground/merge-foundry
```

Expected: all tests PASS and ESLint exits 0.

- [ ] **Step 5: Commit styles**

```bash
git add app/playground/merge-foundry/merge-foundry.module.css tests/merge-foundry-engine.test.mjs
git commit -m "feat(games): style merge foundry experience"
```

### Task 6: Games Hub Integration and Final Verification

**Files:**
- Modify: `app/playground/page.tsx`
- Modify: `app/playground/playground.module.css`
- Modify: `.gitignore`
- Modify: `tests/merge-foundry-engine.test.mjs`

- [ ] **Step 1: Write a failing hub integration test**

```js
test("Games hub lists and filters both playable games", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  assert.match(page, /href="\/playground\/merge-foundry"/);
  assert.match(page, /Merge Foundry/);
  assert.match(page, /Puzzle/);
  assert.match(page, /Strategy/);
  assert.match(page, /2 live games|2 game/);
});
```

- [ ] **Step 2: Run the hub test and verify RED**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
```

Expected: FAIL because the hub still contains only Neon Pulse.

- [ ] **Step 3: Refactor the hub to a game data array**

Create a `games` array with slug, title, categories, localized description,
feature badges, and visual type. Filter each card independently by normalized
query and selected category. Add Puzzle, Strategy, and Casual filter buttons,
update counts to two, and render the existing Neon Pulse plus Merge Foundry
without duplicating card markup.

Add a CSS-only foundry preview using a 4×4 mini grid, material tier colors, and
merge glow. Change `.gameGrid` to two responsive cards while retaining a
single-column layout below the existing mobile breakpoint.

- [ ] **Step 4: Ignore visual-companion artifacts**

Append this entry only if absent:

```gitignore
.superpowers/
```

- [ ] **Step 5: Run complete automated verification**

Run:

```bash
node --test tests/merge-foundry-engine.test.mjs
npx eslint app/playground/page.tsx app/playground/merge-foundry tests/merge-foundry-engine.test.mjs
npm test
npm run build
```

Expected:

- Merge Foundry tests PASS.
- Scoped ESLint exits 0.
- Full suite passes; if an unrelated pre-existing test fails, record the exact test and verify the scoped suite remains green.
- Production build completes and lists `/playground/merge-foundry` as a static route.

- [ ] **Step 6: Perform browser gameplay verification**

At `http://localhost:3000/playground/merge-foundry`, verify:

1. Arrow keys, swipe, and direction buttons produce the same deterministic slides.
2. Invalid moves do not spawn tiles.
3. A merge animates and emits the correct audio cue.
4. Eligible orders deliver, remove materials, and advance progress.
5. Undo restores board, score, orders, and seed once.
6. Reload restores the active shift.
7. Win, loss, and restart overlays work.
8. Mute and reduced motion persist.
9. Light/Dark changes shell, cards, controls, and text while the board remains dark.
10. Desktop and mobile widths have no horizontal overflow.

- [ ] **Step 7: Commit hub integration**

```bash
git add .gitignore app/playground/page.tsx app/playground/playground.module.css tests/merge-foundry-engine.test.mjs
git commit -m "feat(games): launch merge foundry"
```

- [ ] **Step 8: Review final branch state**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: no uncommitted Merge Foundry changes; unrelated user-owned Contact changes remain untouched.
