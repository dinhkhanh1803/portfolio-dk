import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");

test("SEO & Social collection is routed to a dedicated workbench", () => {
  const page = read("app/tools/page.tsx");

  assert.match(page, /import SeoSocialWorkbench from "\.\/seo-social-workbench"/);
  assert.match(page, /activeCollection\.id === "seo-social" \? <SeoSocialWorkbench \/>/);
  for (const label of [
    "Meta Tag Generator",
    "Open Graph & Twitter",
    "SERP Preview",
    "UTM Builder",
    "Schema JSON-LD",
    "Social Share Links",
    "Robots Meta",
  ]) {
    assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("SEO & Social workbench exposes practical SEO controls and previews", () => {
  const workbench = read("app/tools/seo-social-workbench.tsx");

  for (const token of [
    "seo-social-workbench",
    "seo-social-tabs",
    "seo-serp-preview",
    "seo-output-card",
    "seo-summary-grid",
    "copyOutput",
    "downloadOutput",
    "renderControls",
  ]) {
    assert.match(workbench, new RegExp(token));
  }

  for (const label of ["Meta tags", "Open Graph", "Twitter Card", "Search preview", "UTM URL", "JSON-LD", "Share URLs"]) {
    assert.match(workbench, new RegExp(label));
  }
});

test("SEO engine generates meta tags, UTM links, schema, share links, and scoring", () => {
  const engine = read("app/tools/seo-social-engine.ts");

  for (const symbol of [
    "buildMetaTags",
    "buildOpenGraphTags",
    "buildTwitterCardTags",
    "buildRobotsDirectives",
    "buildUtmUrl",
    "buildJsonLd",
    "buildShareLinks",
    "scoreSeoContent",
    "normalizeUrl",
  ]) {
    assert.match(engine, new RegExp(`export function ${symbol}`));
  }

  assert.match(engine, /Organization/);
  assert.match(engine, /Product/);
  assert.match(engine, /twitter:card/);
  assert.match(engine, /utm_campaign/);
});

test("SEO & Social styling is scoped, responsive, and theme-aware", () => {
  const css = read("app/globals.css");

  for (const selector of [
    ".seo-social-workbench",
    ".seo-social-layout",
    ".seo-output-card",
    ".seo-serp-preview",
    ".seo-share-grid",
  ]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /\[data-theme="dark"\] \.seo-output-card/);
  assert.match(css, /@container[^{]+max-width: 820px/);
});
