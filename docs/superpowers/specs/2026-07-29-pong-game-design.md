# Neon Classic Pong Design

## Goal

Build the fourth playable browser game, **Pong**, as a polished Neon Classic experience that supports both solo play against AI and local two-player matches.

## Product Scope

Pong will be available at `/playground/pong` and promoted as the fourth live game on the Playground hub. It will remain faithful to classic Pong: two paddles, one ball, skill-based rebounds, increasing ball speed, and no power-ups.

Players configure a match before starting:

- Mode: Solo vs AI or local two-player.
- Winning score: 5, 7, or 11 points.
- AI difficulty for solo mode: Easy, Normal, or Hard.

The match flow is:

1. Configure the match.
2. Start from a ready/countdown state.
3. Serve with Space, touch, or the visible action button.
4. Play until one side reaches the selected winning score.
5. Show the winner and offer rematch or return to settings.

After each point, the ball returns to the center and serves toward the player who conceded the point.

## Controls

Desktop controls:

- Player 1: `W` and `S`.
- Player 2: `ArrowUp` and `ArrowDown`.
- Serve: `Space`.
- Pause or resume: `P` or `Escape`.

Mobile controls use direct paddle dragging and large touch regions. Solo mode only exposes the human paddle controls. Local two-player mode exposes controls for both sides.

Global shortcuts must ignore focused interactive elements such as buttons, inputs, selects, textareas, links, and editable content so native keyboard activation remains accessible.

## Gameplay and Physics

The engine uses a fixed timestep so identical inputs produce consistent results across different display frame rates.

The ball:

- Starts from the center after a countdown.
- Reflects from the top and bottom walls.
- Reflects from paddles without tunneling through them.
- Changes its vertical direction based on the contact point relative to the paddle center.
- Gains a small amount of speed after each paddle hit.
- Never exceeds a defined maximum speed.

Paddles remain inside the playfield. Keyboard input supports simultaneous key states, and touch input maps to a target paddle position rather than issuing discrete jumps.

AI difficulty is deterministic and defined by:

- Paddle maximum speed.
- Reaction interval.
- Prediction error applied to the projected ball intercept.

Easy reacts slowly with large error, Normal is balanced, and Hard reacts quickly with small but non-zero error. AI remains beatable and cannot teleport.

## Visual Design

The game uses a responsive 16:9 canvas inside the existing portfolio shell.

Dark mode:

- Deep navy arena.
- Cyan left paddle.
- Coral right paddle.
- White-to-warm-yellow ball.
- Glowing center line and restrained neon accents.

Light mode:

- Soft cool background.
- Darker arena markings and text.
- Saturated but readable paddle colors.
- Reduced glow so the scene remains crisp.

Effects include:

- A short ball trail.
- Brief impact flashes.
- Small collision particles.
- A subtle score flash.
- Animated countdown and result overlays.

Reduced-motion mode disables or minimizes trail animation, particles, shake, and decorative transitions without changing gameplay timing.

## Audio

Web Audio generates sounds locally for:

- Paddle collision.
- Wall bounce.
- Point scored.
- Countdown.
- Match victory.

Audio is an enhancement and must never block gameplay. Unlocking or resuming the audio context happens independently from state transitions. Mute is available at all times and is persisted.

## Interface

The HUD displays:

- Left and right score.
- Match mode.
- AI difficulty or `2 Players`.
- Winning-score target.
- Current ball-speed multiplier.

Controls include:

- Mute.
- Pause/resume while a rally is active.
- Reduce effects.
- New match.
- Rematch.
- Return to match settings.

Pause freezes simulation without accumulating hidden elapsed time. Match-over state takes priority over pause state.

All controls have clear accessible names, visible focus styles, readable contrast, and disabled states that remain legible.

## Persistence

Local storage contains only:

- Mute preference.
- Reduced-motion preference.
- Last selected mode, winning score, and AI difficulty.
- Aggregate solo and local win/loss statistics.

The active rally is not persisted.

Storage reads and writes are guarded. Invalid or unavailable storage falls back to safe defaults without breaking the game.

## Architecture

Files are separated by responsibility:

- `app/playground/pong/pong-engine.ts`: pure match state, fixed-step simulation, collisions, scoring, serving, and AI.
- `app/playground/pong/pong-game.tsx`: React orchestration, canvas drawing, input, menus, HUD, and overlays.
- `app/playground/pong/pong-audio.ts`: Web Audio controller and cleanup.
- `app/playground/pong/pong-storage.ts`: validated preferences and statistics.
- `app/playground/pong/pong.module.css`: themed responsive presentation.
- `app/playground/pong/page.tsx`: route metadata and game entry.
- `tests/pong-engine.test.mjs`: engine and integration contracts.

The Playground hub receives a fourth game card, a Pong preview, updated counts, and appropriate Arcade, Skill, and Multiplayer categories.

## Error Handling

- Invalid time deltas are clamped or ignored.
- State transitions reject actions that are invalid for the current phase.
- Storage failures degrade to in-memory defaults.
- Audio failures are swallowed after cleanup and do not affect input.
- Visibility changes automatically pause an active rally.
- Resize and theme changes redraw the canvas without resetting the match.

## Testing and Acceptance

Automated tests must prove:

- Wall and paddle collision behavior.
- Paddle anti-tunneling and playfield clamping.
- Contact-position rebound angles.
- Ball acceleration and maximum speed.
- Point scoring, serve direction, and victory at 5, 7, and 11.
- Easy, Normal, and Hard AI speed, reaction, and prediction-error boundaries.
- Fixed-step consistency across frame cadences.
- Pause timing behavior.
- Keyboard shortcut isolation from focused controls.
- Validated storage fallback.
- Route, audio, theme, reduced-motion, responsive styles, and Playground integration.

Final verification requires:

- Focused Pong tests.
- Full repository test suite.
- Scoped ESLint.
- Production build.
- Browser QA in light and dark themes.
- Desktop and 390-pixel mobile checks with no horizontal overflow.
- Real interaction checks for solo mode, local two-player controls, pause, rematch, and settings.
