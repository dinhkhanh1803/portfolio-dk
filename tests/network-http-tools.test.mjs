import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Network & HTTP collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");
  assert.match(page, /import NetworkHttpWorkbench from "\.\/network-http-workbench"/);
  assert.match(page, /activeCollection\.id === "network-http" \? <NetworkHttpWorkbench \/>/);
});

test("Network & HTTP workbench exposes URL, headers, IP, and DNS tools", () => {
  const workbench = read("app/tools/network-http-workbench.tsx");
  for (const label of ["URL Parser", "HTTP Headers", "IP Inspector", "DNS Toolkit", "Sample", "Copy", "Download"]) {
    assert.match(workbench, new RegExp(label));
  }
  assert.match(workbench, /network-http-workbench/);
  assert.match(workbench, /text-tool-actions/);
  assert.match(workbench, /text-tool-grid/);
  assert.match(workbench, /text-tool-control-card/);
  assert.match(workbench, /sampleUrl/);
});

test("Network & HTTP engine parses URLs, headers, IPs, and DNS records", async () => {
  const engine = await import("../app/tools/network-http-engine.ts");
  const parsed = engine.parseUrlDetails("https://example.com:8443/docs?q=dk#top");
  assert.equal(parsed.hostname, "example.com");
  assert.equal(parsed.port, "8443");
  assert.equal(parsed.query.length, 1);

  const headers = engine.parseHeaders("Content-Type: application/json\nCache-Control: no-cache\nX-Test: one");
  assert.equal(headers.length, 3);
  assert.equal(engine.buildCurlFromHeaders("https://api.example.com", headers), 'curl -I "https://api.example.com" -H "Content-Type: application/json" -H "Cache-Control: no-cache" -H "X-Test: one"');

  const ipv4 = engine.inspectIp("192.168.1.10");
  assert.equal(ipv4.version, "IPv4");
  assert.equal(ipv4.privateRange, true);

  const cidr = engine.inspectCidr("192.168.1.10/24");
  assert.equal(cidr.network, "192.168.1.0");
  assert.equal(cidr.broadcast, "192.168.1.255");
  assert.equal(cidr.usableHosts, 254);

  const dns = engine.buildDnsRecords("dktools.dev");
  assert.match(dns.zoneFile, /dktools\.dev\.\s+3600\s+IN\s+A/);
});

test("Network & HTTP styling is scoped and wraps tabs instead of horizontal overflow", () => {
  const css = read("app/globals.css");
  for (const selector of [".network-http-workbench", ".network-http-grid", ".network-http-card", ".network-http-tabs"]) {
    assert.ok(css.includes(selector), `${selector} should exist in globals.css`);
  }
  assert.match(css, /\.network-http-tabs[\s\S]*flex-wrap:\s*wrap/);
  assert.doesNotMatch(css, /\.network-http-tabs\{[^}]*overflow-x:\s*auto/);
});