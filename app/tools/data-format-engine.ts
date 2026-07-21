export type CsvOptions = {
  delimiter?: string;
  hasHeaders?: boolean;
  trim?: boolean;
  skipEmptyValues?: boolean;
};

export type SqlOptions = CsvOptions & {
  tableName?: string;
  dialect?: "postgres" | "mysql" | "sqlite";
};

const defaultOptions: Required<CsvOptions> = { delimiter: ",", hasHeaders: true, trim: true, skipEmptyValues: false };
const clean = (value: string, trim: boolean) => trim ? value.trim() : value;

export function parseCsv(source: string, delimiter = ",") {
  if (!delimiter || delimiter.length !== 1) throw new Error("CSV delimiter must be exactly one character.");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else cell += char;
      continue;
    }

    if (closedQuote && char !== delimiter && char !== "\n" && char !== "\r") throw new Error("CSV is invalid: unexpected character after a closing quote.");
    if (char === '"') {
      if (cell) throw new Error("CSV is invalid: quotes must start at the beginning of a cell.");
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell); cell = ""; closedQuote = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = ""; closedQuote = false;
    } else cell += char;
  }

  if (quoted) throw new Error("CSV is invalid: missing closing quote.");
  if (cell || row.length || source.endsWith(delimiter)) { row.push(cell); rows.push(row); }
  return rows.filter((values) => values.some((value) => value.length > 0));
}

export function csvToJson(source: string, inputOptions: CsvOptions = {}) {
  const options = { ...defaultOptions, ...inputOptions };
  const rows = parseCsv(source, options.delimiter);
  if (!rows.length) return [];
  const headers = options.hasHeaders ? rows.shift()!.map((value, index) => clean(value, options.trim) || `column_${index + 1}`) : rows[0]!.map((_, index) => `column_${index + 1}`);
  return rows.map((row) => headers.reduce<Record<string, string>>((record, header, index) => {
    const value = clean(row[index] ?? "", options.trim);
    if (!options.skipEmptyValues || value !== "") record[header] = value;
    return record;
  }, {}));
}

const escapeCsv = (value: unknown, delimiter: string) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /["\n\r]/.test(text) || text.includes(delimiter) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function jsonToCsv(value: unknown, delimiter = ",") {
  if (!Array.isArray(value)) throw new Error("JSON input must be an array of objects.");
  if (!value.length) return "";
  if (value.some((item) => !item || Array.isArray(item) || typeof item !== "object")) throw new Error("Every JSON array item must be an object.");
  const records = value as Record<string, unknown>[];
  const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
  return [headers, ...records.map((record) => headers.map((header) => record[header]))].map((row) => row.map((cell) => escapeCsv(cell, delimiter)).join(delimiter)).join("\n");
}

export function csvToMarkdown(source: string, inputOptions: CsvOptions = {}) {
  const options = { ...defaultOptions, ...inputOptions, hasHeaders: true };
  const rows = parseCsv(source, options.delimiter);
  if (!rows.length) return "";
  const normalized = rows.map((row) => row.map((cell) => clean(cell, options.trim).replaceAll("|", "\\|").replaceAll("\n", "<br>")));
  const width = normalized[0]!.length;
  const complete = normalized.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ""));
  return [complete[0], Array(width).fill("---"), ...complete.slice(1)].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

const quoteIdentifier = (value: string, dialect: SqlOptions["dialect"]) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("SQL table and column names may only contain letters, numbers, and underscores.");
  return dialect === "mysql" ? `\`${value}\`` : `"${value}"`;
};

export function csvToSql(source: string, inputOptions: SqlOptions = {}) {
  const options = { ...defaultOptions, ...inputOptions, tableName: inputOptions.tableName?.trim() || "imported_data", dialect: inputOptions.dialect ?? "postgres" };
  const records = csvToJson(source, options);
  if (!records.length) return "";
  const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
  const table = quoteIdentifier(options.tableName, options.dialect);
  const columns = headers.map((header) => quoteIdentifier(header, options.dialect)).join(", ");
  const values = records.map((record) => `  (${headers.map((header) => `'${(record[header] ?? "").replaceAll("'", "''")}'`).join(", ")})`).join(",\n");
  return `INSERT INTO ${table} (${columns}) VALUES\n${values};`;
}

const parseScalar = (value: string): unknown => {
  if (value === "") return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value.replace(/^['"]|['"]$/g, "");
};

const formatScalar = (value: unknown) => {
  if (value === null) return "null";
  if (typeof value === "string") return /^[A-Za-z0-9_ .@/-]+$/.test(value) && value !== "" ? value : JSON.stringify(value);
  return String(value);
};

const toYamlLines = (value: unknown, indent = 0): string[] => {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) return value.flatMap((item) => {
    if (item && typeof item === "object") return [`${pad}-`, ...toYamlLines(item, indent + 1)];
    return [`${pad}- ${formatScalar(item)}`];
  });
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    if (item && typeof item === "object") return [`${pad}${key}:`, ...toYamlLines(item, indent + 1)];
    return [`${pad}${key}: ${formatScalar(item)}`];
  });
  return [`${pad}${formatScalar(value)}`];
};

