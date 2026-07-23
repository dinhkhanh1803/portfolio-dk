export type TextCaseMode =
  | "sentence"
  | "title"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "path"
  | "upper"
  | "lower";

export type SortMode = "asc" | "desc" | "natural" | "length" | "random";
export type DuplicateMode = "exact" | "case-insensitive" | "trimmed";
export type DuplicateKeep = "first" | "last";
export type ReverseMode = "characters" | "words" | "lines";
export type TrimMode = "outer" | "lines" | "collapse" | "remove-empty";
export type SplitMode = "newline" | "comma" | "space" | "custom";
export type ReplaceOptions = { find: string; replacement: string; caseSensitive: boolean; wholeWord: boolean; useRegex: boolean };
export type RepeatOptions = { count: number; separator: string; prefixIndex: boolean };

const splitWords = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_./-]+/g, " ")
    .match(/[\p{L}\p{N}]+/gu) ?? [];

const capitalize = (value: string) =>
  value ? value.charAt(0).toLocaleUpperCase() + value.slice(1).toLocaleLowerCase() : value;

const sentenceCase = (value: string) => {
  const lower = value.toLocaleLowerCase();
  return lower.replace(/(^\s*\p{L}|[.!?]\s*\p{L})/gu, (match) => match.toLocaleUpperCase());
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function convertCase(input: string, mode: TextCaseMode): string {
  const words = splitWords(input);
  const lowerWords = words.map((word) => word.toLocaleLowerCase());

  switch (mode) {
    case "sentence":
      return sentenceCase(input);
    case "title":
      return lowerWords.map(capitalize).join(" ");
    case "camel":
      return lowerWords.map((word, index) => (index === 0 ? word : capitalize(word))).join("");
    case "pascal":
      return lowerWords.map(capitalize).join("");
    case "snake":
      return lowerWords.join("_");
    case "kebab":
      return lowerWords.join("-");
    case "constant":
      return lowerWords.join("_").toLocaleUpperCase();
    case "dot":
      return lowerWords.join(".");
    case "path":
      return lowerWords.join("/");
    case "upper":
      return input.toLocaleUpperCase();
    case "lower":
      return input.toLocaleLowerCase();
    default:
      return input;
  }
}

const normalizeLine = (line: string, trim: boolean) => (trim ? line.trim() : line);

export function sortLines(
  input: string,
  options: { mode: SortMode; trim: boolean; removeEmpty: boolean; unique: boolean },
): string {
  let lines = input.split(/\r?\n/).map((line) => normalizeLine(line, options.trim));
  if (options.removeEmpty) lines = lines.filter(Boolean);
  if (options.unique) lines = [...new Set(lines)];

  if (options.mode === "random") {
    return [...lines].sort(() => Math.random() - 0.5).join("\n");
  }

  const sorted = [...lines].sort((a, b) => {
    if (options.mode === "length") return a.length - b.length || a.localeCompare(b);
    return a.localeCompare(b, undefined, { numeric: options.mode === "natural", sensitivity: "base" });
  });

  return (options.mode === "desc" ? sorted.reverse() : sorted).join("\n");
}

const duplicateKey = (line: string, mode: DuplicateMode) => {
  if (mode === "case-insensitive") return line.trim().toLocaleLowerCase();
  if (mode === "trimmed") return line.trim();
  return line;
};

export function removeDuplicateLines(
  input: string,
  options: { mode: DuplicateMode; keep: DuplicateKeep; removeEmpty: boolean },
): string {
  const lines = input.split(/\r?\n/);
  const seen = new Set<string>();
  const ordered = options.keep === "last" ? [...lines].reverse() : lines;
  const filtered: string[] = [];

  for (const line of ordered) {
    if (options.removeEmpty && !line.trim()) continue;
    const key = duplicateKey(line, options.mode);
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(line);
  }

  return (options.keep === "last" ? filtered.reverse() : filtered).join("\n");
}

export function reverseText(input: string, mode: ReverseMode): string {
  if (mode === "lines") return input.split(/\r?\n/).reverse().join("\n");
  if (mode === "words") return input.split(/(\s+)/).reverse().join("");
  return [...input].reverse().join("");
}

export function trimText(input: string, mode: TrimMode): string {
  if (mode === "lines") return input.split(/\r?\n/).map((line) => line.trim()).join("\n");
  if (mode === "collapse") return input.replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (mode === "remove-empty") return input.split(/\r?\n/).filter((line) => line.trim()).join("\n");
  return input.trim();
}

export function splitText(input: string, options: { mode: SplitMode; customDelimiter: string; trimParts: boolean; removeEmpty: boolean }): string {
  const delimiter = options.mode === "newline" ? /\r?\n/g : options.mode === "comma" ? /,/g : options.mode === "space" ? /\s+/g : new RegExp(escapeRegExp(options.customDelimiter || ","), "g");
  let parts = input.split(delimiter);
  if (options.trimParts) parts = parts.map((part) => part.trim());
  if (options.removeEmpty) parts = parts.filter(Boolean);
  return parts.map((part, index) => `${index + 1}. ${part}`).join("\n");
}

export function replaceText(input: string, options: ReplaceOptions): string {
  if (!options.find) return input;
  try {
    const flags = options.caseSensitive ? "g" : "gi";
    const source = options.useRegex ? options.find : escapeRegExp(options.find);
    const pattern = options.wholeWord ? `\\b(?:${source})\\b` : source;
    return input.replace(new RegExp(pattern, flags), options.replacement);
  } catch {
    return input;
  }
}

export function repeatText(input: string, options: RepeatOptions): string {
  const count = Math.max(1, Math.min(500, Number.isFinite(options.count) ? Math.floor(options.count) : 1));
  return Array.from({ length: count }, (_, index) => `${options.prefixIndex ? `${index + 1}. ` : ""}${input}`).join(options.separator);
}

export function slugifyText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function textStats(input: string) {
  const lines = input ? input.split(/\r?\n/).length : 0;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const sentences = input.trim() ? (input.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((item) => item.trim()).length : 0;
  const paragraphs = input.trim() ? input.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
  const bytes = new TextEncoder().encode(input).length;
  const readingMinutes = Math.max(1, Math.ceil(words / 220));

  return {
    chars: [...input].length,
    charsNoSpaces: [...input.replace(/\s/g, "")].length,
    words,
    lines,
    sentences,
    paragraphs,
    bytes,
    readingMinutes,
  };
}
