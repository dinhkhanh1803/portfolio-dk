# Neon Breaker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Neon Breaker as the fifth live browser game with five deterministic levels, classic Breakout physics, combo scoring, three power-ups, local audio, persistence, responsive controls, and complete Playground integration.

**Architecture:** Keep simulation in a pure TypeScript engine driven by a fixed timestep. Store immutable level data separately, while the client component owns rendering, browser input, audio, persistence, theme observation, focus management, and animation scheduling. Verify behavior through Node tests before connecting the UI.

**Tech Stack:** Next.js App Router, React, TypeScript, Canvas 2D, CSS Modules, Web Audio API, Node test runner, ESLint.

---

## File Map

- Create `app/playground/neon-breaker/neon-breaker-levels.ts`: immutable brick layouts and validation-friendly level metadata.
- Create `app/playground/neon-breaker/neon-breaker-engine.ts`: pure game state, fixed-step physics, collisions, score, combo, lives, levels, and power-ups.
- Create `app/playground/neon-breaker/neon-breaker-storage.ts`: guarded parsing and local-storage access.
- Create `app/playground/neon-breaker/neon-breaker-audio.ts`: local Web Audio cues and cleanup.
- Create `app/playground/neon-breaker/neon-breaker-game.tsx`: React orchestration, Canvas renderer, controls, HUD, overlays, focus, and theme handling.
- Create `app/playground/neon-breaker/neon-breaker.module.css`: responsive light/dark presentation and reduced-motion behavior.
- Create `app/playground/neon-breaker/page.tsx`: route metadata and game entry.
- Create `tests/neon-breaker-engine.test.mjs`: engine and integration contracts.
- Modify `app/playground/page.tsx`: fifth game card, Breakout categories, and visual preview.
- Modify `app/playground/playground.module.css`: Neon Breaker preview styling.

### Task 1: Define levels and initial state

**Files:**
- Create: `app/playground/neon-breaker/neon-breaker-levels.ts`
- Create: `app/playground/neon-breaker/neon-breaker-engine.ts`
- Test: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Write failing tests for level data and initial state**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createRun,
} from "../app/playground/neon-breaker/neon-breaker-engine.ts";
import { LEVELS } from "../app/playground/neon-breaker/neon-breaker-levels.ts";

test("defines five valid handcrafted levels", () => {
  assert.equal(LEVELS.length, 5);
  for (const level of LEVELS) {
    assert.ok(level.bricks.length >= 20);
    assert.ok(level.bricks.some((brick) => brick.kind !== "indestructible"));
    assert.equal(new Set(level.bricks.map((brick) => brick.id)).size, level.bricks.length);
  }
});

