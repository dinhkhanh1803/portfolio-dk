import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatUuid,
  generateNanoId,
  generatePassword,
  generatePassphrase,
  generateUlid,
  generateUsername,
  generateUuidV4,
  pickRandom,
  rollDice,
} from "../app/tools/id-random-engine.ts";

const bytes = (...values) => {
  let offset = 0;
  return (length) => Uint8Array.from({ length }, () => values[offset++ % values.length] ?? 0);
};

test("ID generators create valid UUID, ULID, and Nano ID values", () => {
  const uuid = generateUuidV4(bytes(0));
  assert.equal(uuid, "00000000-0000-4000-8000-000000000000");
  assert.equal(formatUuid(uuid, { uppercase: true, braces: true, noDashes: true }), "{00000000000040008000000000000000}");
  assert.match(generateUlid(0, bytes(0)), /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.equal(generateNanoId(8, "ab", bytes(0)), "aaaaaaaa");
  assert.throws(() => generateNanoId(0, "ab", bytes(0)), /length/i);
});

test("password generators honor selected character groups and passphrase settings", () => {
  const password = generatePassword({ length: 12, lowercase: true, uppercase: true, numbers: true, symbols: true, excludeSimilar: false, customCharacters: "", excludeCharacters: "" }, bytes(0, 1, 2, 3));
  assert.equal(password.length, 12);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /\d/);
  assert.match(password, /[^A-Za-z0-9]/);
  assert.equal(generatePassphrase(3, "-", true, bytes(0)), "Amber-Amber-Amber");
  assert.throws(() => generatePassword({ length: 4, lowercase: false, uppercase: false, numbers: false, symbols: false, excludeSimilar: false, customCharacters: "", excludeCharacters: "" }, bytes(0)), /character/i);
});

test("username, picker, and dice workflows are deterministic with injected randomness", () => {
  assert.equal(generateUsername("snake_case", true, bytes(0)), "vivid_aurora_100");
  assert.deepEqual(pickRandom(["Apple", "Banana", "Cherry"], 2, false, bytes(0)), ["Apple", "Banana"]);
  assert.deepEqual(rollDice("2d6+3", bytes(0, 5)), { count: 2, sides: 6, modifier: 3, rolls: [1, 6], total: 10 });
  assert.throws(() => rollDice("hello", bytes(0)), /notation/i);
});

test("ID and random collection routes to a dedicated seven-tab workbench", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const workbench = readFileSync(resolve("app/tools/id-random-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  for (const label of ["ID Generator", "Bulk UUID Generator", "Password Generator", "Password Generator Pro", "Username Generator", "Random Picker", "Dice Roller (RPG)"]) assert.match(workbench, new RegExp(label.replace(/[()]/g, "\\$&")));
  assert.match(page, /activeCollection\.id === "id-random" \? <IdRandomWorkbench/);
  assert.match(css, /\.random-generator-workbench/);
  assert.match(css, /\.random-result-list/);
  assert.match(css, /\.random-generator-workbench\{[^}]*container-type:inline-size/);
  assert.match(css, /@container\s*\(max-width:\s*\d+px\)\{\.random-dice-grid\{grid-template-columns:1fr\}/);
});
