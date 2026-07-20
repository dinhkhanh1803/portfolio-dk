"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BriefcaseBusiness,
  Gamepad2,
  Globe2,
  Layers3,
  MapPin,
  Palette,
  Smartphone,
} from "lucide-react";
import { useLanguage } from "./language-provider";
import { portfolio } from "./portfolio-data";

type Language = "vi" | "en";

const tiles = ["#f7b84b", "#e96a5b", "#2a9dab", "#f5d98e", "#65b8b2", "#f1836f"];
const bars = [38, 56, 46, 72, 61, 86];

const heroCopy = {
  vi: {
    available: "Đang xây dựng portfolio sống",
    typingPrefix: "Tôi là ",
    typingRoles: ["Nhà phát triển Web", "Nhà phát triển App", "Nhà phát triển Game", "Lập trình viên Full-stack", "Nhà thiết kế UI/UX"],
    headlineLead: "Biến ý tưởng thành",
    headlineAccent: "sản phẩm số.",
    intro: "Tôi là Trần Đình Khánh, một lập trình viên Full-stack thích biến vấn đề thật thành web, app, game và thiết kế có thể dùng được.",
    primary: "Xem dự án",
    secondary: "Liên hệ",
  },
  en: {
    available: "Building a living portfolio",
    typingPrefix: "I am a ",
    typingRoles: ["Web Developer", "App Developer", "Game Developer", "Full-stack Developer", "UI/UX Designer"],
    headlineLead: "Ideas, shaped into",
    headlineAccent: "digital products.",
    intro: "I am Tran Dinh Khanh, a full-stack developer who likes turning real problems into usable websites, apps, games and design systems.",
    primary: "View projects",
    secondary: "Contact",
  },
} as const;

const services = {
  vi: [
    { title: "Web", description: "Website hiện đại, tối ưu trải nghiệm và hiệu suất.", href: "/projects?category=Web", icon: Globe2 },
    { title: "App", description: "Ứng dụng ổn định, dễ dùng và sẵn sàng mở rộng.", href: "/projects?category=App", icon: Smartphone },
    { title: "Game", description: "Gameplay gọn, mượt mà và có chiều sâu kỹ thuật.", href: "/projects?category=Game", icon: Gamepad2 },
    { title: "Design", description: "Giao diện rõ ràng, đồng nhất và đúng tinh thần sản phẩm.", href: "/projects?category=Design", icon: Palette },
  ],
  en: [
    { title: "Web", description: "Modern websites tuned for experience and performance.", href: "/projects?category=Web", icon: Globe2 },
    { title: "App", description: "Stable, usable apps that are ready to grow.", href: "/projects?category=App", icon: Smartphone },
    { title: "Game", description: "Compact, smooth gameplay with technical depth.", href: "/projects?category=Game", icon: Gamepad2 },
    { title: "Design", description: "Clear, consistent interfaces with product character.", href: "/projects?category=Design", icon: Palette },
  ],
} as const;

