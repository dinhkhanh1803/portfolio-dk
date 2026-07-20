"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Code2,
  Database,
  Gamepad2,
  Globe2,
  Layers3,
  MapPin,
  Menu,
  Palette,
  Quote,
  Rocket,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Wrench,
  X,
} from "lucide-react";
import ContactSection from "./contact-section";
import {
  PROJECT_FILTERS,
  filterProjects,
  type ProjectFilter,
} from "./project-filter";

type Language = "vi" | "en";

const copy = {
  vi: {
    nav: ["Giới thiệu", "Dịch vụ", "Dự án", "Đánh giá", "Liên hệ"],
    available: "Sẵn sàng nhận dự án freelance",
    role: "Freelance Developer • Web • App • Game",
    typingPrefix: "Tôi là ",
    typingRoles: [
      "Nhà phát triển Web",
      "Nhà phát triển App",
      "Nhà phát triển Game",
      "Lập trình viên Full-stack",
      "Nhà thiết kế UI/UX",
    ],
    headlineLead: "Biến ý tưởng thành",
    headlineAccent: "sản phẩm số.",
    intro:
      "Thiết kế và phát triển web, app, game — từ ý tưởng đến sản phẩm chạy thật.",
    primary: "Bắt đầu dự án",
    secondary: "Xem sản phẩm",
    location: "Đà Nẵng, Việt Nam",
    contact: "Trao đổi dự án",
    menu: "Mở menu",
    workLabel: "Dự án tiêu biểu",
    workTitle: "Một nền tảng kỹ thuật, nhiều loại sản phẩm.",
    workIntro:
      "Từ website thương mại điện tử đến ứng dụng và game, mỗi sản phẩm đều được tiếp cận bằng tư duy giải quyết vấn đề và khả năng mở rộng lâu dài.",
    caseStatus: "Case study đang cập nhật",
    projects: [
      {
        category: "E-commerce Platform",
        filter: "web",
        title: "Heritage Ginseng",
        text: "Hệ thống bán hàng đa vai trò với CMS, quản lý sản phẩm, mã giảm giá, bài viết và dashboard vận hành.",
        tags: ["Next.js", "NestJS", "PostgreSQL"],
      },
      {
        category: "Marketplace",
        filter: "web",
        title: "Electronics Commerce",
        text: "Nền tảng thương mại điện tử cho khách hàng, người bán và quản trị viên, tích hợp thanh toán và OAuth.",
        tags: ["React", "Express", "MongoDB"],
      },
      {
        category: "Game Development",
        filter: "game",
        title: "Ocean Quest",
        text: "Trải nghiệm puzzle casual với hệ thống level, gameplay mượt và bộ khung có thể mở rộng cho nhiều nội dung.",
        tags: ["Unity", "C#", "Game Design"],
      },
      {
        category: "Mobile & Dashboard",
        filter: "mobile",
        title: "Booking Platform",
        text: "Ứng dụng đặt lịch cho khách hàng, đối tác và quản trị viên với luồng nghiệp vụ rõ ràng trên nhiều nền tảng.",
        tags: ["React Native", "Next.js", "Prisma"],
      },
    ],
    processLabel: "Cách tôi làm việc",
    processTitle: "Rõ ràng từ ý tưởng đến bàn giao.",
    processIntro:
      "Quy trình gọn, minh bạch và có điểm kiểm tra ở từng giai đoạn để dự án luôn đi đúng mục tiêu.",
    process: [
      { no: "01", title: "Khám phá", text: "Làm rõ mục tiêu, người dùng, phạm vi và tiêu chí thành công." },
      { no: "02", title: "Thiết kế", text: "Xây luồng trải nghiệm, cấu trúc và giao diện để duyệt sớm." },
      { no: "03", title: "Phát triển", text: "Code theo từng mốc, kiểm thử liên tục và cập nhật tiến độ rõ ràng." },
      { no: "04", title: "Bàn giao", text: "Tối ưu, triển khai, hướng dẫn sử dụng và hỗ trợ sau dự án." },
    ],
    profileLabel: "Năng lực",
    profileTitle: "Một người đồng hành xuyên suốt sản phẩm.",
    profileIntro:
      "Tôi làm việc ở giao điểm của kỹ thuật, trải nghiệm người dùng và tư duy sản phẩm. Điều này giúp giảm khoảng cách giữa ý tưởng, thiết kế và sản phẩm chạy thật.",
    profileAvailability: "Sẵn sàng cho dự án freelance và cơ hội nghề nghiệp phù hợp.",
    skillGroups: [
      { title: "Web Frontend", items: "React, Next.js, TypeScript, Tailwind CSS" },
      { title: "Backend & Data", items: "NestJS, Node.js, PostgreSQL, MongoDB, Firebase" },
      { title: "App & Game", items: "React Native, Unity, Cocos Creator, PixiJS" },
      { title: "Workflow", items: "Git, REST API, UI/UX, Testing, Deployment" },
    ],
    reviewsLabel: "Đánh giá khách hàng",
    reviewsTitle: "Uy tín được xây từ trải nghiệm hợp tác.",
    reviewsIntro:
      "Khu vực này đã sẵn sàng để bổ sung phản hồi thật sau khi được khách hàng cho phép công khai.",
    pendingReview: "Đang chờ nội dung đánh giá đã xác nhận",
    pendingName: "Tên khách hàng / doanh nghiệp",
    verifiedLabel: "Vị trí dành cho đánh giá đã xác minh",
    contactLabel: "Bắt đầu một dự án",
    contactTitle: "Bạn có ý tưởng? Hãy cùng biến nó thành sản phẩm.",
    contactIntro:
      "Gửi cho tôi mục tiêu, thời gian dự kiến và những gì bạn đang có. Tôi sẽ phản hồi với hướng triển khai phù hợp.",
    emailLabel: "Email",
    phoneLabel: "Điện thoại / Zalo",
    facebookLabel: "Facebook",
    sendEmail: "Gửi email trao đổi",
    footer: "Thiết kế và phát triển bởi Trần Đình Khánh.",
    locationLabel: "Địa điểm",
    backToTop: "Về đầu trang",
    services: [
      {
        title: "Web",
        text: "Website hiện đại, tối ưu trải nghiệm và hiệu suất.",
      },
      {
        title: "App",
        text: "Ứng dụng ổn định, dễ dùng và sẵn sàng mở rộng.",
      },
      {
        title: "Game",
        text: "Gameplay hấp dẫn, mượt mà và có chiều sâu kỹ thuật.",
      },
      {
        title: "Design",
        text: "Giao diện rõ ràng, đồng nhất và đúng tinh thần thương hiệu.",
      },
    ],
  },
  en: {
    nav: ["About", "Services", "Projects", "Reviews", "Contact"],
    available: "Available for freelance projects",
    role: "Freelance Developer • Web • App • Game",
    typingPrefix: "I am a ",
    typingRoles: [
      "Web Developer",
      "App Developer",
      "Game Developer",
      "Full-stack Developer",
      "UI/UX Designer",
    ],
    headlineLead: "Ideas, shaped into",
    headlineAccent: "digital products.",
    intro:
      "I design and build web, app and game products — from first concept to real launch.",
    primary: "Start a project",
    secondary: "View projects",
    location: "Da Nang, Vietnam",
    contact: "Discuss a project",
    menu: "Open menu",
    workLabel: "Selected projects",
    workTitle: "One technical foundation, many kinds of products.",
    workIntro:
      "From e-commerce platforms to applications and games, every product is approached with problem-solving, usability and long-term scalability in mind.",
    caseStatus: "Case study coming soon",
    projects: [
      {
        category: "E-commerce Platform",
        filter: "web",
        title: "Heritage Ginseng",
        text: "A multi-role commerce platform with CMS, product management, coupons, editorial content and an operations dashboard.",
        tags: ["Next.js", "NestJS", "PostgreSQL"],
      },
      {
        category: "Marketplace",
        filter: "web",
        title: "Electronics Commerce",
        text: "An e-commerce platform for customers, sellers and administrators with payment and OAuth integrations.",
        tags: ["React", "Express", "MongoDB"],
      },
      {
        category: "Game Development",
        filter: "game",
        title: "Ocean Quest",
        text: "A casual puzzle experience with a level system, smooth gameplay and a framework designed for ongoing content.",
        tags: ["Unity", "C#", "Game Design"],
      },
      {
        category: "Mobile & Dashboard",
        filter: "mobile",
        title: "Booking Platform",
        text: "A multi-platform booking product for customers, partners and administrators with clear operational workflows.",
        tags: ["React Native", "Next.js", "Prisma"],
      },
    ],
    processLabel: "How I work",
    processTitle: "Clear from first idea to final handoff.",
    processIntro:
      "A lean, transparent process with review points at every stage keeps the product aligned with its real goal.",
    process: [
      { no: "01", title: "Discover", text: "Clarify the goal, audience, scope and definition of success." },
      { no: "02", title: "Design", text: "Shape the user journey, structure and interface for early review." },
      { no: "03", title: "Build", text: "Develop in milestones, test continuously and communicate progress." },
      { no: "04", title: "Launch", text: "Optimize, deploy, document and support the product after handoff." },
    ],
    profileLabel: "Capabilities",
    profileTitle: "One partner across the product journey.",
    profileIntro:
      "I work at the intersection of engineering, user experience and product thinking, closing the gap between an idea, its design and a product people can actually use.",
    profileAvailability: "Open to freelance projects and the right professional opportunity.",
    skillGroups: [
      { title: "Web Frontend", items: "React, Next.js, TypeScript, Tailwind CSS" },
      { title: "Backend & Data", items: "NestJS, Node.js, PostgreSQL, MongoDB, Firebase" },
      { title: "App & Game", items: "React Native, Unity, Cocos Creator, PixiJS" },
      { title: "Workflow", items: "Git, REST API, UI/UX, Testing, Deployment" },
    ],
    reviewsLabel: "Client reviews",
    reviewsTitle: "Trust is built through the experience of working together.",
    reviewsIntro:
      "This area is ready for verified feedback once each client has approved it for public use.",
    pendingReview: "Awaiting confirmed testimonial content",
    pendingName: "Client / company name",
    verifiedLabel: "Reserved for a verified client review",
    contactLabel: "Start a project",
    contactTitle: "Have an idea? Let’s turn it into a real product.",
    contactIntro:
      "Send me your goal, preferred timeline and what you already have. I’ll respond with a practical direction for the project.",
    emailLabel: "Email",
    phoneLabel: "Phone / Zalo",
    facebookLabel: "Facebook",
    sendEmail: "Send a project email",
    footer: "Designed and developed by Trần Đình Khánh.",
    locationLabel: "Location",
    backToTop: "Back to top",
    services: [
      {
        title: "Web",
        text: "Modern websites optimized for experience and performance.",
      },
      {
        title: "App",
        text: "Reliable, intuitive applications designed to scale.",
      },
      {
        title: "Game",
        text: "Engaging gameplay backed by thoughtful engineering.",
      },
      {
        title: "Design",
        text: "Clear, consistent interfaces aligned with your brand.",
      },
    ],
  },
} as const;

