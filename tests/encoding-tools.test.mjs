import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeBase32, decodeBase64, decodeBinary, decodeBytes, decodeDataUri, decodeHtml, encodeBase32, encodeBase64, encodeBinary, encodeBytes, encodeDataUri, encodeHtml } from "../app/tools/encoding-engine.ts";

test("Base64 handles Unicode and URL-safe output", () => {
  const source = "Xin chào DK Coder 👋";
  assert.equal(decodeBase64(encodeBase64(source)), source);
  const safe = encodeBase64("a?b/c+d", true);
  assert.doesNotMatch(safe, /[+/=]/);
  assert.equal(decodeBase64(safe), "a?b/c+d");
});
test("HTML entities handle named and numeric entities", () => {
  assert.equal(encodeHtml('<a title="A&B">'), "&lt;a title=&quot;A&amp;B&quot;&gt;");
  assert.equal(decodeHtml("&lt;b&gt;&#x2713; &amp; &#39;x&#39;&lt;/b&gt;"), "<b>✓ & 'x'</b>");
});
test("binary uses UTF-8 and validates byte groups", () => {
  const source = "DK ✓";
  assert.equal(decodeBinary(encodeBinary(source)), source);
  assert.throws(() => decodeBinary("101 00000000"), /8 bit/);
});
test("Data URI supports Base64 and percent payloads", () => {
  assert.deepEqual(decodeDataUri(encodeDataUri("Hello ✓", "text/plain;charset=utf-8", true)), { mime: "text/plain;charset=utf-8", value: "Hello ✓" });
  assert.deepEqual(decodeDataUri(encodeDataUri("a & b", "text/plain", false)), { mime: "text/plain", value: "a & b" });
});
test("invalid input fails clearly", () => {
  assert.throws(() => decodeBase64("%%%"), /không hợp lệ/);
  assert.throws(() => decodeDataUri("https://example.com"), /Data URI/);
});
test("Base32 implements RFC 4648 and Unicode round-trip", () => {
  assert.equal(encodeBase32("foobar"), "MZXW6YTBOI======");
  assert.equal(decodeBase32("MZXW6YTBOI======"), "foobar");
  assert.equal(decodeBase32(encodeBase32("Xin chào ✓")), "Xin chào ✓");
  assert.throws(() => decodeBase32("INVALID!"), /RFC 4648/);
});

test("byte converter supports binary, hex, decimal, Base64 and separators", () => {
  const source = "DK ✓";
  for (const format of ["binary", "hex", "decimal", "base64"]) {
    assert.equal(decodeBytes(encodeBytes(source, format, " "), format), source);
  }
  assert.equal(encodeBytes("AB", "hex", ""), "4142");
  assert.equal(decodeBytes("4142", "hex"), "AB");
});

test("Encoding workbench seeds raw sample input for every mode", () => {
  const workbench = readFileSync(resolve("app/tools/encoding-workbench.tsx"), "utf8");
  assert.match(workbench, /useState<EncodingKind>\(tabs\[0\]!\.id\)/);
  assert.match(workbench, /useState\(tabs\[0\]!\.sample\)/);
  assert.match(workbench, /const nextTab = tabs\.find\(\(tab\) => tab\.id === next\)!;/);
  assert.match(workbench, /setInput\(nextTab\.sample\)/);
  assert.match(workbench, /setInput\(active\.sample\)/);
});

test("Encoding and crypto detail layouts share compact workbench contracts", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /\.tools-main\.is-detail \.(?:encoding|crypto)-tabs\{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.tools-main\.is-detail \.(?:encoding|crypto)-workbench\{[^}]*gap:7px/);
  assert.match(css, /\.tools-main\.is-detail \.(?:encoding|crypto)-editor textarea\{[^}]*height:clamp\(150px,24dvh,210px\)/);
});


test("Encoding tabs keep active pills compact", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /\.encoding-tabs\{[^}]*align-items:center/);
  assert.match(css, /\.encoding-tabs button\{[^}]*align-self:center/);
});


test("Encoding active tab pills use fixed compact height", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs button\{[^}]*height:32px/);
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs button\{[^}]*min-height:32px/);
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs button\{[^}]*display:inline-flex/);
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs button\{[^}]*align-items:center/);
});


test("Encoding tab bar stays vertically compact", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs\{[^}]*height:44px/);
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs\{[^}]*min-height:44px/);
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs\{[^}]*max-height:44px/);
  assert.match(css, /\.tools-main\.is-detail \.encoding-tabs\{[^}]*padding:5px/);
});
