# Neon Serpent Design

## Goal

Build Neon Serpent as the seventh playable browser game: a polished Snake roguelite with an eight-stage campaign, collectible skills, boss encounters, responsive controls, local arcade audio, and an Endless mode unlocked by completing the campaign.

The game must feel immediately familiar to a classic Snake player while avoiding the usual one-hit frustration. Runs should last roughly 6–10 minutes, support quick restarts, and remain readable in both light and dark themes.

## Player Experience

The player controls a neon serpent on a 24×16 logical grid inside a 960×640 Canvas world. Movement advances on a deterministic tick. Arrow keys and WASD change direction; touch players swipe anywhere on the arena. Opposite-direction input is rejected so the serpent cannot reverse directly into itself.

Each stage asks the player to collect a target number of Energy Cores. Eating a core:

- grows the serpent by one segment;
- grants score;
- advances a short combo timer;
- may drop a skill pickup;
- slightly increases stage pressure.

When the stage target is met, remaining hazards freeze and a portal opens. Entering the portal clears the stage and presents the next stage without reloading the route. Campaign completion after stage eight unlocks Endless permanently.

## Run Structure

### Campaign

The campaign contains eight authored stages:

1. **First Light** — open board, teaches movement and growth.
2. **Cross Current** — fixed wall islands create lanes.
3. **Twin Gates** — paired teleport portals appear.
4. **Sentinel Grid** — first boss encounter with rotating laser lanes.
5. **Tail Hunter** — a drone follows recent tail positions.
6. **Time Fracture** — timed laser tiles pulse on a visible rhythm.
7. **Closing Circuit** — the safe play area contracts in authored steps.
8. **Neon Hydra** — final boss combines lasers, portals, and pressure waves.

Stage progress is preserved only after a clear. A failed run restarts the current unlocked stage, while a new campaign can always begin from stage one.

### Endless

Endless starts with campaign-complete rules and generates deterministic obstacle/hazard phases from the current wave index. Speed, target count, laser density, and drone pressure rise within explicit caps. Every fifth wave uses a boss pattern. Endless records the highest cleared wave separately from campaign progress.

### Difficulty

- **Easy:** slower ticks, three lives, one starting Shield, generous combo window.
- **Normal:** intended balance, three lives, standard drops.
- **Hard:** faster ticks, two lives, shorter combo window, denser hazards.

Difficulty is chosen before a run and locked once the first stage begins.

## Survival and Collision Rules

The serpent is not removed by the first collision:

1. An active Shield charge absorbs the collision.
2. Otherwise one life is lost.
3. The serpent becomes briefly invulnerable, shrinks to a safe minimum length, and respawns at the stage start.
4. Zero lives enters `gameover`.

Wall, obstacle, active laser, hostile drone, and self collisions all use the same bounded damage pipeline. Portal travel and Phase prevent invalid collision checks during their active window. Respawn placement must be validated against current hazards so a player cannot immediately lose another life.

## Skills and Pickups

Five pickups can drop from Energy Cores using a deterministic schedule:

- **Shield:** absorbs one collision, maximum two charges.
- **Magnet:** pulls nearby Energy Cores toward the head for eight seconds.
- **Slow Time:** reduces world tick speed for six seconds without changing input responsiveness.
- **Phase:** ignores body, wall, and obstacle collision for four seconds; lasers and bosses still damage.
- **Score Boost:** doubles core and combo score for ten seconds.

Pickups appear on free cells, expire after a visible timeout, and never block the only traversable route. Collecting a pickup emits a distinct event for UI, audio, and live announcements.

## Bosses

Bosses are deterministic stage controllers rather than free-moving enemies.

### Sentinel Grid

Four emitters telegraph rows or columns, then fire lasers. Safe lanes always exist. The player damages the Sentinel by collecting charged cores; each charged core removes one boss shield point. At zero shield the stage portal opens.

### Neon Hydra

The Hydra has three phases:

1. alternating laser lanes;
2. portal swaps plus a tail-following drone;
3. contracting arena with radial pressure pulses.

Each phase has a fixed shield target. Damage and transitions are driven by charged cores, keeping Snake collection—not shooting—as the central mechanic.

## Scoring

Score comes from:

