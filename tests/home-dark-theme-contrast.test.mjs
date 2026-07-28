import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

test("home dark mode gives service cards and secondary controls readable surfaces", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(
    css,
    /\[data-theme="dark"\] \.home-main \.service-card\s*\{[^}]*background:\s*linear-gradient\([^}]*border-color:[^}]*box-shadow:/s,
  );
  assert.match(
    css,
    /\[data-theme="dark"\] \.home-main \.service-card h2,\s*\[data-theme="dark"\] \.home-main \.service-card > a\s*\{[^}]*color:\s*var\(--ink\)/s,
  );
  assert.match(
    css,
    /\[data-theme="dark"\] \.home-main \.service-card p\s*\{[^}]*color:\s*var\(--muted\)/s,
  );
  assert.match(
    css,
    /\[data-theme="dark"\] \.home-main \.button-secondary,[^}]*\.availability,[^}]*\.hero-location\s*\{[^}]*background:[^}]*color:\s*var\(--ink\)/s,
  );
});
