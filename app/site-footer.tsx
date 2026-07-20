"use client";
import Link from "next/link";
import { portfolio } from "./portfolio-data";
import { useLanguage } from "./language-provider";
export default function SiteFooter() { const { language } = useLanguage(); const t = portfolio[language]; return <footer className="portfolio-footer"><span>© {new Date().getFullYear()} {t.profile.name}</span><span>{t.profile.role} · {t.profile.location}</span><Link href="/contact">{language === "vi" ? "Kết nối" : "Let’s connect"}</Link></footer>; }
