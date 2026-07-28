# Merge Foundry Game Design

## Goal

Build the second directly playable browser game for the portfolio: a calm,
turn-based merging puzzle with five-to-ten-minute sessions. The game should
reuse the visual language, accessibility standards, and synthesized audio
approach established by Neon Pulse while offering a more strategic play style.

## Product Scope

- Public route: `/playground/merge-foundry`.
- Session length: approximately 5–10 minutes.
- Board: a 5×5 grid.
- Controls: arrow keys, swipe gestures, and visible direction buttons.
- Objective: complete eight crafting orders before the board runs out of moves.
- One undo is available per shift.
- No timer, account, online leaderboard, backend, or external game engine.
- The Games hub promotes Merge Foundry under Puzzle, Strategy, and Casual.

## Core Gameplay

Each directional input slides every material as far as possible. Two matching
materials combine once per move into the next tier:

1. Scrap
2. Copper
3. Steel
4. Energy Core
5. Prism

A valid move spawns one new low-tier material in an empty cell. Newly merged
materials cannot merge again during the same move. Inputs that do not change
the board do not spawn a material and do not consume the undo state.

Three crafting orders remain visible beside the board. An order requests one
or more materials of a specific tier. When the board contains the requested
materials, the player can deliver the order. Delivery removes those materials,
opens board space, awards score, advances the order queue, and increases the
delivery combo. The combo resets after three valid slides without a delivery;
invalid inputs neither advance nor reset it.

The player wins a shift after completing eight orders. The shift ends in defeat
when the board has no empty cells and no adjacent matching materials. Undo
restores the complete state before the previous valid slide, including board,
orders, score, combo, and random generator state, and is usable once per shift.

## Scoring and Difficulty

Merges award points based on the resulting material tier. Deliveries award a
larger base score multiplied by the current delivery combo. Higher-tier and
multi-material orders are worth more.

The opening orders request Scrap, Copper, and Steel. Later orders introduce
Energy Cores, Prisms, and multiple-material recipes. New tile probabilities
shift gradually toward Copper as the shift progresses, but the game never
introduces blockers or a timer in the first release.

## Interface and Visual Direction

The desktop layout places the 5×5 crafting board in the main column and the
three-order queue in a narrower side column. Score, combo, shift progress, mute,
and pause controls remain visible without covering the board. Undo and visible
direction controls sit below the board.

On narrow screens, the order queue moves above the board so the current goal is
visible before the player acts. The board remains square and fills the available
width. Swipe gestures are the primary mobile input, with direction buttons as an
accessible alternative.

The shell follows the site Light and Dark themes. The board itself remains dark
in both themes for stable material contrast. Scrap is slate, Copper is warm
brown, Steel is cool silver, Energy Core is teal, and Prism is gold. Every tier
also uses a label and distinct shape treatment so color is not the only signal.

Animations include directional slides, merge scale pulses, delivery particles,
order stamping, and restrained combo glow. Reduced-motion mode shortens slides
and removes particles, shake, and large scale transitions.

## Audio Direction

Audio is synthesized with the Web Audio API. Sliding uses a quiet metallic
texture, merging produces a pitched tone based on the resulting tier, and
delivery uses a short mechanical stamp. Successive deliveries build a restrained
harmonic sequence. Invalid moves and game-over states use distinct low cues.

Audio starts only after user interaction, can be muted at any time, and never
blocks gameplay when Web Audio is unavailable.

## Architecture

- A route-level server component provides metadata and mounts the client game.
- A pure TypeScript engine owns board transforms, merge rules, spawning, order
  generation, delivery, scoring, undo snapshots, and win/loss detection.
- A React client component renders the board, orchestrates animation phases,
  translates keyboard, pointer, swipe, and button input into engine actions, and
  owns the visible game states.
- A Web Audio controller owns generated sounds and disposes resources cleanly.
- Storage helpers validate and version persisted preferences, high scores, and
  resumable shift data.

The engine owns a seeded random source whose seed is part of the game state.
Undo therefore reproduces the next spawn exactly, keeping tests and restored
games deterministic. React, animation, audio, and storage do not participate in
rule calculations.

## State and Data Flow

The client starts from a validated saved shift or creates a deterministic initial
state. An input direction is sent to the engine. The engine returns an unchanged
state for an invalid move or a transition containing the next state plus merge
events for animation and audio. The UI locks directional input only while the
short transition animation is playing.

Order delivery is an explicit action. The engine verifies the required materials,
removes them deterministically, updates score and progress, and generates the
next order. After every completed transition, the client persists the versioned
state.

## Persistence and Failure Handling

- High score, mute, and reduced-motion preferences persist locally.
- An active shift is saved after each valid move and delivery.
- Invalid, incompatible, or corrupted saved data falls back to a fresh shift.
- If Web Audio initialization fails, the game continues silently.
- Losing page visibility pauses input and animation.
- If the renderer encounters an unrecoverable error, the shell shows a readable
  retry action without discarding a valid saved shift.

## Accessibility

- Full keyboard support uses arrow keys and visible focused controls.
- Swipe is supplemented by four labeled direction buttons.
- Material tiers use text and shape differences in addition to color.
- Status changes announce merges, completed orders, win, and game over through
  a polite live region without narrating every visual effect.
- Focus remains stable after delivery, undo, restart, and theme changes.
- Reduced motion and mute preferences are always available.

## Verification

Unit tests cover:

- sliding and compacting in all four directions;
- one-merge-per-tile behavior;
- invalid moves and deterministic spawning;
- order eligibility, delivery, score, combo, and queue progression;
- exact undo restoration;
- win and no-move game-over detection;
- validation of persisted state.

Browser checks cover:

- keyboard, swipe, and visible direction controls;
- delivery, undo, win, game-over, and restart flows;
- reload and shift restoration;
- mute and reduced-motion preferences;
- Light and Dark theme contrast;
- desktop and mobile layouts without horizontal overflow.

The scoped lint, game tests, full project test suite, and production build must
pass before the implementation is considered complete.
