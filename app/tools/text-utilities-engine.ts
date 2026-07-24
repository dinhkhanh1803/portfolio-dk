export type SlugOptions = {
  separator?: "-" | "_" | ".";
  lowercase?: boolean;
  maxLength?: number;
  keepNumbers?: boolean;
};

export type CleanWhitespaceOptions = {
  trimLines?: boolean;
  removeEmptyLines?: boolean;
  collapseSpaces?: boolean;
  normalizeLineEndings?: boolean;
  tabsToSpaces?: boolean;
};

export type DiffLine = {
  type: "same" | "added" | "removed";
  value: string;
  leftLine?: number;
  rightLine?: number;
};

export type WrapOptions = {
  prefix?: string;
  suffix?: string;
  skipEmpty?: boolean;
};

export type ExtractOptions = {
  query?: string;
  useRegex?: boolean;
  caseSensitive?: boolean;
  invert?: boolean;
  unique?: boolean;
  sort?: boolean;
};

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const namedEntities: Record<string, string> = Object.fromEntries(Object.entries(htmlEntities).map(([key, value]) => [value, key]));

export const TEXT_UTILITIES_SAMPLE = {
  slug: "Tạo công cụ Text Utilities thật chỉnh chu!",
  clean: "   DK Tools\t\t\n\n  Build tiny utilities locally.   \r\n\r\n  Keep the output readable.  ",
  leftDiff: "DK Tools\nText utilities\nRuns in browser\nCopy-ready output",
  rightDiff: "DK Tools\nText utilities\nRuns locally in browser\nCopy-ready output\nDownload-ready files",
  url: "https://dk.tools/search?q=công cụ nhanh&tag=text utilities",
  html: '<article class="card">DK Tools & browser utilities</article>',
  quote: "alpha\nbeta\ngamma",
  extract: "error: missing token\ninfo: build started\nwarning: large bundle\nerror: invalid input\ninfo: build finished",
} as const;

export function createSlug(input: string, options: SlugOptions = {}) {
  const separator = options.separator ?? "-";
  const keepNumbers = options.keepNumbers ?? true;
  const maxLength = Math.max(0, Math.floor(options.maxLength ?? 90));
  const normalized = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, (match) => (match === "Đ" ? "D" : "d"));
  const cased = options.lowercase === false ? normalized : normalized.toLowerCase();
  const allowed = keepNumbers ? /[^a-zA-Z0-9]+/g : /[^a-zA-Z]+/g;
  const slug = cased
    .replace(allowed, separator)
    .replace(new RegExp(`${escapeRegExp(separator)}+`, "g"), separator)
    .replace(new RegExp(`^${escapeRegExp(separator)}|${escapeRegExp(separator)}$`, "g"), "");
  return maxLength ? slug.slice(0, maxLength).replace(new RegExp(`${escapeRegExp(separator)}$`), "") : slug;
}

export function cleanWhitespace(input: string, options: CleanWhitespaceOptions = {}) {
  let value = options.normalizeLineEndings === false ? input : input.replace(/\r\n?/g, "\n");
  if (options.tabsToSpaces) value = value.replace(/\t/g, "  ");
  let lines = value.split("\n");
  if (options.trimLines ?? true) lines = lines.map((line) => line.trim());
  if (options.collapseSpaces ?? true) lines = lines.map((line) => line.replace(/[^\S\n]+/g, " "));
  if (options.removeEmptyLines ?? true) lines = lines.filter((line) => line.length > 0);
  return lines.join("\n").trim();
}

export function compareText(left: string, right: string): DiffLine[] {
  const a = left.split(/\r\n?|\n/);
  const b = right.split(/\r\n?|\n/);
  const table = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: "same", value: a[i], leftLine: i + 1, rightLine: j + 1 });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ type: "removed", value: a[i], leftLine: i + 1 });
      i += 1;
    } else {
      result.push({ type: "added", value: b[j], rightLine: j + 1 });
      j += 1;
    }
  }
  while (i < a.length) {
    result.push({ type: "removed", value: a[i], leftLine: i + 1 });
    i += 1;
  }
  while (j < b.length) {
    result.push({ type: "added", value: b[j], rightLine: j + 1 });
    j += 1;
  }
  return result;
}

export function encodeHtmlEntities(input: string) {
  return input.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
}

export function decodeHtmlEntities(input: string) {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(amp|lt|gt|quot);|&#39;/g, (entity) => namedEntities[entity] ?? entity);
}

export function wrapLines(input: string, options: WrapOptions = {}) {
  const prefix = options.prefix ?? '"';
  const suffix = options.suffix ?? '"';
  return input
    .split(/\r\n?|\n/)
    .filter((line) => !(options.skipEmpty && line.trim() === ""))
    .map((line) => `${prefix}${line}${suffix}`)
    .join("\n");
}

export function extractLines(input: string, options: ExtractOptions = {}) {
  const query = options.query ?? "";
  let matcher: (line: string) => boolean;
  try {
    if (options.useRegex && query) {
      const regex = new RegExp(query, options.caseSensitive ? "" : "i");
      matcher = (line) => regex.test(line);
    } else {
      const needle = options.caseSensitive ? query : query.toLowerCase();
      matcher = (line) => (options.caseSensitive ? line : line.toLowerCase()).includes(needle);
    }
  } catch {
    matcher = () => false;
  }

  let lines = input.split(/\r\n?|\n/).filter((line) => (options.invert ? !matcher(line) : matcher(line)));
  if (options.unique) lines = Array.from(new Set(lines));
  if (options.sort) lines = [...lines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  return lines.join("\n");
}

export function encodeUrl(input: string, component = true) {
  return component ? encodeURIComponent(input) : encodeURI(input);
}

export function decodeUrl(input: string, component = true) {
  return component ? decodeURIComponent(input) : decodeURI(input);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
