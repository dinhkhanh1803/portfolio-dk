"use client";

import { Copy, Download, RotateCcw, Share2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildFullSeoHead,
  buildJsonLd,
  buildRobotsDirectives,
  buildShareLinks,
  buildUtmUrl,
  normalizeUrl,
  scoreSeoContent,
  type SeoInput,
} from "./seo-social-engine";

type SeoTab = "meta" | "social" | "serp" | "utm" | "schema" | "share" | "robots";

const tabs: { id: SeoTab; label: string }[] = [
  { id: "meta", label: "Meta Tag Generator" },
  { id: "social", label: "Open Graph & Twitter" },
  { id: "serp", label: "SERP Preview" },
  { id: "utm", label: "UTM Builder" },
  { id: "schema", label: "Schema JSON-LD" },
  { id: "share", label: "Social Share Links" },
  { id: "robots", label: "Robots Meta" },
];

const sample: SeoInput = {
  title: "DK Tools - Practical browser utilities for modern builders",
  description: "Generate, format, inspect, and preview developer assets locally with fast browser-based tools for web apps, content, SEO, and product work.",
  url: "https://dktools.dev/tools/seo-social",
  siteName: "DK Tools",
  image: "https://dktools.dev/og/seo-tools.png",
  locale: "en_US",
  type: "website",
  canonical: "https://dktools.dev/tools/seo-social",
  robotsIndex: true,
  robotsFollow: true,
  noArchive: false,
  twitterHandle: "@dktools",
  keywords: "developer tools, seo tools, open graph, utm builder",
  author: "DK Tools",
  publishedTime: "2026-07-23T08:00:00+07:00",
  modifiedTime: "2026-07-23T08:00:00+07:00",
  schemaType: "WebSite",
  price: "49",
  currency: "USD",
  availability: "InStock",
  utmSource: "newsletter",
  utmMedium: "email",
  utmCampaign: "launch_week",
  utmTerm: "seo tools",
  utmContent: "hero_cta",
  shareText: "Try DK Tools for browser-first developer utilities",
};

const fieldMeta: (keyof SeoInput)[] = ["title", "description", "url", "siteName", "image", "canonical", "keywords", "author"];

function copyText(value: string) {
  navigator.clipboard?.writeText(value);
}

