import assert from "node:assert/strict";
import test from "node:test";
import {
  BUILD_PADS,
  CAMPAIGN_WAVES,
  ENEMY_DEFINITIONS,
  ROUTE,
  TOWER_DEFINITIONS,
} from "../app/playground/neon-siege/neon-siege-data.ts";
import {
  activateEmp,
  activateOverclock,
  buildTower,
  createSiegeRun,
  generateEndlessWave,
  queueAirstrike,
  routeLength,
  sellTower,
  startEndless,
  startWave,
  stepSiege,
  upgradeTower,
} from "../app/playground/neon-siege/neon-siege-engine.ts";
import { DEFAULT_PROGRESS, parseProgress } from "../app/playground/neon-siege/neon-siege-storage.ts";

const stepFor = (state, totalMs, slice = 50) => {
  let next = state;
  for (let elapsed = 0; elapsed < totalMs; elapsed += slice) next = stepSiege(next, slice);
  return next;
};

test("defines one fixed route, twelve build pads, four towers, six enemies, and twelve waves", () => {
  assert.ok(ROUTE.length >= 6);
  assert.equal(new Set(BUILD_PADS.map((pad) => pad.id)).size, BUILD_PADS.length);
  assert.ok(BUILD_PADS.length >= 10 && BUILD_PADS.length <= 12);
  assert.deepEqual(Object.keys(TOWER_DEFINITIONS).sort(), ["frost", "pulse", "railgun", "tesla"]);
  assert.deepEqual(Object.keys(ENEMY_DEFINITIONS).sort(), ["boss", "disruptor", "drone", "runner", "splitter", "tank"]);
  assert.equal(CAMPAIGN_WAVES.length, 12);
  assert.ok([4, 8, 12].every((wave) => CAMPAIGN_WAVES[wave - 1].groups.some((group) => group.type === "boss")));
});

test("creates a planning run with difficulty-scaled resources", () => {
  const easy = createSiegeRun("easy");
  const normal = createSiegeRun("normal");
  const hard = createSiegeRun("hard");
  assert.equal(normal.phase, "planning");
  assert.equal(normal.health, 20);
  assert.equal(normal.wave, 0);
  assert.ok(easy.credits > normal.credits && normal.credits > hard.credits);
});

test("builds, upgrades, and sells towers with bounded economy", () => {
  const base = createSiegeRun("normal");
  const built = buildTower(base, BUILD_PADS[0].id, "pulse");
  assert.equal(built.towers.length, 1);
  assert.ok(built.credits < base.credits);
  assert.equal(buildTower(built, BUILD_PADS[0].id, "frost"), built);
  const upgraded = upgradeTower(built, built.towers[0].id);
  assert.equal(upgraded.towers[0].level, 2);
  const maxed = upgradeTower(upgradeTower(upgraded, upgraded.towers[0].id), upgraded.towers[0].id);
  assert.equal(maxed.towers[0].level, 3);
  const sold = sellTower(maxed, maxed.towers[0].id);
  assert.equal(sold.towers.length, 0);
  assert.ok(sold.credits > maxed.credits);
});

test("starts authored waves, spawns enemies deterministically, and grants early-call credit", () => {
  const base = createSiegeRun("normal");
  const started = startWave(base, true);
  assert.equal(started.phase, "playing");
  assert.equal(started.wave, 1);
  assert.ok(started.credits > base.credits);
  const advanced = stepFor(started, 1500);
  assert.ok(advanced.enemies.length > 0);
  assert.deepEqual(advanced.enemies.map((enemy) => enemy.type), stepFor(startWave(base, true), 1500).enemies.map((enemy) => enemy.type));
});

test("enemies reaching the core leak health and zero health ends the run", () => {
  const base = startWave(createSiegeRun("normal"));
  const leaking = {
    ...base,
    health: 1,
    pendingSpawns: [],
    enemies: [{
      id: 99, type: "drone", hp: 30, maxHp: 30, progress: routeLength() - 1,
      speed: 300, armor: 0, threat: 1, reward: 8, slowRemainingMs: 0, stunRemainingMs: 0,
    }],
  };
  const next = stepSiege(leaking, 50);
  assert.equal(next.health, 0);
  assert.equal(next.phase, "gameover");
});

test("all four towers damage enemies and preserve their combat identities", () => {
  for (const type of ["pulse", "frost", "tesla", "railgun"]) {
    let state = createSiegeRun("easy");
    state = { ...state, credits: 9999 };
    state = buildTower(state, BUILD_PADS[0].id, type);
    state = {
      ...state,
      phase: "playing",
      wave: 1,
      pendingSpawns: [],
      enemies: [0, 1, 2].map((index) => ({
        id: index + 1, type: index === 2 ? "tank" : "drone", hp: 300, maxHp: 300,
        progress: 120 + index * 12, speed: 0, armor: index === 2 ? 8 : 0,
        threat: 1, reward: 8, slowRemainingMs: 0, stunRemainingMs: 0,
      })),
    };
    const fired = stepFor(state, 1200);
    assert.ok(fired.enemies.some((enemy) => enemy.hp < 300), `${type} should deal damage`);
    if (type === "frost") assert.ok(fired.enemies.some((enemy) => enemy.slowRemainingMs > 0));
    if (type === "tesla" || type === "railgun") assert.ok(fired.enemies.filter((enemy) => enemy.hp < 300).length >= 2);
  }
});

