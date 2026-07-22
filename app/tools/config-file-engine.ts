export type CspConfig = { reportOnly: boolean; reportUri: string; directives: Record<string, string[]> };
export type RobotRule = { mode: "Allow" | "Disallow"; path: string };
export type BotRule = { name: string; mode: "Allow All" | "Block All" | "Custom"; rules?: RobotRule[] };

export function buildCsp(config: CspConfig) {
  const segments = Object.entries(config.directives)
    .filter(([, sources]) => sources.length)
    .map(([directive, sources]) => `${directive} ${[...new Set(sources.map((source) => source.trim()).filter(Boolean))].join(" ")}`);
  if (config.reportUri.trim()) segments.push(`report-uri ${config.reportUri.trim()}`);
  return { name: config.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: segments.join("; ") };
}

export function buildRobots({ globalRules, sitemap, bots }: { globalRules: RobotRule[]; sitemap: string; bots: BotRule[] }) {
  const toRules = (rules: RobotRule[]) => rules.map((rule) => `${rule.mode}: ${rule.path.trim()}`).filter((rule) => !rule.endsWith(":"));
  const lines = ["User-agent: *", ...(toRules(globalRules).length ? toRules(globalRules) : ["Allow: /"])];
  for (const bot of bots) {
    const botRules = bot.mode === "Allow All" ? ["Allow: /"] : bot.mode === "Block All" ? ["Disallow: /"] : toRules(bot.rules ?? []);
    lines.push("", `User-agent: ${bot.name.trim() || "CustomBot"}`, ...(botRules.length ? botRules : ["Allow: /"]));
  }
  if (sitemap.trim()) lines.push("", `Sitemap: ${sitemap.trim()}`);
  return lines.join("\n");
}

const templates: Record<string, string> = {
  "Node.js": "# — Node.js —\nnode_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\n.npm\n.env\n.env.*\n!.env.example",
  "Next.js": "# — Next.js —\n.next/\nout/\n.vercel\n*.tsbuildinfo\nnext-env.d.ts",
  Python: "# — Python —\n__pycache__/\n*.py[cod]\n.venv/\nvenv/\n.pytest_cache/\n.mypy_cache/\n.env",
  Rust: "# — Rust —\ntarget/\nCargo.lock",
  Go: "# — Go —\n*.exe\n*.test\ncoverage.out\n/vendor/",
  Java: "# — Java —\ntarget/\n*.class\n*.jar\n.classpath\n.project\n.settings/",
  "C/C++": "# — C/C++ —\n*.o\n*.obj\n*.exe\n*.out\nbuild/\ncmake-build-*/",
  Swift: "# — Swift —\n.build/\nDerivedData/\n*.xcodeproj/xcuserdata/",
  "Dart / Flutter": "# — Dart / Flutter —\n.dart_tool/\n.packages\nbuild/\n.flutter-plugins\n.pub-cache/",
  Ruby: "# — Ruby —\n.bundle/\n/vendor/bundle\n/log/\n/tmp/\n.env",
  PHP: "# — PHP —\nvendor/\n.env\n.phpunit.result.cache",
  "VS Code": "# — VS Code —\n.vscode/*\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/extensions.json",
  JetBrains: "# — JetBrains —\n.idea/\n*.iml",
  "Vim / Neovim": "# — Vim / Neovim —\n*.swp\n*.swo\n.Session.vim",
  macOS: "# — macOS —\n.DS_Store\n.AppleDouble\n.LSOverride",
  Windows: "# — Windows —\nThumbs.db\nDesktop.ini\n$RECYCLE.BIN/",
  Linux: "# — Linux —\n*~\n.fuse_hidden*\n.directory",
  Vite: "# — Vite —\ndist/\n*.local",
  Vue: "# — Vue —\ndist/\n.nuxt/\n.output/",
  Angular: "# — Angular —\n.angular/\ndist/\ncoverage/",
  Laravel: "# — Laravel —\n/vendor/\n.env\nstorage/*.key\npublic/storage",
  Django: "# — Django —\n*.sqlite3\n/staticfiles/\n/media/\n.env",
  "Ruby on Rails": "# — Ruby on Rails —\n/log/*\n/tmp/*\n/public/assets\n/.bundle",
  Docker: "# — Docker —\n.env\n*.log\nnode_modules/\n.git/",
  Terraform: "# — Terraform —\n.terraform/\n*.tfstate\n*.tfstate.*\n.terraform.lock.hcl",
  Ansible: "# — Ansible —\n*.retry\n.vault_pass\ninventory.local",
  "React Native / Expo": "# — React Native / Expo —\nnode_modules/\n.expo/\n.expo-shared/\n*.jks\n*.p8\n*.mobileprovision\nandroid/.gradle/\nandroid/app/build/\nios/build/\nios/Pods/",
  Electron: "# — Electron —\nnode_modules/\ndist/\nout/\nrelease/\n*.dmg\n*.exe\n*.AppImage\n*.snap",
  Tauri: "# — Tauri —\nsrc-tauri/target/\nsrc-tauri/gen/\ntarget/\n*.dmg\n*.msi\n*.AppImage",
  Unity: "# — Unity —\n[Ll]ibrary/\n[Tt]emp/\n[Oo]bj/\n[Bb]uild/\n[Bb]uilds/\n[Ll]ogs/\n[Uu]ser[Ss]ettings/\nMemoryCaptures/\n*.csproj\n*.sln",
  "Unreal Engine": "# — Unreal Engine —\nBinaries/\nBuild/\nDerivedDataCache/\nIntermediate/\nSaved/\n.vs/\n*.VC.db\n*.opensdf\n*.sdf\n*.suo",
  Godot: "# — Godot —\n.godot/\n.import/\n*.translation\n*.import\nexport.cfg\nexport_presets.cfg",
  Phaser: "# — Phaser —\nnode_modules/\ndist/\n.cache/\ncoverage/\n*.local",
  "Roblox Studio": "# — Roblox Studio —\n*.rbxl\n*.rbxlx\n*.rbxm\n*.rbxmx\nsourcemap.json\n*.lock",
};

