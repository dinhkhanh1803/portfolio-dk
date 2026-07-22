export type LoremMode = "paragraphs" | "sentences" | "words";
export type LoremFlavor = "classic" | "tech" | "friendly";
export type MockFormat = "JSON" | "CSV" | "SQL";
export type SequenceKind = "Arithmetic" | "Geometric" | "Fibonacci" | "Prime" | "Triangular" | "Square" | "Cube" | "Powers";
export type RandomSource = (length: number) => Uint8Array;

const secureRandom: RandomSource = (length) => { const values = new Uint8Array(length); globalThis.crypto.getRandomValues(values); return values; };
const index = (size: number, source: RandomSource) => source(1)[0]! % size;

const loremWords: Record<LoremFlavor, string[]> = {
  classic: "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat".split(" "),
  tech: "adaptive interface signal system protocol component runtime schema network module service reliable scalable workflow platform insight".split(" "),
  friendly: "warm bright curious helpful thoughtful creative playful calm welcoming simple useful everyday delightful moment".split(" "),
};

export function generateLorem(options: { mode: LoremMode; count: number; sentencesPerParagraph: number; includeStart: boolean; flavor: LoremFlavor; html: boolean }) {
  const words = loremWords[options.flavor];
  const safeCount = Math.max(1, Math.min(100, Math.floor(options.count)));
  const sentence = (offset: number, wordCount = 12) => {
    const result = Array.from({ length: wordCount }, (_, i) => words[(offset + i) % words.length]!);
    return `${result.map((word, i) => i === 0 ? word[0]!.toUpperCase() + word.slice(1) : word).join(" ")}.`;
  };
  if (options.mode === "words") return Array.from({ length: safeCount }, (_, i) => words[i % words.length]!).join(" ");
  if (options.mode === "sentences") return Array.from({ length: safeCount }, (_, i) => sentence(i * 7)).join(" ");
  const paragraphs = Array.from({ length: safeCount }, (_, paragraph) => Array.from({ length: Math.max(1, Math.min(20, options.sentencesPerParagraph)) }, (_, line) => sentence((paragraph * options.sentencesPerParagraph + line) * 7)).join(" "));
  if (options.includeStart && options.flavor === "classic") paragraphs[0] = `Lorem ipsum dolor sit amet, ${paragraphs[0]!.slice(paragraphs[0]!.indexOf(" ") + 1)}`;
  return options.html ? paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n") : paragraphs.join("\n\n");
}

export type MockFieldType = "Full Name" | "Email" | "Phone" | "Company" | "City" | "Country" | "UUID" | "Date" | "Integer" | "Boolean" | "Lorem sentence";
export type MockField = { key: string; type: MockFieldType };
const names = ["Lan Nguyen", "Minh Tran", "Anh Le", "Khanh Pham", "Mai Vo", "Huy Bui"];
const companies = ["DK Studio", "Northstar Labs", "Pixel & Co", "Orbit Works", "Mango Systems"];
const cities = ["Da Nang", "Ho Chi Minh City", "Hanoi", "Hue", "Can Tho"];
const countries = ["Vietnam", "Japan", "Singapore", "Canada", "Australia"];

const uuid = (source: RandomSource) => { const bytes = source(16); bytes[6] = (bytes[6]! & 15) | 64; bytes[8] = (bytes[8]! & 63) | 128; const hex = [...bytes].map((item) => item.toString(16).padStart(2, "0")).join(""); return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`; };
export function generateMockRows(fields: MockField[], count: number, source: RandomSource = secureRandom) {
  if (!fields.length) throw new Error("Choose at least one field.");
  const safeCount = Math.max(1, Math.min(1000, Math.floor(count)));
  return Array.from({ length: safeCount }, (_, row) => Object.fromEntries(fields.map(({ key, type }) => {
    const name = names[index(names.length, source)]!;
    const value: Record<MockFieldType, string | number | boolean> = {
      "Full Name": name,
      Email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
      Phone: `+84 9${String(10000000 + index(89999999, source)).padStart(8, "0")}`,
      Company: companies[index(companies.length, source)]!,
      City: cities[index(cities.length, source)]!,
      Country: countries[index(countries.length, source)]!,
      UUID: uuid(source),
      Date: `2026-${String(1 + (row % 12)).padStart(2, "0")}-${String(1 + (row % 28)).padStart(2, "0")}`,
      Integer: 1 + index(1000, source),
      Boolean: index(2, source) === 1,
      "Lorem sentence": generateLorem({ mode: "sentences", count: 1, sentencesPerParagraph: 1, includeStart: false, flavor: "classic", html: false }),
    };
    return [key.trim() || type.replaceAll(" ", "").toLowerCase(), value[type]];
  })));
}

const csvValue = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
export function formatMockRows(rows: Record<string, unknown>[], format: MockFormat) {
  if (!rows.length) return "";
  if (format === "JSON") return JSON.stringify(rows, null, 2);
  const keys = Object.keys(rows[0]!);
  if (format === "CSV") return [keys.join(","), ...rows.map((row) => keys.map((key) => csvValue(row[key])).join(","))].join("\n");
  return rows.map((row) => `INSERT INTO mock_data (${keys.join(", ")}) VALUES (${keys.map((key) => typeof row[key] === "boolean" ? (row[key] ? "TRUE" : "FALSE") : `'${String(row[key]).replaceAll("'", "''")}'`).join(", ")});`).join("\n");
}

const primes = (count: number) => { const output: number[] = []; let candidate = 2; while (output.length < count) { if (output.every((prime) => candidate % prime !== 0 || candidate === prime)) output.push(candidate); candidate += 1; } return output; };
export function generateSequence(type: SequenceKind, count: number, start: number, step: number) {
  const safeCount = Math.max(1, Math.min(200, Math.floor(count)));
  if (type === "Arithmetic") return Array.from({ length: safeCount }, (_, i) => start + step * i);
  if (type === "Geometric") return Array.from({ length: safeCount }, (_, i) => start * step ** i);
  if (type === "Fibonacci") return Array.from({ length: safeCount }, (_, i) => { if (i < 2) return i; let a = 0; let b = 1; for (let n = 2; n <= i; n += 1) [a, b] = [b, a + b]; return b; });
  if (type === "Prime") return primes(safeCount);
  if (type === "Triangular") return Array.from({ length: safeCount }, (_, i) => ((i + 1) * (i + 2)) / 2);
  if (type === "Square") return Array.from({ length: safeCount }, (_, i) => (i + 1) ** 2);
  if (type === "Cube") return Array.from({ length: safeCount }, (_, i) => (i + 1) ** 3);
  return Array.from({ length: safeCount }, (_, i) => start ** i);
}