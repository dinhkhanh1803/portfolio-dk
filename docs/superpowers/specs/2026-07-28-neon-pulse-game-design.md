# Neon Pulse Game Design

## Goal

Build the first directly playable browser game for the portfolio: a short, polished
reaction game that works with keyboard, mouse, and touch, while establishing reusable
game-shell patterns for future games.

## Product Scope

- Public route: `/playground/neon-pulse`.
- Typical run length: 60-90 seconds.
- Controls: `Space`, pointer click, or touch.
- Core loop: trigger when the moving pulse overlaps the target zone.
- Ratings: `Perfect`, `Good`, and `Miss`.
- Run systems: score, combo, multiplier, three lives, increasing speed, pause, restart.
- Persistence: local high score plus sound and reduced-motion preferences.
- No account, online leaderboard, backend, or external game engine in the first release.

## Gameplay

The pulse travels around a circular track. Each input is evaluated against its distance
from the center of the target zone. A Perfect hit awards the most points and strengthens
the combo; a Good hit keeps the run alive with fewer points; a Miss breaks the combo and
costs one life.

Difficulty rises in controlled stages by increasing pulse speed, narrowing the target,
changing direction, and occasionally moving the target after a successful hit. The run
ends when all three lives are lost. Restart is available immediately from the result
screen.

## Visual and Audio Direction

The game uses the portfolio dark theme with teal as the primary gameplay color and coral
for danger or misses. Canvas effects include glow, trails, particles, hit rings, and
small screen shake. Reduced-motion mode removes shake and lowers particle density.

Audio is generated with the Web Audio API to avoid asset downloads. Hits produce pitched
tones, Perfect streaks climb musically, misses use a short low-frequency cue, and higher
combos add restrained rhythmic layers. Audio starts only after user interaction and can
be muted at any time.

## Architecture

- A route-level React page provides metadata and mounts the client game.
- A reusable game shell owns start, pause, game-over, sound, and preference controls.
- A Canvas renderer draws the arena and transient effects.
- A deterministic engine owns timing, scoring, collision windows, lives, and difficulty.
- A Web Audio controller owns synthesized sound and disposes audio resources cleanly.
- Storage helpers validate localStorage values before use.

Engine rules remain independent of React, Canvas, and audio so they can be tested without
a browser and reused by future game modes.

## Responsive and Accessibility Behavior

The arena scales to the available viewport while preserving a square play field. Primary
controls remain reachable on mobile. The page supports keyboard play, visible focus,
pause on tab visibility loss, mute, reduced motion, and readable non-color feedback for
Perfect, Good, and Miss.

## Failure Handling

- If Web Audio is unavailable, gameplay continues silently.
- If Canvas initialization fails, the page shows a readable retry state.
- Invalid stored preferences or scores fall back to defaults.
- Losing focus automatically pauses an active run.

## Verification

- Unit tests cover hit grading, score/combo behavior, life loss, difficulty progression,
  and storage validation.
- Browser checks cover start, input, pause, game over, restart, sound toggle, responsive
  layout, and dark-theme contrast.
- The full project test suite and production build must pass.