test("EMP, Overclock, and Airstrike apply effects and bounded cooldowns", () => {
  const enemy = {
    id: 1, type: "tank", hp: 300, maxHp: 300, progress: 240, speed: 40,
    armor: 8, threat: 2, reward: 20, slowRemainingMs: 0, stunRemainingMs: 0,
  };
  const playing = { ...startWave(createSiegeRun("normal")), pendingSpawns: [], enemies: [enemy] };
  const emp = activateEmp(playing);
  assert.ok(emp.enemies[0].hp < enemy.hp);
  assert.ok(emp.enemies[0].stunRemainingMs > 0);
  assert.ok(emp.skills.empCooldownMs > 0);
  const overclock = activateOverclock({ ...playing, skills: { ...playing.skills, empCooldownMs: 0 } });
  assert.ok(overclock.skills.overclockRemainingMs > 0);
  const strike = queueAirstrike({ ...playing, skills: { ...playing.skills, airstrikeCooldownMs: 0 } }, 240);
  assert.ok(strike.skills.airstrike);
  const resolved = stepFor(strike, 1000);
  assert.ok(resolved.enemies.length === 0 || resolved.enemies[0].hp < enemy.hp);
});

test("wave twelve wins the campaign and Endless generation is deterministic", () => {
  const playing = {
    ...createSiegeRun("normal"), phase: "playing", wave: 12,
    pendingSpawns: [], enemies: [], campaignComplete: false,
  };
  const victory = stepSiege(playing, 16);
  assert.equal(victory.phase, "victory");
  assert.equal(victory.campaignComplete, true);
  assert.deepEqual(generateEndlessWave(18, "hard"), generateEndlessWave(18, "hard"));
  assert.ok(generateEndlessWave(18, "hard").groups.length > 0);
});
test("versioned progress rejects malformed and impossible Endless records", () => {
  const valid = { version: 1, bestScore: 9000, highestWave: 12, campaignComplete: true, endlessUnlocked: true, bestEndlessWave: 18 };
  assert.deepEqual(parseProgress(JSON.stringify(valid)), valid);
  assert.deepEqual(parseProgress('{"version":2}'), DEFAULT_PROGRESS);
  assert.deepEqual(parseProgress('{"version":1,"bestScore":-1,"highestWave":0,"campaignComplete":false,"endlessUnlocked":false,"bestEndlessWave":0}'), DEFAULT_PROGRESS);
  assert.deepEqual(parseProgress('{"version":1,"bestScore":1,"highestWave":0,"campaignComplete":false,"endlessUnlocked":true,"bestEndlessWave":0}'), DEFAULT_PROGRESS);
});

test("Endless can only start after a validated campaign unlock", () => {
  const fresh = createSiegeRun("normal");
  assert.equal(startEndless(fresh, false), fresh);
  const endless = startEndless({ ...fresh, campaignComplete: true }, true);
  assert.equal(endless.mode, "endless");
  assert.equal(endless.wave, 12);
  assert.equal(endless.phase, "planning");
});

test("tower cadence preserves cooldown overshoot across fixed slices", () => {
  let state = { ...createSiegeRun("easy"), credits: 9999 };
  state = buildTower(state, BUILD_PADS[0].id, "pulse");
  state = { ...state, phase: "playing", wave: 1, pendingSpawns: [], enemies: [{
    id: 1, type: "tank", hp: 9999, maxHp: 9999, progress: 120, speed: 0, armor: 0,
    threat: 1, reward: 0, slowRemainingMs: 0, stunRemainingMs: 0,
  }] };
  const fine = stepFor(state, 2000, 20);
  const coarse = stepFor(state, 2000, 50);
  assert.equal(fine.enemies[0].hp, coarse.enemies[0].hp);
});
test("boss arrival emits a pulse that delays tower fire", () => {
  let state = { ...createSiegeRun("easy"), credits: 9999 };
  state = buildTower(state, BUILD_PADS[0].id, "pulse");
  state = { ...state, phase: "playing", wave: 4, pendingSpawns: [{ type: "boss", spawnAtMs: 0, ordinal: 0 }] };
  const pulsed = stepSiege(state, 20);
  assert.ok(pulsed.towers[0].cooldownMs >= 600);
  assert.equal(pulsed.event?.label, "BOSS");
});