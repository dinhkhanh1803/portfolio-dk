import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { byteUnitConvert, convertBase, ipAddressConvert, numberBasePlayground, numberToRoman, numberToWords, romanToNumber } from "../app/tools/number-tools-engine.ts";
import { aspectRatio, convertCssUnit, convertTemperature, convertUnit, formatNumberExplorer } from "../app/tools/unit-tools-engine.ts";
import { dateDifference, durationBreakdown, formatDateExplorer, timestampToIso, timezoneConvert } from "../app/tools/date-time-engine.ts";

test("Number tools convert bases, Roman numerals, words, IPs, and bytes", () => {
  assert.deepEqual(convertBase("42", 10), { binary: "101010", octal: "52", decimal: "42", hexadecimal: "2A" });
  assert.equal(numberBasePlayground("0b1010 + 0x5"), "15");
  assert.equal(numberToRoman(1994), "MCMXCIV");
  assert.equal(romanToNumber("MCMXCIV"), 1994);
  assert.equal(numberToWords(1205), "one thousand two hundred five");
  assert.equal(ipAddressConvert("192.168.1.1").integer, 3232235777);
  assert.equal(byteUnitConvert(1024, "B", "KB"), 1);
});

test("Unit tools convert measurements, CSS units, aspect ratios, temperatures, and formats", () => {
  assert.equal(convertUnit(1, "length", "mm", "cm"), 0.1);
  assert.equal(convertTemperature(100, "C", "F"), 212);
  assert.equal(convertCssUnit(16, "px", "rem", 16), 1);
  assert.equal(aspectRatio(1920, 1080).ratio, "16:9");
  assert.equal(formatNumberExplorer(1234567.89, "en-US", "currency", "USD"), "$1,234,567.89");
});

test("Date time tools convert timestamps, timezones, durations, differences, and formats", () => {
  assert.equal(timestampToIso(1700000000), "2023-11-14T22:13:20.000Z");
  assert.equal(timezoneConvert("2024-01-01T00:00:00.000Z", "Asia/Saigon"), "01/01/2024, 07:00:00");
  assert.deepEqual(durationBreakdown(90061), { days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.equal(dateDifference("2024-01-01", "2024-01-31").days, 30);
  assert.equal(formatDateExplorer("2024-01-01T00:00:00.000Z", "en-US", "long"), "January 1, 2024");
});

test("Number, unit, and date workbenches expose requested tabs with raw samples", () => {
  const number = readFileSync(resolve("app/tools/number-tools-workbench.tsx"), "utf8");
  const unit = readFileSync(resolve("app/tools/unit-tools-workbench.tsx"), "utf8");
  const date = readFileSync(resolve("app/tools/date-time-workbench.tsx"), "utf8");
  for (const label of ["Number Base Converter", "Number Base Playground", "Roman Numeral Converter", "Number to Words", "IP Address Converter", "Byte Unit Converter"]) assert.match(number, new RegExp(label));
  for (const label of ["Unit Converter", "CSS Unit Converter", "Temperature Converter", "Aspect Ratio Calculator", "Number Format Explorer"]) assert.match(unit, new RegExp(label));
  for (const label of ["Timestamp Converter", "Timezone Converter", "Duration Calculator", "Date Difference Calculator", "Date Format Explorer"]) assert.match(date, new RegExp(label));
  assert.match(number, /sample: string/);
  assert.match(unit, /sample: string/);
  assert.match(date, /sample: string/);
});
test("Number, unit, and date workbenches use calculator controls instead of raw textarea runners", () => {
  const number = readFileSync(resolve("app/tools/number-tools-workbench.tsx"), "utf8");
  const unit = readFileSync(resolve("app/tools/unit-tools-workbench.tsx"), "utf8");
  const date = readFileSync(resolve("app/tools/date-time-workbench.tsx"), "utf8");
  for (const source of [number, unit, date]) {
    assert.match(source, /calculator-workbench/);
    assert.match(source, /<input/);
    assert.match(source, /<select/);
    assert.doesNotMatch(source, /Raw Input/);
    assert.doesNotMatch(source, /<textarea/);
  }
  assert.match(number, /Base 36/);
  assert.match(unit, /Length/);
  assert.match(date, /Use current time/);
});
test("calculator stylesheet covers numeric tool layout", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  for (const selector of [".calculator-workbench", ".calculator-panel", ".calculator-controls", ".calculator-result-card", ".calculator-toolbar"]) {
    assert.match(css, new RegExp(selector.replace(".", "\\.")));
  }
});

test("Tools page routes Number, Unit, and Date tools to dedicated workbenches", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /import NumberToolsWorkbench from "\.\/number-tools-workbench";/);
  assert.match(page, /import UnitToolsWorkbench from "\.\/unit-tools-workbench";/);
  assert.match(page, /import DateTimeWorkbench from "\.\/date-time-workbench";/);
  assert.match(page, /activeCollection\.id === "number-converters" \? <NumberToolsWorkbench \/>/);
  assert.match(page, /activeCollection\.id === "unit-converters" \? <UnitToolsWorkbench \/>/);
  assert.match(page, /activeCollection\.id === "date-time" \? <DateTimeWorkbench \/>/);
});