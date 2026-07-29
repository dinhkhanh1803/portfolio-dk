# Neon Breaker Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Neon Breaker to ten levels and six deterministic skills while replacing the remaining-life popup with an inline Space-to-serve flow.

**Architecture:** Extend immutable level data and pure engine state first, preserving fixed-step determinism. Add bounded Laser, Shield, and Sticky transitions to the engine, then update the Canvas client, persistence, HUD, audio, and Playground metadata. Every gameplay change starts with a failing Node test.

**Tech Stack:** Next.js App Router, React, TypeScript, Canvas 2D, CSS Modules, Web Audio API, Node test runner, ESLint.

---

### Task 1: Extend campaign and persistence to ten levels

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-levels.ts`
- Modify: `app/playground/neon-breaker/neon-breaker-engine.ts`
- Modify: `app/playground/neon-breaker/neon-breaker-storage.ts`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Write failing ten-level tests**

Change the level assertion to `LEVELS.length === 10`, verify every level has at least 20 unique bricks and a destructible route, verify clearing level ten produces `victory`, and accept persisted `unlockedLevel: 10`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because only five levels exist and storage rejects level ten.

- [ ] **Step 3: Add five explicit layouts**

Append deterministic layouts named `Prism Run`, `Reactor Grid`, `Split Horizon`, `Amber Vault`, and `Final Signal`. Keep ten columns per row and use `S`, `R`, `I`, and `.` only.

- [ ] **Step 4: Replace hard-coded level bounds**

Use `LEVELS.length` in engine validation and storage validation. Progression must enter victory only when `state.level >= LEVELS.length`.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: all campaign and persistence tests pass.

### Task 2: Add Laser, Shield, and Sticky engine mechanics

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-engine.ts`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Write failing skill tests**

Add tests proving:

```ts
applyPowerUp(state, "laser").skills.laserShots === 3
fireLaser(state).skills.laserShots === 2
applyPowerUp(state, "shield").skills.shieldCharges === 1
applyPowerUp(state, "sticky").skills.stickyArmed === true
```

Also verify Laser destroys the lowest destructible brick in the selected lane, Shield prevents one final-ball loss without consuming a life, and Sticky catches the next paddle contact until `launchBall()` releases it.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because the new power-up types and transitions do not exist.

- [ ] **Step 3: Extend engine state**

Add:

```ts
export type PowerUpType =
  | "wide"
  | "multiball"
  | "slow"
  | "laser"
  | "shield"
  | "sticky";

export type SkillState = {
  laserShots: number;
  shieldCharges: number;
  stickyArmed: boolean;
};
```

Initialize skills to `{ laserShots: 0, shieldCharges: 0, stickyArmed: false }`.

- [ ] **Step 4: Implement bounded pure transitions**

Export `fireLaser(state, worldX)`. Select a destructible, non-destroyed brick whose horizontal span contains `worldX`; choose the largest `y`, damage it, reward score, and consume one shot. Cap Laser at three shots and Shield at one charge. Sticky consumes `stickyArmed` on paddle contact and attaches that ball to the paddle.

- [ ] **Step 5: Update deterministic drops**

Keep the `hash % 7 === 0` drop frequency and choose from all six skill types using `Math.floor(hash / 7) % 6`.

- [ ] **Step 6: Implement Shield life handling**

When the final ball is lost and a shield charge exists, consume the charge, keep lives unchanged, center the paddle, attach a replacement ball, and return to `ready`.

- [ ] **Step 7: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: all six-skill tests pass.

