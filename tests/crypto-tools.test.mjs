import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checksum, generateHmac, generatePassword, generateShaHash } from "../app/tools/crypto-engine.ts";

test("Crypto engine generates SHA hashes and HMAC digests", async () => {
  assert.equal(await generateShaHash("DK Tools", "SHA-256"), "0581e8145938e85c200b3ba3eeacfaa6c638939413b7a74020c6238219fc2421");
  assert.equal(await generateHmac("DK Tools", "secret", "SHA-256"), "e249d392ec92c4ca9a88c077e6e0e6d84ef0910fa631a3d1ba74e2f1320d1471");
});

test("Crypto engine calculates checksums and configurable passwords", () => {
  assert.equal(checksum("ABC"), "000000c6");
  const password = generatePassword({ length: 24, uppercase: true, lowercase: true, numbers: true, symbols: false });
  assert.equal(password.length, 24);
  assert.match(password, /^[A-Za-z0-9]+$/);
});

test("Crypto workbench seeds raw sample input for every mode", () => {
  const workbench = readFileSync(resolve("app/tools/crypto-workbench.tsx"), "utf8");
  assert.match(workbench, /type CryptoTab = .*sample: string/s);
  assert.match(workbench, /useState<CryptoMode>\(tabs\[0\]!\.id\)/);
  assert.match(workbench, /useState\(tabs\[0\]!\.sample\)/);
  assert.match(workbench, /const nextTab = tabs\.find\(\(tab\) => tab\.id === next\)!;/);
  assert.match(workbench, /setInput\(nextTab\.sample\)/);
  assert.match(workbench, /setInput\(active\.sample\)/);
});

test("Tools page routes crypto collection to the dedicated workbench", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /import CryptoWorkbench from "\.\/crypto-workbench";/);
  assert.match(page, /activeCollection\.id === "crypto-hash" \? <CryptoWorkbench \/>/);
});
