import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

test("encoding workbench uses readable dark surfaces and control states", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(
    css,
    /\[data-theme="dark"\] \.encoding-tabs,[\s\S]*?\.encoding-editor\s*\{[^}]*background:/,
  );
  assert.match(
    css,
    /\[data-theme="dark"\] \.encoding-editor>span\s*\{[^}]*background:[^}]*color:\s*var\(--ink\)/s,
  );
  assert.match(
    css,
    /\[data-theme="dark"\] \.encoding-editor textarea\s*\{[^}]*background:[^}]*color:\s*var\(--ink\)/s,
  );
  assert.match(
    css,
    /\[data-theme="dark"\] \.encoding-actions button:disabled,[\s\S]*?\.encoding-output-actions button:disabled\s*\{[^}]*background:[^}]*color:\s*var\(--muted\)[^}]*opacity:/,
  );
});
