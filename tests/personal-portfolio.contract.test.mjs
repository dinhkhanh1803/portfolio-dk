import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import postcss from "postcss";

test("portfolio data covers all bilingual areas", async () => {
  const { portfolio, siteNav } = await import(pathToFileURL(resolve("app/portfolio-data.ts")).href);
  assert.deepEqual(siteNav.map((item) => item.href), ["/", "/projects", "/tools", "/playground", "/blog", "/contact"]);
  assert.deepEqual(siteNav.map((item) => item.label.vi), ["Trang chủ", "Dự án", "Công cụ", "Trò chơi", "Tài liệu", "Liên hệ"]);
  for (const language of ["vi", "en"]) {
    assert.equal(portfolio[language].profile.role, "Full-stack Developer");
    assert.equal(portfolio[language].projects.length, 15);
    assert.deepEqual([...new Set(portfolio[language].projects.map((project) => project.category))], ["Web", "App", "Game", "Tool", "Design"]);
    assert.ok(portfolio[language].tools.length);
    assert.ok(portfolio[language].playground.length);
    assert.ok(portfolio[language].posts.length);
  }
});

test("home page owns the introduction hero and has no below-hero desktop sections", () => {
  const home = readFileSync(resolve("app/page.tsx"), "utf8");
  const about = readFileSync(resolve("app/about/page.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(home, /<section className="hero"/);
  assert.match(home, /ProductCollage/);
  assert.match(home, /product-collage/);
  assert.match(home, /dashboard-card/);
  assert.match(home, /onPointerMove/);
  assert.match(home, /Nhà phát triển Web/);
  assert.match(home, /Nhà phát triển App/);
  assert.match(home, /Nhà phát triển Game/);
  assert.match(home, /Lập trình viên Full-stack/);
  assert.match(home, /Nhà thiết kế UI\/UX/);
  assert.match(home, /Web Developer/);
  assert.match(home, /App Developer/);
  assert.match(home, /Game Developer/);
  assert.match(home, /Full-stack Developer/);
  assert.match(home, /UI\/UX Designer/);
  assert.doesNotMatch(home, /Người xây tool|Tool Builder|Game Experimenter|Người làm game nhỏ|typed-role/);
  assert.doesNotMatch(css, /typed-role/);
  assert.match(home, /<strong aria-live="polite">\{typedRole\}<\/strong>/);
  assert.match(home, /<section className="service-rail"/);
  assert.match(home, /<\/section>\s*<section className="service-rail"/);
  assert.match(home, /const services =/);
  assert.match(home, /heroServices\.map/);
  assert.doesNotMatch(home, /page-section|ProjectCards|ItemCards|home-hero|hero-showcase|focus-card/);
  assert.doesNotMatch(about, /ProductCollage|service-rail|page-section/);
  assert.match(css, /home-main/);
  assert.match(css, /\.home-main \.hero/);
  assert.match(css, /min-height: 620px/);
  assert.match(css, /min-height: 590px/);
  assert.match(css, /min-height: 142px/);
  assert.doesNotMatch(css, /448px|104px/);
  assert.match(css, /Home collage card polish/);
  assert.match(css, /html:not\(\[data-theme="dark"\]\) body[^}]*circle at 92% 96%[^}]*\.18/s);
  assert.match(css, /\.home-main \.game-grid[^}]*repeat\(5,minmax\(0,1fr\)\)/s);
  assert.match(css, /\.home-main \.game-card[^}]*display:block[^}]*overflow:hidden/s);
  assert.match(css, /\.home-main \.dashboard-card[^}]*box-shadow/s);
});

