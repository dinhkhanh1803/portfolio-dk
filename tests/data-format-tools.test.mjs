import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  csvToJson,
  csvToMarkdown,
  csvToSql,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
  markdownToJson,
  markdownToNotionBlocks,
  xmlToJson,
  yamlToJson,
} from "../app/tools/data-format-engine.ts";

test("CSV parser preserves quoted commas, newlines, and escaped quotes", () => {
  const result = csvToJson('name,note\n"Lan, An","Line one\nLine ""two"""');
  assert.deepEqual(result, [{ name: "Lan, An", note: 'Line one\nLine "two"' }]);
});

test("CSV options trim values and omit empty properties", () => {
  const result = csvToJson(" name , email , age \n Lan , , 24 ", { trim: true, skipEmptyValues: true });
  assert.deepEqual(result, [{ name: "Lan", age: "24" }]);
});

test("JSON records round-trip through CSV with escaped values", () => {
  const source = [{ name: "Lan, An", active: true }, { name: "Minh", active: false, note: "hello" }];
  const csv = jsonToCsv(source);
  assert.equal(csv, 'name,active,note\n"Lan, An",true,\nMinh,false,hello');
  assert.deepEqual(csvToJson(csv), [{ name: "Lan, An", active: "true", note: "" }, { name: "Minh", active: "false", note: "hello" }]);
});

test("CSV creates portable Markdown and PostgreSQL insert statements", () => {
  const csv = "name,age\nO'Reilly,34";
  assert.equal(csvToMarkdown(csv), "| name | age |\n| --- | --- |\n| O'Reilly | 34 |");
  assert.equal(csvToSql(csv, { tableName: "people", dialect: "postgres" }), "INSERT INTO \"people\" (\"name\", \"age\") VALUES\n  ('O''Reilly', '34');");
});

test("CSV to SQL keeps columns that appear after skipped empty cells", () => {
  const sql = csvToSql("name,email\nLan,\nMinh,minh@example.com", { skipEmptyValues: true });
  assert.equal(sql, "INSERT INTO \"imported_data\" (\"name\", \"email\") VALUES\n  ('Lan', ''),\n  ('Minh', 'minh@example.com');");
});

test("Markdown tables are converted to JSON and malformed input explains the issue", () => {
  assert.deepEqual(markdownToJson("| Name | Score |\n| --- | ---: |\n| Lan | 10 |"), [{ Name: "Lan", Score: "10" }]);
  assert.deepEqual(markdownToJson("| Note |\n| --- |\n| A\\|B |"), [{ Note: "A|B" }]);
  assert.throws(() => csvToJson('name,age\n"Lan,24'), /CSV/);
  assert.throws(() => csvToJson('"Lan"x,24'), /CSV/);
  assert.throws(() => jsonToCsv({ name: "Lan" }), /array/i);
});

test("YAML and JSON converters preserve nested data", () => {
  const source = { name: "Lan", tags: ["dev", "tools"], profile: { active: true, score: 10 } };
  const yaml = jsonToYaml(source);
  assert.match(yaml, /name: Lan/);
  assert.deepEqual(yamlToJson(yaml), source);
});

test("JSON and XML converters preserve simple nested documents", () => {
  const xml = jsonToXml({ user: { name: "Lan", active: true, note: "A&B" } }, "root");
  assert.equal(xml, "<root>\n  <user>\n    <name>Lan</name>\n    <active>true</active>\n    <note>A&amp;B</note>\n  </user>\n</root>");
  assert.deepEqual(xmlToJson(xml), { root: { user: { name: "Lan", active: "true", note: "A&B" } } });
});

test("Markdown can export Notion-like blocks", () => {
  assert.deepEqual(markdownToNotionBlocks("# Plan\n- Build tool\nPlain note"), [
    { type: "heading_1", text: "Plan" },
    { type: "bulleted_list_item", text: "Build tool" },
    { type: "paragraph", text: "Plain note" },
  ]);
});

test("Workbench seeds raw sample input for every converter mode", () => {
  const workbench = readFileSync(resolve("app/tools/data-format-workbench.tsx"), "utf8");
  assert.match(workbench, /useState<Mode>\(tabs\[0\]!\.id\)/);
  assert.match(workbench, /useState\(tabs\[0\]!\.sample\)/);
  assert.match(workbench, /const nextTab = tabs\.find\(\(tab\) => tab\.id === next\)!;/);
  assert.match(workbench, /setInput\(nextTab\.sample\)/);
  assert.match(workbench, /setInput\(active\.sample\)/);
});

test("Workbench exposes all data-format upload contracts", () => {
  const workbench = readFileSync(resolve("app/tools/data-format-workbench.tsx"), "utf8");
  assert.match(workbench, /csv-markdown/);
  assert.match(workbench, /yaml-json/);
  assert.match(workbench, /json-xml/);
  assert.match(workbench, /xml-json/);
  assert.match(workbench, /markdown-notion/);
  assert.match(workbench, /\.md,\.markdown,\.txt,text\/markdown,text\/plain/);
});


test("Data format layout prioritizes the editor above the fold", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /\.tools-main\.is-detail\{[^}]*padding-top:18px/);
  assert.match(css, /\.tools-main\.is-detail \.tools-detail-header>p\{display:none\}/);
  assert.match(css, /\.tools-main\.is-detail \.data-format-tabs\{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.tools-main\.is-detail \.data-format-tabs\{[^}]*overflow:visible/);
  assert.match(css, /\.data-format-intro p,\.data-format-intro>svg\{display:none\}/);
  assert.match(css, /\.data-format-editor textarea\{[^}]*height:clamp\(150px,24dvh,210px\)/);
  assert.match(css, /@media\(min-width:981px\)\{\.data-format-editors\{grid-template-columns:minmax\(0,1fr\) 6.5rem minmax\(0,1fr\)\}/);
});
