import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_STATS,
  MUTE_KEY,
  STATS_KEY,
  parseStats,
  recordMatch,
  safeRead,
  safeWrite,
} from "../app/playground/neon-fleet/neon-fleet-storage.ts";
import { createFleetAudio } from "../app/playground/neon-fleet/neon-fleet-audio.ts";

const freshDefault = () => ({
  version: 1,
  byDifficulty: {
    easy: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
    normal: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
    hard: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
  },
});

test("parseStats replaces malformed, inconsistent, and impossible versioned data with defaults", () => {
  const invalid = [
    null,
    "{bad",
    JSON.stringify({ version: 2, byDifficulty: freshDefault().byDifficulty }),
    JSON.stringify({ version: 1, byDifficulty: { easy: freshDefault().byDifficulty.easy } }),
    JSON.stringify({
      version: 1,
      byDifficulty: {
        ...freshDefault().byDifficulty,
        normal: { played: 2, won: 3, bestAccuracy: 10, fastestVictoryMs: null },
      },
    }),
    JSON.stringify({
      version: 1,
      byDifficulty: {
        ...freshDefault().byDifficulty,
        hard: { played: 1.5, won: 1, bestAccuracy: Infinity, fastestVictoryMs: -1 },
      },
    }),
  ];

  for (const raw of invalid) assert.deepEqual(parseStats(raw), DEFAULT_STATS);
});

test("parseStats accepts a valid record and recordMatch updates one difficulty immutably", () => {
  const stored = JSON.stringify({
    version: 1,
    byDifficulty: {
      easy: { played: 4, won: 3, bestAccuracy: 76, fastestVictoryMs: 64000 },
      normal: { played: 2, won: 1, bestAccuracy: 45, fastestVictoryMs: 99000 },
      hard: { played: 0, won: 0, bestAccuracy: 0, fastestVictoryMs: null },
    },
  });
  const stats = parseStats(stored);
  const next = recordMatch(stats, "hard", { won: true, accuracy: 64, durationMs: 91000 });

  assert.deepEqual(stats, JSON.parse(stored));
  assert.notEqual(next, stats);
  assert.notEqual(next.byDifficulty, stats.byDifficulty);
  assert.equal(next.byDifficulty.hard.played, 1);
  assert.equal(next.byDifficulty.hard.won, 1);
  assert.equal(next.byDifficulty.hard.bestAccuracy, 64);
  assert.equal(next.byDifficulty.hard.fastestVictoryMs, 91000);
  assert.deepEqual(next.byDifficulty.easy, stats.byDifficulty.easy);
});

test("recordMatch clamps rounded accuracy and only records a positive fastest time for wins", () => {
  const first = recordMatch(freshDefault(), "normal", { won: false, accuracy: 110.6, durationMs: 12000 });
  const second = recordMatch(first, "normal", { won: true, accuracy: -1.2, durationMs: 0 });
  const third = recordMatch(second, "normal", { won: true, accuracy: 80.2, durationMs: 8000 });
  const fourth = recordMatch(third, "normal", { won: true, accuracy: 70, durationMs: 10000 });

  assert.equal(first.byDifficulty.normal.bestAccuracy, 100);
  assert.equal(first.byDifficulty.normal.fastestVictoryMs, null);
  assert.equal(second.byDifficulty.normal.fastestVictoryMs, null);
  assert.equal(third.byDifficulty.normal.bestAccuracy, 100);
  assert.equal(third.byDifficulty.normal.fastestVictoryMs, 8000);
  assert.equal(fourth.byDifficulty.normal.fastestVictoryMs, 8000);
});

test("parseStats defaults are fresh and do not share nested references", () => {
  const first = parseStats(null);
  const second = parseStats(null);
  first.byDifficulty.easy.played = 99;

  assert.notEqual(first, DEFAULT_STATS);
  assert.notEqual(first.byDifficulty.easy, second.byDifficulty.easy);
  assert.equal(second.byDifficulty.easy.played, 0);
  assert.equal(DEFAULT_STATS.byDifficulty.easy.played, 0);
});

