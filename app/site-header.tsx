"use client";

import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { siteNav } from "./portfolio-data";
import { useLanguage } from "./language-provider";

type Theme = "light" | "dark";

export default function SiteHeader() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("portfolio-theme") as Theme | null;
    const initialTheme = savedTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = initialTheme;
    const frame = window.requestAnimationFrame(() => setTheme(initialTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("portfolio-theme", nextTheme);
  };

  return (
    <header className="site-header glass-panel">
      <Link className="brand" href="/" aria-label="DK Coder — home">
        <span className="brand-mark">DK</span>
        <span className="brand-name">DK Coder</span>
      </Link>

      <nav className={open ? "nav-links is-open" : "nav-links"} aria-label="Main navigation">
        {siteNav.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label[language]}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <div className="language-switch" aria-label="Language">
          <button className={language === "vi" ? "active" : ""} aria-pressed={language === "vi"} onClick={() => setLanguage("vi")}>VI</button>
          <span>/</span>
          <button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
        </div>

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}