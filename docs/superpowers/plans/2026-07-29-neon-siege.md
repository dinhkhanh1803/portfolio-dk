# Neon Siege Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Neon Siege as the sixth polished browser game: a deterministic fixed-path tower defense campaign with 12 waves, four towers, three active skills, Endless mode, responsive Canvas UI, audio, persistence, and Playground integration.

**Architecture:** Keep authored map/wave data separate from a pure fixed-step engine. React owns input, animation, accessibility, persistence, and Canvas drawing; audio and storage remain isolated adapters. All gameplay rules are testable without DOM or timing dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Canvas 2D, Web Audio API, CSS Modules, Node test runner, ESLint.

---

## File Map

- Create `app/playground/neon-siege/neon-siege-data.ts`: route, build pads, tower/enemy definitions, and 12 authored waves.
- Create `app/playground/neon-siege/neon-siege-engine.ts`: immutable deterministic game state and transitions.
- Create `app/playground/neon-siege/neon-siege-storage.ts`: versioned progress validation and safe localStorage helpers.
- Create `app/playground/neon-siege/neon-siege-audio.ts`: local oscillator/noise sound controller.
- Create `app/playground/neon-siege/neon-siege-game.tsx`: React orchestration, input, Canvas rendering, HUD, dialogs, and persistence.
- Create `app/playground/neon-siege/neon-siege.module.css`: responsive light/dark game layout.
- Create `app/playground/neon-siege/page.tsx`: route metadata and game entry.
- Create `tests/neon-siege-engine.test.mjs`: gameplay, storage, route, style, audio, and hub contracts.
- Modify `app/playground/page.tsx`: sixth playable game card and filters.

### Task 1: Authored Map, Towers, Enemies, and Waves

**Files:**
- Create: `app/playground/neon-siege/neon-siege-data.ts`
- Create: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Write the failing data contract tests**

Create tests that import `ROUTE`, `BUILD_PADS`, `TOWER_DEFINITIONS`, `ENEMY_DEFINITIONS`, and `CAMPAIGN_WAVES`. Assert a continuous route with at least six points, 10–12 unique pads outside the route, four tower keys (`pulse`, `frost`, `tesla`, `railgun`), six enemy keys, exactly 12 waves, and bosses on waves 4, 8, and 12.

