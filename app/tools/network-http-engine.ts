export type ParsedUrlDetail = {
  valid: boolean;
  error?: string;
  href: string;
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  query: Array<{ key: string; value: string }>;
  segments: string[];
};

export type HeaderEntry = { name: string; value: string };
export type IpInspection = {
  input: string;
  version: "IPv4" | "IPv6" | "Invalid";
  valid: boolean;
  privateRange: boolean;
  loopback: boolean;
  multicast: boolean;
  binary?: string;
  integer?: number;
  normalized?: string;
};

export type CidrInspection = {
  valid: boolean;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
};

function safeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("URL is empty");
  return new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

export function parseUrlDetails(value: string): ParsedUrlDetail {
  try {
    const url = safeUrl(value);
    return {
      valid: true,
      href: url.href,
      protocol: url.protocol.replace(/:$/, ""),
      username: decodeURIComponent(url.username),
      password: url.password ? "********" : "",
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      query: [...url.searchParams.entries()].map(([key, value]) => ({ key, value })),
      segments: url.pathname.split("/").filter(Boolean).map(decodeURIComponent),
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Invalid URL", href: value, protocol: "", username: "", password: "", hostname: "", port: "", pathname: "", search: "", hash: "", origin: "", query: [], segments: [] };
  }
}

export function parseHeaders(raw: string): HeaderEntry[] {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const index = line.indexOf(":");
    if (index === -1) return { name: line, value: "" };
    return { name: line.slice(0, index).trim(), value: line.slice(index + 1).trim() };
  }).filter((header) => header.name.length > 0);
}

export function headersToObject(headers: HeaderEntry[]) {
  return headers.reduce<Record<string, string>>((acc, header) => {
    acc[header.name] = header.value;
    return acc;
  }, {});
}

export function buildCurlFromHeaders(url: string, headers: HeaderEntry[]) {
  const target = url.trim();
  const headerArgs = headers.map((header) => `-H "${header.name}: ${header.value}"`).join(" ");
  return `curl -I "${target}"${headerArgs ? ` ${headerArgs}` : ""}`;
}

function ipv4ToInt(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return parts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function intToIpv4(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function isPrivateIpv4(value: number) {
  return (value >= ipv4ToInt("10.0.0.0")! && value <= ipv4ToInt("10.255.255.255")!)
    || (value >= ipv4ToInt("172.16.0.0")! && value <= ipv4ToInt("172.31.255.255")!)
    || (value >= ipv4ToInt("192.168.0.0")! && value <= ipv4ToInt("192.168.255.255")!);
}

export function inspectIp(input: string): IpInspection {
  const value = input.trim();
  const ipv4 = ipv4ToInt(value);
  if (ipv4 !== null) {
    return {
      input: value,
      version: "IPv4",
      valid: true,
      privateRange: isPrivateIpv4(ipv4),
      loopback: ipv4 >= ipv4ToInt("127.0.0.0")! && ipv4 <= ipv4ToInt("127.255.255.255")!,
      multicast: ipv4 >= ipv4ToInt("224.0.0.0")! && ipv4 <= ipv4ToInt("239.255.255.255")!,
      binary: value.split(".").map((part) => Number(part).toString(2).padStart(8, "0")).join("."),
      integer: ipv4,
      normalized: intToIpv4(ipv4),
    };
  }
  const ipv6Like = /^[0-9a-f:]+$/i.test(value) && value.includes(":");
  if (ipv6Like) {
    return { input: value, version: "IPv6", valid: true, privateRange: /^f[cd]/i.test(value), loopback: value === "::1", multicast: /^ff/i.test(value), normalized: value.toLowerCase() };
  }
  return { input: value, version: "Invalid", valid: false, privateRange: false, loopback: false, multicast: false };
}

export function inspectCidr(input: string): CidrInspection {
  const [ip, prefixRaw] = input.trim().split("/");
  const prefix = Number(prefixRaw);
  const base = ipv4ToInt(ip || "");
  if (base === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { valid: false, network: "", broadcast: "", firstHost: "", lastHost: "", totalAddresses: 0, usableHosts: 0, subnetMask: "", wildcardMask: "" };
  }
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const network = (base & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  return {
    valid: true,
    network: intToIpv4(network),
    broadcast: intToIpv4(broadcast),
    firstHost: intToIpv4(total <= 2 ? network : network + 1),
    lastHost: intToIpv4(total <= 2 ? broadcast : broadcast - 1),
    totalAddresses: total,
    usableHosts: total <= 2 ? total : total - 2,
    subnetMask: intToIpv4(mask),
    wildcardMask: intToIpv4(wildcard),
  };
}

export function buildDnsRecords(domain: string) {
  const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "") || "example.com";
  const fqdn = `${clean}.`;
  const records = [
    { type: "A", host: fqdn, value: "203.0.113.10", ttl: 3600 },
    { type: "AAAA", host: fqdn, value: "2001:db8::10", ttl: 3600 },
    { type: "CNAME", host: `www.${fqdn}`, value: fqdn, ttl: 3600 },
    { type: "MX", host: fqdn, value: `10 mail.${fqdn}`, ttl: 3600 },
    { type: "TXT", host: fqdn, value: '"v=spf1 include:_spf.example.com ~all"', ttl: 3600 },
  ];
  const zoneFile = records.map((record) => `${record.host}\t${record.ttl}\tIN\t${record.type}\t${record.value}`).join("\n");
  return { domain: clean, records, zoneFile };
}