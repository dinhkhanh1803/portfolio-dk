import * as TOML from "@iarna/toml";
import YAML from "yaml";


const SQL_KEYWORDS = /\b(select|from|where|and|or|order\s+by|group\s+by|having|limit|offset|join|left\s+join|right\s+join|inner\s+join|outer\s+join|on|insert\s+into|values|update|set|delete|create\s+table|alter\s+table|drop\s+table|union|all|as|case|when|then|else|end|distinct)\b/gi;
const CLAUSE_BREAKS = /\b(FROM|WHERE|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|JOIN|UNION|VALUES|SET)\b/g;

function lineIndent(level: number, indent = 2) { return " ".repeat(level * indent); }
function asRecord(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object."); return value as Record<string, unknown>; }

export function formatSql(source: string) {
  const cleaned = source.trim().replace(/\s+/g, " ").replace(SQL_KEYWORDS, (match) => match.toUpperCase());
  if (!cleaned) return "";
  return cleaned.replace(CLAUSE_BREAKS, "\n$1").replace(/,\s*/g, ", ").replace(/[ \t]+\n/g, "\n").trim();
}
export function minifySql(source: string) { return source.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim(); }

export function formatXml(source: string, indent = 2) {
  const compact = source.trim().replace(/>\s*</g, "><");
  if (!compact) return "";
  const tokens = compact.replace(/(>)(<)/g, "$1\n$2").split("\n");
  let depth = 0;
  return tokens.map((token) => {
    const isClose = /^<\//.test(token);
    const opens = /^<[^!?/][^>]*[^/]>$/.test(token) && !/^<[^>]+>.*<\//.test(token);
    if (isClose) depth = Math.max(0, depth - 1);
    const result = `${lineIndent(depth, indent)}${token}`;
    if (opens) depth += 1;
    return result;
  }).join("\n");
}
export function minifyXml(source: string) { return source.trim().replace(/>\s+</g, "><"); }
export function validateXml(source: string) {
  const tags = [...source.matchAll(/<\/?([A-Za-z_][\w:.-]*)\b[^>]*>/g)].map((match) => match[0]);
  const stack: string[] = [];
  for (const token of tags) {
    if (/^<\?/.test(token) || /^<!/.test(token) || /\/>$/.test(token)) continue;
    const name = token.match(/^<\/?([\w:.-]+)/)?.[1] ?? "";
    if (token.startsWith("</")) { if (stack.pop() !== name) throw new Error(`Unexpected closing tag: ${name}`); } else stack.push(name);
  }
  if (stack.length) throw new Error(`Unclosed tag: ${stack.at(-1)}`);
  return "Valid XML document.";
}

export function minifyHtml(source: string, options: { comments?: boolean; interTag?: boolean; spaces?: boolean; lineBreaks?: boolean } = {}) {
  const settings = { comments: true, interTag: true, spaces: true, lineBreaks: true, ...options };
  let result = source;
  if (settings.comments) result = result.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
  if (settings.interTag) result = result.replace(/>\s+</g, "><");
  if (settings.lineBreaks) result = result.replace(/[\r\n]+/g, "");
  if (settings.spaces) result = result.replace(/[\t ]{2,}/g, " ");
  return result.trim();
}
export function prettyHtml(source: string, indent = 2) { return formatXml(source, indent); }

export function parseEnv(source: string) {
  const result: Record<string, string> = {};
  for (const raw of source.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.replace(/^export\s+/, "");
    const index = normalized.indexOf("=");
    if (index < 1) continue;
    const key = normalized.slice(0, index).trim();
    let value = normalized.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    result[key] = value;
  }
  return result;
}
export function formatEnv(source: string, options: { sortKeys?: boolean; stripComments?: boolean; maskValues?: boolean } = {}) {
  const entries = Object.entries(parseEnv(options.stripComments ? source.replace(/^\s*#.*$/gm, "") : source));
  if (options.sortKeys) entries.sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([key, value]) => `${key}=${options.maskValues && value ? "•".repeat(Math.max(6, Math.min(value.length, 16))) : value}`).join("\n");
}
export function envToJson(source: string) { return JSON.stringify(parseEnv(source), null, 2); }
export function jsonToEnv(source: string) { return Object.entries(asRecord(JSON.parse(source))).map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`).join("\n"); }

export function yamlToJson(source: string) { return JSON.stringify(YAML.parse(source), null, 2); }
export function jsonToYaml(source: string) { return YAML.stringify(JSON.parse(source)); }
export function formatYaml(source: string, indent = 2) { return YAML.stringify(YAML.parse(source), { indent }); }
export function minifyYaml(source: string) { return YAML.stringify(YAML.parse(source), { indent: 1, lineWidth: 0 }).trim(); }

export function tomlToJson(source: string) { return JSON.stringify(TOML.parse(source), null, 2); }
export function jsonToToml(source: string) { return TOML.stringify(JSON.parse(source) as TOML.JsonMap); }
export function formatToml(source: string) { return TOML.stringify(TOML.parse(source)); }
export function validateToml(source: string) { TOML.parse(source); return "Valid TOML document."; }

export function formatColumns(source: string, options: { input: string; output?: string; align?: "left" | "right" | "center"; trim?: boolean }) {
  const delimiter = options.input === "\\t" ? "\t" : options.input;
  const output = options.output === "\\t" ? "\t" : options.output ?? delimiter;
  const rows = source.split(/\r?\n/).filter((line) => line.length > 0).map((line) => line.split(delimiter).map((cell) => options.trim ? cell.trim() : cell));
  const widths = rows.reduce<number[]>((all, row) => { row.forEach((cell, index) => { all[index] = Math.max(all[index] ?? 0, cell.length); }); return all; }, []);
  const pad = (cell: string, width: number) => {
    const room = Math.max(0, width - cell.length);
    if (options.align === "right") return `${" ".repeat(room)}${cell}`;
    if (options.align === "center") return `${" ".repeat(Math.floor(room / 2))}${cell}${" ".repeat(Math.ceil(room / 2))}`;
    return `${cell}${" ".repeat(room)}`;
  };
  return rows.map((row) => row.map((cell, index) => pad(cell, widths[index] ?? cell.length)).join(` ${output} `)).join("\n");
}
