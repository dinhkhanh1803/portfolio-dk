"use client";

import "../../docs-pages.module.css";
import "../../learning-hub.module.css";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Code2, Compass, Languages, ListTree, Search, Sparkles } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { detailedDocs, docsArticles, getArticle, getTopic, type DocsArticle, type DocsLanguage } from "../../../docs-data";
import { creativeGuides } from "../../../docs-creative-content";
import CreativeFoundationGuide from "../../creative-foundation-guide";
import DocsSourceFooter from "../../docs-source-footer";
import { useLanguage } from "../../../language-provider";
import { useEffect } from "react";

function LanguageLearningHub({ article, t, topicId }: { article: DocsArticle; t: DocsLanguage; topicId: "languages" | "algorithms" | "tools" }) {
  const languages = docsArticles.filter((item) => item.topic === topicId);
  const modules = t === "vi" ? [
    ["01", "Nền tảng", "Khái niệm cốt lõi, cú pháp và mental model."],
    ["02", "Xây dựng", "Làm một tính năng nhỏ, đọc API và xử lý lỗi."],
    ["03", "Ôn tập", "Checklist, câu hỏi tự kiểm tra và ghi chú cá nhân."],
  ] : [
    ["01", "Foundations", "Core concepts, syntax, and the mental model."],
    ["02", "Build", "Ship a small feature, read APIs, and handle errors."],
    ["03", "Review", "Checklists, self-tests, and personal notes."],
  ];
  const research = t === "vi" ? ["Điều gì làm ngôn ngữ/framework này phù hợp với dự án?", "Những convention nào giúp code dễ đọc và bảo trì?", "Khi nào nên dùng công cụ này, và khi nào không?"] : ["What makes this language or framework a fit for a project?", "Which conventions keep code readable and maintainable?", "When should you use this tool, and when should you not?"];

  return <main className="language-learning-page">
    <div className="language-learning-top"><Link className="docs-back" href={`/blog/${topicId}`}><ArrowLeft size={16} /> {t === "vi" ? "Ngôn ngữ & hệ sinh thái" : "Languages & ecosystem"}</Link></div>
    <div className="language-learning-layout">
      <aside className="language-learning-sidebar"><div className="learning-sidebar-head"><BookOpen size={18} /><strong>{t === "vi" ? "Thư viện học" : "Learning library"}</strong></div><label className="learning-filter"><Search size={15} /><span>{t === "vi" ? "Lọc chủ đề" : "Filter topics"}</span></label><nav aria-label={t === "vi" ? "Các chủ đề học" : "Learning topics"}>{languages.map((item) => <Link key={item.id} className={item.id === article.id ? "is-current" : ""} href={`/blog/${topicId}/${item.id}`}>{item.title[t]}<ChevronRight size={14} /></Link>)}</nav></aside>
      <article className="language-learning-main"><header><p className="eyebrow"><Sparkles size={14} /> {t === "vi" ? "Learning hub" : "Learning hub"}</p><div className="docs-article-tags">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h1>{t === "vi" ? `Học & ôn ${article.title[t]}` : `Learn and review ${article.title[t]}`}</h1><p>{article.description[t]}</p></header><section className="learning-overview"><h2>{t === "vi" ? "Dùng trang này như thế nào?" : "How to use this page"}</h2><p>{t === "vi" ? "Bắt đầu từ nền tảng, tự tay xây một phần nhỏ, rồi quay lại checklist để ôn và research sâu hơn. Mỗi module sẽ được mở rộng thành bài học chi tiết theo thời gian." : "Start with fundamentals, build a small piece yourself, then return to the checklist to review and research more deeply. Each module will grow into detailed lessons over time."}</p></section><section><div className="learning-section-title"><ListTree size={19} /><h2>{t === "vi" ? "Lộ trình học" : "Learning path"}</h2></div><div className="learning-module-grid">{modules.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><button type="button">{t === "vi" ? "Sắp bổ sung" : "Coming soon"}</button></article>)}</div></section><section className="learning-research"><div><Compass size={22} /><h2>{t === "vi" ? "Gợi ý research" : "Research prompts"}</h2></div><ul>{research.map((question) => <li key={question}>{question}</li>)}</ul></section></article>
      <aside className="language-learning-outline"><strong>{t === "vi" ? "Trong learning hub" : "In this hub"}</strong><a href="#">{t === "vi" ? "Tổng quan" : "Overview"}</a><a href="#">{t === "vi" ? "Lộ trình học" : "Learning path"}</a><a href="#">{t === "vi" ? "Research" : "Research"}</a><div><Languages size={17} />{t === "vi" ? "Đổi ngôn ngữ giao diện ở thanh đầu trang." : "Use the header to switch interface language."}</div></aside>
    </div>
  </main>;
}

