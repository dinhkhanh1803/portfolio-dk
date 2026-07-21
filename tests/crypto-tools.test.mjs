import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  checksum,
  crc32,
  decodeJwt,
  decryptText,
  djb2,
  encryptText,
  generateHmac,
  generateHmacDigest,
  generatePassword,
  generateShaDigest,
  generateShaHash,
  generateSri,
  hashText,
  inspectJwt,
} from "../app/tools/crypto-engine.ts";

test("Crypto engine generates SHA hashes and HMAC digests", async () => {
  assert.equal(await generateShaHash("DK Tools", "SHA-256"), "0581e8145938e85c200b3ba3eeacfaa6c638939413b7a74020c6238219fc2421");
  assert.equal(await generateHmac("DK Tools", "secret", "SHA-256"), "e249d392ec92c4ca9a88c077e6e0e6d84ef0910fa631a3d1ba74e2f1320d1471");
  const digest = await generateShaDigest("DK Tools", "SHA-256");
  assert.equal(digest.hex, "0581e8145938e85c200b3ba3eeacfaa6c638939413b7a74020c6238219fc2421");
  assert.equal(digest.base64Url, "BYHoFFk46FwgCzuj7qz6psY4k5QTt6dAIMYjghn8JCE");
  const hmac = await generateHmacDigest("DK Tools", "secret", "SHA-256");
  assert.equal(hmac.hex, "e249d392ec92c4ca9a88c077e6e0e6d84ef0910fa631a3d1ba74e2f1320d1471");
});

test("Crypto engine calculates checksums and configurable passwords", () => {
  assert.equal(checksum("ABC"), "000000c6");
  assert.equal(crc32(""), "00000000");
  assert.equal(djb2(""), "00001505");
  const password = generatePassword({ length: 24, uppercase: true, lowercase: true, numbers: true, symbols: false });
  assert.equal(password.length, 24);
  assert.match(password, /^[A-Za-z0-9]+$/);
});

test("Crypto engine supports text hash, SRI, JWT inspection, and AES-GCM text encryption", async () => {
  const hashes = await hashText("DK Tools");
  assert.equal(hashes.find((item) => item.label === "SHA-256")?.hex, "0581e8145938e85c200b3ba3eeacfaa6c638939413b7a74020c6238219fc2421");
  assert.equal(hashes.find((item) => item.label === "CRC32")?.hex, "644c31a5");
  assert.equal(await generateSri("console.log('DK Tools');", "SHA-384"), "sha384-V1wRCQxPb/68C+rCz8CfMga9KXu/OF0j77ze9yNz+pdlBFY6sRfTvM2PKrbxVQHS");

  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRLIENvZGVyIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature";
  const decoded = decodeJwt(token);
  assert.equal(decoded.header.alg, "HS256");
  assert.equal(decoded.payload.name, "DK Coder");
  const inspected = inspectJwt(token);
  assert.equal(inspected.algorithm, "HS256");
  assert.equal(inspected.subject, "1234567890");

  const encrypted = await encryptText("local secret", "passphrase");
  assert.match(encrypted, /"alg":"AES-256-GCM"/);
  assert.equal(await decryptText(encrypted, "passphrase"), "local secret");
});

test("Crypto workbench seeds raw sample input for every mode", () => {
  const workbench = readFileSync(resolve("app/tools/crypto-workbench.tsx"), "utf8");
  assert.match(workbench, /type CryptoTab = .*sample: string/s);
  assert.match(workbench, /useState<CryptoMode>\(tabs\[0\]!\.id\)/);
  assert.match(workbench, /useState\(tabs\[0\]!\.sample\)/);
  assert.match(workbench, /const nextTab = tabs\.find\(\(tab\) => tab\.id === next\)!;/);
  assert.match(workbench, /setInput\(nextTab\.sample\)/);
  assert.match(workbench, /setInput\(active\.sample\)/);
  assert.match(workbench, /Text Hash Generator/);
  assert.match(workbench, /SRI Hash Generator/);
  assert.match(workbench, /JWT Debugger/);
  assert.match(workbench, /JWT Inspector/);
  assert.match(workbench, /Text Encrypt \/ Decrypt/);
  assert.doesNotMatch(workbench, /KeyRound/);
});

test("Tools page routes crypto collection to the dedicated workbench", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /import CryptoWorkbench from "\.\/crypto-workbench";/);
  assert.match(page, /activeCollection\.id === "crypto-hash" \? <CryptoWorkbench \/>/);
  assert.match(page, /Text Hash Generator/);
  assert.match(page, /SRI Hash Generator/);
  assert.match(page, /JWT Debugger/);
  assert.match(page, /JWT Inspector/);
  assert.match(page, /Text Encrypt \/ Decrypt/);
});

test("Crypto workbench uses the same editor/action layout contract as Data Format", () => {
  const workbench = readFileSync(resolve("app/tools/crypto-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(workbench, /<span className="crypto-option-spacer" \/><button onClick=\{sample\}/);
  assert.match(workbench, /<\/label>\s*<div className="crypto-actions"><button className="is-primary" onClick=\{run\}/s);
  assert.doesNotMatch(workbench, /<div className="crypto-actions"><button className="is-primary" onClick=\{run\}[^]*<\/div>\s*<\/div>\s*<div className="crypto-editor-grid">/s);
  assert.match(css, /\/\* Crypto detail layout matches Data Format converter grid \*\//);
  assert.match(css, /\.tools-main\.is-detail \.crypto-editor-grid\{grid-template-columns:minmax\(0,1fr\) 6\.5rem minmax\(0,1fr\)/s);
  assert.match(css, /\.tools-main\.is-detail \.crypto-actions\{flex-direction:column/s);
  assert.match(css, /\.tools-main\.is-detail \.crypto-actions small\{display:block/s);
  assert.match(css, /@media\(min-width:981px\)\{\.tools-main\.is-detail \.crypto-editor-grid\{grid-template-columns:minmax\(0,1fr\) 6\.5rem minmax\(0,1fr\)/s);
});
