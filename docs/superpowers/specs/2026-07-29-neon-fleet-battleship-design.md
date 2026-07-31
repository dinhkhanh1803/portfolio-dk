# Neon Fleet — Battleship Classic Design

## Goal

Build the eighth playable portfolio game as a polished browser version of classic Battleship. The game is a single-player match against AI, uses the standard 10×10 board and five-ship fleet, and stays focused on placement, deduction, and alternating shots. It must feel consistent with the existing neon game collection while remaining readable in both light and dark themes.

## Product Scope

### Included

- One player versus AI.
- Easy, Normal, and Hard AI difficulties.
- Standard fleet:
  - Carrier: 5 cells
  - Battleship: 4 cells
  - Cruiser: 3 cells
  - Submarine: 3 cells
  - Destroyer: 2 cells
- Placement phase with manual placement, rotation, auto-place, and reset.
- Alternating player and AI turns.
- Clear miss, hit, sunk, victory, and defeat states.
- Match log, remaining-fleet indicators, restart, mute, and persistent statistics.
- Responsive mouse, touch, and keyboard-accessible controls.
- Light and dark theme support.
- Reduced-motion support.
- Local deterministic game engine and AI with no network dependency.

### Excluded

- Multiplayer, accounts, matchmaking, chat, leaderboards, and servers.
- Power-ups, cooldown skills, special weapons, or non-classic ship abilities.
- Purchases, ads, daily rewards, and unlock progression.
- Ship movement after the battle starts.

## Core Rules

The game uses two independent 10×10 boards. Ships occupy straight horizontal or vertical runs, cannot overlap, and must stay inside the board. Adjacent ships are allowed, matching common Battleship rules.

The player completes placement before combat can begin. During combat, the player selects one untried enemy cell. The game resolves that shot, displays its outcome, then lets the AI take exactly one shot after a short presentation delay. A hit does not grant an extra turn. Previously targeted cells cannot be selected again.

A ship is sunk when all its cells have been hit. A side loses when all five ships are sunk. The result screen reports duration, shots, hits, accuracy, and ships remaining.

## Match Flow

1. **Setup**
   - Choose Easy, Normal, or Hard.
   - Select a ship from the dock.
   - Preview placement on hover or touch.
   - Rotate with a button, right click, or `R`.
   - Place all ships manually or use Auto-place.
   - Start battle only when the fleet is valid and complete.

2. **Player turn**
   - Enemy board is active.
   - Hover/focus shows a targeting reticle.
   - Selecting an untried cell resolves miss, hit, or sunk.
   - Input locks immediately to prevent double shots.

3. **AI turn**
   - The AI selects one legal untried cell using its difficulty strategy.
   - A radar sweep leads into the impact animation.
   - The player board updates and control returns to the player unless the match ended.

4. **Match end**
   - Victory or defeat overlay appears.
   - Persistent statistics update once.
   - The player can start a rematch with the same difficulty or return to setup.

## AI Design

All AI strategies are deterministic when supplied the same seed, making them testable.

### Easy

Selects uniformly from all untried cells. It does not remember hit clusters beyond excluding cells already fired upon.

### Normal

Uses hunt-and-target behavior. In hunt mode it samples legal cells. After a hit, it adds untried orthogonal neighbors to a target queue. It continues around the cluster until the ship sinks, then returns to hunt mode.

### Hard

Uses the same target behavior but improves both modes:

- Hunt mode scores every legal cell by counting valid placements for each remaining unsunk ship.
- Target mode infers horizontal or vertical orientation after two aligned hits.
- It prioritizes cells extending the known hit line.
- It never reads hidden ship positions directly when choosing a shot; hidden positions are used only to resolve the selected coordinate.

## Architecture

### `neon-fleet-data.ts`

Defines board size, fleet catalog, difficulty metadata, coordinates, theme-independent labels, and shared types.

### `neon-fleet-engine.ts`

Pure functions for:

- Creating seeded matches.
- Validating and applying ship placement.
- Rotating, removing, and auto-placing fleets.
- Resolving player and AI shots.
- Detecting sunk fleets and match completion.
- Advancing match phases without timers or browser APIs.

### `neon-fleet-ai.ts`

