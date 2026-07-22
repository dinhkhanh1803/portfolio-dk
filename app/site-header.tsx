"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteNav } from "./portfolio-data";
import { useLanguage } from "./language-provider";

type Theme = "light" | "dark";
type Indicator = { left: number; width: number };

export default function SiteHeader() {
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("portfolio-theme") as Theme | null;
    const initialTheme = savedTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = initialTheme;
    const frame = window.requestAnimationFrame(() => setTheme(initialTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateIndicator = () => {
      const activeLink = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      if (!activeLink) {
        setIndicator(null);
        return;
      }
      const navBox = nav.getBoundingClientRect();
      const linkBox = activeLink.getBoundingClientRect();
      setIndicator({ left: linkBox.left - navBox.left, width: linkBox.width });
    };

    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(nav);
    window.addEventListener("resize", updateIndicator);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [language, open, pathname]);

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

      <nav ref={navRef} className={open ? "nav-links is-open" : "nav-links"} aria-label="Main navigation">
        <span className="nav-indicator" aria-hidden="true" style={indicator ? { transform: `translateX(${indicator.left}px)`, width: indicator.width } : { opacity: 0 }} />
        {siteNav.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} className={isActive ? "is-active" : ""} href={item.href} onClick={() => setOpen(false)} aria-current={isActive ? "page" : undefined}>
              {item.label[language]}
            </Link>
          );
        })}
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