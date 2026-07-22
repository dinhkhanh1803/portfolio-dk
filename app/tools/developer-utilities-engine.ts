/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
const sampleTables = {
  users: [
    { id: 1, name: "Lan", email: "lan@example.com", age: 28, city: "Ho Chi Minh City" },
    { id: 2, name: "Minh", email: "minh@example.com", age: 32, city: "Da Nang" },
    { id: 3, name: "An", email: "an@example.com", age: 24, city: "Hanoi" },
  ],
  orders: [
    { id: 101, userId: 1, product: "Starter plan", amount: 29, status: "completed" },
    { id: 102, userId: 2, product: "Pro plan", amount: 79, status: "completed" },
    { id: 103, userId: 1, product: "Design audit", amount: 149, status: "pending" },
  ],
  products: [
    { id: 1, name: "Keyboard", category: "Electronics", price: 89, stock: 14 },
    { id: 2, name: "Monitor", category: "Electronics", price: 299, stock: 7 },
    { id: 3, name: "Notebook", category: "Office", price: 8, stock: 120 },
  ],
};

const asNumber = (value) => Number(value);
const identifier = /^[a-zA-Z_][\w]*$/;

export function sampleSchema() {
  return Object.fromEntries(Object.entries(sampleTables).map(([name, rows]) => [name, Object.keys(rows[0])]));
}

export function executeSampleSql(input) {
  const query = input.trim().replace(/;$/, "");
  if (!query) return { error: "Enter a SELECT, SHOW TABLES, or DESCRIBE query.", rows: [], columns: [] };
  if (/^show\s+tables$/i.test(query)) {
    return { columns: ["table"], rows: Object.keys(sampleTables).map((table) => ({ table })) };
  }
  const describe = query.match(/^describe\s+(\w+)$/i);
  if (describe) {
    const columns = sampleSchema()[describe[1].toLowerCase()];
    return columns ? { columns: ["field"], rows: columns.map((field) => ({ field })) } : { error: `Unknown table: ${describe[1]}`, rows: [], columns: [] };
  }
  const statement = query.match(/^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i);
  if (!statement) return { error: "This playground supports read-only SELECT queries against users, orders, and products.", rows: [], columns: [] };
  const [, selected, tableName, where, orderField, orderDirection, limit] = statement;
  const table = sampleTables[tableName.toLowerCase()];
  if (!table) return { error: `Unknown table: ${tableName}`, rows: [], columns: [] };
  let rows = [...table];
  if (where) {
    const condition = where.match(/^(\w+)\s*(=|!=|>=|<=|>|<)\s*(?:'([^']*)'|"([^"]*)"|([\d.]+))$/);
    if (!condition) return { error: "Use a single condition, such as age > 25 or city = 'Hanoi'.", rows: [], columns: [] };
    const [, field, operator, singleQuoted, doubleQuoted, numeric] = condition;
    if (!Object.hasOwn(rows[0], field)) return { error: `Unknown field: ${field}`, rows: [], columns: [] };
    const comparison = singleQuoted ?? doubleQuoted ?? asNumber(numeric);
    rows = rows.filter((row) => {
      const value = row[field];
      if (operator === "=") return value === comparison;
      if (operator === "!=") return value !== comparison;
      if (operator === ">") return value > comparison;
      if (operator === "<") return value < comparison;
      if (operator === ">=") return value >= comparison;
      return value <= comparison;
    });
  }
  if (orderField) {
    if (!Object.hasOwn(table[0], orderField)) return { error: `Unknown field: ${orderField}`, rows: [], columns: [] };
    rows.sort((a, b) => (a[orderField] > b[orderField] ? 1 : a[orderField] < b[orderField] ? -1 : 0) * (orderDirection?.toLowerCase() === "desc" ? -1 : 1));
  }
  const count = selected.match(/^count\(\*\)(?:\s+as\s+(\w+))?$/i);
  const sum = selected.match(/^sum\((\w+)\)(?:\s+as\s+(\w+))?$/i);
  const average = selected.match(/^avg\((\w+)\)(?:\s+as\s+(\w+))?$/i);
  if (count) {
    const name = count[1] || "count";
    return { columns: [name], rows: [{ [name]: rows.length }] };
  }
  if (average) {
    const field = average[1]; const name = average[2] || `avg_${field}`;
    if (!Object.hasOwn(table[0], field)) return { error: `Unknown field: ${field}`, rows: [], columns: [] };
    return { columns: [name], rows: [{ [name]: rows.reduce((total, row) => total + (Number(row[field]) || 0), 0) / rows.length }] };
  }
  if (sum) {
    const field = sum[1]; const name = sum[2] || `sum_${field}`;
    if (!Object.hasOwn(table[0], field)) return { error: `Unknown field: ${field}`, rows: [], columns: [] };
    return { columns: [name], rows: [{ [name]: rows.reduce((total, row) => total + (Number(row[field]) || 0), 0) }] };
  }
  const fields = selected.trim() === "*" ? Object.keys(table[0]) : selected.split(",").map((field) => field.trim());
  if (fields.some((field) => !identifier.test(field) || !Object.hasOwn(table[0], field))) return { error: "Select valid field names from the current table.", rows: [], columns: [] };
  const projected = rows.slice(0, Math.min(Number(limit || 100), 100)).map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
  return { columns: fields, rows: projected };
}

