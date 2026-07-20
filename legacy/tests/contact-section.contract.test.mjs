import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const componentPath = resolve("app/contact-section.tsx");
const source = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("contact form exposes the six approved controls without submitting", () => {
  for (const name of ["name", "email", "phone", "projectType", "budget", "message"]) {
    assert.match(source, new RegExp(`name=["']${name}["']`));
  }

  assert.match(source, /type=["']button["']/);
  assert.doesNotMatch(source, /onSubmit|fetch\(|\/api\//);
});

test("contact details preserve all four approved channels", () => {
  assert.match(source, /trandinhkhanh0318@gmail\.com/);
  assert.match(source, /0915 368 545/);
  assert.match(source, /trandinhkhanh2002/);
  assert.match(source, /Đà Nẵng, Việt Nam/);
});

test("contact details include a concise bilingual introduction", () => {
  assert.match(source, /Thông tin liên hệ/);
  assert.match(source, /Contact information/);
  assert.match(source, /24 giờ/);
  assert.match(source, /24 hours/);
});