function downloadText(value: string, fileName: string) {
  const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function SeoSocialWorkbench() {
  const [active, setActive] = useState<SeoTab>("meta");
  const [form, setForm] = useState<SeoInput>(sample);
  const score = useMemo(() => scoreSeoContent(form), [form]);
  const shareLinks = useMemo(() => buildShareLinks(form), [form]);
  const utmUrl = useMemo(() => buildUtmUrl(form.url, form.utmSource, form.utmMedium, form.utmCampaign, form.utmTerm, form.utmContent), [form]);

  const output = useMemo(() => {
    if (active === "utm") return utmUrl;
    if (active === "schema") return buildJsonLd(form);
    if (active === "share") return shareLinks.map((item) => `${item.label}: ${item.url}`).join("\n");
    if (active === "robots") return `<meta name="robots" content="${buildRobotsDirectives(form)}" />`;
    return buildFullSeoHead(form);
  }, [active, form, shareLinks, utmUrl]);

  const setValue = (key: keyof SeoInput, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const Input = ({ name, label, type = "text" }: { name: keyof SeoInput; label: string; type?: string }) => (
    <label className="seo-field">
      <span>{label}</span>
      <input type={type} value={String(form[name])} onChange={(event) => setValue(name, event.target.value)} />
    </label>
  );

  function renderControls() {
    if (active === "utm") {
      return <div className="seo-input-grid">
        <Input name="url" label="Landing URL" />
        <Input name="utmSource" label="Source" />
        <Input name="utmMedium" label="Medium" />
        <Input name="utmCampaign" label="Campaign" />
        <Input name="utmTerm" label="Term" />
        <Input name="utmContent" label="Content" />
      </div>;
    }
    if (active === "schema") {
      return <div className="seo-input-grid">
        <label className="seo-field"><span>Schema type</span><select value={form.schemaType} onChange={(event) => setValue("schemaType", event.target.value as SeoInput["schemaType"])}>{["Organization", "WebSite", "Article", "Product"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <Input name="title" label="Name / headline" />
        <Input name="description" label="Description" />
        <Input name="url" label="URL" />
        <Input name="image" label="Image URL" />
        <Input name="author" label="Author" />
        <Input name="publishedTime" label="Published time" />
        <Input name="modifiedTime" label="Modified time" />
        {form.schemaType === "Product" ? <><Input name="price" label="Price" /><Input name="currency" label="Currency" /><Input name="availability" label="Availability" /></> : null}
      </div>;
    }
    if (active === "robots") {
      return <div className="seo-check-grid">
        <label><input type="checkbox" checked={form.robotsIndex} onChange={(event) => setValue("robotsIndex", event.target.checked)} /> Allow indexing</label>
        <label><input type="checkbox" checked={form.robotsFollow} onChange={(event) => setValue("robotsFollow", event.target.checked)} /> Follow links</label>
        <label><input type="checkbox" checked={form.noArchive} onChange={(event) => setValue("noArchive", event.target.checked)} /> No archive</label>
      </div>;
    }
    if (active === "share") {
      return <div className="seo-input-grid"><Input name="shareText" label="Share text" /><Input name="url" label="Share URL" /></div>;
    }
    return <div className="seo-input-grid">
      {fieldMeta.map((name) => <Input key={name} name={name} label={name.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} />)}
      <Input name="locale" label="Locale" />
      <Input name="type" label="OG type" />
      <Input name="twitterHandle" label="Twitter handle" />
      <div className="seo-check-grid">
        <label><input type="checkbox" checked={form.robotsIndex} onChange={(event) => setValue("robotsIndex", event.target.checked)} /> index</label>
        <label><input type="checkbox" checked={form.robotsFollow} onChange={(event) => setValue("robotsFollow", event.target.checked)} /> follow</label>
      </div>
    </div>;
  }

  const renderPreview = () => {
    if (active === "serp") return <div className="seo-serp-preview">
      <small>{normalizeUrl(form.url)}</small>
      <h3>{form.title || "Page title"}</h3>
      <p>{form.description || "Meta description preview appears here."}</p>
      <div className="seo-summary-grid">{score.checks.map((check) => <span className={check.pass ? "is-pass" : "is-warn"} key={check.label}>{check.pass ? "✓" : "!"} {check.label}</span>)}</div>
    </div>;
    if (active === "social") return <div className="seo-social-preview-card">
      <div className="seo-og-image">{form.image ? "OG Image" : "Add image URL"}</div>
      <div><div className="seo-card-badges"><span>Open Graph</span><span>Twitter Card</span></div><small>{form.siteName}</small><h3>{form.title}</h3><p>{form.description}</p></div>
    </div>;
    if (active === "share") return <div className="seo-share-grid">{shareLinks.map((item) => <button key={item.label} type="button" onClick={() => copyText(item.url)}><Share2 size={15} />{item.label}</button>)}</div>;
    return <pre className="seo-code-block">{output}</pre>;
  };

  return <section className="seo-social-workbench">
    <div className="data-format-tabs seo-social-tabs">{tabs.map((tab) => <button type="button" className={active === tab.id ? "is-active" : ""} onClick={() => setActive(tab.id)} key={tab.id}>{tab.label}</button>)}</div>
    <div className="seo-social-heading">
      <div><small>WEB VISIBILITY LAB</small><h1>SEO & Social Tools</h1><p>Generate production-ready metadata, social previews, UTM URLs, robots directives, and structured data locally in your browser.</p></div>
      <div className="seo-social-actions"><button type="button" onClick={() => setForm(sample)}><Sparkles size={15} /> Sample</button><button type="button" onClick={() => setForm({ ...sample, title: "", description: "", keywords: "" })}><RotateCcw size={15} /> Clear</button></div>
    </div>
    <div className="seo-social-layout">
      <section className="seo-control-card"><h2>{tabs.find((tab) => tab.id === active)?.label}</h2>{renderControls()}</section>
      <section className="seo-output-card">
        <header><div><small>{active === "utm" ? "UTM URL" : active === "schema" ? "JSON-LD" : active === "share" ? "Share URLs" : active === "serp" ? "Search preview" : "Meta tags"}</small><strong>{score.score}% SEO readiness</strong></div><div><button type="button" onClick={() => copyOutput()}><Copy size={15} /> Copy</button><button type="button" onClick={() => downloadOutput()}><Download size={15} /> Download</button></div></header>
        {renderPreview()}
      </section>
    </div>
  </section>;

  function copyOutput() {
    copyText(output);
  }

  function downloadOutput() {
    downloadText(output, active === "schema" ? "schema.json" : active === "utm" ? "utm-url.txt" : "seo-output.html");
  }
}

