import test from "node:test";
import assert from "node:assert/strict";

import { availableGitignoreTemplates, buildCsp, buildGitignore, buildNginx, buildRobots, chmodFromOctal, octalFromPermissions } from "../app/tools/config-file-engine.ts";

test("CSP output serializes enabled directives, report-only mode and report URI", () => {
  const csp = buildCsp({ reportOnly: true, reportUri: "https://example.com/csp", directives: { "default-src": ["'self'"], "img-src": ["'self'", "data:"] } });
  assert.equal(csp.name, "Content-Security-Policy-Report-Only");
  assert.match(csp.value, /default-src 'self'/);
  assert.match(csp.value, /img-src 'self' data:/);
  assert.match(csp.value, /report-uri https:\/\/example.com\/csp/);
});

test("robots and gitignore generators create practical, deduplicated outputs", () => {
  const robots = buildRobots({ globalRules: [{ mode: "Disallow", path: "/admin" }], sitemap: "https://example.com/sitemap.xml", bots: [{ name: "GPTBot", mode: "Block All" }] });
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /User-agent: GPTBot/);
  assert.match(robots, /Sitemap: https:\/\/example.com\/sitemap.xml/);
  const gitignore = buildGitignore(["Node.js", "Next.js", "VS Code"], ".env.secret\nnode_modules/");
  assert.match(gitignore, /# — Node\.js —/);
  assert.match(gitignore, /\.next\//);
  assert.equal(gitignore.match(/node_modules\//g)?.length, 1);
});


test("gitignore templates cover common web app and game project artifacts", () => {
  const templates = availableGitignoreTemplates();
  for (const name of ["React Native / Expo", "Electron", "Unity", "Unreal Engine", "Godot", "Phaser", "Roblox Studio"]) assert.ok(templates.includes(name), `${name} template is available`);

  const output = buildGitignore(["React Native / Expo", "Unity", "Godot", "Phaser"], "");
  assert.match(output, /\.expo\//);
  assert.match(output, /\[Ll\]ibrary\//);
  assert.match(output, /\.godot\//);
  assert.match(output, /\.cache\//);
});
test("Nginx and chmod converters generate deployable configuration and permissions", () => {
  const nginx = buildNginx({ serverName: "example.com", port: 443, root: "/srv/site", index: "index.html", ssl: true, sslCertificate: "/etc/ssl/site.pem", sslKey: "/etc/ssl/site.key", gzip: true, spa: true, proxyPass: "" });
  assert.match(nginx, /listen 443 ssl;/);
  assert.match(nginx, /try_files \$uri \$uri\/ \/index.html;/);
  assert.match(nginx, /ssl_certificate \/etc\/ssl\/site.pem;/);
  assert.deepEqual(chmodFromOctal("755"), { octal: "755", symbolic: "rwxr-xr-x", special: "" });
  assert.equal(octalFromPermissions({ owner: [true, true, false], group: [true, false, true], others: [true, false, false], special: { setuid: false, setgid: false, sticky: false } }), "654");
});
