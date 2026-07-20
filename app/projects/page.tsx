"use client";
import { ProjectCards } from "../content-cards"; import { useLanguage } from "../language-provider"; import { portfolio } from "../portfolio-data";
export default function ProjectsPage() { const { language } = useLanguage(); return <main className="route-page"><p className="eyebrow">Portfolio</p><h1>{language === "vi" ? "Dự án" : "Projects"}</h1><p className="page-lead">{language === "vi" ? "Các sản phẩm tôi đã góp phần định hình và phát triển." : "Products I have helped shape and build."}</p><ProjectCards items={portfolio[language].projects} /></main>; }