export function jsonToYaml(value: unknown) {
  return toYamlLines(value).join("\n");
}

export function yamlToJson(source: string) {
  const lines = source.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> | unknown[] }> = [{ indent: -1, value: root }];

  for (const line of lines) {
    const indent = Math.floor((line.match(/^ */)?.[0].length ?? 0) / 2);
    const trimmed = line.trim();
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) stack.pop();
    const parent = stack[stack.length - 1]!.value;

    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(parent)) throw new Error("YAML lists must belong to a key.");
      parent.push(parseScalar(trimmed.slice(2).trim()));
      continue;
    }

    const match = trimmed.match(/^([^:]+):(.*)$/);
    if (!match) throw new Error("YAML line is not supported by this converter.");
    const key = match[1]!.trim();
    const rawValue = match[2]!.trim();
    if (rawValue) (parent as Record<string, unknown>)[key] = parseScalar(rawValue);
    else {
      const nextLine = lines[lines.indexOf(line) + 1]?.trim();
      const child: Record<string, unknown> | unknown[] = nextLine?.startsWith("- ") ? [] : {};
      (parent as Record<string, unknown>)[key] = child;
      stack.push({ indent, value: child });
    }
  }
  return root;
}

const escapeXml = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const unescapeXml = (value: string) => value.replaceAll("&quot;", '"').replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&");

const toXml = (key: string, value: unknown, indent = 0): string => {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) return value.map((item) => toXml(key, item, indent)).join("\n");
  if (value && typeof value === "object") {
    const inner = Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => toXml(childKey, childValue, indent + 1)).join("\n");
    return `${pad}<${key}>\n${inner}\n${pad}</${key}>`;
  }
  return `${pad}<${key}>${escapeXml(value)}</${key}>`;
};

export function jsonToXml(value: unknown, rootName = "root") {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(rootName)) throw new Error("XML root name is invalid.");
  return toXml(rootName, value);
}

export function xmlToJson(source: string) {
  const tokens = source.trim().match(/<[^>]+>|[^<]+/g) ?? [];
  const stack: Array<{ name: string; value: Record<string, unknown> }> = [];
  let root: Record<string, unknown> | undefined;
  for (const token of tokens) {
    if (/^<\?/.test(token) || /^<!--/.test(token)) continue;
    if (/^<\//.test(token)) {
      const closing = token.replace(/^<\//, "").replace(/>$/, "").trim();
      const node = stack.pop();
      if (!node || node.name !== closing) throw new Error("XML has mismatched tags.");
      const completed = { [node.name]: node.value };
      if (!stack.length) root = completed;
      else stack[stack.length - 1]!.value[node.name] = node.value;
    } else if (/^<[^/][^>]*>$/.test(token)) {
      const name = token.replace(/^</, "").replace(/>$/, "").trim().split(/\s+/)[0]!;
      stack.push({ name, value: {} });
    } else if (token.trim()) {
      const current = stack[stack.length - 1];
      if (!current) throw new Error("XML text appears outside the root element.");
      current.value = unescapeXml(token.trim()) as unknown as Record<string, unknown>;
    }
  }
  if (!root || stack.length) throw new Error("XML is incomplete.");
  return root;
}

export function markdownToJson(source: string) {
  const lines = source.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("Markdown table needs a header row and separator row.");
  const toCells = (line: string) => {
    const content = line.replace(/^\||\|$/g, "");
    const cells: string[] = [];
    let cell = "";
    for (let index = 0; index < content.length; index += 1) {
      const char = content[index]!;
      if (char === "\\" && content[index + 1] === "|") { cell += "|"; index += 1; }
      else if (char === "|") { cells.push(cell.trim().replaceAll("<br>", "\n")); cell = ""; }
      else cell += char;
    }
    cells.push(cell.trim().replaceAll("<br>", "\n"));
    return cells;
  };
  const headers = toCells(lines[0]!);
  if (!headers.length || !toCells(lines[1]!).every((cell) => /^:?-{3,}:?$/.test(cell))) throw new Error("Markdown table separator row is invalid.");
  return lines.slice(2).map((line) => toCells(line)).map((row) => headers.reduce<Record<string, string>>((record, header, index) => { record[header] = row[index] ?? ""; return record; }, {}));
}

export function markdownToNotionBlocks(source: string) {
  return source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    if (line.startsWith("### ")) return { type: "heading_3", text: line.slice(4) };
    if (line.startsWith("## ")) return { type: "heading_2", text: line.slice(3) };
    if (line.startsWith("# ")) return { type: "heading_1", text: line.slice(2) };
    if (/^[-*]\s+/.test(line)) return { type: "bulleted_list_item", text: line.replace(/^[-*]\s+/, "") };
    if (/^\d+\.\s+/.test(line)) return { type: "numbered_list_item", text: line.replace(/^\d+\.\s+/, "") };
    return { type: "paragraph", text: line };
  });
}
