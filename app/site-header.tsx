"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { portfolio, siteNav } from "./portfolio-data";
import { useLanguage } from "./language-provider";
export default function SiteHeader() { const { language, setLanguage } = useLanguage(); const [open, setOpen] = useState(false); const t = portfolio[language]; return <header className="portfolio-header"><Link className="brand" href="/"><span className="brand-mark">DK</span><span>{t.profile.name}</span></Link><nav className={`site-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">{siteNav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label[language]}</Link>)}</nav><div className="header-actions"><div className="language-switch"><button aria-pressed={language === "vi"} onClick={() => setLanguage("vi")}>VI</button><span>/</span><button aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button></div><Link className="header-cta" href="/contact">{language === "vi" ? "Liên hệ" : "Contact"}</Link><button className="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>; }