```js
assert.equal(CAMPAIGN_WAVES.length, 12);
assert.deepEqual(Object.keys(TOWER_DEFINITIONS).sort(), ["frost", "pulse", "railgun", "tesla"]);
assert.ok([4, 8, 12].every((wave) => CAMPAIGN_WAVES[wave - 1].groups.some((group) => group.type === "boss")));
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/neon-siege-engine.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `neon-siege-data.ts`.

- [ ] **Step 3: Implement typed authored data**

Define `Point`, `BuildPad`, `TowerType`, `EnemyType`, `TowerDefinition`, `EnemyDefinition`, `WaveGroup`, and `WaveDefinition`. Use a 960×640 world, a multi-bend fixed route, 12 pads, three levels per tower, and deterministic group spawn timing.

- [ ] **Step 4: Run focused tests and commit**

Run: `node --test tests/neon-siege-engine.test.mjs`
Expected: PASS for data contracts.

Commit: `feat(games): define Neon Siege battlefield`

### Task 2: Core State, Economy, and Tower Management

**Files:**
- Create: `app/playground/neon-siege/neon-siege-engine.ts`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing economy tests**

Test `createSiegeRun`, `buildTower`, `upgradeTower`, `sellTower`, and `selectPad`. Cover starting health/Credits, occupied pads, insufficient Credits, three-level cap, and refund based on total investment.

```js
const run = createSiegeRun("normal");
const built = buildTower(run, BUILD_PADS[0].id, "pulse");
assert.equal(built.towers.length, 1);
assert.ok(built.credits < run.credits);
assert.equal(buildTower(built, BUILD_PADS[0].id, "frost"), built);
```

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL because `neon-siege-engine.ts` does not exist.

- [ ] **Step 3: Implement immutable state transitions**

Define `SiegePhase`, `Difficulty`, `SiegeState`, `TowerState`, `EnemyState`, `ProjectileState`, `SkillState`, and `SiegeEvent`. `createSiegeRun` must initialize planning phase, wave 0, 20 health, difficulty-scaled Credits, empty towers/enemies/projectiles, score 0, combo 1, and bounded skill cooldowns.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and `npx eslint app/playground/neon-siege tests/neon-siege-engine.test.mjs`.
Expected: PASS with no lint errors.

Commit: `feat(games): add Neon Siege economy`

### Task 3: Route Movement, Targeting, and Core Leaks

**Files:**
- Modify: `app/playground/neon-siege/neon-siege-engine.ts`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing movement tests**

Test route distance interpolation, deterministic spawn order, target policies, and leaks. An enemy reaching the final route point must be removed and subtract exactly its `threat` from core health; zero health enters `gameover`.

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL because `stepSiege` and `spawnEnemy` are missing.

- [ ] **Step 3: Implement fixed-step movement and targeting**

Use route segment lengths and total progress rather than per-pixel pathfinding. Clamp delta to the fixed step. Towers target the active enemy with greatest route progress inside range. Emit deterministic IDs and events.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests.
Expected: PASS for movement/leak contracts.

Commit: `feat(games): simulate Neon Siege enemies`

### Task 4: Four Tower Identities and Enemy Traits

**Files:**
- Modify: `app/playground/neon-siege/neon-siege-engine.ts`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing combat tests**

Cover Pulse fire cadence, Frost bounded slow/area damage, Tesla chain count/falloff, Railgun line piercing/armor penetration, Tank armor, Splitter children, and Disruptor fire-rate debuff. Assert damage, kill reward, score, combo, and cooldown results with exact deterministic state.

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL on missing combat transitions.

- [ ] **Step 3: Implement combat**

Advance tower cooldowns only during `playing`. Create projectiles/events for visuals while applying deterministic hits in the engine. Clamp slow and disruption, cap chain targets, and prevent one enemy from rewarding Credits twice.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and scoped ESLint.
Expected: PASS.

Commit: `feat(games): implement Neon Siege combat`

### Task 5: Campaign Waves, Bosses, Early Calls, Skills, and Endless

**Files:**
- Modify: `app/playground/neon-siege/neon-siege-engine.ts`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing progression tests**

Cover `startWave`, group schedules, planning transitions, early-call Credit bonus, boss waves, wave-12 victory, Endless unlock, deterministic generated groups, and scaling caps.

Add tests for `activateEmp`, `activateOverclock`, and `queueAirstrike`: EMP damages/stuns active enemies, Overclock changes tower cadence for a fixed duration, Airstrike applies delayed area damage at a clamped route location, and all cooldowns pause outside gameplay.

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL on missing wave/skill APIs.

- [ ] **Step 3: Implement campaign and skills**

Use authored campaign groups through wave 12. `startWave` changes planning to playing; clearing active enemies and pending groups returns to planning or victory. `startEndless` is allowed only after campaign completion. Endless generation must use a pure seeded formula based on wave index and difficulty.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests.
Expected: PASS.

Commit: `feat(games): add Neon Siege campaign`

### Task 6: Versioned Progress Storage

**Files:**
- Create: `app/playground/neon-siege/neon-siege-storage.ts`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing persistence tests**

Test valid v1 records and rejection of negative scores, invalid difficulty, impossible waves, wrong version, malformed JSON, and non-object values.

```js
assert.deepEqual(parseSiegeProgress('{"version":1,"bestScore":9000,"highestWave":12,"campaignComplete":true,"endlessUnlocked":true,"bestEndlessWave":18}'), expected);
```

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL because storage module is missing.

- [ ] **Step 3: Implement safe storage adapter**

Export constants, `DEFAULT_SIEGE_PROGRESS`, `parseSiegeProgress`, `safeRead`, and `safeWrite`. Keep all browser access guarded and never throw on private-mode failures.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests.
Expected: PASS.

Commit: `feat(games): persist Neon Siege progress`

### Task 7: Local Arcade Audio

**Files:**
- Create: `app/playground/neon-siege/neon-siege-audio.ts`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing audio contract tests**

Require `unlock`, `setMuted`, `dispose`, build/upgrade/sell cues, four tower cues, leak, three skill cues, wave clear, boss, victory, and game-over methods.

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL because audio module is missing.

- [ ] **Step 3: Implement Web Audio controller**

Create/reuse one AudioContext, synthesize short oscillators and noise, resume on user gesture, suspend when muted, and disconnect/close on disposal. Do not load external assets.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and scoped ESLint.
Expected: PASS.

Commit: `feat(games): add Neon Siege audio`

### Task 8: React Canvas Game and Responsive UI

**Files:**
- Create: `app/playground/neon-siege/neon-siege-game.tsx`
- Create: `app/playground/neon-siege/neon-siege.module.css`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing UI/style contracts**

Require Canvas, fixed-step animation, pointer/touch handlers, tower shop, selected-tower panel, wave preview, skill buttons/cooldowns, difficulty selector, dialogs, pause/restart/mute, reduced motion, bilingual copy, `aria-live`, focus management, theme tokens, 390 px media rules, and no fixed minimum width.

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL because game and stylesheet are missing.

- [ ] **Step 3: Implement orchestration and renderer**

Drive the pure engine with `requestAnimationFrame` and a fixed accumulator. Draw path, core, pads, towers, ranges, enemies, health bars, projectiles, Airstrike target, particles, selection, and light/dark variants. Map clicks/taps to pads and route positions. Use buttons for all build/upgrade/sell/skill actions so keyboard users do not depend on Canvas hit-testing.

- [ ] **Step 4: Implement responsive CSS and accessibility**

Desktop uses battlefield plus command rail; mobile stacks the Canvas above horizontally wrapped controls. Keep touch targets at least 42 px. Respect global theme and reduced-motion state. Trap focus only in real modal states and pause on visibility loss.

- [ ] **Step 5: Verify GREEN and commit**

Run focused tests and scoped ESLint.
Expected: PASS.

Commit: `feat(games): build Neon Siege interface`

### Task 9: Route and Playground Integration

**Files:**
- Create: `app/playground/neon-siege/page.tsx`
- Modify: `app/playground/page.tsx`
- Modify: `tests/neon-siege-engine.test.mjs`

- [ ] **Step 1: Add failing integration contracts**

Require `/playground/neon-siege`, title `Neon Siege`, `Tower Defense`, `Strategy`, a sixth playable card, and Vietnamese/English descriptions mentioning 12 waves and Endless.

- [ ] **Step 2: Verify RED**

Run focused tests.
Expected: FAIL because route/card are absent.

- [ ] **Step 3: Add route metadata and hub card**

Export bilingual metadata consistent with existing game pages and add a distinct tower-defense visual variant to the hub without changing existing game URLs.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests.
Expected: PASS.

Commit: `feat(games): publish Neon Siege`

### Task 10: Review and Final Verification

**Files:**
- Review all Neon Siege files and `app/playground/page.tsx`.

- [ ] **Step 1: Request code review**

Review spec alignment, deterministic engine behavior, tower/enemy interactions, touch controls, focus/dialog behavior, theme contrast, mobile overflow, performance, and persistence validation. Fix every Critical/Important issue with a failing regression test first.

- [ ] **Step 2: Run focused verification**

Run: `node --test tests/neon-siege-engine.test.mjs`
Expected: all Neon Siege tests pass.

Run: `npx eslint app/playground/neon-siege app/playground/page.tsx tests/neon-siege-engine.test.mjs`
Expected: exit 0.

Run: `git diff --check`
Expected: exit 0.

- [ ] **Step 3: Run repository verification**

Run: `npm test`
Expected: all tests pass.

Run: `npm run build`
Expected: production build and TypeScript pass.

- [ ] **Step 4: Browser QA**

Verify desktop and 390×844 mobile in light and dark modes. Complete representative build/upgrade/sell actions, activate all three skills, reach a boss via deterministic setup or normal play, test pause/visibility/mute, inspect dialogs/focus, and confirm no horizontal overflow or console errors.

- [ ] **Step 5: Commit final fixes**

Commit: `fix(games): polish Neon Siege gameplay`