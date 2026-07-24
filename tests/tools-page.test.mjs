import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("tools page Vietnamese interface copy is stored as readable UTF-8", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /filter: "L\u1ecdc c\u00f4ng c\u1ee5\.\.\."/u);
  assert.match(page, /quick: "T\u00ecm nhanh b\u1ea5t k\u1ef3 c\u00f4ng c\u1ee5 n\u00e0o\.\.\."/u);
  assert.match(page, /badge: "DK Coder \u00b7 Toolbox"/u);
  assert.match(page, /lead: "B\u1ed9 ti\u1ec7n \u00edch d\u00e0nh cho l\u1eadp tr\u00ecnh, thi\u1ebft k\u1ebf, v\u00e0 x\u1eed l\u00fd n\u1ed9i dung \u2014 nhanh, ri\u00eang t\u01b0 v\u00e0 ngay trong tr\u00ecnh duy\u1ec7t\."/u);
  assert.match(page, /<kbd>Ctrl K<\/kbd>/u);
  const badTokens = [
    String.fromCharCode(0x00c3),
    String.fromCharCode(0x00c2),
    String.fromCharCode(0x00e2, 0x20ac),
    String.fromCharCode(0x00e2, 0x0152),
    String.fromCharCode(0x00c3, 0x00a1, 0x00c2),
  ];
  for (const token of badTokens) assert.equal(page.includes(token), false, `Unexpected mojibake token ${JSON.stringify(token)}`);
});
test("tools sidebar keeps its scroll position while changing tool collections", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  const dynamicPage = readFileSync(resolve("app/tools/[collectionId]/page.tsx"), "utf8");

  assert.match(page, /useLayoutEffect/);
  assert.match(page, /useRef/);
  assert.match(page, /const toolsNavRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(page, /dk-tools:sidebar-scroll/);
  assert.match(page, /ref=\{toolsNavRef\}/);
  assert.match(page, /onScroll=\{rememberSidebarScroll\}/);
  assert.match(page, /rememberSidebarScroll\(\);\s*router\.push/);
  assert.doesNotMatch(dynamicPage, /key=\{params\.collectionId\}/);
});
test("tools sidebar dark theme keeps every navigation label readable", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.ok(css.includes('[data-theme="dark"] .tools-sidebar{--tools-sidebar-text:#eaf7f5;--tools-sidebar-muted:#b7cbc8}'));
  assert.ok(css.includes('[data-theme="dark"] .tools-sidebar .tools-nav-item{color:var(--tools-sidebar-text)}'));
  assert.ok(css.includes('[data-theme="dark"] .tools-sidebar .tools-group-heading{color:var(--tools-sidebar-muted)}'));
  assert.ok(css.includes('[data-theme="dark"] .tools-sidebar-title,[data-theme="dark"] .tools-nav-item.is-active{color:var(--control-on-accent)}'));
});