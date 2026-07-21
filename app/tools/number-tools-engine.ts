export function convertBase(value: string, fromBase: number) {
  const parsed = Number.parseInt(value.trim().replace(/^0[xob]/i, ""), fromBase);
  if (!Number.isFinite(parsed)) throw new Error("Invalid number for this base.");
  return { binary: parsed.toString(2), octal: parsed.toString(8), decimal: parsed.toString(10), hexadecimal: parsed.toString(16).toUpperCase() };
}

const parseAnyBase = (token: string) => token.startsWith("0b") ? parseInt(token.slice(2), 2) : token.startsWith("0o") ? parseInt(token.slice(2), 8) : token.startsWith("0x") ? parseInt(token.slice(2), 16) : Number(token);
export function numberBasePlayground(expression: string) {
  const tokens = expression.trim().split(/\s+/);
  if (!tokens.length) throw new Error("Enter an expression.");
  let total = parseAnyBase(tokens[0]!);
  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index];
    const next = parseAnyBase(tokens[index + 1] || "0");
    if (operator === "+") total += next;
    else if (operator === "-") total -= next;
    else if (operator === "*") total *= next;
    else if (operator === "/") total /= next;
    else throw new Error("Supported operators: + - * /");
  }
  return String(total);
}

const romanPairs: [number, string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
export function numberToRoman(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 3999) throw new Error("Roman numerals support 1 to 3999.");
  let rest = value;
  let output = "";
  for (const [amount, numeral] of romanPairs) while (rest >= amount) { output += numeral; rest -= amount; }
  return output;
}
export function romanToNumber(value: string) {
  let index = 0;
  let total = 0;
  const upper = value.trim().toUpperCase();
  for (const [amount, numeral] of romanPairs) while (upper.slice(index, index + numeral.length) === numeral) { total += amount; index += numeral.length; }
  if (numberToRoman(total) !== upper) throw new Error("Invalid Roman numeral.");
  return total;
}

const ones = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
const underThousand = (value: number): string => {
  if (value < 20) return ones[value]!;
  if (value < 100) return tens[Math.floor(value / 10)]! + (value % 10 ? " " + ones[value % 10] : "");
  return ones[Math.floor(value / 100)] + " hundred" + (value % 100 ? " " + underThousand(value % 100) : "");
};
export function numberToWords(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 999999999) throw new Error("Supports integers from 0 to 999,999,999.");
  if (value === 0) return "zero";
  const scales: [number, string][] = [[1000000,"million"],[1000,"thousand"],[1,""]];
  const parts: string[] = [];
  let rest = value;
  for (const [amount, label] of scales) {
    const chunk = Math.floor(rest / amount);
    if (chunk) parts.push(underThousand(chunk) + (label ? " " + label : ""));
    rest %= amount;
  }
  return parts.join(" ");
}

export function ipAddressConvert(ip: string) {
  const parts = ip.trim().split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) throw new Error("Enter a valid IPv4 address.");
  const integer = parts.reduce((sum, part) => (sum << 8) + part, 0) >>> 0;
  return { integer, binary: parts.map((part) => part.toString(2).padStart(8, "0")).join("."), hexadecimal: "0x" + integer.toString(16).toUpperCase().padStart(8, "0") };
}

const byteFactors: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3 };
export function byteUnitConvert(value: number, from: string, to: string) {
  if (!byteFactors[from] || !byteFactors[to]) throw new Error("Unsupported byte unit.");
  return value * byteFactors[from] / byteFactors[to];
}