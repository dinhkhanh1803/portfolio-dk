# Neon Serpent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate Neon Serpent, a deterministic Snake roguelite with an eight-stage campaign, skills, two bosses, three difficulties, and an unlockable Endless mode.

**Architecture:** Keep gameplay in a pure immutable TypeScript engine driven by fixed ticks and serializable authored data. A client React component owns input, Canvas rendering, theme observation, Web Audio, overlays, and persistence; Node tests import the engine and storage modules directly.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Canvas 2D, Web Audio, Node test runner.

---

## File Map

- Create `app/playground/neon-serpent/neon-serpent-data.ts`: grid constants, difficulty settings, skill metadata, and eight authored stage definitions.
- Create `app/playground/neon-serpent/neon-serpent-engine.ts`: deterministic run state and all pure state transitions.
- Create `app/playground/neon-serpent/neon-serpent-storage.ts`: strict versioned local progress validation and safe browser storage.
- Create `app/playground/neon-serpent/neon-serpent-audio.ts`: synthesized arcade cues with explicit lifecycle.
- Create `app/playground/neon-serpent/neon-serpent-game.tsx`: fixed-step loop, controls, Canvas renderer, HUD, menus, and overlays.
- Create `app/playground/neon-serpent/neon-serpent.module.css`: responsive light/dark presentation and reduced-motion styles.
- Create `app/playground/neon-serpent/page.tsx`: metadata and route entry.
- Create `tests/neon-serpent-engine.test.mjs`: engine, data, storage, integration, and source contracts.
- Modify `app/playground/page.tsx`: seventh card, categories, copy, and serpent preview.
- Modify `app/playground/playground.module.css`: serpent card preview.

### Task 1: Authored game data

**Files:**
- Create: `app/playground/neon-serpent/neon-serpent-data.ts`
- Test: `tests/neon-serpent-engine.test.mjs`

- [ ] **Step 1: Write the failing authored-data test**

```js
test("defines a 24x16 board, three difficulties, five skills, and eight stages", () => {
  assert.deepEqual(GRID, { columns: 24, rows: 16, width: 960, height: 640 });
  assert.deepEqual(Object.keys(DIFFICULTIES).sort(), ["easy", "hard", "normal"]);
  assert.deepEqual(Object.keys(SKILLS).sort(), ["magnet", "phase", "scoreBoost", "shield", "slowTime"]);
  assert.equal(STAGES.length, 8);
  assert.deepEqual(STAGES.filter((stage) => stage.boss).map((stage) => stage.id), [4, 8]);
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `neon-serpent-data.ts`.

- [ ] **Step 3: Add serializable definitions**

```ts
export const GRID = { columns: 24, rows: 16, width: 960, height: 640 } as const;
export type Difficulty = "easy" | "normal" | "hard";
export type SkillType = "shield" | "magnet" | "slowTime" | "phase" | "scoreBoost";
export type HazardKind = "wall" | "portal" | "laser" | "hunter" | "contract";
export type Cell = { x: number; y: number };
export type StageDefinition = {
  id: number;
  name: string;
  target: number;
  tickMs: number;
  hazards: HazardKind[];
  walls: Cell[];
  boss?: "sentinel" | "hydra";
};

export const DIFFICULTIES = {
  easy: { lives: 3, speedScale: 1.14, comboMs: 3800, startingShield: 1, hazardScale: 0.82 },
  normal: { lives: 3, speedScale: 1, comboMs: 3000, startingShield: 0, hazardScale: 1 },
  hard: { lives: 2, speedScale: 0.86, comboMs: 2300, startingShield: 0, hazardScale: 1.2 },
} as const;

export const SKILLS = {
  shield: { durationMs: 0, maxCharges: 2 },
  magnet: { durationMs: 8000, maxCharges: 1 },
  slowTime: { durationMs: 6000, maxCharges: 1 },
  phase: { durationMs: 4000, maxCharges: 1 },
  scoreBoost: { durationMs: 10000, maxCharges: 1 },
} as const;
```

Add eight explicit `StageDefinition` records, with fixed wall cells and the hazard/boss contracts from the approved design.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: PASS for the authored-data contract.

- [ ] **Step 5: Commit**

```bash
git add app/playground/neon-serpent/neon-serpent-data.ts tests/neon-serpent-engine.test.mjs
git commit -m "feat(games): define Neon Serpent stages"
```

### Task 2: Deterministic movement, cores, and damage

**Files:**
- Create: `app/playground/neon-serpent/neon-serpent-engine.ts`
- Modify: `tests/neon-serpent-engine.test.mjs`

- [ ] **Step 1: Write failing movement and collision tests**

```js
test("moves one cell per tick and rejects a direct reverse", () => {
  const run = createSerpentRun("normal", 1, 42);
  const reversed = queueDirection(run, "left");
  assert.equal(reversed.queuedDirection, "right");
  const moved = stepSerpent(queueDirection(run, "up"), run.tickMs);
  assert.deepEqual(moved.snake[0], { x: run.snake[0].x, y: run.snake[0].y - 1 });
});

