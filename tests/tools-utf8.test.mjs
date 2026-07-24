import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const mojibakePattern = /Ã|Â|â€|â€œ|â€|â€™|ï¿½|�/u;

const recentToolFiles = [
  "app/tools/page.tsx",
  "app/tools/regex-tools-workbench.tsx",
  "app/tools/text-utilities-workbench.tsx",
  "app/tools/network-http-workbench.tsx",
  "app/tools/image-effects-workbench.tsx",
  "app/tools/image-enhance-workbench.tsx",
  "app/tools/audio-tools-workbench.tsx",
].map((file) => resolve(file));

test("tools landing page keeps Vietnamese UI copy encoded as UTF-8", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");

  assert.match(page, /DK Coder · Toolbox/u);
  assert.match(page, /Công cụ nhỏ, giải quyết việc lớn\./u);
  assert.match(page, /Bộ tiện ích dành cho lập trình, thiết kế, và xử lý nội dung/u);
  assert.match(page, /Lọc công cụ\.\.\./u);
  assert.match(page, /Tìm nhanh bất kỳ công cụ nào\.\.\./u);
  assert.match(page, /Dùng gần đây/u);
  assert.doesNotMatch(page, mojibakePattern);
});

test("recent tool files do not contain mojibake markers", () => {
  for (const file of recentToolFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, mojibakePattern, file);
  }
});
