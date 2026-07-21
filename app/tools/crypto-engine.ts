export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export type SriAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";
export type DigestOutput = { hex: string; base64: string; base64Url: string };
export type HashResult = { label: string; kind: "cryptographic" | "checksum" | "non-crypto"; hex: string; base64?: string; base64Url?: string; note?: string };
export type PasswordOptions = { length: number; uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean };
export type DecodedJwt = { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string; signingInput: string };
export type JwtInspection = {
  algorithm: string;
  type: string;
  issuer: string | null;
  subject: string | null;
  audience: unknown;
  issuedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean | null;
  notBefore: string | null;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const sriNames: Record<SriAlgorithm, string> = { "SHA-256": "sha256", "SHA-384": "sha384", "SHA-512": "sha512" };
const asArrayBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const textToArrayBuffer = (value: string) => asArrayBuffer(encoder.encode(value));

const bytesToHex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array) => {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]!);
  return btoa(binary);
};
const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};
const toBase64Url = (value: string) => value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
};
const bytesToBase64Url = (bytes: ArrayBuffer | Uint8Array) => toBase64Url(bytesToBase64(bytes));
const base64UrlToBytes = (value: string) => base64ToBytes(fromBase64Url(value));
const dateFromSeconds = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;

export async function generateShaDigest(value: string, algorithm: HashAlgorithm = "SHA-256"): Promise<DigestOutput> {
  const digest = new Uint8Array(await crypto.subtle.digest(algorithm, encoder.encode(value)));
  return { hex: bytesToHex(digest), base64: bytesToBase64(digest), base64Url: bytesToBase64Url(digest) };
}

export async function generateShaHash(value: string, algorithm: HashAlgorithm = "SHA-256") {
  return (await generateShaDigest(value, algorithm)).hex;
}

export async function generateHmacDigest(value: string, secret: string, algorithm: HashAlgorithm = "SHA-256"): Promise<DigestOutput> {
  if (!secret) throw new Error("Secret key is required for HMAC.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return { hex: bytesToHex(signature), base64: bytesToBase64(signature), base64Url: bytesToBase64Url(signature) };
}

export async function generateHmac(value: string, secret: string, algorithm: HashAlgorithm = "SHA-256") {
  return (await generateHmacDigest(value, secret, algorithm)).hex;
}

export function checksum(value: string) {
  const total = [...encoder.encode(value)].reduce((sum, byte) => (sum + byte) >>> 0, 0);
  return total.toString(16).padStart(8, "0");
}

const crc32Table = new Uint32Array(256).map((_, tableIndex) => {
  let crc = tableIndex;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

export function crc32(value: string) {
  let crc = 0xffffffff;
  for (const byte of encoder.encode(value)) crc = crc32Table[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

export function djb2(value: string) {
  let hash = 5381;
  for (const byte of encoder.encode(value)) hash = (((hash << 5) + hash) + byte) >>> 0;
  return hash.toString(16).padStart(8, "0");
}

export async function hashText(value: string): Promise<HashResult[]> {
  const cryptographic = await Promise.all((["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as HashAlgorithm[]).map(async (algorithm) => ({ label: algorithm, kind: "cryptographic" as const, ...(await generateShaDigest(value, algorithm)) })));
  return [
    ...cryptographic,
    { label: "CRC32", kind: "checksum", hex: crc32(value), note: "Reference checksum" },
    { label: "djb2", kind: "non-crypto", hex: djb2(value), note: "Non-cryptographic" },
  ];
}

export async function generateSri(value: string, algorithm: SriAlgorithm = "SHA-384") {
  const digest = await generateShaDigest(value, algorithm);
  return sriNames[algorithm] + "-" + digest.base64;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) throw new Error("JWT must contain header, payload, and signature parts.");
  try {
    return {
      header: JSON.parse(decoder.decode(base64UrlToBytes(parts[0]!))) as Record<string, unknown>,
      payload: JSON.parse(decoder.decode(base64UrlToBytes(parts[1]!))) as Record<string, unknown>,
      signature: parts[2]!,
      signingInput: parts[0]! + "." + parts[1]!,
    };
  } catch {
    throw new Error("JWT header or payload is not valid base64url JSON.");
  }
}

export function inspectJwt(token: string): JwtInspection {
  const decoded = decodeJwt(token);
  const exp = typeof decoded.payload.exp === "number" ? decoded.payload.exp : null;
  return {
    algorithm: String(decoded.header.alg ?? "unknown"),
    type: String(decoded.header.typ ?? "JWT"),
    issuer: typeof decoded.payload.iss === "string" ? decoded.payload.iss : null,
    subject: typeof decoded.payload.sub === "string" ? decoded.payload.sub : null,
    audience: decoded.payload.aud ?? null,
    issuedAt: dateFromSeconds(decoded.payload.iat),
    expiresAt: dateFromSeconds(exp),
    isExpired: exp === null ? null : Date.now() >= exp * 1000,
    notBefore: dateFromSeconds(decoded.payload.nbf),
  };
}

const deriveAesKey = async (password: string, salt: Uint8Array) => {
  if (!password) throw new Error("Password is required for encryption and decryption.");
  const baseKey = await crypto.subtle.importKey("raw", textToArrayBuffer(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: asArrayBuffer(salt), iterations: 100000, hash: "SHA-256" }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
};

export async function encryptText(value: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, key, textToArrayBuffer(value)));
  return JSON.stringify({ v: 1, alg: "AES-256-GCM", kdf: "PBKDF2-SHA-256", iter: 100000, salt: bytesToBase64Url(salt), iv: bytesToBase64Url(iv), data: bytesToBase64Url(encrypted) });
}

export async function decryptText(payload: string, password: string) {
  let parsed: { salt?: string; iv?: string; data?: string };
  try {
    parsed = JSON.parse(payload) as { salt?: string; iv?: string; data?: string };
  } catch {
    throw new Error("Encrypted payload must be the JSON output generated by this tool.");
  }
  if (!parsed.salt || !parsed.iv || !parsed.data) throw new Error("Encrypted payload is missing salt, iv, or data.");
  const key = await deriveAesKey(password, base64UrlToBytes(parsed.salt));
  try {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(base64UrlToBytes(parsed.iv)) }, key, asArrayBuffer(base64UrlToBytes(parsed.data)));
    return decoder.decode(decrypted);
  } catch {
    throw new Error("Unable to decrypt. Check the password and encrypted payload.");
  }
}

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