test("eating a core grows the snake and deterministic seeds reproduce state", () => {
  const first = createSerpentRun("normal", 1, 91);
  const staged = { ...first, core: { ...first.snake[0], x: first.snake[0].x + 1 } };
  const eaten = stepSerpent(staged, staged.tickMs);
  assert.equal(eaten.snake.length, staged.snake.length + 1);
  assert.equal(eaten.coresCollected, 1);
  assert.deepEqual(createSerpentRun("normal", 1, 91), first);
});

test("shield absorbs damage before lives and respawn is safe", () => {
  const run = createSerpentRun("easy", 1, 7);
  const crashed = { ...run, snake: [{ x: 23, y: 8 }], direction: "right", queuedDirection: "right" };
  const shielded = stepSerpent(crashed, crashed.tickMs);
  assert.equal(shielded.shieldCharges, 0);
  assert.equal(shielded.lives, run.lives);
  assert.ok(shielded.snake.every((cell) => !isDangerousCell(shielded, cell)));
});
```

- [ ] **Step 2: Run tests and verify missing exports**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: FAIL because `createSerpentRun`, `queueDirection`, `stepSerpent`, and `isDangerousCell` are not exported.

- [ ] **Step 3: Implement the immutable run state**

```ts
export type Direction = "up" | "down" | "left" | "right";
export type RunPhase = "ready" | "playing" | "paused" | "stageClear" | "victory" | "gameover";
export type SerpentRun = {
  difficulty: Difficulty;
  mode: "campaign" | "endless";
  phase: RunPhase;
  stage: number;
  wave: number;
  snake: Cell[];
  direction: Direction;
  queuedDirection: Direction;
  core: Cell;
  pickups: Pickup[];
  lives: number;
  shieldCharges: number;
  score: number;
  combo: number;
  comboRemainingMs: number;
  coresCollected: number;
  target: number;
  tickMs: number;
  accumulatorMs: number;
  invulnerableMs: number;
  effects: Record<Exclude<SkillType, "shield">, number>;
  boss: BossState | null;
  seed: number;
  nextId: number;
  event: SerpentEvent | null;
};
```

Implement seeded `nextRandom`, bounded free-cell spawning, reverse rejection, fixed-tick accumulation, growth, combo arithmetic, collision classification, shield/life damage, minimum-length respawn, and `gameover`.

- [ ] **Step 4: Run movement and damage tests**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: PASS for data, movement, core, deterministic seed, and damage tests.

- [ ] **Step 5: Commit**

```bash
git add app/playground/neon-serpent/neon-serpent-engine.ts tests/neon-serpent-engine.test.mjs
git commit -m "feat(games): add Neon Serpent core engine"
```

### Task 3: Skills, hazards, bosses, and mode progression

**Files:**
- Modify: `app/playground/neon-serpent/neon-serpent-engine.ts`
- Modify: `tests/neon-serpent-engine.test.mjs`

- [ ] **Step 1: Write failing progression tests**

```js
test("all five pickups apply bounded effects", () => {
  for (const type of ["shield", "magnet", "slowTime", "phase", "scoreBoost"]) {
    const run = createSerpentRun("normal", 1, 5);
    const pickup = { id: 1, type, cell: { ...run.snake[0] }, expiresMs: 5000 };
    const next = collectPickup({ ...run, pickups: [pickup] }, pickup.id);
    if (type === "shield") assert.equal(next.shieldCharges, 1);
    else assert.equal(next.effects[type], SKILLS[type].durationMs);
  }
});

test("campaign stage eight unlocks Endless and locked Endless is guarded", () => {
  const fresh = createSerpentRun("normal", 1, 2);
  assert.equal(startEndless(fresh, false), fresh);
  const final = { ...createSerpentRun("normal", 8, 2), phase: "stageClear" };
  const victory = advanceStage(final);
  assert.equal(victory.phase, "victory");
  assert.equal(victory.campaignComplete, true);
  assert.equal(startEndless(victory, true).mode, "endless");
});

