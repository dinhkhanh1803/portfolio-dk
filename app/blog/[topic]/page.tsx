"use client";

import "../docs-pages.module.css";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { docsArticles, getTopic, levelLabel, type DocsLanguage } from "../../docs-data";
import { useLanguage } from "../../language-provider";

const languageFilters = [
  { id: "all", label: { vi: "Tất cả", en: "All" }, tags: [] },
  { id: "frontend", label: { vi: "Frontend", en: "Frontend" }, tags: ["JavaScript", "TypeScript", "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "Astro", "HTML", "CSS", "Frontend", "Web"] },
  { id: "backend", label: { vi: "Backend", en: "Backend" }, tags: ["Node.js", "Node", "Python", "Java", "C#", "Go", "Rust", "PHP", "Laravel", "Django", "Spring", "Backend", "API", "GraphQL", "NestJS", "Express"] },
  { id: "database", label: { vi: "Database", en: "Database" }, tags: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Database", "ORM"] },
  { id: "devops", label: { vi: "DevOps", en: "DevOps" }, tags: ["Docker", "Kubernetes", "Cloud", "DevOps", "CI/CD", "AWS", "Deploy"] },
  { id: "mobile", label: { vi: "Mobile", en: "Mobile" }, tags: ["Flutter", "React Native", "Swift", "Kotlin", "Android", "iOS", "Mobile"] },
  { id: "game", label: { vi: "Game", en: "Game" }, tags: ["Unity", "Unreal", "Godot", "Game", "PixiJS", "WebGL"] },
] as const;

export default function DocsTopicPage() {
  const { topic: topicId } = useParams<{ topic: string }>();
  const topic = getTopic(topicId);
  const { language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<(typeof languageFilters)[number]["id"]>("all");
  const t = language as DocsLanguage;
  if (!topic) notFound();
  const articles = docsArticles.filter((article) => article.topic === topic.id);
  const filteredArticles = useMemo(() => {
    if (topic.id !== "languages" || activeFilter === "all") return articles;
    const filter = languageFilters.find((item) => item.id === activeFilter);
    return articles.filter((article) => article.tags.some((tag) => filter?.tags.includes(tag as never)));
  }, [activeFilter, articles, topic.id]);

  return <main className="docs-topic-page">
    <Link className="docs-back" href="/blog"><ArrowLeft size={16} /> {t === "vi" ? "Quay lại Tài liệu" : "Back to Docs"}</Link>
    <section className={`docs-topic-heading is-${topic.accent}`}><span><BookOpen size={25} /></span><div><p className="eyebrow">{t === "vi" ? "Nhóm tài liệu" : "Documentation topic"}</p><h1>{topic.label[t]}</h1><p>{topic.description[t]}</p></div></section>
    {topic.id === "languages" && <nav className="docs-topic-filters" aria-label={t === "vi" ? "Lọc tài liệu theo chuyên môn" : "Filter documentation by discipline"}>{languageFilters.map((filter) => <button key={filter.id} type="button" className={activeFilter === filter.id ? "is-active" : ""} aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)}>{filter.label[t]}</button>)}</nav>}
    <section className="docs-topic-list">
      {filteredArticles.map((article) => {
        const isPlanned = article.status === "planned" || !article.sections;
        const opensLearningHub = topic.id === "languages" || topic.id === "algorithms" || topic.id === "tools";
        const content = <><div><span>{isPlanned ? (t === "vi" ? "Sắp bổ sung" : "Coming soon") : levelLabel[article.level][t]}</span>{isPlanned ? <Clock3 size={17} /> : <ArrowRight size={17} />}</div><h2>{article.title[t]}</h2><p>{article.description[t]}</p><ul>{article.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul><strong>{opensLearningHub ? (t === "vi" ? "Mở learning hub" : "Open learning hub") : isPlanned ? (t === "vi" ? "Đang biên soạn" : "In progress") : <>{t === "vi" ? "Đọc tài liệu" : "Read guide"} <ArrowRight size={15} /></>}</strong></>;
        return isPlanned && !opensLearningHub ? <article key={article.id} className="docs-topic-resource is-coming-soon">{content}</article> : <Link key={article.id} className="docs-topic-resource" href={`/blog/${topic.id}/${article.id}`}>{content}</Link>;
      })}
    </section>
  </main>;
}