- core base value;
- current combo multiplier;
- charged boss cores;
- stage clear bonus;
- remaining lives and Shield charges;
- difficulty multiplier;
- Endless wave bonus.

Combo increments while cores are collected inside the combo window and resets on timeout or damage. Score arithmetic is integer-only and deterministic. Best score, highest cleared campaign stage, campaign completion, Endless unlock, and best Endless wave use a strict versioned localStorage schema.

## Architecture

### Authored Data

`neon-serpent-data.ts` owns world/grid constants, stage layouts, difficulty settings, skill definitions, and boss patterns. Data is serializable and contains no browser APIs.

### Pure Engine

`neon-serpent-engine.ts` owns immutable state transitions:

- run creation;
- direction buffering;
- fixed-tick movement;
- food and pickup spawning;
- collision/damage/respawn;
- portal travel;
- stage progression;
- hazard and boss schedules;
- skill duration and scoring;
- campaign and Endless transitions.

The engine uses deterministic IDs and a seeded pseudo-random generator stored in state. Rendering cadence cannot alter gameplay results.

### React Orchestration

`neon-serpent-game.tsx` owns:

- `requestAnimationFrame` plus fixed-step accumulator;
- keyboard, swipe, and accessible button controls;
- Canvas drawing;
- pause/restart/mute;
- difficulty and stage selection;
- focus-managed overlays;
- local persistence;
- theme observation;
- reduced-motion behavior;
- audio event dispatch.

### Adapters

`neon-serpent-audio.ts` synthesizes all cues with Web Audio and loads no external files. `neon-serpent-storage.ts` validates the versioned save record and safely handles unavailable localStorage.

## Visual Direction

The arena uses a crisp logical grid, restrained glow, rounded obstacle blocks, bright head/segment contrast, and clear telegraphs. The serpent trail fades without obscuring its actual body. Boss lasers show a warning state before becoming dangerous. Pickups use both color and symbols so they are not color-dependent.

Dark mode uses deep navy/teal surfaces and luminous accents. Light mode uses warm off-white panels, pale aqua grid lines, dark text, and reduced glow. Canvas colors are derived from the observed global theme rather than hardcoded to dark mode.

Particles, screen shake, and trail density respect `prefers-reduced-motion`. Damage feedback must remain understandable when all motion effects are disabled.

## Responsive and Accessible Controls

Desktop uses the arena with a compact HUD and command rail. Mobile preserves the 3:2 world aspect ratio, stacks controls below the Canvas, and provides minimum 44px touch targets.

All primary actions are real buttons. Four directional buttons provide a keyboard-accessible alternative to Canvas/swipe input. Status changes use `aria-live`. Pause, stage-clear, victory, and game-over overlays move focus into the dialog, trap focus, and restore it on close. Hiding the document pauses the run.

## Audio

Distinct local cues cover:

- core collection and combo tiers;
- each of the five skills;
- collision, Shield break, and life loss;
- portal open and stage clear;
- laser warning and fire;
- boss arrival, phase change, victory, and game-over.

Audio unlocks only after a user gesture, resumes when unmuted, and is disposed on unmount.

## Integration

The route is `/playground/neon-serpent`. The Playground hub gains a seventh card categorized under Arcade, Skill, Casual, and Endless, with a distinct Snake preview. Existing routes and filters remain unchanged.

## Testing and Acceptance

The Node test suite must cover:

- direction buffering and reverse rejection;
- deterministic movement across frame cadences;
- core spawning, growth, and combo scoring;
- all collision/damage/respawn paths;
- all five skills and duration caps;
- portal safety;
- each authored stage contract;
- both boss phase controllers;
- campaign victory and guarded Endless unlock;
- deterministic Endless generation;
- strict storage validation;
- audio, route, hub, theme, responsive, and accessibility source contracts.

Before completion:

- focused tests pass;
- scoped ESLint passes;
- full repository tests pass;
- production build passes;
- desktop and 390×844 browser QA pass in light and dark modes;
- representative keyboard, swipe, skill, boss, pause, and persistence flows are exercised.

## Out of Scope

- online leaderboards;
- network multiplayer;
- accounts or cloud saves;
- user-created levels;
- external art, music, or analytics;
- procedural campaign layouts.
