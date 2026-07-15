import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Trần Đình Khánh | Freelance Developer & Digital Maker",
  description:
    "Portfolio của Trần Đình Khánh — phát triển website, ứng dụng, game và thiết kế sản phẩm số tại Đà Nẵng.",
  keywords: [
    "Trần Đình Khánh",
    "freelance developer Đà Nẵng",
    "web developer",
    "app developer",
    "game developer",
  ],
  authors: [{ name: "Trần Đình Khánh" }],
  openGraph: {
    title: "Trần Đình Khánh | Freelance Developer",
    description: "Web, app, game và trải nghiệm số được thiết kế để chạy thật.",
    type: "website",
    locale: "vi_VN",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${manrope.variable} ${sora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
