export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const encoder = new TextEncoder();
const bytesToHex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export async function generateShaHash(value: string, algorithm: HashAlgorithm = "SHA-256") {
  const digest = await crypto.subtle.digest(algorithm, encoder.encode(value));
  return bytesToHex(digest);
}

export async function generateHmac(value: string, secret: string, algorithm: HashAlgorithm = "SHA-256") {
  if (!secret) throw new Error("Secret key is required for HMAC.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToHex(signature);
}

export function checksum(value: string) {
  const total = [...encoder.encode(value)].reduce((sum, byte) => (sum + byte) >>> 0, 0);
  return total.toString(16).padStart(8, "0");
}

export type PasswordOptions = { length: number; uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean };
const passwordSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

const pick = (characters: string) => characters[crypto.getRandomValues(new Uint32Array(1))[0]! % characters.length]!;

export function generatePassword(options: PasswordOptions) {
  const length = Math.max(4, Math.min(128, Math.floor(options.length || 16)));
  const selected = [
    options.uppercase ? passwordSets.uppercase : "",
    options.lowercase ? passwordSets.lowercase : "",
    options.numbers ? passwordSets.numbers : "",
    options.symbols ? passwordSets.symbols : "",
  ].filter(Boolean);
  if (!selected.length) throw new Error("Choose at least one character set.");
  const all = selected.join("");
  const required = selected.map((set) => pick(set));
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pick(all));
  const password = [...required, ...rest];
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swap = crypto.getRandomValues(new Uint32Array(1))[0]! % (index + 1);
    [password[index], password[swap]] = [password[swap]!, password[index]!];
  }
  return password.join("");
}
