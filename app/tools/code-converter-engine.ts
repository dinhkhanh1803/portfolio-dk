type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const parseJson = (value: string): JsonValue => JSON.parse(value) as JsonValue;
const pascalCase = (value: string) => value.replace(/^[^a-zA-Z]+/, "").replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, char: string) => char.toUpperCase()) || "Root";
const camelAttr = (value: string) => value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
const quote = (value: string) => JSON.stringify(value);
const isRecord = (value: JsonValue): value is Record<string, JsonValue> => !!value && typeof value === "object" && !Array.isArray(value);

function inferTs(value: JsonValue, name: string, declarations: string[]): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return value.length ? `${inferTs(value[0]!, name, declarations)}[]` : "unknown[]";
  if (isRecord(value)) {
    const typeName = pascalCase(name);
    const lines = Object.entries(value).map(([key, child]) => `  ${JSON.stringify(key).replace(/^"|"$/g, /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? "" : '"')}: ${inferTs(child, typeName + pascalCase(key), declarations)};`);
    declarations.push(`export interface ${typeName} {\n${lines.join("\n")}\n}`);
    return typeName;
  }
  return typeof value;
}

export function jsonToTypeScript(input: string, rootName = "Root") {
  const declarations: string[] = [];
  inferTs(parseJson(input), rootName, declarations);
  return declarations.reverse().join("\n\n");
}

function inferZod(value: JsonValue, name: string, declarations: string[]): string {
  if (value === null) return "z.null()";
  if (Array.isArray(value)) return value.length ? `z.array(${inferZod(value[0]!, name, declarations)})` : "z.array(z.unknown())";
  if (isRecord(value)) {
    const schemaName = pascalCase(name) + "Schema";
    const fields = Object.entries(value).map(([key, child]) => `  ${/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)}: ${inferZod(child, pascalCase(name) + pascalCase(key), declarations)},`);
    declarations.push(`export const ${schemaName} = z.object({\n${fields.join("\n")}\n});`);
    return schemaName;
  }
  if (typeof value === "string") return "z.string()";
  if (typeof value === "number") return "z.number()";
  if (typeof value === "boolean") return "z.boolean()";
  return "z.unknown()";
}

export function jsonToZodSchema(input: string, rootName = "Root") {
  const declarations: string[] = [];
  inferZod(parseJson(input), rootName, declarations);
  return `import { z } from "zod";\n\n${declarations.reverse().join("\n\n")}`;
}

function inferGo(value: JsonValue, name: string, declarations: string[]): string {
  if (value === null) return "any";
  if (Array.isArray(value)) return value.length ? `[]${inferGo(value[0]!, name, declarations)}` : "[]any";
  if (isRecord(value)) {
    const typeName = pascalCase(name);
    const fields = Object.entries(value).map(([key, child]) => `  ${pascalCase(key)} ${inferGo(child, typeName + pascalCase(key), declarations)} \`json:"${key}"\``);
    declarations.push(`type ${typeName} struct {\n${fields.join("\n")}\n}`);
    return typeName;
  }
  if (typeof value === "string") return "string";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float64";
  if (typeof value === "boolean") return "bool";
  return "any";
}

export function jsonToGoStruct(input: string, rootName = "Root") {
  const declarations: string[] = [];
  inferGo(parseJson(input), rootName, declarations);
  return declarations.reverse().join("\n\n");
}

const sqlTypeToTs = (type: string) => {
  const normalized = type.toLowerCase();
  if (/int|serial|decimal|numeric|float|double|real/.test(normalized)) return "number";
  if (/bool/.test(normalized)) return "boolean";
  if (/date|time/.test(normalized)) return "string";
  if (/json/.test(normalized)) return "Record<string, unknown>";
  return "string";
};