test("recordMatch leaves invalid difficulty or result unchanged instead of corrupting stats", () => {
  const stats = freshDefault();

  assert.equal(recordMatch(stats, "impossible", { won: true, accuracy: 50, durationMs: 10 }), stats);
  assert.equal(recordMatch(stats, "easy", { won: "yes", accuracy: 50, durationMs: 10 }), stats);
  assert.equal(recordMatch(stats, "easy", { won: true, accuracy: NaN, durationMs: 10 }), stats);
});

test("safeRead and safeWrite are harmless during Node SSR without localStorage", () => {
  assert.equal(STATS_KEY, "dk-neon-fleet-stats-v1");
  assert.equal(MUTE_KEY, "dk-neon-fleet-muted");
  assert.equal(safeRead(STATS_KEY), null);
  assert.equal(safeWrite(MUTE_KEY, "true"), false);
});

test("audio adapter provides a safe no-op Node lifecycle", async () => {
  const audio = createFleetAudio();
  for (const key of ["unlock", "setMuted", "play", "dispose"]) assert.equal(typeof audio[key], "function");

  audio.setMuted(true);
  audio.play("hit");
  audio.dispose();
  audio.dispose();
  audio.play("victory");
  await assert.doesNotReject(audio.unlock());
});

test("game UI exposes the complete setup, combat, accessibility, and adapter contract", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-fleet/neon-fleet-game.tsx", import.meta.url),
    "utf8",
  );

  for (const token of [
    "GAME 08", "Your Fleet", "Enemy Waters", "Auto-place", "Reset fleet", "Rotate",
    "Start battle", "Easy", "Normal", "Hard", "MutationObserver", "visibilitychange",
    "createFleetAudio", "chooseAiShot", "recordMatch", "safeRead", "safeWrite",
    '"victory"', '"defeat"', 'role="grid"', 'role="gridcell"', "aria-live", "aria-modal",
    "untried",
  ]) {
    assert.ok(source.includes(token), `missing UI contract token: ${token}`);
  }

  assert.match(source, /BOARD_SIZE\s*\*\s*BOARD_SIZE/);
  assert.match(source, /String\.fromCharCode\(65\s*\+\s*cell\.y\)/);
  assert.match(source, /setTimeout\([\s\S]*?(?:500|600|650|700)/);
  assert.doesNotMatch(source, /Directional controls|d-?pad/i);
  assert.match(source, /match\.phase === "aiTurn" && !paused/);
  assert.match(source, /toggleMute[\s\S]*?audioRef\.current\?\.unlock\(\)/);
});

test("AI receives only public board knowledge", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-fleet/neon-fleet-game.tsx", import.meta.url),
    "utf8",
  );
  const call = source.match(/chooseAiShot\(([\s\S]*?)\);/)?.[1] ?? "";

  assert.match(source, /shots:\s*(?:match|current)\.player\.shots/);
  assert.match(source, /remainingLengths:/);
  assert.ok(call, "chooseAiShot call is missing");
  assert.doesNotMatch(call, /\.ships|player/);
});

test("route mounts Neon Fleet with useful metadata", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-fleet/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /title:\s*["']Neon Fleet \u2014 Battleship["']/);
  assert.match(source, /description:\s*["'][^"']*(?:fleet|Battleship)[^"']*["']/i);
  assert.match(source, /<NeonFleetGame\s*\/>/);
});

test("scoped styles provide responsive themes, focus, motion, and shot presentation", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-fleet/neon-fleet.module.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /\.boards\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,/);
  assert.match(source, /@media\s*\(max-width:\s*760px\)/);
  assert.match(source, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(source, /--(?:water|fleet-water):/);
  assert.match(source, /\.(?:dark|light)\b|:global\(\[data-theme=/);
  assert.match(source, /:focus-visible/);
  assert.match(source, /\[data-shot=["']miss["']\]/);
  assert.match(source, /\[data-shot=["']hit["']\]/);
  assert.match(source, /\[data-shot=["']sunk["']\]/);
  assert.match(source, /radar/i);
});
