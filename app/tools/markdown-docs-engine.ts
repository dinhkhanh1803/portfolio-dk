export type BadgeOptions = { label: string; message: string; color: string; labelColor: string; style: string; logo?: string };
export type CommitOptions = { type: string; scope: string; subject: string; body: string; issues: string; breaking: boolean };
export type ReadmeOptions = { name: string; subtitle: string; about: string; github: string; website: string; stack: string[]; twitter?: string; linkedin?: string; devto?: string; medium?: string; youtube?: string; includeStats?: boolean };

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const inline = (value: string) => escapeHtml(value)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

export function markdownToHtml(source: string) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const output: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  const flushList = () => { if (list.length) { output.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`); list = []; } };
  for (const line of lines) {
    if (line.startsWith("```")) { flushList(); if (code) { output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = null; } else code = []; continue; }
    if (code) { code.push(line); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (heading) { flushList(); const level = heading[1]!.length; output.push(`<h${level}>${inline(heading[2]!)}</h${level}>`); }
    else if (bullet) list.push(bullet[1]!);
    else if (line.startsWith("> ")) { flushList(); output.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); }
    else if (line.trim()) { flushList(); output.push(`<p>${inline(line)}</p>`); }
    else flushList();
  }
  flushList(); if (code) output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return output.join("\n");
}

export function markdownToPlainText(source: string) {
  return source.replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*\n?|```/g, ""))
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, "$1").replace(/[>#*_`]/g, "").replace(/^[-+]\s+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractMarkdownLinks(source: string) {
  return [...source.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => ({ label: match[1]!, url: match[2]! }));
}

export function formatMarkdown(source: string) {
  return source.replaceAll("\r\n", "\n").split("\n").map((line) => {
    const header = line.match(/^(#{1,6})\s*(.*?)\s*$/); if (header) return `${header[1]} ${header[2]}`.trimEnd();
    return line.replace(/^\*\s+/, "- ").replace(/[ \t]+$/g, "");
  }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const parseLine = (line: string, delimiter: string) => { const cells: string[] = []; let value = ""; let quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]!; if (char === '"' && line[i + 1] === '"') { value += '"'; i += 1; } else if (char === '"') quoted = !quoted; else if (char === delimiter && !quoted) { cells.push(value.trim()); value = ""; } else value += char; } cells.push(value.trim()); return cells; };
export function csvToMarkdown(source: string, delimiterMode: "comma" | "tab" | "semicolon" = "comma") {
  const delimiter = delimiterMode === "tab" ? "\t" : delimiterMode === "semicolon" ? ";" : ",";
  const rows = source.replaceAll("\r\n", "\n").split("\n").filter((line) => line.trim()).map((line) => parseLine(line, delimiter));
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length)); const safe = (value: string | undefined) => (value ?? "").replaceAll("|", "\\|");
  const normalize = (row: string[]) => Array.from({ length: width }, (_, index) => safe(row[index]));
  const [head, ...body] = rows.map(normalize);
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((row) => `| ${row.join(" | ")} |`)].join("\n");
}

export function makeBadge({ label, message, color, labelColor, style, logo }: BadgeOptions) {
  const path = `${encodeURIComponent(label || "label")}-${encodeURIComponent(message || "message")}-${encodeURIComponent(color || "blue")}`;
  const query = new URLSearchParams({ style: style || "flat", labelColor: labelColor || "555" }); if (logo) query.set("logo", logo);
  return `https://img.shields.io/badge/${path}?${query.toString()}`;
}

export function makeCommitMessage({ type, scope, subject, body, issues, breaking }: CommitOptions) {
  const prefix = `${type || "feat"}${scope.trim() ? `(${scope.trim()})` : ""}${breaking ? "!" : ""}: ${subject.trim()}`;
  const parts = [prefix]; if (body.trim()) parts.push(body.trim()); if (issues.trim()) parts.push(`Closes ${issues.trim().replace(/\s*,\s*/g, ", Closes ")}`); return parts.join("\n\n");
}

export function makeReadme({ name, subtitle, about, github, website, stack, twitter = "", linkedin = "", devto = "", medium = "", youtube = "", includeStats = true }: ReadmeOptions) {
  const clean = (value: string) => value.trim().replace(/^@/, "");
  const links = [
    github.trim() ? `- GitHub: [@${clean(github)}](https://github.com/${clean(github)})` : "",
    website.trim() ? `- Website: ${website.trim()}` : "",
    twitter.trim() ? `- X / Twitter: [@${clean(twitter)}](https://x.com/${clean(twitter)})` : "",
    linkedin.trim() ? `- LinkedIn: [${clean(linkedin)}](https://linkedin.com/in/${clean(linkedin)})` : "",
    devto.trim() ? `- Dev.to: [${clean(devto)}](https://dev.to/${clean(devto)})` : "",
    medium.trim() ? `- Medium: [${clean(medium)}](https://medium.com/@${clean(medium)})` : "",
    youtube.trim() ? `- YouTube: [${clean(youtube)}](https://youtube.com/@${clean(youtube)})` : "",
  ].filter(Boolean).join("\n");
  const username = clean(github);
  const stats = includeStats && username ? `\n## GitHub stats\n\n![${username}'s GitHub stats](https://github-readme-stats.vercel.app/api?username=${encodeURIComponent(username)}&show_icons=true&theme=transparent)\n\n![Top languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${encodeURIComponent(username)}&layout=compact&theme=transparent)\n` : "";
  return `# Hi, I'm ${name.trim() || "Developer"}\n\n## ${subtitle.trim() || "Building useful things"}\n\n${about.trim() || "I build thoughtful software and open-source tools."}\n\n${links ? `## Find me\n${links}\n\n` : ""}## Tech stack\n${stack.length ? stack.map((item) => `- ${item}`).join("\n") : "- TypeScript"}\n${stats}`;
}
