export type EncodingKind = "base64" | "base32" | "url" | "html" | "binary" | "data-uri";
export type EncodingDirection = "encode" | "decode";

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error("Chuỗi Base64 không hợp lệ.");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  try { return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)); }
  catch { throw new Error("Chuỗi Base64 không hợp lệ."); }
};

export function encodeBase64(value: string, urlSafe = false) {
  const result = bytesToBase64(new TextEncoder().encode(value));
  return urlSafe ? result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : result;
}

export function decodeBase64(value: string) {
  return new TextDecoder("utf-8", { fatal: true }).decode(base64ToBytes(value));
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function encodeBase32(value: string) {
  const bytes = new TextEncoder().encode(value);
  let bits = "";
  bytes.forEach((byte) => { bits += byte.toString(2).padStart(8, "0"); });
  let result = "";
  for (let index = 0; index < bits.length; index += 5) result += BASE32_ALPHABET[parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  return result.padEnd(Math.ceil(result.length / 8) * 8, "=");
}

export function decodeBase32(value: string) {
  const normalized = value.toUpperCase().replace(/s/g, "");
  if (!/^[A-Z2-7]*={0,6}$/.test(normalized) || normalized.length % 8 !== 0) throw new Error("Chuỗi Base32 RFC 4648 không hợp lệ.");
  const payload = normalized.replace(/=+$/, "");
  let bits = "";
  for (const char of payload) bits += BASE32_ALPHABET.indexOf(char).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(parseInt(bits.slice(index, index + 8), 2));
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes)); }
  catch { throw new Error("Base32 không chứa văn bản UTF-8 hợp lệ."); }
}

export type ByteEncoding = "binary" | "hex" | "decimal" | "base64";
export function encodeBytes(value: string, format: ByteEncoding, separator = " ") {
  if (format === "base64") return encodeBase64(value);
  const radix = format === "binary" ? 2 : format === "hex" ? 16 : 10;
  const width = format === "binary" ? 8 : format === "hex" ? 2 : 3;
  return [...new TextEncoder().encode(value)].map((byte) => byte.toString(radix).toUpperCase().padStart(width, "0")).join(separator);
}

export function decodeBytes(value: string, format: ByteEncoding) {
  if (format === "base64") return decodeBase64(value);
  const radix = format === "binary" ? 2 : format === "hex" ? 16 : 10;
  const pattern = format === "binary" ? /^[01]{8}$/ : format === "hex" ? /^[0-9A-Fa-f]{2}$/ : /^[0-9]{1,3}$/;
  let tokens = value.trim().replaceAll(String.fromCharCode(10), " ").replaceAll(String.fromCharCode(13), " ").replaceAll(String.fromCharCode(9), " ").split(/[ ,;:|-]+/).filter(Boolean);
  if (tokens.length === 1 && format !== "decimal") {
    const width = format === "binary" ? 8 : 2;
    if (tokens[0].length % width === 0) tokens = tokens[0].match(new RegExp(".{" + width + "}", "g")) ?? [];
  }
  if (!tokens.length) return "";
  if (tokens.some((token) => !pattern.test(token) || parseInt(token, radix) > 255)) throw new Error("Dữ liệu " + format + " không hợp lệ theo từng byte.");
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(tokens, (token) => parseInt(token, radix))); }
  catch { throw new Error("Dữ liệu không tạo thành văn bản UTF-8 hợp lệ."); }
}
export function encodeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function decodeHtml(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    if (entity[0] === "#") return String.fromCodePoint(entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
    return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[entity.toLowerCase()];
  });
}

export function encodeBinary(value: string) {
  return [...new TextEncoder().encode(value)].map((byte) => byte.toString(2).padStart(8, "0")).join(" ");
}

export function decodeBinary(value: string) {
  const bits = value.trim().split(/\s+/).filter(Boolean);
  if (!bits.length) return "";
  if (bits.some((part) => !/^[01]{8}$/.test(part))) throw new Error("Mỗi byte nhị phân phải có đúng 8 bit.");
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bits, (part) => parseInt(part, 2)));
}

export function encodeDataUri(value: string, mime = "text/plain;charset=utf-8", base64 = true) {
  return base64 ? `data:${mime};base64,${encodeBase64(value)}` : `data:${mime},${encodeURIComponent(value)}`;
}

export function decodeDataUri(value: string) {
  const match = value.match(/^data:([^,]*?)(;base64)?,([\s\S]*)$/i);
  if (!match) throw new Error("Data URI không đúng định dạng.");
  return { mime: match[1] || "text/plain;charset=US-ASCII", value: match[2] ? decodeBase64(match[3]) : decodeURIComponent(match[3]) };
}

export function transformEncoding(kind: EncodingKind, direction: EncodingDirection, value: string, options?: { urlSafe?: boolean; mime?: string; dataUriBase64?: boolean }) {
  if (kind === "base64") return direction === "encode" ? encodeBase64(value, options?.urlSafe) : decodeBase64(value);
  if (kind === "base32") return direction === "encode" ? encodeBase32(value) : decodeBase32(value);
  if (kind === "url") return direction === "encode" ? encodeURIComponent(value) : decodeURIComponent(value);
  if (kind === "html") return direction === "encode" ? encodeHtml(value) : decodeHtml(value);
  if (kind === "binary") return direction === "encode" ? encodeBinary(value) : decodeBinary(value);
  return direction === "encode" ? encodeDataUri(value, options?.mime, options?.dataUriBase64) : decodeDataUri(value).value;
}