test("Sentinel and Hydra phases are deterministic", () => {
  const sentinel = createSerpentRun("normal", 4, 55);
  const hydra = createSerpentRun("normal", 8, 55);
  assert.deepEqual(stepSerpent(sentinel, 5000).boss, stepSerpent(sentinel, 5000).boss);
  assert.ok(stepSerpent(hydra, 12000).boss.phase >= hydra.boss.phase);
});
```

- [ ] **Step 2: Run tests and verify missing progression**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: FAIL for pickup collection, boss schedules, and campaign/Endless transitions.

- [ ] **Step 3: Implement the five pickups and authored hazards**

Add `collectPickup`, effect countdown, Magnet core attraction, Slow Time tick scaling, Phase collision bypass, Score Boost scoring, deterministic pickup drops, paired portals with teleport cooldown, warning/fire laser cadence, tail-position hunter, and authored contraction boundaries. Each hazard reads stage data and emits a semantic event.

- [ ] **Step 4: Implement bosses and progression**

Add Sentinel shield damage from charged cores and telegraphed alternating laser lanes. Add Hydra's three deterministic phases: laser lanes, portal-plus-hunter, and contraction-plus-pressure. Add `openPortal`, `advanceStage`, `startEndless`, and capped `generateEndlessStage(wave, difficulty, seed)`; every fifth Endless wave is a boss pattern.

- [ ] **Step 5: Run all engine tests**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: PASS for all data, engine, skill, hazard, boss, campaign, and Endless tests.

- [ ] **Step 6: Commit**

```bash
git add app/playground/neon-serpent/neon-serpent-engine.ts tests/neon-serpent-engine.test.mjs
git commit -m "feat(games): add Neon Serpent campaign systems"
```

### Task 4: Persistence and audio adapters

**Files:**
- Create: `app/playground/neon-serpent/neon-serpent-storage.ts`
- Create: `app/playground/neon-serpent/neon-serpent-audio.ts`
- Modify: `tests/neon-serpent-engine.test.mjs`

- [ ] **Step 1: Write failing storage and audio source tests**

```js
test("progress parser accepts only consistent version-one records", () => {
  const valid = { version: 1, bestScore: 900, highestStage: 8, campaignComplete: true, endlessUnlocked: true, bestEndlessWave: 9 };
  assert.deepEqual(parseProgress(JSON.stringify(valid)), valid);
  assert.deepEqual(parseProgress('{"version":2}'), DEFAULT_PROGRESS);
  assert.deepEqual(parseProgress('{"version":1,"bestScore":-1}'), DEFAULT_PROGRESS);
});

test("audio adapter exposes unlock, mute, event, and dispose lifecycle", async () => {
  const source = await readFile(new URL("../app/playground/neon-serpent/neon-serpent-audio.ts", import.meta.url), "utf8");
  for (const token of ["unlock()", "setMuted(", "play(", "dispose()"]) assert.match(source, new RegExp(token.replace(/[()]/g, "\\$&")));
});
```

- [ ] **Step 2: Run tests and verify missing adapter modules**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: FAIL with missing storage/audio modules.

- [ ] **Step 3: Implement strict storage**

```ts
export const PROGRESS_KEY = "neon-serpent:progress:v1";
export const MUTED_KEY = "neon-serpent:muted";
export type SerpentProgress = {
  version: 1;
  bestScore: number;
  highestStage: number;
  campaignComplete: boolean;
  endlessUnlocked: boolean;
  bestEndlessWave: number;
};
export const DEFAULT_PROGRESS: SerpentProgress = {
  version: 1, bestScore: 0, highestStage: 1,
  campaignComplete: false, endlessUnlocked: false, bestEndlessWave: 0,
};
```

Implement `parseProgress`, `safeRead`, and `safeWrite`, rejecting negative/non-integer scores, stages outside 1-8, waves above 999, and Endless unlock without campaign completion.

- [ ] **Step 4: Implement local synthesized audio**

Create `createSerpentAudio()` returning `{ unlock, setMuted, play, dispose }`. Use one lazily created `AudioContext`, oscillator/gain envelopes for core, combo, five skill cues, shield, damage, laser, portal, boss, clear, victory, and game-over; disconnect nodes and close the context in `dispose`.

- [ ] **Step 5: Run adapter tests**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: PASS including malformed storage and audio lifecycle contracts.

- [ ] **Step 6: Commit**

```bash
git add app/playground/neon-serpent/neon-serpent-storage.ts app/playground/neon-serpent/neon-serpent-audio.ts tests/neon-serpent-engine.test.mjs
git commit -m "feat(games): persist and score Neon Serpent runs"
```

### Task 5: Canvas game UI and responsive route

**Files:**
- Create: `app/playground/neon-serpent/neon-serpent-game.tsx`
- Create: `app/playground/neon-serpent/neon-serpent.module.css`
- Create: `app/playground/neon-serpent/page.tsx`
- Modify: `tests/neon-serpent-engine.test.mjs`

- [ ] **Step 1: Write failing UI source contracts**

```js
test("game UI provides Canvas, all inputs, theme, audio, pause, and accessible status", async () => {
  const source = await readFile(new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url), "utf8");
  for (const token of [
    "<canvas", "requestAnimationFrame", "ArrowUp", "KeyW", "touchstart",
    "MutationObserver", "prefers-reduced-motion", "aria-live", "visibilitychange",
    "Pause", "Restart", "Mute"
  ]) assert.match(source, new RegExp(token));
});
```

- [ ] **Step 2: Run tests and verify the UI module is missing**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: FAIL with missing `neon-serpent-game.tsx`.

- [ ] **Step 3: Implement React orchestration and controls**

Create a client component with a `SerpentRun` ref, fixed-step `requestAnimationFrame` accumulator, keyboard listener for arrows/WASD/Space/Escape, swipe gesture detection, four 44px directional buttons, new run/difficulty/stage controls, pause/restart/mute actions, safe progress writes, document visibility pause, `aria-live` status, and focus-managed dialog overlays.

- [ ] **Step 4: Implement Canvas rendering**

Draw theme-derived background/grid, walls, portals, laser warnings/firing, contraction mask, hunter, cores, five symbol-coded pickups, snake body/head/eyes, combo trail, particles, portal, Sentinel, Hydra, and HUD indicators. Clamp device pixel ratio, scale logical coordinates to the rendered Canvas, and disable shake/trail density when reduced motion is requested.

- [ ] **Step 5: Implement responsive themed CSS and route**

```tsx
import type { Metadata } from "next";
import NeonSerpentGame from "./neon-serpent-game";

