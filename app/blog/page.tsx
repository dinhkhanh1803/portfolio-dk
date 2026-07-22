"use client";

import "./docs-hub.module.css";

import Link from "next/link";
import { BookOpen, BrainCircuit, Code2, Cpu, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { docsArticles, docsTopics, levelLabel, type DocsLanguage, type DocsTopicId } from "../docs-data";
import { useLanguage } from "../language-provider";

const icons = { foundations: BookOpen, languages: Code2, algorithms: BrainCircuit, tools: Cpu };
const RECENT_DOCUMENTS_KEY = "docs-recent-documents";

export default function BlogPage() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<DocsTopicId | "all">("all");
  const [recentDocumentIds, setRecentDocumentIds] = useState<string[]>([]);
  const t = language as DocsLanguage;

  useEffect(() => {
    const readRecentDocuments = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(RECENT_DOCUMENTS_KEY) ?? "[]");
        setRecentDocumentIds(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : []);
      } catch {
        setRecentDocumentIds([]);
      }
    };
    readRecentDocuments();
    window.addEventListener(RECENT_DOCUMENTS_KEY, readRecentDocuments);
    return () => window.removeEventListener(RECENT_DOCUMENTS_KEY, readRecentDocuments);
  }, []);

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return docsArticles.filter((document) => (activeTopic === "all" || document.topic === activeTopic) && (!needle || [document.title[t], document.description[t], ...document.tags].join(" ").toLocaleLowerCase().includes(needle)));
  }, [activeTopic, query, t]);
  const recentDocuments = useMemo(() => recentDocumentIds.map((id) => docsArticles.find((document) => `${document.topic}/${document.id}` === id)).filter((document): document is (typeof docsArticles)[number] => Boolean(document)), [recentDocumentIds]);
  const displayedDocuments = query || activeTopic !== "all" ? filteredDocuments : recentDocuments;
  const resetFilters = () => { setQuery(""); setActiveTopic("all"); };
  const isSearching = Boolean(query || activeTopic !== "all");

  return <main className="docs-page">
    <section className="docs-hero"><div><p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> DK Coder · Knowledge base</p><h1>{t === "vi" ? "Tài liệu lập trình" : "Programming documentation"}</h1><p>{t === "vi" ? "Học nhanh, tra cứu rõ ràng và áp dụng vào sản phẩm." : "Learn quickly, find clear references, and apply them to real products."}</p></div></section>
    <section className="docs-explorer"><label className="docs-search"><Search size={20} aria-hidden="true" /><span className="sr-only">Search documentation</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t === "vi" ? "Tìm khái niệm, công cụ, ngôn ngữ..." : "Search concepts, tools, languages..."} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={17} /></button>}</label></section>
    <section className="docs-topic-grid">{docsTopics.map((topic) => { const Icon = icons[topic.id]; const count = docsArticles.filter((article) => article.topic === topic.id).length; return <Link key={topic.id} href={`/blog/${topic.id}`} className={`docs-topic-card is-${topic.accent} ${activeTopic === topic.id ? "is-active" : ""}`} onClick={() => setActiveTopic(topic.id)}><span><Icon size={22} aria-hidden="true" /></span><div><b>{topic.label[t]}</b><p>{topic.description[t]}</p></div><em>{count}</em></Link>; })}</section>
    <section className="docs-recently-read"><div className="docs-recently-read-head"><p className="eyebrow">{isSearching ? (t === "vi" ? "Kết quả tìm kiếm" : "Search results") : (t === "vi" ? "Đã đọc gần đây" : "Recently read")}</p>{isSearching && <button type="button" onClick={resetFilters}>{t === "vi" ? "Xóa bộ lọc" : "Clear filters"}</button>}</div>{displayedDocuments.length ? <div className="docs-resource-grid">{displayedDocuments.map((document) => <Link className="docs-resource" key={document.id} href={`/blog/${document.topic}/${document.id}`}><div><span>{docsTopics.find((topic) => topic.id === document.topic)?.label[t]}</span><small>{levelLabel[document.level][t]}</small></div><h2>{document.title[t]}</h2><p>{document.description[t]}</p><ul>{document.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul><strong>{t === "vi" ? "Đọc lại tài liệu" : "Read again"} →</strong></Link>)}</div> : <div className="document-empty"><BookOpen size={28} /><h2>{isSearching ? (t === "vi" ? "Chưa tìm thấy tài liệu phù hợp" : "No matching documentation yet") : (t === "vi" ? "Chưa có tài liệu đã đọc" : "No recently read documents")}</h2><p>{isSearching ? (t === "vi" ? "Thử một từ khóa khác hoặc xem lại thư viện theo từng chủ đề." : "Try another keyword or explore a topic library.") : (t === "vi" ? "Mở một tài liệu bất kỳ, những tài liệu bạn đọc sẽ xuất hiện ở đây." : "Open any guide and it will appear here for quick return visits.")}</p>{isSearching && <button type="button" onClick={resetFilters}>{t === "vi" ? "Xóa bộ lọc" : "Clear filters"}</button>}</div>}</section>
  </main>;
}