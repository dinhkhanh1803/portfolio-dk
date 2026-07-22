import test from "node:test";
import assert from "node:assert/strict";

import {
  formatJson,
  minifyJson,
  flattenJson,
  queryJsonPath,
  diffJson,
  jsonArrayToTable,
  inferJsonSchema,
} from "../app/tools/json-tools-engine.ts";

test("formats valid JSON with optionally sorted object keys", () => {
  assert.equal(formatJson('{"z":1,"a":{"b":true,"a":null}}', { indent: 2, sortKeys: true }), '{\n  "a": {\n    "a": null,\n    "b": true\n  },\n  "z": 1\n}');
});

test("minifies JSON without changing its values", () => {
  assert.equal(minifyJson('{ "name": "Lan", "roles": ["admin", "editor"] }'), '{"name":"Lan","roles":["admin","editor"]}');
});

test("flattens nested values into JSON pointer paths", () => {
  assert.deepEqual(flattenJson({ profile: { name: "Lan" }, tags: ["tools"] }), {
    "/profile/name": "Lan",
    "/tags/0": "tools",
  });
});

test("queries arrays, filters, recursive fields and last item using practical JSONPath", () => {
  const source = { store: { book: [{ title: "A", price: 8 }, { title: "B", price: 12 }] } };
  assert.deepEqual(queryJsonPath(source, "$.store.book[?(@.price < 10)].title").map((item) => item.value), ["A"]);
  assert.deepEqual(queryJsonPath(source, "$..title").map((item) => item.value), ["A", "B"]);
  assert.equal(queryJsonPath(source, "$.store.book[-1].title")[0].value, "B");
});

test("reports added, removed and changed JSON paths", () => {
  const changes = diffJson({ name: "Lan", active: true }, { name: "Minh", role: "admin" });
  assert.deepEqual(changes.map(({ type, path }) => [type, path]), [["changed", "/name"], ["removed", "/active"], ["added", "/role"]]);
});

test("builds a stable table and schema from JSON arrays", () => {
  const table = jsonArrayToTable('[{"name":"Lan","meta":{"team":"DX"}},{"name":"Minh","active":true}]');
  assert.deepEqual(table.columns, ["name", "meta", "active"]);
  assert.equal(table.rows[0].meta, '{"team":"DX"}');
  assert.deepEqual(inferJsonSchema([{ id: 1, active: true }]), { type: "array", items: { type: "object", properties: { id: { type: "number" }, active: { type: "boolean" } }, required: ["id", "active"] } });
});
