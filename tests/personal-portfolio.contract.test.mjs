import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

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
  assert.match(detail, /Event Loop/);
  assert.match(styles, /:global\(\.docs-topic-page\)/);
  assert.match(styles, /:global\(\.docs-article\)/);
});