const esc = (value) => String(value ?? "").replace(/([;,:\\])/g, "\\$1");
export function buildQrPayload(type, values) {
  const value = values || {};
  switch (type) {
    case "url": return value.url || "https://example.com";
    case "email": return `mailto:${value.email || "hello@example.com"}${value.subject ? `?subject=${encodeURIComponent(value.subject)}` : ""}`;
    case "phone": return `tel:${value.phone || "+84900000000"}`;
    case "sms": return `SMSTO:${value.phone || "+84900000000"}:${value.message || "Hello"}`;
    case "wifi": return `WIFI:T:${value.encryption || "WPA"};S:${esc(value.ssid || "DK Tools")};P:${esc(value.password || "")};${value.hidden ? "H:true;" : ""};`;
    case "vcard": return `BEGIN:VCARD\nVERSION:3.0\nFN:${value.name || "Lan Nguyen"}\nORG:${value.organization || "DK Tools"}\nTEL:${value.phone || "+84900000000"}\nEMAIL:${value.email || "lan@example.com"}\nURL:${value.website || "https://dktools.dev"}\nEND:VCARD`;
    default: return value.text || "DK Tools";
  }
}

export function parseSvgPath(path) {
  const source = String(path || "").trim();
  const tokens = source.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) || [];
  const commandSizes = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  const commands = [];
  let index = 0; let current = null; let x = 0; let y = 0; const points = [];
  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) current = tokens[index++];
    if (!current || !commandSizes[current.toUpperCase()]) return { error: "Unsupported SVG path command.", commands: [], bounds: null };
    const upper = current.toUpperCase(); const size = commandSizes[upper];
    if (upper === "Z") { commands.push({ command: current, values: [] }); current = null; continue; }
    if (index + size > tokens.length || tokens.slice(index, index + size).some((token) => /^[a-zA-Z]$/.test(token))) return { error: "Incomplete path command.", commands: [], bounds: null };
    const values = tokens.slice(index, index + size).map(Number); index += size;
    const relative = current === current.toLowerCase();
    if (upper === "H") { x = relative ? x + values[0] : values[0]; points.push([x, y]); }
    else if (upper === "V") { y = relative ? y + values[0] : values[0]; points.push([x, y]); }
    else {
      const lastX = values[values.length - 2]; const lastY = values[values.length - 1];
      x = relative ? x + lastX : lastX; y = relative ? y + lastY : lastY; points.push([x, y]);
      for (let point = 0; point < values.length - 1; point += 2) points.push([relative ? (point === values.length - 2 ? x : values[point]) : values[point], relative ? (point === values.length - 1 ? y : values[point + 1]) : values[point + 1]]);
    }
    commands.push({ command: current, values });
  }
  if (!commands.length || !points.length) return { error: "Enter at least one drawable SVG command.", commands, bounds: null };
  const xs = points.map(([pointX]) => pointX); const ys = points.map(([, pointY]) => pointY);
  return { commands, bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) } };
}

export function calculateBitwise(a, b, operation) {
  const left = Number(a) | 0; const right = Number(b) | 0;
  const value = operation === "and" ? left & right : operation === "or" ? left | right : operation === "xor" ? left ^ right : operation === "not" ? ~left : operation === "left" ? left << Math.max(0, right) : left >> Math.max(0, right);
  return { decimal: value, hex: `0x${(value >>> 0).toString(16).toUpperCase()}`, binary: (value >>> 0).toString(2) };
}

export function checkLuhn(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return { valid: false, type: "Unknown", digits };
  const sum = [...digits].reverse().reduce((total, digit, index) => {
    let value = Number(digit); if (index % 2) value = value > 4 ? value * 2 - 9 : value * 2; return total + value;
  }, 0);
  const type = /^4/.test(digits) ? "Visa" : /^(5[1-5]|2[2-7])/.test(digits) ? "Mastercard" : /^3[47]/.test(digits) ? "American Express" : /^6(?:011|5)/.test(digits) ? "Discover" : /^(?:35)/.test(digits) ? "JCB" : /^3(?:0[0-5]|[68])/.test(digits) ? "Diners Club" : /^(?:50|5[6-9]|6[0-9])/.test(digits) ? "Maestro" : /^62/.test(digits) ? "UnionPay" : "Unknown";
  return { valid: sum % 10 === 0, type, digits };
}

export function parseUserAgent(value) {
  const ua = String(value || "");
  const browser = /Edg\//.test(ua) ? "Microsoft Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown";
  const os = /Windows NT/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const device = /Mobi|Android|iPhone|iPad/.test(ua) ? "Mobile" : "Desktop";
  return { browser, os, device, raw: ua };
}

const parseVersion = (value) => {
  const match = String(value).trim().replace(/^v/, "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  return match ? [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)] : null;
};
const compareVersion = (left, right) => left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
export function satisfiesSemverRange(version, range) {
  const current = parseVersion(version); if (!current) return false;
  const input = String(range || "").trim(); if (!input || input === "*") return true;
  const evaluate = (part) => {
    const match = part.match(/^(\^|~|>=|<=|>|<|=)?\s*(.*)$/); const operator = match?.[1] || "="; const target = parseVersion(match?.[2] || ""); if (!target) return false;
    const compared = compareVersion(current, target);
    if (operator === "^") return compared >= 0 && current[0] === target[0];
    if (operator === "~") return compared >= 0 && current[0] === target[0] && current[1] === target[1];
    if (operator === ">=") return compared >= 0; if (operator === "<=") return compared <= 0; if (operator === ">") return compared > 0; if (operator === "<") return compared < 0;
    return compared === 0;
  };
  return input.split(/\s+/).every(Boolean) && input.split(/\s+/).every(evaluate);
}

export function makeQrMatrix(payload, size = 29) {
  let state = 2166136261;
  for (const character of String(payload)) { state ^= character.charCodeAt(0); state = Math.imul(state, 16777619); }
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const finder = (offsetX, offsetY) => { for (let y = 0; y < 7; y += 1) for (let x = 0; x < 7; x += 1) matrix[offsetY + y][offsetX + x] = x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4); };
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5; matrix[y][x] = Boolean(state & 1);
  }
  return matrix;
}
