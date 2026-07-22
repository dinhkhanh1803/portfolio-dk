import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQrPayload,
  calculateBitwise,
  checkLuhn,
  executeSampleSql,
  parseSvgPath,
  parseUserAgent,
  satisfiesSemverRange,
} from "../app/tools/developer-utilities-engine.ts";

test("builds standards-compatible Wi-Fi QR payloads", () => {
  assert.equal(buildQrPayload("wifi", { ssid: "DK Tools", password: "secret", encryption: "WPA" }), "WIFI:T:WPA;S:DK Tools;P:secret;;");
});

test("builds contact QR payloads with organisation and website details", () => {
  const payload = buildQrPayload("vcard", { name: "Lan Nguyen", phone: "+84900000000", email: "lan@example.com", organization: "DK Tools", website: "https://dktools.dev" });
  assert.match(payload, /ORG:DK Tools/);
  assert.match(payload, /URL:https:\/\/dktools.dev/);
});

test("executes a read-only sample SQL query", () => {
  const result = executeSampleSql("SELECT name, age FROM users WHERE age > 25 ORDER BY age DESC");
  assert.equal(result.error, undefined);
  assert.deepEqual(result.rows.map((row) => row.name), ["Minh", "Lan"]);
});

test("aggregates averages in the SQL playground", () => {
  const result = executeSampleSql("SELECT AVG(age) AS average_age FROM users");
  assert.deepEqual(result.rows, [{ average_age: 28 }]);
});

test("parses SVG commands and bounds", () => {
  const parsed = parseSvgPath("M 10 10 L 90 90");
  assert.equal(parsed.commands.length, 2);
  assert.deepEqual(parsed.bounds, { minX: 10, minY: 10, maxX: 90, maxY: 90 });
});

test("calculates bitwise operations", () => {
  assert.equal(calculateBitwise(5, 3, "and").decimal, 1);
  assert.equal(calculateBitwise(5, 3, "xor").binary, "110");
});

test("validates cards with Luhn and recognises common UA fields", () => {
  assert.equal(checkLuhn("4111 1111 1111 1111").valid, true);
  assert.equal(checkLuhn("4111 1111 1111 1112").valid, false);
  assert.equal(checkLuhn("3530111333300000").type, "JCB");
  const ua = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36");
  assert.equal(ua.browser, "Chrome");
  assert.equal(ua.os, "Windows");
});

test("evaluates practical semantic version ranges", () => {
  assert.equal(satisfiesSemverRange("1.4.2", "^1.2.0"), true);
  assert.equal(satisfiesSemverRange("2.0.0", "^1.2.0"), false);
  assert.equal(satisfiesSemverRange("1.2.5", "~1.2.0"), true);
});
