import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope, Sora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./language-provider";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin", "latin-ext"] });
const beVietnamPro = Be_Vietnam_Pro({ variable: "--font-vietnamese", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800", "900"] });
export const metadata: Metadata = { title: "Trần Đình Khánh | Full-stack Developer", description: "Personal portfolio of Tran Dinh Khanh, a Full-stack Developer building useful digital products.", authors: [{ name: "Trần Đình Khánh" }], icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body className={`${manrope.variable} ${sora.variable} ${beVietnamPro.variable} antialiased`}><LanguageProvider><SiteHeader />{children}<SiteFooter /></LanguageProvider></body></html>; }
