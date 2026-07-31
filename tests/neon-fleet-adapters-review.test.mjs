import assert from "node:assert/strict";
import test from "node:test";
import { parseStats, recordMatch } from "../app/playground/neon-fleet/neon-fleet-storage.ts";
import { createFleetAudio } from "../app/playground/neon-fleet/neon-fleet-audio.ts";

const freshDefault = () => ({
  version: 1,
  byDifficulty: {
    easy: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
    normal: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
    hard: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
  },
});

test("parseStats reconstructs only known top-level, difficulty, and statistic fields", () => {
  const parsed = parseStats(JSON.stringify({
    version: 1,
    extra: "discarded",
    byDifficulty: {
      easy: { played: 1, won: 1, bestAccuracy: 50, fastestVictoryMs: 100, extra: true },
      normal: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
      hard: { played: 2, won: 1, bestAccuracy: 80, fastestVictoryMs: 200, extra: "discarded" },
      extraDifficulty: { played: 9 },
    },
  }));

  assert.deepEqual(Object.keys(parsed), ["version", "byDifficulty"]);
  assert.deepEqual(Object.keys(parsed.byDifficulty), ["easy", "normal", "hard"]);
  for (const difficulty of ["easy", "normal", "hard"]) {
    assert.deepEqual(Object.keys(parsed.byDifficulty[difficulty]), ["played", "won", "bestAccuracy", "fastestVictoryMs"]);
  }
});

test("recordMatch replaces only the selected difficulty and rounds uncloaked accuracy", () => {
  const stats = freshDefault();
  const next = recordMatch(stats, "hard", { won: true, accuracy: 80.6, durationMs: 5000 });
  const negative = recordMatch(freshDefault(), "normal", { won: false, accuracy: -1.2, durationMs: 10 });
  const overflow = recordMatch(freshDefault(), "normal", { won: false, accuracy: 110.6, durationMs: 10 });

  assert.notEqual(next, stats);
  assert.notEqual(next.byDifficulty, stats.byDifficulty);
  assert.notEqual(next.byDifficulty.hard, stats.byDifficulty.hard);
  assert.equal(next.byDifficulty.easy, stats.byDifficulty.easy);
  assert.equal(next.byDifficulty.normal, stats.byDifficulty.normal);
  assert.equal(next.byDifficulty.hard.bestAccuracy, 81);
  assert.equal(negative.byDifficulty.normal.bestAccuracy, 0);
  assert.equal(overflow.byDifficulty.normal.bestAccuracy, 100);
});

test("audio initialization, playback, and failures are safe in a mocked browser", async () => {
  const hadWindow = Object.hasOwn(globalThis, "window");
  const previousWindow = globalThis.window;
  const calls = {
    constructors: 0, resumes: 0, oscillators: 0, gains: 0,
    connections: 0, starts: 0, stops: 0, closes: 0,
    rejectResume: true, rejectClose: true, throwOnCreate: false,
  };

  class FakeAudioContext {
    state = "suspended";
    destination = {};

    constructor() { calls.constructors += 1; }
    resume() {
      calls.resumes += 1;
      return calls.rejectResume ? Promise.reject(new Error("blocked")) : Promise.resolve();
    }
    createOscillator() {
      calls.oscillators += 1;
      if (calls.throwOnCreate) throw new Error("unavailable");
      return {
        type: "sine",
        frequency: { setValueAtTime() {} },
        connect() { calls.connections += 1; return this; },
        start() { calls.starts += 1; },
        stop() { calls.stops += 1; },
      };
    }
    createGain() {
      calls.gains += 1;
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() { calls.connections += 1; return this; },
      };
    }
    close() {
      calls.closes += 1;
      return calls.rejectClose ? Promise.reject(new Error("already closed")) : Promise.resolve();
    }
  }

  globalThis.window = { AudioContext: FakeAudioContext };
  try {
    const audio = createFleetAudio();
    assert.equal(calls.constructors, 0);
    audio.play("hit");
    assert.equal(calls.constructors, 0);
    assert.equal(calls.oscillators, 0);

    await assert.doesNotReject(audio.unlock());
    assert.equal(calls.constructors, 1);
    assert.equal(calls.resumes, 1);
    await audio.unlock();
    assert.equal(calls.constructors, 1);
    assert.equal(calls.resumes, 2);

    audio.setMuted(true);
    audio.play("hit");
    assert.equal(calls.oscillators, 0);
    audio.setMuted(false);
    audio.play("victory");
    assert.equal(calls.oscillators, 1);
    assert.equal(calls.gains, 1);
    assert.equal(calls.connections, 2);
    assert.equal(calls.starts, 1);
    assert.equal(calls.stops, 1);

    calls.throwOnCreate = true;
    assert.doesNotThrow(() => audio.play("sunk"));
    audio.dispose();
    audio.dispose();
    assert.equal(calls.closes, 1);
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
  }
});
