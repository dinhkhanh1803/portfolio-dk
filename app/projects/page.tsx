"use client";

import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useLanguage } from "../language-provider";
import { portfolio } from "../portfolio-data";

const ALL = "all";
const subscribeToLocation = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
const categoryFromLocation = () => new URLSearchParams(window.location.search).get("category") ?? ALL;

const copy = {
  vi: {
    eyebrow: "Portfolio · Dự án",
    titleStart: "Những sản phẩm",
    titleAccent: "đã được xây dựng",
    lead: "Từ ý tưởng đến sản phẩm chạy thật — mỗi dự án là một bài toán về kỹ thuật, trải nghiệm và giá trị sử dụng.",
    projects: "Dự án",
    technologies: "Công nghệ",
    search: "Tìm theo tên, công nghệ, vai trò...",
    filterLabel: "Lọc dự án theo lĩnh vực",
    all: "Tất cả",
    results: "dự án",
    role: "Vai trò",
    result: "Kết quả",
    comingSoon: "Case study sắp ra mắt",
    explore: "Xem dự án",
    emptyTitle: "Không tìm thấy dự án",
    emptyText: "Thử một từ khóa khác hoặc chọn lại tất cả lĩnh vực.",
    clear: "Xóa bộ lọc",
  },
  en: {
    eyebrow: "Portfolio · Projects",
    titleStart: "Products that",
    titleAccent: "made it into the world",
    lead: "From early ideas to working products — every project is a balance of engineering, experience and practical value.",
    projects: "Projects",
    technologies: "Technologies",
    search: "Search by name, technology, role...",
    filterLabel: "Filter projects by field",
    all: "All",
    results: "projects",
    role: "Role",
    result: "Outcome",
    comingSoon: "Case study coming soon",
    explore: "View project",
    emptyTitle: "No projects found",
    emptyText: "Try another keyword or reset the field filter.",
    clear: "Clear filters",
  },
} as const;

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function ProjectsPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const projects = portfolio[language].projects;
  const [query, setQuery] = useState("");
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const categories = useMemo(() => [ALL, ...Array.from(new Set(projects.map((project) => project.category)))], [projects]);

  const requestedCategory = useSyncExternalStore(subscribeToLocation, categoryFromLocation, () => ALL);
  const activeCategory = categoryOverride ?? (categories.includes(requestedCategory) ? requestedCategory : ALL);

  const filteredProjects = useMemo(() => {
    const needle = normalize(query.trim());
    return projects.filter((project) => {
      const matchesCategory = activeCategory === ALL || project.category === activeCategory;
      const searchable = [project.title, project.description, project.role, project.outcome, ...project.tags].join(" ");
      return matchesCategory && (!needle || normalize(searchable).includes(needle));
    });
  }, [activeCategory, projects, query]);

  const clearFilters = () => {
    setQuery("");
    setCategoryOverride(ALL);
  };

  return (
    <main className="projects-page">

      <section className="project-catalogue" aria-label={t.filterLabel}>
        <div className="project-toolbar glass-panel">
          <label className="project-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">{t.search}</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
          </label>
          <div className="project-filters" role="group" aria-label={t.filterLabel}>
            <SlidersHorizontal size={17} aria-hidden="true" />
            {categories.map((category) => (
              <button
                key={category}
                className={`project-filter ${activeCategory === category ? "is-active" : ""}`}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setCategoryOverride(category)}
              >
                {category === ALL ? t.all : category}
              </button>
            ))}
          </div>
        </div>

        <div className="project-results-meta" aria-live="polite">
          <span>{String(filteredProjects.length).padStart(2, "0")} {t.results}</span>
          <i />
        </div>

        {filteredProjects.length ? (
          <div className="project-showcase-grid">
            {filteredProjects.map((project, index) => (
              <article className="project-showcase-card" key={project.id}>
                <div className="project-card-visual" aria-hidden="true">
                  <span>{String(projects.indexOf(project) + 1).padStart(2, "0")}</span>
                  <div className="project-visual-window">
                    <i /><i /><i />
                    <strong>{project.category}</strong>
                    <b>{project.title.slice(0, 2).toUpperCase()}</b>
                  </div>
                </div>
                <div className="project-card-content">
                  <div className="project-card-topline">
                    <p>{project.category}</p>
                    <span>{String(index + 1).padStart(2, "0")} / {String(filteredProjects.length).padStart(2, "0")}</span>
                  </div>
                  <h2>{project.title}</h2>
                  <p className="project-description">{project.description}</p>
                  <dl className="project-details">
                    <div><dt>{t.role}</dt><dd>{project.role}</dd></div>
                    <div><dt>{t.result}</dt><dd>{project.outcome}</dd></div>
                  </dl>
                  <div className="project-card-footer">
                    <ul aria-label="Technologies">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                    {project.status === "live" ? (
                      <Link href={project.href}>{t.explore}<ArrowUpRight size={17} /></Link>
                    ) : (
                      <span className="project-coming-soon">{t.comingSoon}</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="project-empty">
            <Search size={26} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <button type="button" onClick={clearFilters}>{t.clear}</button>
          </div>
        )}
      </section>
    </main>
  );
}