test("shared shell and header align with the main hero", () => {
  for (const path of ["app/site-header.tsx", "app/site-footer.tsx", "app/language-provider.tsx", "app/projects/page.tsx", "app/tools/page.tsx", "app/playground/page.tsx", "app/blog/page.tsx", "app/about/page.tsx", "app/contact/page.tsx"]) assert.ok(existsSync(resolve(path)), path);
  const header = readFileSync(resolve("app/site-header.tsx"), "utf8");
  const provider = readFileSync(resolve("app/language-provider.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(header, /site-header glass-panel/);
  assert.match(header, /"nav-links is-open" : "nav-links"/);
  assert.match(header, /className="brand-name">DK Coder/);
  assert.match(header, /aria-pressed/);
  assert.match(header, /aria-expanded/);
  assert.match(header, /Switch to dark mode/);
  assert.match(header, /localStorage/);
  assert.match(header, /document\.documentElement\.dataset\.theme/);
  assert.match(header, /href="\/"/);
  assert.doesNotMatch(header, /href="\/about"/);
  assert.doesNotMatch(header, /className="header-cta" href="\/contact"/);
  assert.match(provider, /sessionStorage/);
  assert.match(css, /\.site-header[^}]*1380px/s);
  assert.match(css, /\[data-theme="dark"\]/);
});
test("projects page provides a bilingual searchable and filterable project catalogue", () => {
  const projects = readFileSync(resolve("app/projects/page.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(projects, /useMemo/);
  assert.match(projects, /type="search"/);
  assert.match(projects, /Search/);
  assert.match(projects, /activeCategory/);
  assert.match(projects, /project-filter/);
  assert.match(projects, /filteredProjects\.map/);
  assert.match(projects, /project-empty/);
  assert.match(projects, /Không tìm thấy dự án/);
  assert.match(projects, /No projects found/);
  assert.match(css, /\.projects-page/);
  assert.doesNotMatch(projects, /projects-intro|projects-heading|projects-stats/);
  assert.doesNotMatch(css, /\.projects-intro|\.projects-heading|\.projects-stats/);
  assert.match(css, /\.project-toolbar/);
  assert.match(css, /\.project-showcase-card/);
  assert.match(css, /\.project-filter\.is-active/);
  assert.match(css, /@media \(max-width: 760px\)/);
});

test("blog route is a bilingual searchable programming knowledge hub", () => {
  const blog = readFileSync(resolve("app/blog/page.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(blog, /useMemo/);
  assert.match(blog, /type="search"/);
  assert.match(blog, /Programming documentation/);
  assert.match(blog, /foundations/);
  assert.match(blog, /algorithms/);
  assert.match(blog, /filteredDocuments/);
  assert.match(blog, /document-empty/);
  assert.match(css, /\.docs-page/);
  assert.match(css, /\.docs-search/);
  assert.match(css, /\.docs-topic-card/);
});


test("docs hub replaces the full library with recently read documents", () => {
  const hub = readFileSync(resolve("app/blog/page.tsx"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");

  assert.match(hub, /docs-recently-read/);
  assert.match(hub, /docs-recent-documents/);
  assert.doesNotMatch(hub, /docs-library/);
  assert.match(detail, /docs-recent-documents/);
  assert.match(detail, /localStorage\.setItem/);
});
test("docs article headings use the Vietnamese typeface", () => {
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");

  assert.match(styles, /:global\(\.docs-article h1\)\s*\{[^}]*font-family:\s*var\(--font-vietnamese\)/s);
  assert.match(styles, /:global\(\.docs-article h2\)\s*\{[^}]*font-family:\s*var\(--font-vietnamese\)/s);
  assert.doesNotMatch(styles, /:global\(\.docs-article h[12]\)[^}]*var\(--font-sora\)/s);
});
test("six foundation guides provide bilingual lessons, diagrams, code, and sources", () => {
  const data = readFileSync(resolve("app/docs-data.ts"), "utf8");
  const content = readFileSync(resolve("app/docs-detailed-content.ts"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");

  for (const id of ["event-loop", "web-foundations", "git-workflow", "http-basics", "html-semantic", "css-cascade"]) assert.match(data, new RegExp(`"${id}"`));
  assert.match(data, /detailedDocs/);
  assert.match(content, /sources:/);
  assert.match(content, /code:/);
  assert.match(content, /diagram:/);
  assert.match(detail, /detailedDocs/);
  assert.match(detail, /docs-lesson-code/);
  assert.match(detail, /DocsSourceFooter/);
});
test("next three foundation guides provide detailed bilingual content", () => {
  const data = readFileSync(resolve("app/docs-data.ts"), "utf8");
  const content = readFileSync(resolve("app/docs-detailed-content.ts"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");

  for (const id of ["responsive-design", "web-accessibility", "forms-validation"]) {
    assert.match(data, new RegExp(`"${id}"`));
    assert.match(content, new RegExp(`"${id}"[\\s\\S]*sections:`));
  }
  assert.match(content, /Responsive design is constraint design/);
  assert.match(content, /Keyboard first/);
  assert.match(content, /Validate twice, explain once/);
  assert.match(detail, /DocsSourceFooter/);
});

test("nine foundation guides use distinct editorial formats and research-backed blocks", async () => {
  const { detailedDocs } = await import(pathToFileURL(resolve("app/docs-data.ts")).href);
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");
  const ids = ["event-loop", "web-foundations", "git-workflow", "http-basics", "html-semantic", "css-cascade", "responsive-design", "web-accessibility", "forms-validation"];
  const formats = ids.map((id) => detailedDocs[id]?.format);

  assert.equal(new Set(formats).size, ids.length, "Each guide needs its own editorial format");
  for (const id of ids) {
    const doc = detailedDocs[id];
    assert.ok(doc?.promise?.vi && doc?.promise?.en, `${id} needs a bilingual reader promise`);
    assert.ok(doc.sources.length >= 3, `${id} needs at least three primary sources`);
    assert.ok(doc.sections.some((section) => section.items?.length), `${id} needs a scannable knowledge block`);
    assert.ok(doc.sections.some((section) => section.code || section.compare), `${id} needs code or a concrete comparison`);
  }
  assert.match(detail, /docs-article-format/);
  assert.match(detail, /docs-lesson-compare/);
  assert.match(detail, /docs-lesson-items/);
  assert.match(styles, /docs-article-format/);
  assert.match(styles, /docs-lesson-compare/);
});

test("three advanced foundation guides use a separate creative learning experience", async () => {
  const { creativeGuides } = await import(pathToFileURL(resolve("app/docs-creative-content.ts")).href);
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");
  const topic = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const component = readFileSync(resolve("app/blog/creative-foundation-guide.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");
  const ids = ["browser-rendering", "dom-events", "promises-async"];

  for (const id of ids) assert.ok(creativeGuides[id], `${id} needs a creative guide`);
  assert.equal(new Set(ids.map((id) => creativeGuides[id].mode)).size, 3);
  assert.equal(creativeGuides["browser-rendering"].mode, "frame-lab");
  assert.equal(creativeGuides["dom-events"].mode, "event-scene");
  assert.equal(creativeGuides["promises-async"].mode, "async-control-room");
  for (const id of ids) {
    const guide = creativeGuides[id];
    assert.ok(guide.sources.length >= 3, `${id} needs authoritative research sources`);
    assert.ok(guide.stations.length >= 4, `${id} needs a substantial learning journey`);
  }
  assert.match(detail, /CreativeFoundationGuide/);
  assert.match(topic, /creativeGuides/);
  assert.match(topic, /!creativeGuides\[article\.id\]/);
  assert.match(component, /creative-render-lab/);
  assert.match(component, /creative-event-scene/);
  assert.match(component, /creative-async-control-room/);
  assert.match(component, /creative-simulation/);
  assert.match(styles, /creative-guide/);
  assert.match(styles, /creative-simulation/);
});

test("JavaScript errors, modules, and npm have distinct bilingual field guides", async () => {
  const { creativeGuides } = await import(pathToFileURL(resolve("app/docs-creative-content.ts")).href);
  const data = readFileSync(resolve("app/docs-data.ts"), "utf8");
  const component = readFileSync(resolve("app/blog/creative-foundation-guide.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");
  const expectedModes = {
    "javascript-errors": "incident-desk",
    "javascript-modules": "module-graph",
    "npm-basics": "package-console",
  };

  for (const [id, mode] of Object.entries(expectedModes)) {
    const guide = creativeGuides[id];
    assert.equal(guide?.mode, mode, `${id} needs its own visual mode`);
    assert.ok(guide?.thesis.vi && guide?.thesis.en, `${id} needs a bilingual thesis`);
    assert.ok(guide?.stations.length >= 4, `${id} needs a substantial learning journey`);
    assert.ok(guide?.stations.some((station) => station.code), `${id} needs a practical code example`);
    assert.ok(guide?.sources.length >= 3, `${id} needs authoritative sources`);
  }

  assert.equal((styles.match(/creative-incident-desk/g) ?? []).length, 1, "New visual styles must not be duplicated inside media queries");
  assert.doesNotThrow(() => postcss.parse(styles), "Docs stylesheet must remain valid CSS");
  assert.match(data, /browser-rendering[^\]]*javascript-errors[^\]]*javascript-modules[^\]]*npm-basics/s);
  assert.match(component, /IncidentDesk/);
  assert.match(component, /ModuleGraph/);
  assert.match(component, /PackageConsole/);
  assert.match(styles, /creative-incident-desk/);
  assert.match(styles, /creative-module-graph/);
  assert.match(styles, /creative-package-console/);
});
test("environment, Git basics, and commit messages have distinct bilingual field guides", async () => {
  const { creativeGuides } = await import(pathToFileURL(resolve("app/docs-creative-content.ts")).href);
  const data = readFileSync(resolve("app/docs-data.ts"), "utf8");
  const component = readFileSync(resolve("app/blog/creative-foundation-guide.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");
  const expectedModes = {
    "environment-variables": "config-vault",
    "git-basics": "git-workbench",
    "commit-messages": "history-ledger",
  };

  for (const [id, mode] of Object.entries(expectedModes)) {
    const guide = creativeGuides[id];
    assert.equal(guide?.mode, mode, `${id} needs its own visual mode`);
    assert.ok(guide?.thesis.vi && guide?.thesis.en, `${id} needs a bilingual thesis`);
    assert.ok(guide?.stations.length >= 4, `${id} needs four learning stages`);
    assert.ok(guide?.stations.some((station) => station.code), `${id} needs a practical example`);
    assert.ok(guide?.sources.length >= 3, `${id} needs authoritative sources`);
  }

  assert.match(data, /npm-basics[^\]]*environment-variables[^\]]*git-basics[^\]]*commit-messages/s);
  assert.match(component, /ConfigVault/);
  assert.match(component, /GitWorkbench/);
  assert.match(component, /HistoryLedger/);
  assert.match(styles, /creative-config-vault/);
  assert.match(styles, /creative-git-workbench/);
  assert.match(styles, /creative-history-ledger/);
  assert.doesNotThrow(() => postcss.parse(styles));
});
test("pull requests, clean code, and debugging have distinct bilingual field guides", async () => {
  const { creativeGuides } = await import(pathToFileURL(resolve("app/docs-creative-content.ts")).href);
  const data = readFileSync(resolve("app/docs-data.ts"), "utf8");
  const component = readFileSync(resolve("app/blog/creative-foundation-guide.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");
  const expectedModes = {
    "pull-requests": "review-room",
    "clean-code": "change-budget",
    "debugging-basics": "debug-lab",
  };

  for (const [id, mode] of Object.entries(expectedModes)) {
    const guide = creativeGuides[id];
    assert.equal(guide?.mode, mode, `${id} needs its own visual mode`);
    assert.ok(guide?.thesis.vi && guide?.thesis.en, `${id} needs a bilingual thesis`);
    assert.ok(guide?.stations.length >= 4, `${id} needs four learning stages`);
    assert.ok(guide?.stations.some((station) => station.code), `${id} needs a practical example`);
    assert.ok(guide?.sources.length >= 3, `${id} needs authoritative sources`);
  }

  assert.match(data, /commit-messages[^\]]*pull-requests[^\]]*clean-code[^\]]*debugging-basics/s);
  assert.match(component, /ReviewRoom/);
  assert.match(component, /ChangeBudget/);
  assert.match(component, /DebugLab/);
  assert.match(styles, /creative-review-room/);
  assert.match(styles, /creative-change-budget/);
  assert.match(styles, /creative-debug-lab/);
  assert.doesNotThrow(() => postcss.parse(styles));
});
test("testing, REST APIs, and access control have distinct bilingual learning systems", async () => {
  const { creativeGuides } = await import(pathToFileURL(resolve("app/docs-creative-content.ts")).href);
  const data = readFileSync(resolve("app/docs-data.ts"), "utf8");
  const component = readFileSync(resolve("app/blog/creative-foundation-guide.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");
  const expectedModes = {
    "testing-basics": "test-pyramid-lab",
    "rest-api-basics": "api-contract-workshop",
    "authentication-basics": "access-control-matrix",
  };

  for (const [id, mode] of Object.entries(expectedModes)) {
    const guide = creativeGuides[id];
    assert.equal(guide?.mode, mode, `${id} needs its own visual mode`);
    assert.ok(guide?.thesis.vi && guide?.thesis.en, `${id} needs a bilingual thesis`);
    assert.ok(guide?.stations.length >= 4, `${id} needs four learning stages`);
    assert.ok(guide?.stations.some((station) => station.code), `${id} needs a practical example`);
    assert.ok(guide?.sources.length >= 3, `${id} needs authoritative sources`);
  }

  assert.match(data, /debugging-basics[^\]]*testing-basics[^\]]*rest-api-basics[^\]]*authentication-basics/s);
  assert.match(component, /TestPyramidLab/);
  assert.match(component, /ApiContractWorkshop/);
  assert.match(component, /AccessControlMatrix/);
  assert.match(styles, /creative-test-pyramid-lab/);
  assert.match(styles, /creative-api-contract-workshop/);
  assert.match(styles, /creative-access-control-matrix/);
  assert.doesNotThrow(() => postcss.parse(styles));
});
test("docs remove quick practice and share one synchronized source footer", () => {
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");
  const creative = readFileSync(resolve("app/blog/creative-foundation-guide.tsx"), "utf8");
  const footer = readFileSync(resolve("app/blog/docs-source-footer.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");

  assert.doesNotMatch(detail, /quickPracticeByLanguage|docs-lesson-practice|docs-lesson-sources|Quick practice|Áp dụng nhanh/);
  assert.doesNotMatch(detail, /Continue learning|Tiếp theo/);
  assert.match(detail, /<DocsSourceFooter/);
  assert.match(creative, /<DocsSourceFooter/);
  assert.match(footer, /docs-source-footer/);
  assert.match(styles, /docs-source-footer/);
  assert.doesNotMatch(styles, /docs-lesson-practice|docs-lesson-sources/);
  assert.doesNotMatch(styles, /creative-sources/);
});

test("languages docs provide compact heading and learning-discipline filters", () => {
  const topic = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");

  assert.match(topic, /useState/);
  assert.match(topic, /languageFilters/);
  for (const label of ["Frontend", "Backend", "Database", "DevOps", "Mobile", "Game"]) assert.match(topic, new RegExp(label));
  assert.match(topic, /docs-topic-filters/);
  assert.match(styles, /:global\(\.docs-topic-heading\.is-coral h1\)\s*\{[^}]*font-size:\s*clamp\(26px,\s*3vw,\s*38px\)/s);
  assert.match(styles, /:global\(\.docs-topic-filters\)/);
});
test("tools catalog covers developer workflow and AI learning hubs", async () => {
  const { docsArticles } = await import(pathToFileURL(resolve("app/docs-data.ts")).href);
  const topic = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");
  const tools = docsArticles.filter((article) => article.topic === "tools");
  const titles = tools.map((article) => article.title.en).join(" ");

  assert.ok(tools.length >= 30, `Expected at least 30 tools cards, received ${tools.length}`);
  for (const keyword of ["Git", "Docker", "GitHub Actions", "VS Code", "DevTools", "AI", "MCP"]) assert.match(titles, new RegExp(keyword));
  assert.match(topic, /topic\.id === "tools"/);
  assert.match(detail, /topic\.id === "tools"/);
});
test("algorithms catalog covers core structures, techniques, and a learning hub", async () => {
  const { docsArticles } = await import(pathToFileURL(resolve("app/docs-data.ts")).href);
  const topic = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");
  const algorithms = docsArticles.filter((article) => article.topic === "algorithms");
  const titles = algorithms.map((article) => article.title.en).join(" ");

  assert.ok(algorithms.length >= 32, `Expected at least 32 algorithm cards, received ${algorithms.length}`);
  for (const keyword of ["Big O", "Binary search", "Dynamic programming", "Graph", "Sorting", "Tree"]) assert.match(titles, new RegExp(keyword));
  assert.match(topic, /topic\.id === "algorithms"/);
  assert.match(detail, /topic\.id === "algorithms"/);
});
test("language cards open a dedicated learning and research hub", () => {
  const topic = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");

  assert.match(topic, /topic\.id === "languages"/);
  assert.match(detail, /language-learning-page/);
  assert.match(detail, /language-learning-sidebar/);
  assert.match(detail, /learning-research/);
  assert.match(detail, /learning-hub\.module\.css/);
});
test("languages catalog covers popular languages and frameworks", async () => {
  const { docsArticles } = await import(pathToFileURL(resolve("app/docs-data.ts")).href);
  const languages = docsArticles.filter((article) => article.topic === "languages");
  const titles = languages.map((article) => article.title.en).join(" ");

  assert.ok(languages.length >= 32, `Expected at least 32 language cards, received ${languages.length}`);
  for (const keyword of ["Python", "Java", "C#", "Go", "Rust", "React", "Vue", "Angular", "Next.js", "Node.js", "Laravel", "Flutter"]) assert.match(titles, new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.ok(languages.some((article) => article.status === "planned"));
});
test("docs topic heading uses compact Vietnamese typography", () => {
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");

  assert.match(styles, /:global\(\.docs-topic-heading h1\)\s*\{[^}]*font-family:\s*var\(--font-vietnamese\)[^}]*font-size:\s*clamp\(30px,\s*3\.6vw,\s*44px\)/s);
  assert.match(styles, /:global\(\.docs-topic-heading\)\s*\{[^}]*padding:\s*20px/s);
});
test("foundation catalog uses three desktop columns", () => {
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");

  assert.match(styles, /:global\(\.docs-topic-list\)\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.doesNotMatch(styles, /@media \(max-width: 1100px\)[\s\S]*:global\(\.docs-topic-list\)\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});
test("foundations catalog lists a substantial set of planned guides", async () => {
  const { docsArticles } = await import(pathToFileURL(resolve("app/docs-data.ts")).href);
  const topicPage = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const foundations = docsArticles.filter((article) => article.topic === "foundations");

  assert.ok(foundations.length >= 30, `Expected at least 30 foundation cards, received ${foundations.length}`);
  assert.ok(foundations.some((article) => article.status === "planned"));
  assert.match(topicPage, /is-coming-soon/);
  assert.match(topicPage, /Sắp bổ sung/);
});
test("docs uses Vietnamese typography and a compact hero", () => {
  const blog = readFileSync(resolve("app/blog/page.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(blog, /Tài liệu lập trình/);
  assert.doesNotMatch(blog, /docs-hero-note/);
  assert.doesNotMatch(blog, /docs-results/);
  assert.match(css, /body\{[^}]*font-family:var\(--font-vietnamese\)/);
  assert.match(css, /\.docs-hero h1\{[^}]*font-family:var\(--font-vietnamese\)/);
});
test("header uses one sliding indicator for the current navigation route", () => {
  const header = readFileSync(resolve("app/site-header.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  assert.match(header, /usePathname/);
  assert.match(header, /useLayoutEffect/);
  assert.match(header, /ResizeObserver/);
  assert.match(header, /nav-indicator/);
  assert.match(header, /aria-current/);
  assert.match(css, /\.site-header \.nav-links \{[^}]*position: relative/s);
  assert.match(css, /\.site-header \.nav-indicator/);
  assert.doesNotMatch(css, /\.site-header \.nav-links a::after/);
});

test("docs provides topic indexes and reusable detail routes", () => {
  for (const path of ["app/docs-data.ts", "app/blog/docs-pages.module.css", "app/blog/[topic]/page.tsx", "app/blog/[topic]/[documentId]/page.tsx"]) assert.ok(existsSync(resolve(path)), path);
  const hub = readFileSync(resolve("app/blog/page.tsx"), "utf8");
  const topic = readFileSync(resolve("app/blog/[topic]/page.tsx"), "utf8");
  const detail = readFileSync(resolve("app/blog/[topic]/[documentId]/page.tsx"), "utf8");
  const styles = readFileSync(resolve("app/blog/docs-pages.module.css"), "utf8");

  assert.match(hub, /docs-topic-card/);
  assert.match(topic, /notFound/);
  assert.match(topic, /docs-pages\.module\.css/);
  assert.match(topic, /docs-topic-page/);
  assert.match(detail, /docs-article/);
  assert.match(detail, /docs-pages\.module\.css/);
  assert.match(readFileSync(resolve("app/docs-data.ts"), "utf8"), /Event Loop/);
  assert.match(styles, /:global\(\.docs-topic-page\)/);
  assert.match(styles, /:global\(\.docs-article\)/);
});
