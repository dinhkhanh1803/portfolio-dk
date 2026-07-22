import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describeCron, getNextRuns, parseCronExpression } from "../app/tools/cron-schedule-engine.ts";

test("cron parser validates five fields and explains common schedules", () => {
  assert.deepEqual(parseCronExpression("*/5 * * * *").fields, ["*/5", "*", "*", "*", "*"]);
  assert.equal(parseCronExpression("* * * *").valid, false);
  assert.equal(parseCronExpression("70 * * * *").valid, false);
  assert.equal(describeCron("0 9 * * 1-5"), "At 09:00, Monday through Friday.");
  assert.equal(describeCron("*/15 * * * *"), "Every 15 minutes.");
});

test("next-run preview returns the next matching local schedule times", () => {
  const start = new Date(2026, 6, 20, 8, 59, 30);
  const runs = getNextRuns("*/15 * * * *", start, 3);
  assert.equal(runs.length, 3);
  assert.deepEqual(runs.map((value) => [value.getHours(), value.getMinutes()]), [[9, 0], [9, 15], [9, 30]]);
});
test("cron schedule collection uses the dedicated four-tab workbench", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const workbench = readFileSync(resolve("app/tools/cron-schedule-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  for (const label of ["Cron Tools", "Crontab Visual Editor", "Crontab Explainer", "Cron Next-Run Preview"]) assert.match(workbench, new RegExp(label));
  assert.match(page, /activeCollection\.id === "cron-schedule" \? <CronScheduleWorkbench/);
  assert.match(css, /\.cron-workbench/);
});