export function sqlToTypeScript(input: string, rootName = "Row") {
  const tableMatch = input.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?["`\[]?([\w-]+)/i);
  const body = input.match(/\(([^]+)\)/)?.[1];
  if (!body) throw new Error("Expected a CREATE TABLE statement with columns.");
  const interfaceName = rootName || pascalCase(tableMatch?.[1] || "Row");
  const fields = body.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(Boolean).filter((line) => !/^(primary|foreign|unique|constraint|key)\b/i.test(line)).map((line) => {
    const parts = line.replace(/["`\[\]]/g, "").split(/\s+/);
    const name = parts[0]!;
    const type = parts[1] || "text";
    const optional = /not\s+null|primary\s+key/i.test(line) ? "" : "?";
    return `  ${name}${optional}: ${sqlTypeToTs(type)};`;
  });
  return `export interface ${pascalCase(interfaceName)} {\n${fields.join("\n")}\n}`;
}

export function htmlToJsx(input: string) {
  return input
    .replace(/\bclass=/g, "className=")
    .replace(/\bfor=/g, "htmlFor=")
    .replace(/\btabindex=/g, "tabIndex=")
    .replace(/\breadonly\b/g, "readOnly")
    .replace(/\bautocomplete=/g, "autoComplete=")
    .replace(/\bmaxlength=/g, "maxLength=")
    .replace(/\bcellpadding=/g, "cellPadding=")
    .replace(/\bcellspacing=/g, "cellSpacing=")
    .replace(/<!--/g, "{/* ").replace(/-->/g, " */}");
}

export function svgToJsx(input: string) {
  return htmlToJsx(input).replace(/\s([a-zA-Z_:][-\w:.]*)(=)/g, (_, attr: string, eq: string) => ` ${attr === "xmlns" || attr.startsWith("aria-") || attr.startsWith("data-") ? attr : camelAttr(attr)}${eq}`);
}

const tailwindMap: Record<string, Record<string, string>> = {
  display: { flex: "flex", grid: "grid", block: "block", "inline-block": "inline-block", none: "hidden" },
  "align-items": { center: "items-center", start: "items-start", "flex-start": "items-start", end: "items-end", "flex-end": "items-end" },
  "justify-content": { center: "justify-center", "space-between": "justify-between", "flex-start": "justify-start", "flex-end": "justify-end" },
  "font-weight": { "700": "font-bold", bold: "font-bold", "600": "font-semibold", "500": "font-medium" },
  color: { "#ffffff": "text-white", "#fff": "text-white", "#000000": "text-black", "#000": "text-black" },
  "background-color": { "#ffffff": "bg-white", "#fff": "bg-white", "#000000": "bg-black", "#000": "bg-black" },
};
const spacingScale: Record<string, string> = { "0": "0", "0px": "0", "4px": "1", "0.25rem": "1", "8px": "2", "0.5rem": "2", "12px": "3", "0.75rem": "3", "16px": "4", "1rem": "4", "24px": "6", "1.5rem": "6", "32px": "8", "2rem": "8" };

export function cssToTailwind(input: string) {
  const classes: string[] = [];
  for (const declaration of input.split(";")) {
    const [rawProp, ...rawValue] = declaration.split(":");
    if (!rawProp || !rawValue.length) continue;
    const prop = rawProp.trim().toLowerCase();
    const value = rawValue.join(":").trim().toLowerCase();
    if (tailwindMap[prop]?.[value]) classes.push(tailwindMap[prop]![value]!);
    if (prop === "padding" && spacingScale[value]) classes.push(`p-${spacingScale[value]}`);
    if (prop === "margin" && spacingScale[value]) classes.push(`m-${spacingScale[value]}`);
    if (prop === "border-radius" && (value === "0.5rem" || value === "8px")) classes.push("rounded-lg");
  }
  return [...new Set(classes)].join(" ");
}

const tokenizeCommand = (input: string) => [...input.matchAll(/'([^']*)'|"([^"]*)"|(\S+)/g)].map((match) => match[1] ?? match[2] ?? match[3] ?? "");

export function curlToFetch(input: string) {
  const tokens = tokenizeCommand(input.trim());
  if (tokens[0] !== "curl") throw new Error("Expected a curl command.");
  let method = "GET";
  let url = "";
  const headers: Record<string, string> = {};
  let body = "";
  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    if (token === "-X" || token === "--request") method = tokens[++index]?.toUpperCase() || method;
    else if (token === "-H" || token === "--header") { const [key, ...rest] = (tokens[++index] || "").split(":"); headers[key!.trim()] = rest.join(":").trim(); }
    else if (["-d", "--data", "--data-raw", "--data-binary"].includes(token)) { body = tokens[++index] || ""; if (method === "GET") method = "POST"; }
    else if (!token.startsWith("-")) url = token;
  }
  if (!url) throw new Error("Unable to find a URL in this curl command.");
  const lines = [`const response = await fetch(${quote(url)}, {`, `  method: ${quote(method)},`];
  if (Object.keys(headers).length) lines.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`);
  if (body) lines.push(`  body: ${quote(body)},`);
  lines.push("});", "", "const data = await response.json();");
  return lines.join("\n");
}

export function dockerRunToCompose(input: string) {
  const tokens = tokenizeCommand(input.trim());
  if (tokens[0] !== "docker" || tokens[1] !== "run") throw new Error("Expected a docker run command.");
  let name = "app";
  const ports: string[] = [];
  const env: Record<string, string> = {};
  let image = "";
  const command: string[] = [];
  for (let index = 2; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    if (token === "--name") name = tokens[++index] || name;
    else if (token === "-p" || token === "--publish") ports.push(tokens[++index] || "");
    else if (token === "-e" || token === "--env") { const [key, ...rest] = (tokens[++index] || "").split("="); env[key!] = rest.join("="); }
    else if (token === "-d" || token === "--rm") continue;
    else if (!token.startsWith("-") && !image) image = token;
    else command.push(token);
  }
  if (!image) throw new Error("Unable to find an image in this docker run command.");
  const lines = ["services:", `  ${name}:`, `    image: ${quote(image)}`];
  if (ports.length) lines.push("    ports:", ...ports.filter(Boolean).map((port) => `      - ${quote(port)}`));
  if (Object.keys(env).length) lines.push("    environment:", ...Object.entries(env).map(([key, value]) => `      ${key}: ${quote(value)}`));
  if (command.length) lines.push(`    command: ${quote(command.join(" "))}`);
  return lines.join("\n");
}

function flattenTokens(value: unknown, path: string[] = [], output: string[] = []) {
  if (value && typeof value === "object" && "value" in (value as Record<string, unknown>)) output.push(`  --${path.join("-")}: ${(value as Record<string, unknown>).value};`);
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) flattenTokens(child, [...path, key.replace(/\s+/g, "-").toLowerCase()], output);
  return output;
}

export function figmaTokensToCss(input: string) {
  return `:root {\n${flattenTokens(JSON.parse(input)).join("\n")}\n}`;
}