const navIds = ["about", "services", "projects", "reviews", "contact"];
const serviceIcons = [Globe2, Smartphone, Gamepad2, Palette];
const projectIcons = [Layers3, Code2, Gamepad2, Smartphone];
const projectFilterLabels = {
  vi: { all: "Tất cả", web: "Web", mobile: "Mobile", game: "Game" },
  en: { all: "All", web: "Web", mobile: "Mobile", game: "Game" },
} as const;
const skillIcons = [Code2, Database, Gamepad2, Wrench];

function ProductCollage() {
  const bars = [38, 56, 46, 72, 61, 86];
  const tiles = ["#f7b84b", "#e96a5b", "#2a9dab", "#f5d98e", "#65b8b2", "#f1836f"];

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
        <div className="mini-mark">
          <Layers3 size={25} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <strong>Product Lab</strong>
          <span>Design · Build · Launch</span>
        </div>
      </div>

      <div className="shape shape-teal" />
      <div className="shape shape-coral" />
      <div className="shape shape-gold" />

      <div className="dashboard-card glass-panel">
        <div className="mock-topbar">
          <span className="mock-logo">K.</span>
          <span>Dashboard</span>
          <span className="mock-dots">•••</span>
        </div>
        <div className="metric-grid">
          <div><small>Revenue</small><strong>1.246B</strong><em>+12.5%</em></div>
          <div><small>Projects</small><strong>48</strong><em>+8.1%</em></div>
          <div><small>Clients</small><strong>32</strong><em>+15.3%</em></div>
        </div>
        <div className="chart-area">
          <span className="chart-label">Growth overview</span>
          <div className="bar-chart">
            {bars.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="phone-card glass-panel">
        <div className="phone-speaker" />
        <span className="eyebrow">TODAY</span>
        <strong>Good morning, Khánh!</strong>
        <p>Your focus for today</p>
        {["Design system", "Homepage build", "Client review"].map((item, index) => (
          <div className="task-line" key={item}>
            <span>{index + 1}</span>
            <div><b>{item}</b><small>{index + 2} tasks</small></div>
          </div>
        ))}
      </div>

      <div className="game-card glass-panel">
        <div className="game-heading"><span>Ocean Quest</span><b>1,250</b></div>
        <div className="game-grid">
          {Array.from({ length: 20 }).map((_, index) => (
            <i key={index} style={{ background: tiles[index % tiles.length] }} />
          ))}
        </div>
        <button type="button">Level 12</button>
      </div>

      <div className="design-card glass-panel">
        <span>DESIGN SYSTEM</span>
        <strong>Aa</strong>
        <p>Sora / Manrope</p>
        <div className="swatches">
          {tiles.slice(0, 5).map((color) => <i key={color} style={{ background: color }} />)}
        </div>
        <div className="design-controls"><b>Button</b><span>Component</span></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("vi");
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);
  const [typedRole, setTypedRole] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeProjectFilter, setActiveProjectFilter] = useState<ProjectFilter>("all");
  const t = copy[language];
  const activeRole = t.typingRoles[roleIndex % t.typingRoles.length];
  const visibleProjects = filterProjects(
    t.projects.map((project, visualIndex) => ({ ...project, visualIndex })),
    activeProjectFilter,
  );

  const closeMenu = () => setMenuOpen(false);
  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setRoleIndex(0);
    setTypedRole("");
    setIsDeleting(false);
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      const reducedMotionTimer = window.setTimeout(() => {
        setTypedRole(t.typingRoles[0]);
      }, 0);
      return () => window.clearTimeout(reducedMotionTimer);
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

      setTypedRole((current) =>
        isDeleting
          ? current.slice(0, -1)
          : activeRole.slice(0, current.length + 1),
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeRole, isDeleting, t.typingRoles, typedRole]);

  return (
    <main className={`lang-${language}`} lang={language}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header glass-panel">
        <a className="brand" href="#top" aria-label="Trần Đình Khánh — home">
          <span className="brand-mark">DK</span>
          <span className="brand-name">DK DEV</span>
        </a>

        <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Main navigation">
          {t.nav.map((label, index) => (
            <a key={label} href={`#${navIds[index]}`} onClick={closeMenu}>{label}</a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="language-switch" aria-label="Language">
            <button className={language === "vi" ? "active" : ""} onClick={() => changeLanguage("vi")}>VI</button>
            <span>/</span>
            <button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
          </div>
          <a className="header-cta" href="#contact">{t.contact}<ArrowDownRight size={17} /></a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={t.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy" id="about">
          <div className="hero-meta">
            <div className="availability"><span /><BriefcaseBusiness size={16} />{t.available}</div>
            <p className="hero-location"><MapPin size={16} />{t.location}</p>
          </div>
          <p className="hero-role">
            <span className="mr-1">{t.typingPrefix}</span>
            <strong aria-live="polite">{typedRole}</strong>
            <i className="typing-cursor" aria-hidden="true" />
          </p>
          <h1><span>{t.headlineLead}</span><strong>{t.headlineAccent}</strong></h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#contact">{t.primary}<ArrowRight size={20} /></a>
            <a className="button button-secondary" href="#projects">{t.secondary}<ArrowDownRight size={20} /></a>
          </div>
        </div>

        <div className="hero-visual">
          <ProductCollage />
        </div>
      </section>

      <section className="service-rail" id="services" aria-label="Services">
        {t.services.map((service, index) => {
          const Icon = serviceIcons[index];
          return (
            <article className={`service-card service-${index + 1}`} key={service.title}>
              <div className="service-icon"><Icon size={27} strokeWidth={1.8} /></div>
              <div><h2>{service.title}</h2><p>{service.text}</p></div>
              <a href="#contact" aria-label={`${service.title} service`}><ArrowRight size={19} /></a>
            </article>
          );
        })}
      </section>

      <section className="projects-section section-shell" id="projects">
        <div className="section-heading">
          <div>
            <div className="section-label"><Sparkles size={16} />{t.workLabel}</div>
            <h2>{t.workTitle}</h2>
          </div>
          <p>{t.workIntro}</p>
        </div>

        <div
          className="project-filters"
          aria-label={language === "vi" ? "Lọc dự án" : "Filter projects"}
        >
          {PROJECT_FILTERS.map((filter) => (
            <button
              className={activeProjectFilter === filter ? "is-active" : ""}
              type="button"
              aria-pressed={activeProjectFilter === filter}
              onClick={() => setActiveProjectFilter(filter)}
              key={filter}
            >
              {projectFilterLabels[language][filter]}
            </button>
          ))}
        </div>

        <div className="projects-grid">
          {visibleProjects.map((project) => {
            const Icon = projectIcons[project.visualIndex];
            return (
              <article className={`project-card project-${project.visualIndex + 1} glass-panel`} key={project.title}>
                <div className="project-visual">
                  <div className="project-orbit orbit-one" />
                  <div className="project-orbit orbit-two" />
                  <div className="project-window">
                    <div className="window-bar"><i /><i /><i /></div>
                    <Icon size={40} strokeWidth={1.45} />
                    <span>{project.category}</span>
                  </div>
                </div>
                <div className="project-content">
                  <span className="project-category">{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.text}</p>
                  <div className="project-tags">
                    {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="case-status"><BadgeCheck size={15} />{t.caseStatus}</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="process-section section-shell">
        <div className="process-intro">
          <div className="section-label"><Target size={16} />{t.processLabel}</div>
          <h2>{t.processTitle}</h2>
          <p>{t.processIntro}</p>
          <a className="text-link" href="#contact">{t.contact}<ArrowRight size={17} /></a>
        </div>
        <div className="process-grid glass-panel">
          {t.process.map((step, index) => (
            <article className="process-card" key={step.no}>
              <span>{step.no}</span>
              <div className="process-icon">{index === 0 ? <Users /> : index === 1 ? <Palette /> : index === 2 ? <Code2 /> : <Rocket />}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {index < t.process.length - 1 && <ChevronRight className="process-arrow" />}
            </article>
          ))}
        </div>
      </section>

      <section className="profile-section section-shell">
        <div className="profile-story glass-panel">
          <div className="section-label"><BadgeCheck size={16} />{t.profileLabel}</div>
          <h2>{t.profileTitle}</h2>
          <p>{t.profileIntro}</p>
          <div className="profile-ready"><Check size={17} />{t.profileAvailability}</div>
          <div className="profile-signature">
            <div className="profile-mark">DK</div>
            <div><strong>Trần Đình Khánh</strong><span>{t.role}</span></div>
          </div>
        </div>
        <div className="skills-grid">
          {t.skillGroups.map((group, index) => {
            const Icon = skillIcons[index];
            return (
              <article className="skill-card" key={group.title}>
                <div><Icon size={22} /></div>
                <h3>{group.title}</h3>
                <p>{group.items}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="reviews-section section-shell" id="reviews">
        <div className="section-heading reviews-heading">
          <div>
            <div className="section-label"><Quote size={16} />{t.reviewsLabel}</div>
            <h2>{t.reviewsTitle}</h2>
          </div>
          <p>{t.reviewsIntro}</p>
        </div>
        <div className="reviews-grid">
          {[0, 1, 2].map((index) => (
            <article className="review-card glass-panel" key={index}>
              <Quote className="quote-icon" size={29} />
              <p>“{t.pendingReview}”</p>
              <div className="review-person">
                <span>{String.fromCharCode(65 + index)}</span>
                <div><strong>{t.pendingName}</strong><small>{t.verifiedLabel}</small></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ContactSection language={language} />

      <footer className="site-footer section-shell">
        <a className="brand" href="#top"><span className="brand-mark">DK</span><span>{t.footer}</span></a>
        <p>© {new Date().getFullYear()} Trần Đình Khánh</p>
        <a href="#top">{t.backToTop} <ArrowRight size={16} /></a>
      </footer>
    </main>
  );
}