test("creates a ready three-life run with the ball attached", () => {
  const state = createRun();
  assert.equal(state.phase, "ready");
  assert.equal(state.level, 1);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
  assert.equal(state.combo, 1);
  assert.equal(state.balls.length, 1);
  assert.equal(state.balls[0].attached, true);
  assert.equal(state.paddle.x + state.paddle.width / 2, WORLD_WIDTH / 2);
  assert.ok(state.paddle.y < WORLD_HEIGHT);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because the level and engine modules do not exist.

- [ ] **Step 3: Implement immutable level data**

Define:

```ts
export type BrickKind = "standard" | "reinforced" | "indestructible";

export type LevelBrick = {
  id: string;
  kind: BrickKind;
  column: number;
  row: number;
};

export type LevelDefinition = {
  id: number;
  name: string;
  seed: number;
  bricks: readonly LevelBrick[];
};

const fromPattern = (
  id: number,
  name: string,
  seed: number,
  rows: readonly string[],
): LevelDefinition => ({
  id,
  name,
  seed,
  bricks: rows.flatMap((row, rowIndex) =>
    [...row].flatMap((cell, column) => {
      const kind = cell === "S"
        ? "standard"
        : cell === "R"
          ? "reinforced"
          : cell === "I"
            ? "indestructible"
            : null;
      return kind
        ? [{ id: `l${id}-r${rowIndex}-c${column}`, kind, row: rowIndex, column }]
        : [];
    }),
  ),
});

export const LEVELS: readonly LevelDefinition[] = [
  fromPattern(1, "First Light", 101, [
    "SSSSSSSSSS", "SSSSSSSSSS", ".SSSSSSSS.", "..SSSSSS..",
  ]),
  fromPattern(2, "Twin Gates", 211, [
    "RRSSSSSSRR", "SSS....SSS", "SSS.II.SSS", "SSSSSSSSSS",
  ]),
  fromPattern(3, "Neon Heart", 307, [
    ".SS....SS.", "SSSS..SSSS", "SSRSSSSRSS", ".SSRSSRSS.", "..SSRRSS..",
  ]),
  fromPattern(4, "Circuit Lock", 401, [
    "I.SSSSSS.I", "SSRRRRRRSS", "SS.I..I.SS", "SSRRRRRRSS", "I.SSSSSS.I",
  ]),
  fromPattern(5, "Core Fortress", 503, [
    "IRRRRRRRRI", "RSSSSSSSSR", "RSI.RR.ISR", "RSSSSSSSSR", "IRRRRRRRRI",
  ]),
];
```

Use a local `fromPattern()` helper to translate five explicit 10-column string layouts into stable brick IDs such as `l1-r2-c4`. Map `S` to standard, `R` to reinforced, `I` to indestructible, and `.` to empty.

- [ ] **Step 4: Implement initial engine types and `createRun()`**

Define constants and types:

```ts
export const WORLD_WIDTH = 900;
export const WORLD_HEIGHT = 1125;
export const FIXED_STEP_MS = 16;
export const BALL_RADIUS = 11;

export type BreakerPhase =
  | "ready"
  | "playing"
  | "paused"
  | "level-clear"
  | "gameover"
  | "victory";

export type BreakerState = {
  phase: BreakerPhase;
  level: number;
  lives: number;
  score: number;
  combo: number;
  paddle: PaddleState;
  balls: BallState[];
  bricks: BrickState[];
  drops: PowerUpDrop[];
  effects: ActiveEffects;
  elapsedMs: number;
  event: BreakerEvent;
  eventId: number;
};
```

`createRun(startingLevel = 1)` validates an optional level from one through five, loads that level, creates a centered paddle, attaches one stationary ball, initializes three lives, and creates empty drop/effect state.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 6: Commit the level and state foundation**

```bash
git add app/playground/neon-breaker/neon-breaker-levels.ts app/playground/neon-breaker/neon-breaker-engine.ts tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): add Neon Breaker level foundation"
```

### Task 2: Add launch, paddle control, pause, and fixed-step motion

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-engine.ts`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing movement and transition tests**

```js
test("launches the attached ball and clamps paddle movement", () => {
  const launched = launchBall(createRun());
  assert.equal(launched.phase, "playing");
  assert.equal(launched.balls[0].attached, false);
  assert.ok(launched.balls[0].vy < 0);

  let moved = launched;
  for (let index = 0; index < 200; index += 1) {
    moved = step(moved, FIXED_STEP_MS, { left: true, right: false, pointerX: null });
  }
  assert.equal(moved.paddle.x, 0);
});

test("fixed timestep is stable across render cadences", () => {
  const initial = launchBall(createRun());
  const single = advanceFixed(initial, 0, 480, NO_INPUT);
  let chunked = { state: initial, accumulatorMs: 0 };
  for (let index = 0; index < 8; index += 1) {
    chunked = advanceFixed(chunked.state, chunked.accumulatorMs, 60, NO_INPUT);
  }
  assert.deepEqual(chunked, single);
});

test("pause and resume preserve simulation state", () => {
  const playing = launchBall(createRun());
  const paused = pauseRun(playing);
  assert.deepEqual(step(paused, 500, NO_INPUT), paused);
  assert.equal(resumeRun(paused).phase, "playing");
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because launch, stepping, fixed advancement, and pause helpers are missing.

- [ ] **Step 3: Implement movement and phase transitions**

Add:

```ts
export type BreakerInput = {
  left: boolean;
  right: boolean;
  pointerX: number | null;
};

export function launchBall(state: BreakerState): BreakerState;
export function pauseRun(state: BreakerState): BreakerState;
export function resumeRun(state: BreakerState): BreakerState;
export function step(state: BreakerState, deltaMs: number, input: BreakerInput): BreakerState;
export function advanceFixed(
  state: BreakerState,
  accumulatorMs: number,
  deltaMs: number,
  input: BreakerInput,
): { state: BreakerState; accumulatorMs: number };
```

Use a paddle speed of 650 world units per second. Pointer input targets the paddle center and is clamped inside the arena. Attached balls follow the paddle. Launch angle alternates slightly by life and level while always traveling upward.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: movement, fixed-step, and pause tests pass.

- [ ] **Step 5: Commit deterministic controls**

```bash
git add app/playground/neon-breaker/neon-breaker-engine.ts tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): add Neon Breaker controls and timestep"
```

### Task 3: Implement wall, paddle, and brick collisions

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-engine.ts`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing collision tests**

```js
test("reflects from walls and paddle with a contact-based angle", () => {
  const playing = launchBall(createRun());
  const wall = step({
    ...playing,
    balls: [{ ...playing.balls[0], x: BALL_RADIUS + 1, vx: -500, vy: -200 }],
  }, 16, NO_INPUT);
  assert.ok(wall.balls[0].vx > 0);

  const paddle = step({
    ...playing,
    balls: [{
      ...playing.balls[0],
      x: playing.paddle.x + 15,
      y: playing.paddle.y - BALL_RADIUS - 2,
      vx: 0,
      vy: 900,
    }],
  }, 16, NO_INPUT);
  assert.ok(paddle.balls[0].vy < 0);
  assert.ok(paddle.balls[0].vx < 0);
});

test("swept brick collision damages exactly one crossed brick", () => {
  const playing = launchBall(createRun());
  const target = playing.bricks.find((brick) => brick.kind === "standard");
  const next = step({
    ...playing,
    balls: [{
      ...playing.balls[0],
      x: target.x + target.width / 2,
      y: target.y + target.height + 50,
      vx: 0,
      vy: -1200,
    }],
  }, 64, NO_INPUT);
  assert.equal(next.bricks.filter((brick) => brick.destroyed).length, 1);
  assert.ok(next.balls[0].vy > 0);
});

test("reinforced bricks require two hits and indestructible bricks never break", () => {
  const state = createRun(4);
  const reinforced = state.bricks.find((brick) => brick.kind === "reinforced");
  const indestructible = state.bricks.find((brick) => brick.kind === "indestructible");
  const firstHit = damageBrick(reinforced);
  assert.equal(firstHit.hitsRemaining, 1);
  assert.equal(damageBrick(firstHit).destroyed, true);
  assert.equal(damageBrick(indestructible).destroyed, false);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL on missing collision behavior and `damageBrick`.

- [ ] **Step 3: Implement swept collision resolution**

Add reusable helpers:

```ts
type Collision = {
  time: number;
  normalX: -1 | 0 | 1;
  normalY: -1 | 0 | 1;
  brickId: string | null;
};

function sweptCircleVsRect(ball: BallState, dx: number, dy: number, rect: Rect): Collision | null;
export function damageBrick(brick: BrickState): BrickState;
```

Resolve the earliest collision in a fixed step. Reflect on the collision normal, move through the remaining fraction, and allow only one brick damage event per ball per step. Reinforced bricks start with two hits, standard bricks with one, and indestructible bricks with `Infinity`.

- [ ] **Step 4: Add score, combo, and speed assertions**

```js
test("brick damage awards combo score and caps speed", () => {
  let state = launchBall(createRun());
  for (let index = 0; index < 12; index += 1) {
    state = rewardBrickDamage(state, "standard");
  }
  assert.ok(state.score > 1200);
  assert.equal(state.combo, 3);
  assert.ok(state.balls.every((ball) => ball.speed <= MAX_BALL_SPEED));
});
```

Export `rewardBrickDamage(state, kind)` and call it from collision resolution. Implement 100 points for standard destruction, 150 per reinforced damaging hit, `0.25x` combo growth capped at `3x`, and a ball speed cap.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: all collision, durability, score, combo, and speed tests pass.

- [ ] **Step 6: Commit collision gameplay**

```bash
git add app/playground/neon-breaker/neon-breaker-engine.ts tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): add Neon Breaker collision gameplay"
```

### Task 4: Add lives, levels, deterministic drops, and power-ups

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-engine.ts`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing life and progression tests**

```js
test("losing the last ball costs one life and resets combo", () => {
  const playing = launchBall(createRun());
  const next = step({
    ...playing,
    combo: 2.5,
    balls: [{ ...playing.balls[0], y: WORLD_HEIGHT + 50, vy: 600 }],
  }, 16, NO_INPUT);
  assert.equal(next.lives, 2);
  assert.equal(next.combo, 1);
  assert.equal(next.phase, "ready");
});

test("zero lives ends the run", () => {
  const playing = launchBall({ ...createRun(), lives: 1 });
  const next = step({
    ...playing,
    balls: [{ ...playing.balls[0], y: WORLD_HEIGHT + 50, vy: 600 }],
  }, 16, NO_INPUT);
  assert.equal(next.phase, "gameover");
});

test("clearing levels advances through level five to victory", () => {
  const destroyAll = (state) => state.bricks.map((brick) =>
    brick.kind === "indestructible"
      ? brick
      : { ...brick, destroyed: true, hitsRemaining: 0 });
  let state = createRun();
  for (let level = 1; level <= 5; level += 1) {
    state = evaluateProgress({ ...state, phase: "playing", bricks: destroyAll(state) });
    if (level < 5) {
      assert.equal(state.phase, "level-clear");
      state = startNextLevel(state);
      assert.equal(state.level, level + 1);
    }
  }
  assert.equal(state.phase, "victory");
});
```

- [ ] **Step 2: Add failing deterministic power-up tests**

```js
test("brick IDs deterministically choose bounded power-up drops", () => {
  const outcomes = LEVELS[0].bricks.map((brick) => powerUpForBrick(brick.id, LEVELS[0].seed));
  assert.deepEqual(
    outcomes,
    LEVELS[0].bricks.map((brick) => powerUpForBrick(brick.id, LEVELS[0].seed)),
  );
  assert.ok(outcomes.some((value) => value === null));
  assert.ok(outcomes.every((value) => value === null || ["wide", "multiball", "slow"].includes(value)));
});

test("wide, slow, and multiball effects stay bounded", () => {
  const base = launchBall(createRun());
  const wide = applyPowerUp(base, "wide");
  assert.ok(wide.paddle.width > base.paddle.width);
  assert.equal(wide.effects.wideRemainingMs, 10_000);

  const slow = applyPowerUp(base, "slow");
  assert.ok(slow.balls.every((ball) => ball.speed >= MIN_BALL_SPEED));
  assert.equal(slow.effects.slowRemainingMs, 7_000);

  const multi = applyPowerUp(base, "multiball");
  assert.equal(multi.balls.length, 3);
  assert.ok(applyPowerUp(multi, "multiball").balls.length <= MAX_BALLS);
});
```

- [ ] **Step 3: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL on missing life, progression, drop, and power-up behavior.

- [ ] **Step 4: Implement lives and progression**

Add:

```ts
export function evaluateProgress(state: BreakerState): BreakerState;
export function startNextLevel(state: BreakerState): BreakerState;
```

Remove balls below the arena. Only when the final ball is lost should one life be removed. Reset combo and active timed effects on life loss. At zero lives enter `gameover`. When every destructible brick is destroyed, award `500 * lives`; enter `level-clear` for levels one through four and `victory` after level five.

- [ ] **Step 5: Implement deterministic drops and effects**

Add:

```ts
export type PowerUpType = "wide" | "multiball" | "slow";
export const MAX_BALLS = 5;
export function powerUpForBrick(brickId: string, seed: number): PowerUpType | null;
export function applyPowerUp(state: BreakerState, type: PowerUpType): BreakerState;
```

Hash `brickId` and the level seed. Drop only when the hash is divisible by 7; select one of three types from the quotient. Drops fall at a constant velocity and disappear below the arena. Paddle collection applies the effect and emits an event. Decrement timed effects only in `playing`.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: all engine tests pass.

- [ ] **Step 7: Commit progression and power-ups**

```bash
git add app/playground/neon-breaker/neon-breaker-engine.ts tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): add Neon Breaker progression and powerups"
```

### Task 5: Add persistence and audio

**Files:**
- Create: `app/playground/neon-breaker/neon-breaker-storage.ts`
- Create: `app/playground/neon-breaker/neon-breaker-audio.ts`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing storage and audio contract tests**

```js
test("storage parsing accepts valid records and rejects invalid values", async () => {
  const storage = await import("../app/playground/neon-breaker/neon-breaker-storage.ts");
  assert.deepEqual(storage.parseProgress('{"bestScore":12000,"unlockedLevel":4}'), {
    bestScore: 12000,
    unlockedLevel: 4,
  });
  assert.deepEqual(
    storage.parseProgress('{"bestScore":-1,"unlockedLevel":99}'),
    storage.DEFAULT_PROGRESS,
  );
});

test("audio exposes every gameplay cue", () => {
  const source = readFileSync("app/playground/neon-breaker/neon-breaker-audio.ts", "utf8");
  for (const cue of [
    "playPaddle",
    "playWall",
    "playBrick",
    "playPowerUp",
    "playLifeLost",
    "playLevelClear",
    "playGameOver",
    "playVictory",
  ]) assert.match(source, new RegExp(cue));
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because storage and audio modules are missing.

- [ ] **Step 3: Implement guarded persistence**

Export:

```ts
export const PROGRESS_KEY = "neon-breaker:progress:v1";
export const MUTED_KEY = "neon-breaker:muted";
export const MOTION_KEY = "neon-breaker:reduced-motion";
export const DEFAULT_PROGRESS = { bestScore: 0, unlockedLevel: 1 };
export function parseProgress(raw: string | null): Progress;
export function parseBoolean(raw: string | null, fallback: boolean): boolean;
export function safeRead(key: string): string | null;
export function safeWrite(key: string, value: string): boolean;
```

Accept only safe non-negative integer scores and unlocked levels from one through five.

- [ ] **Step 4: Implement resilient Web Audio**

Create `NeonBreakerAudio` with lazy `AudioContext` creation, `unlock()`, `setMuted()`, the eight cue methods, and `dispose()`. Use short oscillators and gain envelopes; swallow construction, resume, suspend, and close failures. Unmuting calls `unlock()` immediately.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: storage and audio contracts pass.

- [ ] **Step 6: Commit browser services**

```bash
git add app/playground/neon-breaker/neon-breaker-storage.ts app/playground/neon-breaker/neon-breaker-audio.ts tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): add Neon Breaker audio and storage"
```

### Task 6: Build the game route, Canvas UI, and themed styles

**Files:**
- Create: `app/playground/neon-breaker/page.tsx`
- Create: `app/playground/neon-breaker/neon-breaker-game.tsx`
- Create: `app/playground/neon-breaker/neon-breaker.module.css`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing route and UI contracts**

```js
test("Neon Breaker route wires gameplay, input, audio, theme, and accessibility", () => {
  const page = readFileSync("app/playground/neon-breaker/page.tsx", "utf8");
  const game = readFileSync("app/playground/neon-breaker/neon-breaker-game.tsx", "utf8");
  assert.match(page, /metadata/);
  assert.match(page, /NeonBreakerGame/);
  assert.match(game, /<canvas/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /advanceFixed/);
  assert.match(game, /visibilitychange/);
  assert.match(game, /ArrowLeft/);
  assert.match(game, /onPointer/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /aria-modal="true"/);
  assert.match(game, /data-theme/);
});

test("Neon Breaker styles are responsive and motion-aware", () => {
  const css = readFileSync("app/playground/neon-breaker/neon-breaker.module.css", "utf8");
  assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(css, /:global\(\[data-theme="dark"\]\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /data-reduced-motion/);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because route, game component, and stylesheet are missing.

- [ ] **Step 3: Implement route metadata**

```tsx
import type { Metadata } from "next";
import NeonBreakerGame from "./neon-breaker-game";

export const metadata: Metadata = {
  title: "Neon Breaker | DK Coder",
  description: "A neon five-level Breakout game playable directly in your browser.",
};

export default function NeonBreakerPage() {
  return <NeonBreakerGame />;
}
```

- [ ] **Step 4: Implement React orchestration**

The client component must:

- Hydrate progress, mute, and reduced-motion preferences after mount.
- Observe `document.documentElement.dataset.theme`.
- Hold pure state, fixed-step accumulator, held keyboard input, pointer target, Canvas, audio, animation frame, event ID, trails, particles, and focus refs.
- Ignore global shortcuts when `target.closest("button, input, select, textarea, a, [contenteditable='true']")` matches.
- Pause on visibility loss and when opening a settings/new-run overlay.
- Unlock audio without blocking launch.
- Dispatch audio from engine event changes.
- Update best score and unlocked level only at level clear, game over, or victory.
- Render the arena, bricks, paddle, balls, drops, trails, particles, score popups, and theme-specific background with Canvas.
- Show bilingual HUD and overlays for ready, paused, level clear, game over, and victory.
- Move focus into overlays, trap Tab within modal overlays, expose `aria-pressed` states, and announce gameplay events in an `aria-live` region.

- [ ] **Step 5: Implement responsive CSS**

Use scoped variables for light and dark surfaces. The Canvas container uses `aspect-ratio: 4 / 5`, a maximum width suitable for desktop, and no fixed width that can overflow mobile. Add readable HUD cards, overlay buttons, focus rings, mobile control hints, and reduced-motion rules.

- [ ] **Step 6: Run focused tests, lint, and build**

Run:

```bash
node --test tests/neon-breaker-engine.test.mjs
npx eslint app/playground/neon-breaker
npm run build
```

Expected: focused tests pass, scoped lint exits 0, and `/playground/neon-breaker` appears in the build route list.

- [ ] **Step 7: Commit the playable route**

```bash
git add app/playground/neon-breaker tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): build Neon Breaker experience"
```

### Task 7: Integrate the fifth Playground card

**Files:**
- Modify: `app/playground/page.tsx`
- Modify: `app/playground/playground.module.css`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing hub contract**

```js
test("Playground promotes Neon Breaker as the fifth game", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  assert.match(page, /\/playground\/neon-breaker/);
  assert.match(page, /Neon Breaker/);
  assert.match(page, /visual:\s*"breaker"/);
  assert.match(page, /Casual/);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because the Playground has no Neon Breaker card.

- [ ] **Step 3: Add card metadata and preview markup**

Add a fifth `GameCard`:

```ts
{
  slug: "neon-breaker",
  href: "/playground/neon-breaker",
  title: "Neon Breaker",
  categories: ["Arcade", "Reaction", "Skill", "Casual"],
  categoryLabel: "ARCADE · SKILL · CASUAL",
  description: language === "vi"
    ? "Phá năm pháo đài gạch, giữ combo và thu power-up trong một vòng chơi Breakout neon."
    : "Break five brick fortresses, hold your combo, and catch power-ups in a neon Breakout run.",
  features: [
    { icon: "grid", label: "5 levels" },
    { icon: "audio", label: "Web Audio" },
    { icon: "controls", label: "Touch + Keyboard" },
  ],
  visual: "breaker",
}
```

Render a preview with two brick rows, a glowing ball, and paddle. Add scoped animation and disable it under reduced motion.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/neon-breaker-engine.test.mjs
npm test
```

Expected: all focused tests and the complete repository suite pass.

- [ ] **Step 5: Commit Playground integration**

```bash
git add app/playground/page.tsx app/playground/playground.module.css tests/neon-breaker-engine.test.mjs
git commit -m "feat(games): add Neon Breaker to Playground"
```

### Task 8: Browser QA, review, and final verification

**Files:**
- Modify only files implicated by verified defects.
- Test: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Run browser QA at desktop width**

Start `npm run dev -- --port 3001`, then verify:

- `/playground` shows five games and the Neon Breaker card.
- Arcade, Skill, Casual, and search filters find the card.
- `/playground/neon-breaker` launches a run.
- Mouse and keyboard move the paddle.
- Space launches, P pauses, and the settings overlay freezes simulation.
- Brick hits update score and combo.
- Losing the last active ball removes exactly one life.
- Mute toggles immediately.
- Light and dark theme switches redraw the arena.
- No console errors are emitted.

- [ ] **Step 2: Run browser QA at 390 × 844**

Verify no horizontal overflow, touch dragging moves the paddle, tap launches, HUD remains readable, overlays fit the viewport, and reduced motion removes decorative trails without changing gameplay.

- [ ] **Step 3: Request independent code review**

Review all changes against `docs/superpowers/specs/2026-07-29-neon-breaker-design.md`. Fix every Critical and Important finding. For each behavior defect, add a failing regression test before changing production code.

- [ ] **Step 4: Run final verification**

Run:

```bash
node --test tests/neon-breaker-engine.test.mjs
npm test
npx eslint app/playground/neon-breaker app/playground/page.tsx
npm run build
git diff --check
git status --short
```

Expected: focused tests pass, full tests pass, scoped lint exits 0, production build includes the route, diff check is clean, and status lists only intentional game changes or is clean after commits.

- [ ] **Step 5: Commit review fixes if needed**

```bash
git add app/playground/neon-breaker app/playground/page.tsx app/playground/playground.module.css tests/neon-breaker-engine.test.mjs
git commit -m "fix(games): harden Neon Breaker gameplay"
```
