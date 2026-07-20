import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

test("portfolio data covers all bilingual areas", async () => {
  const { portfolio, siteNav } = await import(pathToFileURL(resolve("app/portfolio-data.ts")).href);
  assert.deepEqual(siteNav.map((item) => item.href), ["/", "/projects", "/tools", "/playground", "/blog", "/contact"]);
  assert.deepEqual(siteNav.map((item) => item.label.vi), ["Trang chủ", "Dự án", "Công cụ", "Trò chơi", "Bài viết", "Liên hệ"]);
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