function ProductCollage() {
  return (
    <div
      className="product-collage"
      aria-label="Web, app, game and design work preview"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -5;
        event.currentTarget.style.setProperty("--tilt-x", `${y.toFixed(2)}deg`);
        event.currentTarget.style.setProperty("--tilt-y", `${x.toFixed(2)}deg`);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--tilt-x", "0deg");
        event.currentTarget.style.setProperty("--tilt-y", "0deg");
      }}
    >
      <div className="collage-brand glass-panel">
        <div className="mini-mark"><Layers3 size={25} strokeWidth={1.8} aria-hidden="true" /></div>
        <div><strong>Product Lab</strong><span>Design · Build · Launch</span></div>
      </div>

      <div className="shape shape-teal" />
      <div className="shape shape-coral" />
      <div className="shape shape-gold" />

      <div className="dashboard-card glass-panel">
        <div className="mock-topbar"><span className="mock-logo">K.</span><span>Dashboard</span><span className="mock-dots">•••</span></div>
        <div className="metric-grid">
          <div><small>Revenue</small><strong>1.246B</strong><em>+12.5%</em></div>
          <div><small>Projects</small><strong>48</strong><em>+8.1%</em></div>
          <div><small>Clients</small><strong>32</strong><em>+15.3%</em></div>
        </div>
        <div className="chart-area"><span className="chart-label">Growth overview</span><div className="bar-chart">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
      </div>

      <div className="phone-card glass-panel">
        <div className="phone-speaker" />
        <span className="eyebrow">TODAY</span>
        <strong>Good morning, Khánh!</strong>
        <p>Your focus for today</p>
        {["Design system", "Homepage build", "Client review"].map((item, index) => <div className="task-line" key={item}><span>{index + 1}</span><div><b>{item}</b><small>{index + 2} tasks</small></div></div>)}
      </div>

      <div className="game-card glass-panel">
        <div className="game-heading"><span>Ocean Quest</span><b>1,250</b></div>
        <div className="game-grid">{Array.from({ length: 20 }).map((_, index) => <i key={index} style={{ background: tiles[index % tiles.length] }} />)}</div>
        <button type="button">Level 12</button>
      </div>

      <div className="design-card glass-panel">
        <span>DESIGN SYSTEM</span>
        <strong>Aa</strong>
        <p>Sora / Manrope</p>
        <div className="swatches">{tiles.slice(0, 5).map((color) => <i key={color} style={{ background: color }} />)}</div>
        <div className="design-controls"><b>Button</b><span>Component</span></div>
      </div>
    </div>
  );
}

export default function Home() {
  const { language } = useLanguage();
  const content = portfolio[language];
  const t = heroCopy[language as Language];
  const heroServices = services[language as Language];
  const [roleIndex, setRoleIndex] = useState(0);
  const [typedRole, setTypedRole] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const activeRole = t.typingRoles[roleIndex % t.typingRoles.length];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const timer = window.setTimeout(() => setTypedRole(t.typingRoles[0]), 0);
      return () => window.clearTimeout(timer);
    }

    let delay = isDeleting ? 34 : 68;
    if (!isDeleting && typedRole === activeRole) delay = 1450;
    if (isDeleting && typedRole === "") delay = 260;

    const timer = window.setTimeout(() => {
      if (!isDeleting && typedRole === activeRole) {
        setIsDeleting(true);
        return;
      }
      if (isDeleting && typedRole === "") {
        setIsDeleting(false);
        setRoleIndex((current) => (current + 1) % t.typingRoles.length);
        return;
      }
      setTypedRole((current) => isDeleting ? current.slice(0, -1) : activeRole.slice(0, current.length + 1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeRole, isDeleting, t.typingRoles, typedRole]);

  return (
    <main className={`home-main about-main lang-${language}`} lang={language}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="hero-meta">
            <div className="availability"><span /><BriefcaseBusiness size={16} />{t.available}</div>
            <p className="hero-location"><MapPin size={16} />{content.profile.location}</p>
          </div>
          <p className="hero-role"><span className="mr-1">{t.typingPrefix}</span><strong aria-live="polite">{typedRole}</strong><i className="typing-cursor" aria-hidden="true" /></p>
          <h1><span>{t.headlineLead}</span><strong>{t.headlineAccent}</strong></h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/projects">{t.primary}<ArrowRight size={20} /></Link>
            <Link className="button button-secondary" href="/contact">{t.secondary}<ArrowDownRight size={20} /></Link>
          </div>
        </div>

        <div className="hero-visual"><ProductCollage /></div>
      </section>

      <section className="service-rail" aria-label={language === "vi" ? "Các mảng tôi phát triển" : "Areas I build"}>
        {heroServices.map((service, index) => {
          const Icon = service.icon;
          return (
            <article className={`service-card service-${index + 1}`} key={service.title}>
              <div className="service-icon"><Icon size={27} strokeWidth={1.9} aria-hidden="true" /></div>
              <div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </div>
              <Link href={service.href} aria-label={`${service.title} ${language === "vi" ? "chi tiết" : "details"}`}><ArrowRight size={22} /></Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}