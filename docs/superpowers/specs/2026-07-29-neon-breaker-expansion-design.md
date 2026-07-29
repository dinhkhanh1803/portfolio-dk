# Neon Breaker Expansion Design

## Goal

Expand Neon Breaker from five to ten handcrafted stages, broaden the reward system from three to six skills, and make life-loss recovery immediate and unobtrusive.

## Approved Scope

- Increase the campaign to ten deterministic levels.
- Keep the existing three lives, score, combo, speed cap, light/dark themes, audio, persistence, keyboard, mouse, and touch controls.
- Keep current skills:
  - Wide Paddle: wider paddle for 10 seconds.
  - Multiball: adds two bounded balls.
  - Slow Ball: slows active balls for 7 seconds and restores their base speed afterward.
- Add three skills:
  - Laser: grants three shots; each shot destroys the lowest destructible brick in its lane.
  - Shield: catches one final-ball miss without consuming a life, then disappears.
  - Sticky Ball: the next paddle contact catches the ball; `Space` releases it again.
- Power-up drops remain deterministic from brick ID and level seed.
- Use symbols and labels in addition to color so every drop is identifiable.

## Life-Loss Flow

When every active ball falls below the arena and at least one life remains:

1. Remove exactly one life.
2. Reset combo and timed effects.
3. Center the paddle and attach a new ball.
4. Keep the arena fully visible.
5. Do not render a modal or blocking popup.
6. Show only a compact status hint: `Space để phát bóng` / `Press Space to launch`.
7. `Space`, click, or touch launches the attached ball.

The initial run may keep its introduction overlay. Level-clear, game-over, and victory overlays remain.

## Level Progression

- Levels 1–5 keep their existing layouts.
- Levels 6–10 introduce denser routes and deliberate reinforced/indestructible patterns.
- Every level contains at least 20 bricks and at least one destructible route.
- Clearing level 10 enters victory.
- Highest unlocked level persists from 1 through 10.
- The Playground card and HUD advertise ten levels.

## Engine Changes

- Extend `PowerUpType` with `laser`, `shield`, and `sticky`.
- Add bounded skill state:
  - `laserShots`: integer from 0 through 3.
  - `shieldCharges`: integer from 0 through 1.
  - `stickyArmed`: boolean.
- Add pure transitions for firing a laser, consuming a shield, catching a ball, and releasing an attached ball.
- Update deterministic drop selection to distribute six skill types without increasing the existing drop frequency.
- Preserve fixed-step determinism and hard caps.

## UI and Controls

- `Space` launches an attached ball and fires Laser when no ball is attached.
- Pointer/touch launch remains available.
- The HUD shows active skills, charges, and timers.
- Life-loss status is inline and non-modal.
- Canvas uses distinct drop symbols:
  - `W` Wide
  - `×3` Multiball
  - `S` Slow
  - `L` Laser
  - `◆` Shield
  - `●` Sticky
- Reduced-motion mode removes decorative effects without changing mechanics.

## Testing

Automated tests must cover:

- Ten valid deterministic levels and victory after level 10.
- Deterministic selection across all six skills.
- Laser charge bounds and brick destruction.
- Shield preventing exactly one life loss.
- Sticky catch and `Space` release.
- Remaining-life loss returning to a non-modal serve state.
- Persistence accepting unlocked levels through 10.
- UI contracts for ten levels, six skills, and no life-loss popup.
- Full repository tests, scoped ESLint, production build, and desktop/mobile browser QA.
