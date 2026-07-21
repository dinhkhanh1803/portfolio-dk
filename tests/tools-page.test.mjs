import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("tools page Vietnamese interface copy is stored as readable UTF-8", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /filter: "Lọc công cụ\.\.\."/);
  assert.match(page, /quick: "Tìm nhanh bất kỳ công cụ nào\.\.\."/);
  assert.match(page, /badge: "DK Coder · Toolbox"/);
  assert.match(page, /lead: "Bộ tiện ích dành cho lập trình, thiết kế và xử lý nội dung — nhanh, riêng tư và ngay trong trình duyệt\."/);
  assert.doesNotMatch(page, /Ã|Â|â€|âŒ|á»|áº|Æ/);
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