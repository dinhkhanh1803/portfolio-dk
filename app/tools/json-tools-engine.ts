type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type JsonPathMatch = { path: string; value: JsonValue };
export type JsonDiff = { type: "added" | "removed" | "changed"; path: string; before?: JsonValue; after?: JsonValue };

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => !!value && typeof value === "object" && !Array.isArray(value);
const encodePointer = (part: string | number) => String(part).replace(/~/g, "~0").replace(/\//g, "~1");
const parse = (source: string): JsonValue => JSON.parse(source) as JsonValue;

function sortValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!isRecord(value)) return value;
  return Object.keys(value).sort().reduce<Record<string, JsonValue>>((result, key) => {
    result[key] = sortValue(value[key]);
    return result;
  }, {});
}

export function formatJson(source: string, options: { indent?: number; sortKeys?: boolean } = {}) {
  const value = parse(source);
  return JSON.stringify(options.sortKeys ? sortValue(value) : value, null, options.indent ?? 2);
}

export function minifyJson(source: string) {
  return JSON.stringify(parse(source));
}

export function flattenJson(value: JsonValue, path = "", result: Record<string, JsonValue> = {}) {
  if (Array.isArray(value)) {
    if (!value.length) result[path || "/"] = value;
    value.forEach((item, index) => flattenJson(item, `${path}/${encodePointer(index)}`, result));
    return result;
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (!keys.length) result[path || "/"] = value;
    keys.forEach((key) => flattenJson(value[key], `${path}/${encodePointer(key)}`, result));
    return result;
  }
  result[path || "/"] = value;
  return result;
}

function descendants(value: JsonValue, name: string, path = ""): JsonPathMatch[] {
  const matches: JsonPathMatch[] = [];
  if (Array.isArray(value)) value.forEach((item, index) => matches.push(...descendants(item, name, `${path}[${index}]`)));
  if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) => {
      const nextPath = path ? `${path}.${key}` : `$.${key}`;
      if (key === name) matches.push({ path: nextPath, value: item });
      matches.push(...descendants(item, name, nextPath));
    });
  }
  return matches;
}

function splitPath(expression: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const character of expression.replace(/^\$\.?/, "")) {
    if (character === "." && depth === 0) {
      if (current) parts.push(current);
      current = "";
    } else {
      if (character === "[") depth += 1;
      if (character === "]") depth -= 1;
      current += character;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function compareValue(value: JsonValue | undefined, operator: string, raw: string) {
  const expected = raw.replace(/^['"]|['"]$/g, "");
  const numeric = Number(expected);
  const target = Number.isNaN(numeric) ? expected : numeric;
  if (operator === "==" || operator === "===") return value === target || String(value) === expected;
  if (operator === "!=") return value !== target && String(value) !== expected;
  if (typeof value !== "number" || typeof target !== "number") return false;
  if (operator === "<") return value < target;
  if (operator === "<=") return value <= target;
  if (operator === ">") return value > target;
  return value >= target;
}

export function queryJsonPath(source: JsonValue, expression: string): JsonPathMatch[] {
  const query = expression.trim();
  if (!query || query === "$") return [{ path: "$", value: source }];
  const recursive = /^\$\.\.([A-Za-z_$][\w$]*)$/.exec(query);
  if (recursive) return descendants(source, recursive[1], "$");
  let current: JsonPathMatch[] = [{ path: "$", value: source }];
  for (const segment of splitPath(query)) {
    const match = /^([^\[]+)?(?:\[(.*)\])?$/.exec(segment);
    if (!match) return [];
    const [, property, selector] = match;
    if (property) {
      current = current.flatMap((entry) => isRecord(entry.value) && property in entry.value
        ? [{ path: `${entry.path}.${property}`, value: entry.value[property] }]
        : []);
    }
    if (selector === undefined) continue;
    if (selector === "*") {
      current = current.flatMap((entry) => Array.isArray(entry.value)
        ? entry.value.map((value, index) => ({ path: `${entry.path}[${index}]`, value }))
        : isRecord(entry.value) ? Object.entries(entry.value).map(([key, value]) => ({ path: `${entry.path}.${key}`, value })) : []);
      continue;
    }
    const filter = /^\?\(@\.([\w$]+)\s*(==|===|!=|<=|>=|<|>)\s*(.+)\)$/.exec(selector);
    if (filter) {
      current = current.flatMap((entry) => Array.isArray(entry.value)
        ? entry.value.flatMap((value, index) => isRecord(value) && compareValue(value[filter[1]], filter[2], filter[3]) ? [{ path: `${entry.path}[${index}]`, value }] : [])
        : []);
      continue;
    }
    const index = Number(selector);
    current = current.flatMap((entry) => Array.isArray(entry.value) && Number.isInteger(index)
      ? (() => { const resolved = index < 0 ? entry.value.length + index : index; return resolved >= 0 && resolved < entry.value.length ? [{ path: `${entry.path}[${resolved}]`, value: entry.value[resolved] }] : []; })()
      : []);
  }
  return current;
}

export function diffJson(before: JsonValue, after: JsonValue, path = ""): JsonDiff[] {
  if (Object.is(before, after)) return [];
  if (Array.isArray(before) && Array.isArray(after)) {
    const items: JsonDiff[] = [];
    const count = Math.max(before.length, after.length);
    for (let index = 0; index < count; index += 1) {
      const nextPath = `${path}/${index}`;
      if (index >= before.length) items.push({ type: "added", path: nextPath, after: after[index] });
      else if (index >= after.length) items.push({ type: "removed", path: nextPath, before: before[index] });
      else items.push(...diffJson(before[index], after[index], nextPath));
    }
    return items;
  }
  if (isRecord(before) && isRecord(after)) {
    const items: JsonDiff[] = [];
    const keys = [...Object.keys(before), ...Object.keys(after).filter((key) => !(key in before))];
    for (const key of keys) {
      const nextPath = `${path}/${encodePointer(key)}`;
      if (!(key in after)) items.push({ type: "removed", path: nextPath, before: before[key] });
      else if (!(key in before)) items.push({ type: "added", path: nextPath, after: after[key] });
      else items.push(...diffJson(before[key], after[key], nextPath));
    }
    return items;
  }
  return [{ type: "changed", path: path || "/", before, after }];
}

export function jsonArrayToTable(source: string) {
  const value = parse(source);
  if (!Array.isArray(value) || !value.every(isRecord)) throw new Error("Expected a JSON array of objects.");
  const columns = Array.from(new Set(value.flatMap((entry) => Object.keys(entry))));
  return {
    columns,
    rows: value.map((entry) => columns.reduce<Record<string, string>>((row, key) => {
      const cell = entry[key];
      row[key] = cell === undefined ? "" : typeof cell === "string" ? cell : JSON.stringify(cell);
      return row;
    }, {})),
  };
}

export function tableToCsv(columns: string[], rows: Record<string, string>[]) {
  const escape = (value: string) => /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [columns.map(escape).join(","), ...rows.map((row) => columns.map((column) => escape(row[column] || "")).join(","))].join("\n");
}

export function inferJsonSchema(value: JsonValue): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) return { type: "array", items: value.length ? inferJsonSchema(value[0]) : {} };
  if (isRecord(value)) {
    const properties = Object.entries(value).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key] = inferJsonSchema(item);
      return result;
    }, {});
    return { type: "object", properties, required: Object.keys(value) };
  }
  return { type: typeof value };
}

export function parseJson(source: string) {
  return parse(source);
}