### Task 3: Replace remaining-life popup with inline serve

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-game.tsx`
- Modify: `app/playground/neon-breaker/neon-breaker.module.css`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Write failing UI contract**

Require a `serveReason` or equivalent engine/UI distinction so the initial `ready` state may show onboarding, while a life-loss `ready` state renders no `role="dialog"`. Require bilingual inline `Space để phát bóng` / `Press Space to launch`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL because every ready state currently renders the modal.

- [ ] **Step 3: Track ready reason**

Add `readyReason: "initial" | "life-lost" | "shield" | "next-level"` to engine state. Set it in `createRun`, life loss, Shield recovery, and `startNextLevel`.

- [ ] **Step 4: Render only initial/transition overlays**

Render the ready modal only for `readyReason === "initial"` or `"next-level"`. For `"life-lost"` and `"shield"`, keep the Canvas unobscured and show a compact inline serve hint. Space, click, and touch continue to call `launchBall`.

- [ ] **Step 5: Add non-blocking serve styling**

Style the hint as a small high-contrast badge inside the arena without a full-screen backdrop. It must not intercept paddle pointer movement.

- [ ] **Step 6: Run focused tests and scoped lint**

Run:

```bash
node --test tests/neon-breaker-engine.test.mjs
npx eslint app/playground/neon-breaker
```

Expected: tests and scoped lint exit 0.

### Task 4: Connect skills to controls, HUD, Canvas, and audio

**Files:**
- Modify: `app/playground/neon-breaker/neon-breaker-game.tsx`
- Modify: `app/playground/neon-breaker/neon-breaker-audio.ts`
- Modify: `app/playground/neon-breaker/neon-breaker.module.css`
- Modify: `app/playground/page.tsx`
- Modify: `tests/neon-breaker-engine.test.mjs`

- [ ] **Step 1: Add failing integration contracts**

Require the six skill labels/symbols, `fireLaser`, ten-level HUD/card copy, and distinct audio methods for Laser, Shield, and Sticky.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: FAIL on missing UI/audio integration.

- [ ] **Step 3: Connect Space behavior**

If a ball is attached, Space launches it. Otherwise, when Laser has charges, Space fires at the paddle center. Pointer/touch firing uses the current paddle center to avoid conflicting with drag control.

- [ ] **Step 4: Render and announce six drops**

Extend Canvas colors and symbols with `L`, `◆`, and `●`. Show Laser shots, Shield charge, Sticky armed state, Wide timer, Slow timer, and active ball count in the HUD/status. Announce collection and consumption through `aria-live`.

- [ ] **Step 5: Add three audio cues**

Add `playLaser`, `playShield`, and `playSticky` using short local oscillators. Dispatch them from engine events without blocking gameplay.

- [ ] **Step 6: Update ten-level copy**

Change `/5` to `/10`, feature copy to `10 levels`, persistence selector range to ten, and descriptions to mention six skills.

- [ ] **Step 7: Run focused tests and confirm GREEN**

Run: `node --test tests/neon-breaker-engine.test.mjs`

Expected: all engine and integration contracts pass.

### Task 5: Review and final verification

**Files:**
- Modify only files implicated by verified defects.

- [ ] **Step 1: Run browser QA**

Verify desktop and 390×844 mobile: ten levels visible/unlockable, six drop symbols readable, Space launch after life loss has no modal, Laser/Shield/Sticky state is visible, mute and light/dark continue working, and no horizontal overflow or console errors occur.

- [ ] **Step 2: Request independent code review**

Review against `docs/superpowers/specs/2026-07-29-neon-breaker-expansion-design.md`. Fix all Critical and Important findings with regression tests.

- [ ] **Step 3: Run final verification**

Run:

```bash
node --test tests/neon-breaker-engine.test.mjs
npm test
npx eslint app/playground/neon-breaker app/playground/page.tsx
npm run build
git diff --check
git status --short
```

Expected: all tests pass, scoped lint exits 0, build includes `/playground/neon-breaker`, diff check is clean, and status lists only intentional expansion files.

- [ ] **Step 4: Commit**

```bash
git add app/playground/neon-breaker app/playground/page.tsx tests/neon-breaker-engine.test.mjs docs/superpowers/plans/2026-07-29-neon-breaker-expansion.md
git commit -m "feat(games): expand Neon Breaker campaign"
```
