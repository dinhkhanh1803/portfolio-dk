"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Language } from "./portfolio-data";
const Context = createContext<{ language: Language; setLanguage: (next: Language) => void } | null>(null);
function initialLanguage(): Language { if (typeof window === "undefined") return "vi"; const saved = sessionStorage.getItem("portfolio-language"); return saved === "en" ? "en" : "vi"; }
export function LanguageProvider({ children }: { children: ReactNode }) { const [language, setLanguage] = useState<Language>(initialLanguage); const change = (next: Language) => { sessionStorage.setItem("portfolio-language", next); setLanguage(next); }; return <Context value={{ language, setLanguage: change }}>{children}</Context>; }
export function useLanguage() { const value = useContext(Context); if (!value) throw new Error("useLanguage must be used inside LanguageProvider"); return value; }
