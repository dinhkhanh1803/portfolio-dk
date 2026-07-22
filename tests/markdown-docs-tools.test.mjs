import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { csvToMarkdown, extractMarkdownLinks, formatMarkdown, markdownToHtml, markdownToPlainText, makeBadge, makeCommitMessage, makeReadme } from "../app/tools/markdown-docs-engine.ts";

test("markdown lab renders safely and supports html, plaintext, links and formatting", () => {
  const source = "# Hello\n\nA **bold** [site](https://example.com).\n\n- One\n- Two\n\n<script>alert(1)</script>";
  assert.match(markdownToHtml(source), /<h1>Hello<\/h1>/);
  assert.match(markdownToHtml(source), /<strong>bold<\/strong>/);
  assert.match(markdownToHtml(source), /&lt;script&gt;/);
  assert.equal(markdownToPlainText(source).includes("Hello"), true);
  assert.deepEqual(extractMarkdownLinks(source), [{ label: "site", url: "https://example.com" }]);
  assert.equal(formatMarkdown("#  Title  \n\n* item"), "# Title\n\n- item");
});

test("csv and tsv data become escaped markdown tables", () => {
  assert.equal(csvToMarkdown("name,role\nLan,Developer"), "| name | role |\n| --- | --- |\n| Lan | Developer |");
  assert.match(csvToMarkdown("name\tstack\nLan\tTypeScript", "tab"), /\| Lan \| TypeScript \|/);
  assert.match(csvToMarkdown('name,note\nLan,"a | b"'), /a \\| b/);
});

test("documentation helpers create badges, conventional commits and a profile README", () => {
  assert.equal(makeBadge({ label: "build", message: "passing", color: "brightgreen", labelColor: "555", style: "flat", logo: "github" }), "https://img.shields.io/badge/build-passing-brightgreen?style=flat&labelColor=555&logo=github");
  assert.equal(makeCommitMessage({ type: "feat", scope: "tools", subject: "add markdown lab", body: "Browser-first", issues: "#42", breaking: false }), "feat(tools): add markdown lab\n\nBrowser-first\n\nCloses #42");
  assert.match(makeReadme({ name: "Lan", subtitle: "Developer", about: "Builds tools", github: "lan", website: "https://lan.dev", stack: ["TypeScript", "Next.js"] }), /# Hi, I\'m Lan/);
});

test("README selector uses defined contrast tokens and includes grouped full-stack options", () => {
  const workbench = readFileSync(resolve("app/tools/markdown-docs-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/tools/markdown-docs-workbench.module.css"), "utf8");
  assert.match(workbench, /Languages/);
  assert.match(workbench, /Frontend/);
  assert.match(workbench, /DevOps/);
  assert.match(workbench, /Kubernetes/);
  assert.match(css, /background:var\(--ink\)!important/);
  assert.doesNotMatch(css, /background:var\(--navy\)/);
});
test("profile README provides an interactive visual preview with social links, tech badges, and statistics", () => {
  const workbench = readFileSync(resolve("app/tools/markdown-docs-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/tools/markdown-docs-workbench.module.css"), "utf8");
  assert.match(workbench, /Rendered/);
  assert.match(workbench, /README stats/);
  assert.match(workbench, /md-readme-hero/);
  assert.match(workbench, /md-readme-socials/);
  assert.match(workbench, /md-readme-tech/);
  assert.match(css, /\.md-readme-hero/);
  assert.match(css, /\.md-readme-stats/);
  assert.match(css, /\.md-readme-preview>\.md-readme-view-tabs\)\{min-height:auto!important;padding:10px 14px!important;[^}]*\}/);
});