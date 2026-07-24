export type RegexMatchGroup = {
  index: number;
  value: string;
};

export type RegexMatch = {
  match: string;
  index: number;
  groups: RegexMatchGroup[];
  namedGroups: Record<string, string>;
  before: string;
  after: string;
};

export type RegexEvaluation = {
  valid: boolean;
  error?: string;
  pattern: string;
  flags: string;
  total: number;
  matches: RegexMatch[];
};

export type RegexPattern = {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description: string;
  sample: string;
};

export const REGEX_PATTERNS: RegexPattern[] = [
  { id: "email", name: "Email", pattern: String.raw`[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}`, flags: "gi", description: "Common email address matcher.", sample: "Contact lan@example.com or support@dk.tools" },
  { id: "url", name: "URL", pattern: String.raw`https?:\/\/[^\s)]+`, flags: "gi", description: "HTTP/HTTPS links.", sample: "Docs: https://dk.tools/docs and https://example.com/path?q=1" },
  { id: "hex", name: "HEX Color", pattern: String.raw`#(?:[0-9a-fA-F]{3}){1,2}\b`, flags: "g", description: "3 or 6 digit CSS hex colors.", sample: "Primary #3b82f6, accent #0f766e, white #fff" },
  { id: "ipv4", name: "IPv4", pattern: String.raw`\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b`, flags: "g", description: "IPv4 addresses with octet validation.", sample: "Local 192.168.1.10, DNS 8.8.8.8, invalid 999.1.1.1" },
  { id: "date", name: "ISO Date", pattern: String.raw`\b\d{4}-\d{2}-\d{2}\b`, flags: "g", description: "YYYY-MM-DD date fragments.", sample: "Created 2026-07-23, updated 2026-08-01" },
  { id: "uuid", name: "UUID", pattern: String.raw`\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b`, flags: "gi", description: "RFC-style UUID values.", sample: "id: 75340c11-becf-4e8f-a827-684c4bacf47c" },
  { id: "markdown-links", name: "Markdown links", pattern: String.raw`\[([^\]]+)\]\((https?:\/\/[^)]+)\)`, flags: "g", description: "Capture Markdown link label and URL.", sample: "Read [Docs](https://dk.tools/docs) or [Blog](https://dk.tools/blog)" },
  { id: "duplicate-word", name: "Duplicate words", pattern: String.raw`\b(\w+)\s+\1\b`, flags: "gi", description: "Find accidentally repeated words.", sample: "This is is a useful useful regex test." },
];

export function buildFlags(options: { global: boolean; ignoreCase: boolean; multiline: boolean; dotAll: boolean; unicode: boolean; sticky?: boolean }) {
  return [
    options.global ? "g" : "",
    options.ignoreCase ? "i" : "",
    options.multiline ? "m" : "",
    options.dotAll ? "s" : "",
    options.unicode ? "u" : "",
    options.sticky ? "y" : "",
  ].join("");
}

const makeRegex = (pattern: string, flags: string) => new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);

export function evaluateRegex(pattern: string, flags: string, text: string): RegexEvaluation {
  if (!pattern.trim()) return { valid: true, pattern, flags, total: 0, matches: [] };

  try {
    const regex = makeRegex(pattern, flags);
    const matches: RegexMatch[] = [];
    let match: RegExpExecArray | null;
    let guard = 0;

    while ((match = regex.exec(text)) && guard < 1000) {
      const value = match[0];
      matches.push({
        match: value,
        index: match.index,
        groups: match.slice(1).map((group, index) => ({ index: index + 1, value: group ?? "" })),
        namedGroups: match.groups ? { ...match.groups } : {},
        before: text.slice(Math.max(0, match.index - 24), match.index),
        after: text.slice(match.index + value.length, match.index + value.length + 24),
      });
      guard += 1;
      if (value === "") regex.lastIndex += 1;
    }

    return { valid: true, pattern, flags, total: matches.length, matches };
  } catch (error) {
    return { valid: false, pattern, flags, total: 0, matches: [], error: error instanceof Error ? error.message : "Invalid regular expression" };
  }
}

export function replaceRegex(pattern: string, flags: string, text: string, replacement: string) {
  try {
    return text.replace(makeRegex(pattern, flags), replacement);
  } catch (error) {
    return error instanceof Error ? `Invalid regex: ${error.message}` : "Invalid regex";
  }
}

export function explainRegex(pattern: string) {
  const pieces: string[] = [];
  if (pattern.includes("^")) pieces.push("^ anchors the match at the beginning of a line or string.");
  if (pattern.includes("$")) pieces.push("$ anchors the match at the end of a line or string.");
  if (pattern.includes("\\d")) pieces.push("\\d matches a digit.");
  if (pattern.includes("\\w")) pieces.push("\\w matches a word character.");
  if (pattern.includes("\\s")) pieces.push("\\s matches whitespace.");
  if (pattern.includes(".*")) pieces.push(".* greedily matches any characters.");
  if (/\[[^\]]+\]/.test(pattern)) pieces.push("[...] defines a character class.");
  if (/\([^?][^)]*\)/.test(pattern)) pieces.push("(...) creates a capturing group.");
  if (/\(\?<[^>]+>/.test(pattern)) pieces.push("(?<name>...) creates a named capturing group.");
  if (/[+*?{]/.test(pattern)) pieces.push("Quantifiers control how many times a token can repeat.");
  return pieces.length ? pieces : ["This pattern is valid, but no high-level hints were detected."];
}
