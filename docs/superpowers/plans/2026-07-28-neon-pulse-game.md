# Neon Pulse Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, directly playable Neon Pulse reaction game and expose it from the portfolio Games page.

**Architecture:** Keep gameplay rules in a deterministic TypeScript engine with no React or browser dependencies. Mount that engine in a client React component that owns the animation loop, Canvas renderer, input, persistence, and a separately disposable Web Audio controller. Use CSS Modules for the game and Games hub so the visual system does not leak into Tools or portfolio pages.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Canvas 2D, Web Audio API, CSS Modules, Node test runner.

---

## File Map

- Create `app/playground/neon-pulse/neon-pulse-engine.ts`: deterministic hit grading, scoring, lives, target movement, and difficulty.
- Create `app/playground/neon-pulse/neon-pulse-audio.ts`: synthesized music and feedback with safe browser fallbacks.
- Create `app/playground/neon-pulse/neon-pulse-game.tsx`: React game shell, animation loop, Canvas rendering, controls, persistence, and overlays.
- Create `app/playground/neon-pulse/neon-pulse.module.css`: responsive dark-neon presentation and reduced-motion behavior.
- Create `app/playground/neon-pulse/page.tsx`: route metadata and game mount.
- Create `app/playground/playground.module.css`: reusable Games hub presentation.
- Modify `app/playground/page.tsx`: replace the placeholder page with a bilingual playable-game catalog.
- Test `tests/neon-pulse-engine.test.mjs`: engine behavior and integration contracts.

### Task 1: Deterministic Gameplay Engine

**Files:**
- Create: `tests/neon-pulse-engine.test.mjs`
- Create: `app/playground/neon-pulse/neon-pulse-engine.ts`

- [ ] **Step 1: Write the failing engine tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  gradeHit,
  resolveHit,
  stepGame,
} from "../app/playground/neon-pulse/neon-pulse-engine.ts";

test("grades wrapped angular distance consistently", () => {
  assert.equal(gradeHit(0.01, Math.PI * 2 - 0.01, 0.18), "perfect");
  assert.equal(gradeHit(0.14, 0, 0.18), "good");
  assert.equal(gradeHit(0.4, 0, 0.18), "miss");
});

test("perfect hits grow score and combo while misses cost a life", () => {
  const initial = createGame(() => 0.25);
  const perfect = resolveHit({ ...initial, pulseAngle: initial.targetAngle }, () => 0.5);
  assert.equal(perfect.feedback, "perfect");
  assert.equal(perfect.combo, 1);
  assert.ok(perfect.score >= 100);

  const missed = resolveHit({ ...perfect, pulseAngle: perfect.targetAngle + 1 }, () => 0.5);
  assert.equal(missed.feedback, "miss");
  assert.equal(missed.combo, 0);
  assert.equal(missed.lives, 2);
});

