"use client";

import { Copy, Download, FlaskConical, Globe2, Network, RotateCcw, Server, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { buildCurlFromHeaders, buildDnsRecords, headersToObject, inspectCidr, inspectIp, parseHeaders, parseUrlDetails } from "./network-http-engine";

const tabs = ["URL Parser", "HTTP Headers", "IP Inspector", "DNS Toolkit"] as const;
const sampleUrl = "https://api.dktools.dev:8443/v1/search?q=network%20tools&lang=en#results";
const sampleHeaders = "Content-Type: application/json\nCache-Control: no-cache\nAuthorization: Bearer demo-token\nX-Request-ID: req_12345";
const sampleIp = "192.168.1.10";
const sampleCidr = "192.168.1.10/24";
const sampleDomain = "dktools.dev";

type Tab = (typeof tabs)[number];

function copyText(value: string) {
  navigator.clipboard?.writeText(value).catch(() => undefined);
}

function downloadText(filename: string, value: string) {
  const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Field({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  return <div className="text-tool-stats network-http-field"><span>{label}</span><code>{String(value ?? "-")}</code></div>;
}

function ActionBar({ sample, clear, output, file }: { sample: () => void; clear: () => void; output: string; file: string }) {
  return <div className="text-tool-actions network-http-actions">
    <button type="button" onClick={sample}><FlaskConical size={15} />Sample</button>
    <button type="button" onClick={clear}><RotateCcw size={15} />Clear</button>
    <button type="button" onClick={() => copyText(output)}><Copy size={15} />Copy</button>
    <button type="button" onClick={() => downloadText(file, output)}><Download size={15} />Download</button>
  </div>;
}

export default function NetworkHttpWorkbench() {
  const [active, setActive] = useState<Tab>("URL Parser");
  const [url, setUrl] = useState(sampleUrl);
  const [headers, setHeaders] = useState(sampleHeaders);
  const [headerUrl, setHeaderUrl] = useState("https://api.example.com");
  const [ip, setIp] = useState(sampleIp);
  const [cidr, setCidr] = useState(sampleCidr);
  const [domain, setDomain] = useState(sampleDomain);

  const parsedUrl = useMemo(() => parseUrlDetails(url), [url]);
  const parsedHeaders = useMemo(() => parseHeaders(headers), [headers]);
  const ipInfo = useMemo(() => inspectIp(ip), [ip]);
  const cidrInfo = useMemo(() => inspectCidr(cidr), [cidr]);
  const dnsInfo = useMemo(() => buildDnsRecords(domain), [domain]);

  const output = useMemo(() => {
    if (active === "URL Parser") return JSON.stringify(parsedUrl, null, 2);
    if (active === "HTTP Headers") return `${JSON.stringify(headersToObject(parsedHeaders), null, 2)}\n\n${buildCurlFromHeaders(headerUrl, parsedHeaders)}`;
    if (active === "IP Inspector") return JSON.stringify({ ip: ipInfo, cidr: cidrInfo }, null, 2);
    return dnsInfo.zoneFile;
  }, [active, parsedUrl, parsedHeaders, headerUrl, ipInfo, cidrInfo, dnsInfo]);

  const sample = () => { setUrl(sampleUrl); setHeaders(sampleHeaders); setHeaderUrl("https://api.example.com"); setIp(sampleIp); setCidr(sampleCidr); setDomain(sampleDomain); };
  const clear = () => { if (active === "URL Parser") setUrl(""); if (active === "HTTP Headers") setHeaders(""); if (active === "IP Inspector") { setIp(""); setCidr(""); } if (active === "DNS Toolkit") setDomain(""); };

  return <section className="text-manipulation-workbench network-http-workbench">
    <div className="data-format-tabs text-tool-tabs network-http-tabs" role="tablist">
      {tabs.map((tab) => <button type="button" key={tab} className={active === tab ? "is-active" : ""} onClick={() => setActive(tab)}>{tab}</button>)}
    </div>

    <header className="network-http-heading">
      <div><p className="eyebrow">BROWSER LOCAL NETWORK LAB</p><h2>{active}</h2><p>Inspect URLs, request headers, IP ranges, and DNS snippets without sending data to a server.</p></div>
      <ActionBar sample={sample} clear={clear} output={output} file="network-http-report.txt" />
    </header>

    {active === "URL Parser" ? <div className="text-tool-grid network-http-grid">
      <section className="text-tool-control-card network-http-card"><label>Raw URL<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={sampleUrl} /></label><div className="network-http-status"><Globe2 size={18} />{parsedUrl.valid ? "Valid URL" : parsedUrl.error}</div></section>
      <section className="text-tool-control-card network-http-card network-http-results"><h3>URL parts</h3><div className="network-http-fields"><Field label="Protocol" value={parsedUrl.protocol} /><Field label="Host" value={parsedUrl.hostname} /><Field label="Port" value={parsedUrl.port || "default"} /><Field label="Path" value={parsedUrl.pathname} /><Field label="Hash" value={parsedUrl.hash || "none"} /><Field label="Origin" value={parsedUrl.origin} /></div><h4>Query params</h4>{parsedUrl.query.length ? parsedUrl.query.map((item) => <Field key={item.key} label={item.key} value={item.value} />) : <p className="network-http-empty">No query parameters.</p>}</section>
    </div> : null}

    {active === "HTTP Headers" ? <div className="text-tool-grid network-http-grid">
      <section className="text-tool-control-card network-http-card"><label>Request URL<input value={headerUrl} onChange={(event) => setHeaderUrl(event.target.value)} /></label><label>Raw headers<textarea value={headers} onChange={(event) => setHeaders(event.target.value)} placeholder={sampleHeaders} /></label></section>
      <section className="text-tool-control-card network-http-card"><h3>Parsed headers</h3>{parsedHeaders.map((header) => <Field key={header.name} label={header.name} value={header.value} />)}<h4>cURL preview</h4><pre>{buildCurlFromHeaders(headerUrl, parsedHeaders)}</pre></section>
    </div> : null}

    {active === "IP Inspector" ? <div className="text-tool-grid network-http-grid">
      <section className="text-tool-control-card network-http-card"><label>IP address<input value={ip} onChange={(event) => setIp(event.target.value)} placeholder={sampleIp} /></label><label>CIDR block<input value={cidr} onChange={(event) => setCidr(event.target.value)} placeholder={sampleCidr} /></label></section>
      <section className="text-tool-control-card network-http-card"><h3>IP details</h3><div className="network-http-fields"><Field label="Version" value={ipInfo.version} /><Field label="Private" value={ipInfo.privateRange} /><Field label="Loopback" value={ipInfo.loopback} /><Field label="Multicast" value={ipInfo.multicast} /><Field label="Integer" value={ipInfo.integer} /><Field label="Binary" value={ipInfo.binary} /></div><h4>CIDR details</h4><div className="network-http-fields"><Field label="Network" value={cidrInfo.network} /><Field label="Broadcast" value={cidrInfo.broadcast} /><Field label="First host" value={cidrInfo.firstHost} /><Field label="Last host" value={cidrInfo.lastHost} /><Field label="Subnet mask" value={cidrInfo.subnetMask} /><Field label="Usable hosts" value={cidrInfo.usableHosts} /></div></section>
    </div> : null}

    {active === "DNS Toolkit" ? <div className="text-tool-grid network-http-grid">
      <section className="text-tool-control-card network-http-card"><label>Domain<input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder={sampleDomain} /></label><p className="network-http-note"><Server size={16} />Generated records are practical starter snippets, not a live DNS lookup.</p></section>
      <section className="text-tool-control-card network-http-card"><h3>DNS records</h3>{dnsInfo.records.map((record) => <Field key={`${record.type}-${record.host}`} label={record.type} value={`${record.host} -> ${record.value}`} />)}</section>
    </div> : null}

    <section className="text-tool-panel network-http-card network-http-output"><header><strong><ShieldCheck size={16} />Generated output</strong><button type="button" onClick={() => copyText(output)}><Copy size={15} />Copy</button></header><pre>{output}</pre></section>
  </section>;
}