export const metadata: Metadata = {
  title: "Neon Serpent | DK Coder",
  description: "A neon Snake roguelite campaign with skills, bosses, and an unlockable Endless mode.",
};

export default function NeonSerpentPage() {
  return <NeonSerpentGame />;
}
```

Use component-local CSS variables with readable light/dark surfaces, a 3:2 arena, responsive stacked controls below 720px, minimum 44px buttons, visible focus, non-color pickup labels, and `prefers-reduced-motion`.

- [ ] **Step 6: Run focused tests and scoped lint**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: PASS.

Run: `npx eslint app/playground/neon-serpent tests/neon-serpent-engine.test.mjs`

Expected: exit 0 with no errors.

- [ ] **Step 7: Commit**

```bash
git add app/playground/neon-serpent tests/neon-serpent-engine.test.mjs
git commit -m "feat(games): build Neon Serpent interface"
```

### Task 6: Playground integration and end-to-end verification

**Files:**
- Modify: `app/playground/page.tsx`
- Modify: `app/playground/playground.module.css`
- Modify: `tests/neon-serpent-engine.test.mjs`

- [ ] **Step 1: Write the failing hub integration test**

```js
test("Playground exposes Neon Serpent as the seventh live game", async () => {
  const page = await readFile(new URL("../app/playground/page.tsx", import.meta.url), "utf8");
  assert.match(page, /slug: "neon-serpent"/);
  assert.match(page, /href: "\/playground\/neon-serpent"/);
  assert.match(page, /visual: "serpent"/);
  assert.match(page, /Neon Serpent/);
});
```

- [ ] **Step 2: Run the test and verify the card is absent**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: FAIL because the hub has no Neon Serpent card.

- [ ] **Step 3: Add the seventh game card and visual**

Extend `GameCard["visual"]` with `"serpent"`, add bilingual copy and Arcade/Skill/Casual/Endless categories, then render a distinct mini-grid snake preview. Add scoped `.serpentVisual`, `.serpentPreview`, segment, head, core, and obstacle styles that work in both themes.

- [ ] **Step 4: Run automated verification**

Run: `node --test tests/neon-serpent-engine.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all repository tests pass.

Run: `npx eslint app/playground/neon-serpent app/playground/page.tsx tests/neon-serpent-engine.test.mjs`

Expected: exit 0 with no errors.

Run: `npm run build`

Expected: production build succeeds and includes `/playground/neon-serpent`.

- [ ] **Step 5: Run browser QA**

Open `/playground` and verify the seventh card, filtering, and navigation. On `/playground/neon-serpent`, exercise keyboard and swipe input, all five pickups, collision/shield/respawn, stage clear, pause/restart/mute, light/dark theme, reduced motion, 390x844 layout, Sentinel, Hydra, campaign victory, persisted refresh, and guarded/unlocked Endless.

- [ ] **Step 6: Commit**

```bash
git add app/playground/page.tsx app/playground/playground.module.css tests/neon-serpent-engine.test.mjs
git commit -m "feat(games): publish Neon Serpent"
```

