import test from "node:test";
import assert from "node:assert/strict";

import {
  formatSql,
  minifyHtml,
  formatXml,
  parseEnv,
  formatEnv,
  yamlToJson,
  jsonToYaml,
  tomlToJson,
  jsonToToml,
  formatColumns,
} from "../app/tools/formatters-engine.ts";

test("formats SQL into readable keyword-cased clauses", () => {
  assert.match(formatSql("select id,name from users where active=1 order by name"), /^SELECT id, name\nFROM users\nWHERE active=1\nORDER BY name$/);
});

test("minifies HTML without comments or inter-tag whitespace", () => {
  assert.equal(minifyHtml("<main>\n <!-- note --> <h1> Hi </h1> \n <p>There</p> </main>"), "<main><h1> Hi </h1><p>There</p></main>");
});

test("indents XML nesting and leaves self-closing nodes on their own line", () => {
  assert.equal(formatXml("<root><item id=\"1\">A</item><empty /></root>"), "<root>\n  <item id=\"1\">A</item>\n  <empty />\n</root>");
});

test("parses, formats, and converts .env variables", () => {
  const parsed = parseEnv("# app\nPORT=3000\nNAME=DK Tools\n");
  assert.deepEqual(parsed, { PORT: "3000", NAME: "DK Tools" });
  assert.equal(formatEnv("NAME=DK Tools\nPORT=3000", { sortKeys: true }), "NAME=DK Tools\nPORT=3000");
});

test("converts YAML and TOML values through JSON", () => {
  assert.deepEqual(JSON.parse(yamlToJson("name: DK\nitems:\n  - tools\n  - docs\n")), { name: "DK", items: ["tools", "docs"] });
  assert.match(jsonToYaml('{"name":"DK","enabled":true}'), /enabled: true/);
  assert.deepEqual(JSON.parse(tomlToJson('title = "DK"\n[server]\nport = 3000')), { title: "DK", server: { port: 3000 } });
  assert.match(jsonToToml('{"title":"DK","server":{"port":3000}}'), /\[server\]/);
});

test("aligns delimited columns and can change delimiters", () => {
  assert.equal(formatColumns("name,role\nLan,Developer", { input: ",", output: "|", align: "left", trim: true }), "name | role     \nLan  | Developer");
});