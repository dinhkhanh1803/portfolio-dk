# Neon Breaker Design

## Goal

Build the fifth playable browser game, **Neon Breaker**, as a polished Breakout experience with short handcrafted levels, responsive controls, local audio, and theme-aware visuals.

The game will be available at `/playground/neon-breaker` and promoted as the fifth live game on the Playground hub.

## Product Scope

Neon Breaker keeps the classic Breakout loop:

1. Move a paddle along the bottom of the arena.
2. Launch and rebound one or more balls.
3. Break every destructible brick.
4. Clear five levels before losing all three lives.

The experience adds restrained progression features:

- Five handcrafted brick layouts.
- Three lives per run.
- A combo multiplier that grows while bricks are destroyed without losing the ball.
- Gradually increasing ball speed with a defined maximum.
- Three time-limited power-ups: Wide Paddle, Multiball, and Slow Ball.
- Score, best score, level progress, lives, combo, and active power-up HUD.

There are no currencies, upgrades, shops, online leaderboards, or server-side state.

## Match Flow

The run states are:

- `ready`: level loaded and ball attached to the paddle.
- `playing`: simulation and collision handling are active.
- `paused`: simulation is frozen without accumulating hidden time.
- `level-clear`: score summary and next-level action.
- `gameover`: all lives lost with restart action.
- `victory`: all five levels cleared with final score and replay action.

Space, click, or touch launches the attached ball. Losing every active ball costs one life, resets the combo, and returns to `ready`. Clearing all destructible bricks enters `level-clear`.

## Controls

Desktop:

- Mouse movement controls the paddle.
- `A` / `D` and `ArrowLeft` / `ArrowRight` provide keyboard control.
- `Space` launches the ball.
- `P` or `Escape` pauses and resumes.

Mobile:

- Drag directly across the arena to position the paddle.
- Tap the arena or visible launch button to release the ball.

Global shortcuts ignore focused buttons, links, inputs, selects, textareas, and editable content.

## Gameplay and Physics

The engine uses a fixed timestep and pure state transitions.

The ball:

- Reflects from the left, right, and top walls.
- Reflects from the paddle based on contact position.
- Uses swept collision checks for the paddle and bricks to prevent tunneling.
- Damages at most one brick per collision resolution step.
- Receives a small speed increase after brick or paddle milestones.
- Never exceeds the configured maximum speed.

Brick types:

- Standard: one hit.
- Reinforced: two hits, with a distinct damaged state.
- Indestructible: shapes the route but is excluded from level-clear counts.

Level layouts define brick positions and types as data. The same input and timestep sequence must produce the same result.

## Scoring and Combo

- Standard brick: 100 base points.
- Reinforced brick: 150 points per damaging hit.
- Combo starts at `1x` and rises by `0.25x` for consecutive brick hits.
- Combo is capped at `3x` and resets when all balls are lost.
- Level clear awards 500 bonus points per remaining life.

Power-up drops are deterministic from brick identity and level seed so tests and replays remain stable.

## Power-Ups

Only three power-ups are included:

- **Wide Paddle:** increases paddle width for 10 seconds.
- **Multiball:** creates two additional balls with bounded launch angles.
- **Slow Ball:** reduces active ball speeds for 7 seconds without dropping below the minimum.

Power-up timers use simulation time and pause with the match. Collecting the same timed power-up refreshes its duration. Multiball is immediate and does not stack beyond a safe active-ball cap.

## Visual Design

The game uses a responsive `4:5` canvas inside the existing portfolio shell, with a `900 × 1125` simulation world scaled to the available viewport.

Dark mode:

- Deep navy arena.
- Cyan paddle and ball trail.
- Coral, amber, violet, and teal brick rows.
- Restrained glow and impact flashes.

Light mode:

- Soft cool arena.
- Dark readable markings.
- Saturated brick colors with reduced glow.
- High-contrast HUD and overlays.

Effects include:

- Short ball trails.
- Brick-hit particles.
- Small score popups.
- Power-up drop trails.
- Level-clear sweep.
- Subtle screen pulse on life loss.

Reduced-motion mode removes decorative trails, particles, shake, and long transitions without changing gameplay timing.

## Audio

Web Audio generates sounds locally for:

- Paddle bounce.
- Wall bounce.
- Brick damage and destruction.
- Power-up drop and collection.
- Life loss.
- Level clear.
- Game over and victory.

Mute is available at all times, persists locally, and resumes audio immediately when re-enabled. Audio failures never block gameplay.

## Persistence

Local storage contains only:

- Best score.
- Highest unlocked level.
- Mute preference.
- Reduced-motion preference.

Storage access is guarded and invalid values fall back to safe defaults. Active runs are not persisted.

## Accessibility

- Every visible control has an accessible name and visible focus state.
- Overlays move focus into their action area and trap focus while modal.
- Selection states use semantic attributes such as `aria-pressed`.
- An `aria-live` region announces life loss, power-up collection, level clear, game over, and victory.
- Colors are not the only way to distinguish brick durability or power-up type.

## Architecture

- `app/playground/neon-breaker/neon-breaker-engine.ts`: pure simulation, collision, level progression, score, combo, lives, and power-ups.
- `app/playground/neon-breaker/neon-breaker-levels.ts`: five immutable level definitions.
- `app/playground/neon-breaker/neon-breaker-game.tsx`: React orchestration, canvas rendering, input, HUD, and overlays.
- `app/playground/neon-breaker/neon-breaker-audio.ts`: Web Audio controller.
- `app/playground/neon-breaker/neon-breaker-storage.ts`: validated persistence.
- `app/playground/neon-breaker/neon-breaker.module.css`: theme-aware responsive presentation.
- `app/playground/neon-breaker/page.tsx`: metadata and route entry.
- `tests/neon-breaker-engine.test.mjs`: engine and integration contracts.

The Playground hub receives a fifth card, a Breakout preview, updated counts, and the categories Arcade, Skill, Casual, and Reaction.

## Error Handling

- Invalid or extreme frame deltas are clamped.
- Invalid state transitions return the existing state.
- Storage and audio failures degrade silently to in-memory behavior.
- Visibility loss automatically pauses an active run.
- Resize and theme changes redraw without resetting the run.
- Ball and power-up counts have hard caps.

## Testing and Acceptance

Automated tests cover:

- Initial run, launch, pause, and reset transitions.
- Wall, paddle, and swept brick collisions.
- Standard, reinforced, and indestructible brick behavior.
- Combo, scoring, speed increase, and speed cap.
- Life loss, game over, level clear, and final victory.
- Deterministic power-up drops and all three power-up effects.
- Multiball cap and last-ball life handling.
- Five valid level definitions.
- Keyboard shortcut isolation.
- Validated storage fallback.
- Route, audio, theme, reduced-motion, responsive CSS, and Playground integration.

Final verification requires focused tests, the full repository test suite, scoped ESLint, a production build, and browser QA in both themes at desktop and 390-pixel mobile widths with no horizontal overflow.