Pure AI selection functions. The AI receives only public shot knowledge, remaining ship lengths, difficulty, and seed. It returns a coordinate and updated seed.

### `neon-fleet-storage.ts`

Versioned parsing and writing of best statistics per difficulty. Malformed or inconsistent local storage falls back safely.

### `neon-fleet-audio.ts`

Lazy Web Audio adapter for UI clicks, radar, miss, hit, sunk, victory, and defeat. It unlocks only after user interaction, supports mute, and disposes cleanly.

### `neon-fleet-game.tsx`

Owns React state, timers used only for presentation, theme observation, input locking, persistence, and accessible announcements. It composes semantic board buttons rather than coupling rules to the DOM.

### `neon-fleet.module.css`

Scoped responsive styling, theme tokens, impact effects, radar animation, focus states, and reduced-motion fallbacks.

## UI Design

The page uses the existing game header pattern with title, short description, mute, pause, and restart controls. The match area contains:

- A compact status strip for phase, turn, difficulty, shots, hits, and accuracy.
- Two board panels on wide screens: “Your Fleet” and “Enemy Waters.”
- Stacked boards on narrow screens, with the currently actionable board first.
- A fleet dock during setup with ship name, length, placement state, rotate, auto-place, reset, and start actions.
- Remaining ship silhouettes beside each board during combat.
- A concise event log showing the latest outcomes without covering the board.

Cell states use color plus symbols and labels:

- Untargeted water: subtle grid.
- Miss: ring/dot.
- Hit: bright cross and impact glow.
- Sunk: continuous highlighted hull with sunk marker.
- Player ship: visible hull.
- Enemy ship: hidden until sunk or match end.

Every grid cell is a real button with an accessible coordinate label such as “Enemy B7, untried.” Focus indicators remain visible in both themes.

## Visual and Audio Direction

The visual identity is “naval command console”: deep teal water, cyan radar lines, coral impacts, amber warnings, and glassy panels. Light mode uses pale sea-glass surfaces with dark teal text; dark mode uses near-black navy surfaces with high-contrast cyan text.

Animations are short and non-blocking:

- Radar sweep before an AI shot.
- Expanding water ring for misses.
- Flash and particles for hits.
- Larger hull pulse for sunk ships.

With reduced motion enabled, these become immediate opacity/color changes. Audio cues remain brief and are never required to understand the state.

## Persistence

Store a version-one record containing:

- Matches played and won per difficulty.
- Best accuracy per difficulty.
- Fastest victory per difficulty.
- Current mute preference.

Statistics update only once at a terminal match state. No in-progress fleet layout is persisted.

## Error Handling

- Invalid manual placement is rejected without modifying state and is announced.
- Auto-placement uses bounded retries and a deterministic fallback; it cannot hang.
- Duplicate shots return unchanged state.
- UI input stays locked during the AI presentation window.
- Storage and audio failures never stop gameplay.
- Theme changes redraw or restyle immediately without restarting the match.

## Testing Strategy

- Fleet placement boundary, overlap, rotation, removal, and completeness.
- Deterministic auto-placement with every ship valid.
- Shot resolution, duplicate-shot rejection, sunk detection, and victory/defeat.
- Turn alternation and input locking contract.
- Easy AI legality, Normal target queue, and Hard probability/orientation behavior.
- AI hidden-information boundary.
- Storage validation and terminal update semantics.
- UI contract for both boards, accessible coordinates, controls, theme, audio, and playground hub entry.
- Browser QA for setup, manual/automatic placement, one complete turn, responsive layout, light/dark switching, and console errors.

## Acceptance Criteria

- A player can place all five ships and complete a full match against each AI difficulty.
- The AI never selects an already tried cell or an out-of-bounds coordinate.
- Hard AI makes decisions only from public knowledge.
- Every shot produces exactly one outcome and each side receives one shot per turn.
- Victory and defeat trigger only after all cells of all ships are hit.
- Mouse, touch, and keyboard users can operate the setup and enemy board.
- The game remains readable and usable in light and dark themes at desktop and mobile widths.
- The new game appears as the eighth playable entry on `/playground`.
- Focused tests, full tests, scoped lint, production build, and browser QA pass before handoff.