export function availableGitignoreTemplates() { return Object.keys(templates); }
export function buildGitignore(selected: string[], custom = "") {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const name of selected) for (const line of (templates[name] ?? "").split("\n")) if (!seen.has(line)) { seen.add(line); output.push(line); }
  for (const line of custom.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)) if (!seen.has(line)) { seen.add(line); output.push(line); }
  return output.join("\n");
}

export type NginxConfig = { serverName: string; port: number; root: string; index: string; ssl: boolean; sslCertificate: string; sslKey: string; gzip: boolean; spa: boolean; proxyPass: string; cacheStatic?: boolean; securityHeaders?: boolean };
export function buildNginx(config: NginxConfig) {
  const listen = config.ssl ? `listen ${config.port || 443} ssl;` : `listen ${config.port || 80};`;
  const lines = ["server {", `  ${listen}`, `  server_name ${config.serverName.trim() || "example.com"};`, "", `  root ${config.root.trim() || "/var/www/html"};`, `  index ${config.index.trim() || "index.html"};`];
  if (config.ssl) lines.push("", `  ssl_certificate ${config.sslCertificate.trim() || "/etc/ssl/cert.pem"};`, `  ssl_certificate_key ${config.sslKey.trim() || "/etc/ssl/key.pem"};`);
  if (config.gzip) lines.push("", "  gzip on;", "  gzip_vary on;", "  gzip_min_length 1024;", "  gzip_types text/plain text/css application/json application/javascript image/svg+xml;");
  if (config.securityHeaders) lines.push("", '  add_header X-Frame-Options "SAMEORIGIN" always;', '  add_header X-Content-Type-Options "nosniff" always;', '  add_header Referrer-Policy "strict-origin-when-cross-origin" always;');
  lines.push("", "  location / {");
  if (config.proxyPass.trim()) lines.push(`    proxy_pass ${config.proxyPass.trim()};`, "    proxy_set_header Host $host;", "    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;");
  else lines.push(config.spa ? "    try_files $uri $uri/ /index.html;" : "    try_files $uri $uri/ =404;");
  lines.push("  }");
  if (config.cacheStatic) lines.push("", "  location ~* \\.(?:css|js|jpg|jpeg|gif|png|svg|ico|woff2?)$ {", "    expires 30d;", "    add_header Cache-Control \"public, immutable\";", "  }");
  lines.push("}"); return lines.join("\n");
}

export type PermissionMatrix = { owner: boolean[]; group: boolean[]; others: boolean[]; special: { setuid: boolean; setgid: boolean; sticky: boolean } };
const groupSymbol = (flags: boolean[]) => `${flags[0] ? "r" : "-"}${flags[1] ? "w" : "-"}${flags[2] ? "x" : "-"}`;
export function octalFromPermissions(value: PermissionMatrix) {
  const digit = (flags: boolean[]) => flags.reduce((total, enabled, index) => total + (enabled ? [4, 2, 1][index]! : 0), 0);
  const special = (value.special.setuid ? 4 : 0) + (value.special.setgid ? 2 : 0) + (value.special.sticky ? 1 : 0);
  return `${special || ""}${digit(value.owner)}${digit(value.group)}${digit(value.others)}`;
}
export function chmodFromOctal(input: string) {
  const digits = input.trim().replace(/^0/, ""); if (!/^[0-7]{3,4}$/.test(digits)) throw new Error("Use a 3- or 4-digit octal value from 000 to 7777.");
  const list = digits.padStart(4, "0").split("").map(Number); const special = list[0]!; const toFlags = (digit: number) => [Boolean(digit & 4), Boolean(digit & 2), Boolean(digit & 1)];
  let symbolic = `${groupSymbol(toFlags(list[1]!))}${groupSymbol(toFlags(list[2]!))}${groupSymbol(toFlags(list[3]!))}`;
  if (special & 4) symbolic = `${symbolic.slice(0, 2)}${symbolic[2] === "x" ? "s" : "S"}${symbolic.slice(3)}`;
  if (special & 2) symbolic = `${symbolic.slice(0, 5)}${symbolic[5] === "x" ? "s" : "S"}${symbolic.slice(6)}`;
  if (special & 1) symbolic = `${symbolic.slice(0, 8)}${symbolic[8] === "x" ? "t" : "T"}`;
  return { octal: digits.length === 4 ? digits : digits.slice(-3), symbolic, special: special ? String(special) : "" };
}