export default function DocsArticlePage() {
  const { topic: topicId, documentId } = useParams<{ topic: string; documentId: string }>();
  const topic = getTopic(topicId);
  const article = getArticle(topicId, documentId);
  const { language, setLanguage } = useLanguage();
  const t = language as DocsLanguage;
  const recentDocumentKey = topic && article ? `${topic.id}/${article.id}` : null;
  useEffect(() => {
    if (!recentDocumentKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem("docs-recent-documents") ?? "[]");
      const recentDocuments = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string" && item !== recentDocumentKey) : [];
      localStorage.setItem("docs-recent-documents", JSON.stringify([recentDocumentKey, ...recentDocuments].slice(0, 6)));
      window.dispatchEvent(new Event("docs-recent-documents"));
    } catch {
      localStorage.setItem("docs-recent-documents", JSON.stringify([recentDocumentKey]));
    }
  }, [recentDocumentKey]);
  if (!topic || !article) notFound();
  const creativeGuide = creativeGuides[article.id];
  if (creativeGuide) return <CreativeFoundationGuide guide={creativeGuide} article={article} t={t} />;
  if (topic.id === "languages" || topic.id === "algorithms" || topic.id === "tools") return <LanguageLearningHub article={article} t={t} topicId={topic.id} />;
  const detailed = detailedDocs[article.id];
  const sections = detailed?.sections ?? article.sections ?? [{ heading: { vi: "Ý chính cần nhớ", en: "Key idea" }, body: { vi: "Bài viết này đang được mở rộng. Hãy dùng phần mô tả và thẻ để định hướng việc học, rồi quay lại khi nội dung mới được cập nhật.", en: "This guide is being expanded. Use the description and tags to orient your learning, then return as new material is published." } }];
  const flow = detailed?.flow ?? article.flow;
  return <main className={`docs-article docs-article-format format-${detailed?.format ?? "standard"}`}><div className="docs-article-top"><Link className="docs-back" href={`/blog/${topic.id}`}><ArrowLeft size={16} /> {t === "vi" ? `Tài liệu ${topic.label[t]}` : `${topic.label[t]} Docs`}</Link><button type="button" className="docs-language" onClick={() => setLanguage(t === "vi" ? "en" : "vi")}><Languages size={15} /> {t === "vi" ? "English" : "Tiếng Việt"}</button></div><header><div className="docs-article-tags">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h1>{article.title[t]}</h1><p>{article.description[t]}</p>{detailed?.promise && <aside className="docs-reader-promise"><Sparkles size={16} /><span>{detailed.promise[t]}</span></aside>}</header><article>{sections.map((section) => <section key={section.heading.en}>{section.kicker && <small className="docs-lesson-kicker">{section.kicker[t]}</small>}<h2>{section.heading[t]}</h2><p>{section.body[t]}</p>{section.items && <ul className="docs-lesson-items">{section.items.map((item) => <li key={item.en}>{item[t]}</li>)}</ul>}{section.compare && <div className="docs-lesson-compare"><div><strong>{section.compare.left[t]}</strong><ul>{section.compare.leftItems.map((item) => <li key={item.en}>{item[t]}</li>)}</ul></div><div><strong>{section.compare.right[t]}</strong><ul>{section.compare.rightItems.map((item) => <li key={item.en}>{item[t]}</li>)}</ul></div></div>}{section.diagram && <div className="docs-lesson-diagram" aria-label={t === "vi" ? "Sơ đồ khái niệm" : "Concept diagram"}>{section.diagram.map((step, index) => <span key={step}><b>{index + 1}</b>{step}{index < section.diagram!.length - 1 && <ArrowRight size={15} />}</span>)}</div>}{section.code && <div className="docs-lesson-code"><header><span><Code2 size={16} /> {section.code.language}</span><small>{t === "vi" ? "Ví dụ" : "Example"}</small></header><pre><code>{section.code.value}</code></pre></div>}{section.note && <aside className="docs-lesson-note"><strong>{t === "vi" ? "Điểm cần nhớ" : "Key takeaway"}</strong><p>{section.note[t]}</p></aside>}</section>)}{flow && <section className="docs-flow-panel"><h3>{t === "vi" ? "Sơ đồ luồng xử lý" : "Processing flow"}</h3><div>{flow.map((step, index) => <span key={`${step}-${index}`}><b>{index + 1}</b>{step}{index < flow.length - 1 && <ArrowRight size={16} />}</span>)}</div></section>}{detailed && <DocsSourceFooter sources={detailed.sources} t={t} />}</article></main>;
}
