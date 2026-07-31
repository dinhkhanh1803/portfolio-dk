import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD,
  createInvadersRun,
  firePlayer,
  movePlayer,
  startRun,
  tickInvaders,
  triggerBomb,
} from "../app/playground/neon-invaders/neon-invaders-engine.ts";

test("creates deterministic wave one formations", () => {
  const run = createInvadersRun(42);
  assert.equal(run.phase, "ready");
  assert.equal(run.wave, 1);
  assert.ok(run.enemies.length >= 12);
  assert.deepEqual(createInvadersRun(42), run);
});

test("moves the player inside the arena and fires with cooldown", () => {
  const run = startRun(createInvadersRun(7));
  assert.equal(movePlayer(run, -999).player.x, 24);
  assert.equal(movePlayer(run, 9999).player.x, WORLD.width - 24);
  const fired = firePlayer(run);
  assert.equal(fired.bullets.length, 1);
  assert.equal(firePlayer(fired), fired);
});

test("dual and rapid power states change the volley", () => {
  const run = startRun(createInvadersRun(8));
  const powered = { ...run, player: { ...run.player, dualMs: 5000, rapidMs: 5000 } };
  const fired = firePlayer(powered);
  assert.equal(fired.bullets.length, 2);
  assert.ok(fired.player.cooldownMs < 240);
});

test("player bullets destroy enemies and grow score and combo", () => {
  const run = startRun(createInvadersRun(9));
  const enemy = { ...run.enemies[0], x: run.player.x, y: 300, hp: 1 };
  const shot = {
    ...run,
    enemies: [enemy],
    bullets: [{ id: 999, x: enemy.x, y: enemy.y + 4, vy: -500, owner: "player" }],
  };
  const result = tickInvaders(shot, 20);
  assert.equal(result.wave, 2);
  assert.ok(result.enemies.length > 0);
  assert.ok(result.score > 0);
  assert.equal(result.bestCombo, 1);
});

test("bomb clears ordinary enemies, damages bosses, and consumes a charge", () => {
  const run = startRun(createInvadersRun(10));
  const bombed = triggerBomb(run);
  assert.equal(bombed.bombs, 0);
  assert.equal(bombed.enemies.length, 0);
  const bossRun = { ...run, wave: 5, bombs: 1, enemies: [{ ...run.enemies[0], kind: "boss", hp: 30, maxHp: 30 }] };
  assert.equal(triggerBomb(bossRun).enemies[0].hp, 20);
});

test("waves five and ten spawn bosses and campaign ends after wave ten", () => {
  let run = startRun(createInvadersRun(11));
  run = { ...run, wave: 4, enemies: [] };
  run = tickInvaders(run, 16);
  assert.equal(run.wave, 5);
  assert.equal(run.enemies.some((enemy) => enemy.kind === "boss"), true);
  run = { ...run, wave: 10, enemies: [] };
  assert.equal(tickInvaders(run, 16).phase, "victory");
});

