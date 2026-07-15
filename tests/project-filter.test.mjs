import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = resolve("app/project-filter.ts");

test("project filters expose the approved order and filter projects", async () => {
  assert.ok(existsSync(modulePath), "project-filter.ts should exist");

  const { PROJECT_FILTERS, filterProjects } = await import(pathToFileURL(modulePath).href);
  const projects = [
    { title: "Store", filter: "web" },
    { title: "Booking", filter: "mobile" },
    { title: "Quest", filter: "game" },
  ];

  assert.deepEqual(PROJECT_FILTERS, ["all", "web", "mobile", "game"]);
  assert.deepEqual(filterProjects(projects, "all"), projects);
  assert.deepEqual(filterProjects(projects, "web"), [projects[0]]);
  assert.deepEqual(filterProjects(projects, "mobile"), [projects[1]]);
  assert.deepEqual(filterProjects(projects, "game"), [projects[2]]);
});
