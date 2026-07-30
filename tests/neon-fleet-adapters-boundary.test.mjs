import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_STATS,
  parseStats,
  safeRead,
  safeWrite,
} from "../app/playground/neon-fleet/neon-fleet-storage.ts";
import { createFleetAudio } from "../app/playground/neon-fleet/neon-fleet-audio.ts";

const validStats = () => ({
  version: 1,
  byDifficulty: {
    easy: { played: 1, won: 0, bestAccuracy: 65, fastestVictoryMs: null },
    normal: { played: 2, won: 1, bestAccuracy: 50, fastestVictoryMs: 3000 },
    hard: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
  },
});

test("parseStats rejects unsafe counts and impossible persisted cross-field states", () => {
  const impossible = [
    { ...validStats(), byDifficulty: { ...validStats().byDifficulty, easy: { played: Number.MAX_SAFE_INTEGER + 1, won: 0, bestAccuracy: 1, fastestVictoryMs: null } } },
    { ...validStats(), byDifficulty: { ...validStats().byDifficulty, hard: { played: 0, won: 0, bestAccuracy: 1, fastestVictoryMs: null } } },
    { ...validStats(), byDifficulty: { ...validStats().byDifficulty, easy: { played: 1, won: 0, bestAccuracy: 10, fastestVictoryMs: 1 } } },
    { ...validStats(), byDifficulty: { ...validStats().byDifficulty, normal: { played: 2, won: 1, bestAccuracy: 50, fastestVictoryMs: null } } },
  ];

  for (const value of impossible) assert.deepEqual(parseStats(JSON.stringify(value)), DEFAULT_STATS);
  assert.deepEqual(parseStats(JSON.stringify(validStats())), validStats());
});

test("DEFAULT_STATS is deeply frozen while parseStats still supplies fresh mutable results", () => {
  assert.ok(Object.isFrozen(DEFAULT_STATS));
  assert.ok(Object.isFrozen(DEFAULT_STATS.byDifficulty));
  assert.ok(Object.isFrozen(DEFAULT_STATS.byDifficulty.easy));
  assert.throws(() => { DEFAULT_STATS.byDifficulty.easy.played = 1; }, TypeError);

  const first = parseStats(null);
  const second = parseStats(null);
  first.byDifficulty.easy.played = 1;
  assert.equal(second.byDifficulty.easy.played, 0);
  assert.equal(DEFAULT_STATS.byDifficulty.easy.played, 0);
});

test("safe storage adapters succeed in browsers and swallow blocked getters and quota failures", () => {
  const hadWindow = Object.hasOwn(globalThis, "window");
  const previousWindow = globalThis.window;
  const entries = new Map();
  try {
    globalThis.window = {
      localStorage: {
        getItem: (key) => entries.get(key) ?? null,
        setItem: (key, value) => entries.set(key, value),
      },
    };
    assert.equal(safeWrite("mute", "true"), true);
    assert.equal(safeRead("mute"), "true");

    globalThis.window = { get localStorage() { throw new Error("blocked"); } };
    assert.equal(safeRead("mute"), null);
    assert.equal(safeWrite("mute", "false"), false);

    globalThis.window = {
      localStorage: {
        getItem: () => null,
        setItem: () => { throw new Error("quota"); },
      },
    };
    assert.equal(safeWrite("mute", "false"), false);
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
  }
});

test("disposed audio cannot emit after an initialized context", async () => {
  const hadWindow = Object.hasOwn(globalThis, "window");
  const previousWindow = globalThis.window;
  let oscillators = 0;
  class FakeAudioContext {
    state = "running";
    destination = {};
    resume() { return Promise.resolve(); }
    createOscillator() {
      oscillators += 1;
      return {
        frequency: { setValueAtTime() {} },
        connect() { return this; },
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() { return this; },
      };
    }
    close() { return Promise.resolve(); }
  }

  globalThis.window = { AudioContext: FakeAudioContext };
  try {
    const audio = createFleetAudio();
    await audio.unlock();
    audio.play("hit");
    assert.equal(oscillators, 1);
    audio.dispose();
    assert.doesNotThrow(() => audio.play("victory"));
    assert.equal(oscillators, 1);
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
  }
});