test("difficulty rises and stepping wraps the pulse angle", () => {
  const state = { ...createGame(() => 0), elapsedMs: 45000, pulseAngle: 6.2 };
  const stepped = stepGame(state, 500);
  assert.ok(stepped.speed > state.speed);
  assert.ok(stepped.targetWidth < state.targetWidth);
  assert.ok(stepped.pulseAngle >= 0 && stepped.pulseAngle < Math.PI * 2);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `neon-pulse-engine.ts`.

- [ ] **Step 3: Implement the engine**

Define these stable public contracts:

```ts
export type HitGrade = "perfect" | "good" | "miss";
export type RunStatus = "ready" | "playing" | "paused" | "game-over";
export type GameState = {
  status: RunStatus;
  pulseAngle: number;
  targetAngle: number;
  targetWidth: number;
  speed: number;
  direction: 1 | -1;
  score: number;
  combo: number;
  bestCombo: number;
  lives: number;
  elapsedMs: number;
  feedback: HitGrade | null;
  feedbackId: number;
};

export function createGame(random = Math.random): GameState;
export function gradeHit(pulseAngle: number, targetAngle: number, targetWidth: number): HitGrade;
export function stepGame(state: GameState, deltaMs: number): GameState;
export function resolveHit(state: GameState, random = Math.random): GameState;
```

Use wrapped angular distance, `100 + combo * 12` for Perfect, `50 + combo * 6`
for Good, three starting lives, and difficulty derived from elapsed time:

```ts
const stage = Math.min(8, Math.floor(elapsedMs / 10000));
const speed = 1.45 + stage * 0.16;
const targetWidth = Math.max(0.09, 0.22 - stage * 0.014);
```

On every successful hit, move the target to `random() * Math.PI * 2`. Reverse
direction at combo milestones divisible by five. Set `status` to `game-over`
when a miss removes the final life.

- [ ] **Step 4: Run the engine tests and verify GREEN**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: 3 tests pass.

- [ ] **Step 5: Commit the engine**

```bash
git add app/playground/neon-pulse/neon-pulse-engine.ts tests/neon-pulse-engine.test.mjs
git commit -m "feat(games): add neon pulse engine"
```

### Task 2: Safe Web Audio Controller

**Files:**
- Create: `app/playground/neon-pulse/neon-pulse-audio.ts`
- Modify: `tests/neon-pulse-engine.test.mjs`

- [ ] **Step 1: Add a failing audio contract test**

```js
import { readFileSync } from "node:fs";

test("audio controller supports hit feedback, mute, and disposal", () => {
  const source = readFileSync(
    "app/playground/neon-pulse/neon-pulse-audio.ts",
    "utf8",
  );
  assert.match(source, /class NeonPulseAudio/);
  assert.match(source, /playHit\\(grade: HitGrade, combo: number\\)/);
  assert.match(source, /setMuted\\(muted: boolean\\)/);
  assert.match(source, /dispose\\(\\)/);
  assert.match(source, /AudioContext/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: the audio contract test fails because the file does not exist.

- [ ] **Step 3: Implement synthesized audio**

Export `NeonPulseAudio` with:

```ts
export class NeonPulseAudio {
  private context: AudioContext | null = null;
  private muted = false;

  async unlock() {
    if (this.muted || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext;
    this.context ??= new AudioContextClass();
    if (this.context.state === "suspended") await this.context.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  playHit(grade: HitGrade, combo: number) {
    // Create short oscillator and gain envelopes. Use ascending pentatonic
    // frequencies for Perfect, a softer fixed tone for Good, and a low
    // sawtooth cue for Miss. Never throw if audio is unavailable.
  }

  dispose() {
    void this.context?.close();
    this.context = null;
  }
}
```

Every oscillator must connect through a gain envelope, stop within 220ms, and
disconnect after its `ended` event. Wrap browser audio creation in `try/catch`
so silent fallback never interrupts gameplay.

- [ ] **Step 4: Run the targeted tests**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: 4 tests pass.

- [ ] **Step 5: Commit audio**

```bash
git add app/playground/neon-pulse/neon-pulse-audio.ts tests/neon-pulse-engine.test.mjs
git commit -m "feat(games): add neon pulse audio"
```

### Task 3: Canvas Game Shell and Route

**Files:**
- Create: `app/playground/neon-pulse/neon-pulse-game.tsx`
- Create: `app/playground/neon-pulse/page.tsx`
- Modify: `tests/neon-pulse-engine.test.mjs`

- [ ] **Step 1: Add a failing integration contract test**

```js
test("game route exposes canvas, controls, and status overlays", () => {
  const page = readFileSync("app/playground/neon-pulse/page.tsx", "utf8");
  const game = readFileSync(
    "app/playground/neon-pulse/neon-pulse-game.tsx",
    "utf8",
  );
  assert.match(page, /NeonPulseGame/);
  assert.match(page, /metadata/);
  assert.match(game, /<canvas/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /visibilitychange/);
  assert.match(game, /localStorage/);
  assert.match(game, /Space/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: route integration test fails because the route files do not exist.

- [ ] **Step 3: Create the route**

```tsx
import type { Metadata } from "next";
import NeonPulseGame from "./neon-pulse-game";

export const metadata: Metadata = {
  title: "Neon Pulse | DK Games",
  description: "A fast browser reaction game with escalating rhythm and combos.",
};

export default function NeonPulsePage() {
  return <NeonPulseGame />;
}
```

- [ ] **Step 4: Implement the client game shell**

The component must:

- initialize `createGame()` in `ready`;
- use one `requestAnimationFrame` loop with a capped delta of 50ms;
- resize Canvas using `devicePixelRatio` and `ResizeObserver`;
- render the track, target arc, pulse trail, pulse core, particles, and hit rings;
- process Space, pointer, and touch through one `attemptHit()` callback;
- avoid scoring when status is not `playing`;
- start/restart, pause/resume, and auto-pause on `visibilitychange`;
- instantiate one `NeonPulseAudio`, unlock it after input, and dispose it on unmount;
- persist `neon-pulse:high-score`, `neon-pulse:muted`, and
  `neon-pulse:reduced-motion` with validated parsing;
- render score, combo, three life indicators, current grade, elapsed time,
  pause/mute controls, ready overlay, pause overlay, and game-over overlay.

Use `aria-live="polite"` for grade feedback, a real `<button>` for every action,
and `aria-label="Neon Pulse game arena"` on the Canvas.

- [ ] **Step 5: Run the targeted tests**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: 5 tests pass.

- [ ] **Step 6: Commit route and shell**

```bash
git add app/playground/neon-pulse/page.tsx app/playground/neon-pulse/neon-pulse-game.tsx tests/neon-pulse-engine.test.mjs
git commit -m "feat(games): build neon pulse game shell"
```

### Task 4: Dark-Neon Visual System

**Files:**
- Create: `app/playground/neon-pulse/neon-pulse.module.css`
- Modify: `app/playground/neon-pulse/neon-pulse-game.tsx`
- Modify: `tests/neon-pulse-engine.test.mjs`

- [ ] **Step 1: Add a failing style contract test**

```js
test("neon pulse styles are scoped, responsive, and motion-aware", () => {
  const css = readFileSync(
    "app/playground/neon-pulse/neon-pulse.module.css",
    "utf8",
  );
  assert.match(css, /\\.gamePage/);
  assert.match(css, /\\.arena/);
  assert.match(css, /\\.hud/);
  assert.match(css, /@media \\(max-width: 760px\\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /#2a9dab/);
  assert.match(css, /#ef725f/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: style contract test fails because the CSS Module does not exist.

- [ ] **Step 3: Implement the CSS Module**

Create a centered full game surface with:

- `min-height: calc(100dvh - 116px)` and a maximum content width of 1180px;
- a two-column desktop layout for arena and run information;
- near-black glass panels, teal/cyan glow, coral miss state, and legible muted text;
- a square `.arena` bounded by `min(72dvh, 720px, 100%)`;
- compact HUD pills that do not overlap Canvas;
- overlays with `backdrop-filter` and clear primary/secondary buttons;
- a one-column mobile layout at 760px;
- reduced transitions and disabled decorative animation under
  `prefers-reduced-motion: reduce`.

Import the module into `neon-pulse-game.tsx` and map every structural element to
a scoped class.

- [ ] **Step 4: Run the targeted tests**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: 6 tests pass.

- [ ] **Step 5: Commit presentation**

```bash
git add app/playground/neon-pulse/neon-pulse.module.css app/playground/neon-pulse/neon-pulse-game.tsx tests/neon-pulse-engine.test.mjs
git commit -m "feat(games): style neon pulse experience"
```

### Task 5: Games Hub Entry Point

**Files:**
- Create: `app/playground/playground.module.css`
- Modify: `app/playground/page.tsx`
- Modify: `tests/neon-pulse-engine.test.mjs`

- [ ] **Step 1: Add a failing Games hub test**

```js
test("Games hub promotes Neon Pulse as playable", () => {
  const page = readFileSync("app/playground/page.tsx", "utf8");
  const css = readFileSync("app/playground/playground.module.css", "utf8");
  assert.match(page, /href="\\/playground\\/neon-pulse"/);
  assert.match(page, /Neon Pulse/);
  assert.match(page, /Play now|Chơi ngay/);
  assert.match(css, /\\.gameGrid/);
  assert.match(css, /\\.playButton/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: Games hub test fails because no Neon Pulse route link exists.

- [ ] **Step 3: Replace the placeholder Games page**

Build a bilingual hub using `useLanguage()` with:

- title `Trò chơi / Games`;
- a short promise that every listed game is playable in-browser;
- a featured Neon Pulse card labeled `Arcade · Reaction · Endless · Skill`;
- live status, control hints, a decorative pulse preview, and a direct Link;
- a smaller “More games coming” area that does not present unavailable games as
  clickable.

Use valid UTF-8 Vietnamese strings directly in this file, eliminating the
existing mojibake text.

- [ ] **Step 4: Implement scoped Games hub styling**

Use a responsive card grid, glass surfaces consistent with the portfolio dark
theme, teal active accents, coral highlight, visible focus, and a mobile
single-column breakpoint. Do not edit global Tool styles.

- [ ] **Step 5: Run the targeted tests**

Run: `node --test tests/neon-pulse-engine.test.mjs`

Expected: 7 tests pass.

- [ ] **Step 6: Commit the Games hub**

```bash
git add app/playground/page.tsx app/playground/playground.module.css tests/neon-pulse-engine.test.mjs
git commit -m "feat(games): launch playable games hub"
```

### Task 6: Full Verification and Browser QA

**Files:**
- Modify only files from earlier tasks if verification exposes a defect.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run lint for touched files**

Run:

```bash
npx eslint app/playground/page.tsx app/playground/neon-pulse/*.ts app/playground/neon-pulse/*.tsx
```

Expected: zero errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js reports a successful production build and includes
`/playground/neon-pulse`.

- [ ] **Step 4: Verify desktop gameplay in the browser**

At `http://localhost:3000/playground/neon-pulse`, verify:

1. Start unlocks audio and enters `playing`.
2. Space and pointer input both produce visible grades.
3. Perfect increases combo and score.
4. Miss removes a life.
5. Pause freezes pulse position and Resume continues.
6. Three misses show Game Over and restart works.
7. Refresh preserves high score and mute preference.

- [ ] **Step 5: Verify responsive and accessible behavior**

At a mobile viewport around 390x844, verify the arena fits without horizontal
scroll, all controls remain reachable, touch input works, text meets dark-theme
contrast, focus rings are visible, and reduced-motion removes shake.

- [ ] **Step 6: Commit verification fixes**

If QA required changes, stage only the Neon Pulse and Playground files and
commit:

```bash
git commit -m "fix(games): polish neon pulse gameplay"
```

If QA required no changes, do not create an empty commit.

