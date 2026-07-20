"use client";
import { ItemCards } from "../content-cards"; import { useLanguage } from "../language-provider"; import { portfolio } from "../portfolio-data";
export default function ToolsPage() { const { language } = useLanguage(); return <main className="route-page"><p className="eyebrow">Utilities</p><h1>{language === "vi" ? "Công cụ" : "Tools"}</h1><p className="page-lead">{language === "vi" ? "Những tiện ích nhỏ giải quyết các vấn đề cụ thể." : "Small utilities for specific, useful problems."}</p><ItemCards items={portfolio[language].tools} /></main>; }
