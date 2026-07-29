# Neon Siege — Tower Defense Design

## Goal

Add the sixth playable browser game to the portfolio: a polished fixed-path tower defense game with short strategic runs, direct desktop/mobile controls, arcade audio, and full light/dark theme support.

## Player Experience

A campaign run lasts roughly 8–12 minutes. The player protects a neon core through 12 handcrafted waves on one readable map. Winning wave 12 unlocks Endless mode, where enemy health, speed, armor, and group size continue scaling until the core is destroyed.

The game must remain understandable without a tutorial modal. Build pads, ranges, targets, costs, cooldowns, wave state, and enemy traits are communicated directly in the HUD and canvas.

## Core Loop

1. Start with 20 core health and a limited Credit balance.
2. Select an empty fixed build pad and buy one of four towers.
3. Start the next wave or call it early for a Credit bonus.
4. Towers acquire targets and fire automatically while the player upgrades, sells, or activates skills.
5. Enemies reaching the core consume health according to their threat value.
6. Clearing wave 12 wins the campaign and unlocks Endless.

The simulation pauses between waves so players can plan without pressure. Pause, restart, mute, reduced-motion, and language controls follow the existing Playground conventions.

## Map and Placement

- One handcrafted fixed route with multiple bends so tower range and placement matter.
- 10–12 fixed build pads outside the route.
- Pads are large enough for reliable touch input at 390 px viewport width.
- Selecting a tower displays its range, level, stats, upgrade cost, and sell value.
- Invalid purchases remain visible but clearly disabled with the missing Credit amount.

## Towers

### Pulse

- Low cost, fast fire rate, balanced single-target damage.
- Best against basic swarms.

### Frost

- Medium cost, low damage, applies a bounded slow effect in a small area.
- Slow refreshes but does not stack multiplicatively.

### Tesla

- Medium-high cost, chains damage across nearby enemies.
- Chain count and falloff improve with upgrades.

### Railgun

- High cost, slow fire rate, long range, armor penetration, and line piercing.
- Best against tanks and bosses.

Every tower has three levels. Upgrades improve a tower’s defining identity rather than only multiplying every number. Selling refunds a fixed percentage of total invested Credits.

## Enemies and Waves

Enemy archetypes:

- Drone: baseline health and speed.
- Runner: fast, fragile.
- Tank: slow, armored.
- Splitter: releases two smaller drones when destroyed.
- Disruptor: briefly reduces nearby tower fire rate.
- Boss: large health pool, armor, and a wave-specific pulse effect.

Bosses appear on waves 4, 8, and 12. Wave definitions are deterministic and authored data. Endless mode generates bounded compositions from the completed campaign wave index.

## Active Skills

- EMP: damages and briefly stuns all active enemies.
- Overclock: temporarily increases all tower fire rates.
- Airstrike: targets a selected route area for delayed area damage.

Skills have visible cooldown rings and keyboard shortcuts, but all remain fully usable by touch. Cooldowns advance only while gameplay is active.

## Economy and Difficulty

- Credits come from kills, wave completion, and optional early-wave calls.
- Easy, Normal, and Hard adjust starting Credits, enemy scaling, and early-call reward; they do not change controls or content.
- Campaign progress stores best score, highest cleared wave, campaign completion, Endless unlock, and Endless best wave.
- Saved data is versioned and invalid records fall back safely.

## Scoring

Score rewards kills, remaining core health, unused Credits, early-wave bonuses, and campaign completion. A combo multiplier grows when enemies are defeated without a core leak and resets when an enemy reaches the core.

## Interface

- Canvas battlefield with path, pads, enemies, projectiles, particles, ranges, and impact effects.
- Compact HUD for health, Credits, wave, score, and combo.
- Bottom/side command panel adapts between desktop and mobile.
- Tower shop uses distinct icons, colors, costs, and concise role labels.
- Wave preview shows the next enemy composition.
- Campaign victory, game over, initial ready, and pause use accessible dialogs; between-wave planning remains unobstructed.
- UI copy is bilingual and theme-aware.

## Audio and Effects

Use local Web Audio oscillators/noise only—no external assets. Provide distinct cues for building, upgrading, selling, each tower family, enemy leaks, skills, wave clear, boss arrival, victory, and game over. Mute state persists.

Reduced-motion mode removes camera shake, limits particles, and shortens transitions without changing gameplay timing.

## Architecture

- `neon-siege-data.ts`: map, pads, tower definitions, enemies, campaign waves.
- `neon-siege-engine.ts`: pure deterministic state transitions, targeting, combat, economy, skills, wave flow, and Endless generation.
- `neon-siege-storage.ts`: versioned progress parsing and safe browser storage.
- `neon-siege-audio.ts`: isolated Web Audio controller.
- `neon-siege-game.tsx`: React orchestration, fixed timestep, input, accessibility, Canvas rendering, and persistence.
- `neon-siege.module.css`: responsive themed layout.

The engine must not depend on React, DOM, Canvas, audio, localStorage, or wall-clock time.

## Testing

Automated tests must cover:

- Route progress and core leaks.
- Legal pad placement, insufficient Credits, upgrades, and selling.
- All four targeting/attack identities.
- Slow bounds, Tesla chaining, Railgun piercing, armor, splitting, and disruption.
- Wave transitions, early-call bonuses, bosses, campaign victory, and deterministic Endless generation.
- EMP, Overclock, Airstrike, and cooldown behavior.
- Versioned persistence and invalid-data fallback.
- Playground route/card integration, bilingual copy, theme tokens, responsive CSS, audio cues, and accessibility contracts.

Browser QA must verify desktop and 390×844 mobile play, light/dark modes, touch placement, tower selection, all active skills, pause/resume, mute, campaign victory flow, and absence of horizontal overflow or console errors.

## Out of Scope

- Multiplayer or online leaderboards.
- User-authored maps.
- Maze-building/pathfinding around freely placed towers.
- Server persistence.
- Purchased art or audio assets.