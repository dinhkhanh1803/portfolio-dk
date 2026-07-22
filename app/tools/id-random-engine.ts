export type RandomSource = (length: number) => Uint8Array;

const secureRandom: RandomSource = (length) => {
  const values = new Uint8Array(length);
  globalThis.crypto.getRandomValues(values);
  return values;
};

const randomIndex = (size: number, source: RandomSource) => source(1)[0]! % size;

export function generateUuidV4(source: RandomSource = secureRandom) {
  const bytes = source(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function formatUuid(uuid: string, options: { uppercase: boolean; braces: boolean; noDashes: boolean }) {
  let output = options.noDashes ? uuid.replaceAll("-", "") : uuid;
  output = options.uppercase ? output.toUpperCase() : output.toLowerCase();
  return options.braces ? `{${output}}` : output;
}

const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function generateUlid(timestamp = Date.now(), source: RandomSource = secureRandom) {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > 281474976710655) throw new Error("ULID timestamp is out of range.");
  let time = timestamp;
  let encodedTime = "";
  for (let index = 0; index < 10; index += 1) {
    encodedTime = crockford[time % 32]! + encodedTime;
    time = Math.floor(time / 32);
  }
  const random = source(16);
  let encodedRandom = "";
  for (let index = 0; index < 16; index += 1) encodedRandom += crockford[random[index]! % 32];
  return encodedTime + encodedRandom;
}

const nanoAlphabet = "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function generateNanoId(length = 21, alphabet = nanoAlphabet, source: RandomSource = secureRandom) {
  if (!Number.isInteger(length) || length < 1 || length > 256) throw new Error("Nano ID length must be between 1 and 256.");
  if (alphabet.length < 2 || alphabet.length > 256) throw new Error("Nano ID alphabet must contain 2 to 256 characters.");
  const bytes = source(length);
  return [...bytes].map((value) => alphabet[value % alphabet.length]).join("");
}

export type PasswordOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  customCharacters: string;
  excludeCharacters: string;
};

const defaultGroups = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{};:,.<>?",
};

export function generatePassword(options: PasswordOptions, source: RandomSource = secureRandom) {
  if (!Number.isInteger(options.length) || options.length < 4 || options.length > 256) throw new Error("Password length must be between 4 and 256.");
  const excluded = new Set((options.excludeCharacters + (options.excludeSimilar ? "Il1O0o" : "")).split(""));
  const clean = (value: string) => [...new Set([...value].filter((character) => !excluded.has(character)))].join("");
  const groups = options.customCharacters.trim()
    ? [clean(options.customCharacters)]
    : [options.lowercase && clean(defaultGroups.lowercase), options.uppercase && clean(defaultGroups.uppercase), options.numbers && clean(defaultGroups.numbers), options.symbols && clean(defaultGroups.symbols)].filter(Boolean) as string[];
  if (!groups.length || groups.some((group) => !group.length)) throw new Error("Select at least one usable character group.");
  if (options.length < groups.length) throw new Error("Password length is too short for the selected character groups.");
  const all = groups.join("");
  const characters = groups.map((group) => group[randomIndex(group.length, source)]!);
  while (characters.length < options.length) characters.push(all[randomIndex(all.length, source)]!);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1, source);
    [characters[index], characters[swap]] = [characters[swap]!, characters[index]!];
  }
  return characters.join("");
}

const passphraseWords = ["amber", "atlas", "breeze", "cedar", "comet", "coral", "ember", "forest", "glacier", "harbor", "lunar", "meadow", "nebula", "ocean", "quartz", "raven", "river", "saffron", "summit", "vivid", "willow", "zenith"];
export function generatePassphrase(wordCount = 4, separator = "-", capitalize = false, source: RandomSource = secureRandom) {
  if (!Number.isInteger(wordCount) || wordCount < 3 || wordCount > 12) throw new Error("Passphrase must contain 3 to 12 words.");
  return Array.from({ length: wordCount }, () => {
    const word = passphraseWords[randomIndex(passphraseWords.length, source)]!;
    return capitalize ? word[0]!.toUpperCase() + word.slice(1) : word;
  }).join(separator);
}

const adjectives = ["vivid", "bright", "silent", "royal", "neon", "swift", "sacred", "lunar", "mighty", "clever"];
const nouns = ["aurora", "comet", "fox", "hawk", "lynx", "quartz", "vortex", "willow", "glacier", "raven"];
export function generateUsername(style: "camelCase" | "snake_case" | "kebab-case" | "l33t", appendNumber: boolean, source: RandomSource = secureRandom) {
  const adjective = adjectives[randomIndex(adjectives.length, source)]!;
  const noun = nouns[randomIndex(nouns.length, source)]!;
  const number = appendNumber ? String(100 + randomIndex(900, source)) : "";
  if (style === "snake_case") return `${adjective}_${noun}${number ? `_${number}` : ""}`;
  if (style === "kebab-case") return `${adjective}-${noun}${number ? `-${number}` : ""}`;
  const camel = adjective + noun[0]!.toUpperCase() + noun.slice(1) + number;
  return style === "l33t" ? camel.replace(/[aeio]/gi, (letter) => ({ a: "4", e: "3", i: "1", o: "0" })[letter.toLowerCase()]!) : camel;
}

export function pickRandom<T>(items: T[], count: number, allowDuplicates: boolean, source: RandomSource = secureRandom) {
  if (!items.length) throw new Error("Add at least one item.");
  if (!Number.isInteger(count) || count < 1) throw new Error("Pick count must be a positive integer.");
  if (!allowDuplicates && count > items.length) throw new Error("Pick count cannot exceed the number of unique items.");
  const pool = [...items];
  const output: T[] = [];
  while (output.length < count) {
    const index = randomIndex(pool.length, source);
    output.push(pool[index]!);
    if (!allowDuplicates) pool.splice(index, 1);
  }
  return output;
}

export function rollDice(notation: string, source: RandomSource = secureRandom) {
  const match = notation.trim().toLowerCase().match(/^(\d{1,2})d(4|6|8|10|12|20|100)([+-]\d+)?$/);
  if (!match) throw new Error("Use dice notation such as 2d6+3.");
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = Number(match[3] ?? 0);
  if (count < 1 || count > 50) throw new Error("Dice quantity must be between 1 and 50.");
  const rolls = Array.from({ length: count }, () => 1 + randomIndex(sides, source));
  return { count, sides, modifier, rolls, total: rolls.reduce((sum, roll) => sum + roll, modifier) };
}

export function passwordEntropy(length: number, alphabetSize: number) {
  return alphabetSize > 1 ? Math.round(length * Math.log2(alphabetSize)) : 0;
}
