"use client";

import {
  BriefcaseBusiness,
  Download,
  Facebook,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { useLanguage } from "../language-provider";
import { portfolio } from "../portfolio-data";

type TimelineItem = {
  period: string;
  role: string;
  company: string;
  detail: string;
};

const copy = {
  vi: {
    eyebrow: "Hồ sơ & Liên hệ",
    available: "Sẵn sàng cho cơ hội phù hợp",
    about: "Giới thiệu",
    skills: "Kỹ năng nổi bật",
    experienceTitle: "Kinh nghiệm",
    educationTitle: "Học vấn",
    cvSoon: "CV đang cập nhật",
    contactCta: "Liên hệ ngay",
    connectEyebrow: "Bắt đầu một cuộc trò chuyện",
    connectTitle: "Hãy cùng tạo nên điều gì đó hữu ích.",
    connectLead:
      "Bạn có một ý tưởng, một sản phẩm cần hoàn thiện hoặc đơn giản muốn trao đổi? Hãy gửi cho tôi vài dòng.",
    email: "Email",
    phone: "Điện thoại / Zalo",
    facebook: "Facebook",
    location: "Địa điểm",
    formTitle: "Thông tin dự án",
    formLead: "Mô tả ngắn nhu cầu của bạn. Form này hiện là bản giao diện và chưa gửi dữ liệu.",
    fullName: "Họ và tên",
    fullNamePlaceholder: "Nguyễn Văn A",
    emailPlaceholder: "hello@example.com",
    phonePlaceholder: "Số điện thoại hoặc Zalo",
    projectType: "Loại dự án",
    projectPlaceholder: "Chọn loại dự án",
    projectOptions: ["Website", "Ứng dụng", "Game", "UI/UX", "Khác"],
    budget: "Ngân sách dự kiến",
    budgetPlaceholder: "Chọn khoảng ngân sách",
    budgetOptions: ["Dưới 10 triệu", "10 — 30 triệu", "30 — 60 triệu", "Trên 60 triệu"],
    message: "Nội dung cần trao đổi",
    messagePlaceholder: "Mục tiêu, phạm vi và thời gian bạn mong muốn…",
    formCta: "Gửi yêu cầu",
    formNote: "Chức năng gửi sẽ được kết nối ở phiên bản sau.",
    experience: [
      {
        period: "2024 — Hiện tại",
        role: "Full-stack Developer",
        company: "Dự án cá nhân & freelance",
        detail:
          "Xây dựng sản phẩm web, ứng dụng và công cụ số từ ý tưởng đến trải nghiệm hoàn chỉnh.",
      },
      {
        period: "2022 — 2024",
        role: "Frontend Developer",
        company: "Sản phẩm web",
        detail:
          "Phát triển giao diện responsive, component tái sử dụng và tối ưu trải nghiệm người dùng.",
      },
    ],
    education: [
      {
        period: "2020 — 2024",
        role: "Công nghệ thông tin",
        company: "Học tập & nghiên cứu",
        detail:
          "Nền tảng lập trình, cơ sở dữ liệu, kiến trúc phần mềm và phát triển sản phẩm.",
      },
    ],
  },
  en: {
    eyebrow: "Profile & Contact",
    available: "Open to the right opportunities",
    about: "Profile",
    skills: "Core skills",
    experienceTitle: "Experience",
    educationTitle: "Education",
    cvSoon: "CV being updated",
    contactCta: "Contact me",
    connectEyebrow: "Start a conversation",
    connectTitle: "Let’s build something useful together.",
    connectLead:
      "Have an idea, a product that needs polishing, or simply want to talk? Send me a few details.",
    email: "Email",
    phone: "Phone / Zalo",
    facebook: "Facebook",
    location: "Location",
    formTitle: "Project details",
    formLead: "Share a short brief. This form is currently UI-only and does not send data.",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    emailPlaceholder: "hello@example.com",
    phonePlaceholder: "Phone number or Zalo",
    projectType: "Project type",
    projectPlaceholder: "Choose a project type",
    projectOptions: ["Website", "Application", "Game", "UI/UX", "Other"],
    budget: "Estimated budget",
    budgetPlaceholder: "Choose a budget range",
    budgetOptions: ["Under $400", "$400 — $1,200", "$1,200 — $2,400", "Over $2,400"],
    message: "What would you like to discuss?",
    messagePlaceholder: "Your goals, scope and preferred timeline…",
    formCta: "Send request",
    formNote: "Sending will be connected in a future version.",
    experience: [
      {
        period: "2024 — Present",
        role: "Full-stack Developer",
        company: "Personal & freelance projects",
        detail:
          "Building web products, applications and digital tools from idea to polished experience.",
      },
      {
        period: "2022 — 2024",
        role: "Frontend Developer",
        company: "Web products",
        detail:
          "Developing responsive interfaces, reusable components and thoughtful user experiences.",
      },
    ],
    education: [
      {
        period: "2020 — 2024",
        role: "Information Technology",
        company: "Study & research",
        detail:
          "Foundations in programming, databases, software architecture and product development.",
      },
    ],
  },
};

function Timeline({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: TimelineItem[];
  icon: typeof BriefcaseBusiness;
}) {
  return (
    <section className="contact-timeline">
      <h2>
        <Icon aria-hidden="true" />
        {title}
      </h2>
      <div className="contact-timeline-list">
        {items.map((item) => (
          <article className="contact-timeline-item" key={`${item.period}-${item.role}`}>
            <p className="contact-timeline-period">{item.period}</p>
            <h3>{item.role}</h3>
            <p className="contact-timeline-company">{item.company}</p>
            <p className="contact-timeline-detail">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ContactPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const profile = portfolio[language].profile;
  const skills = profile.skills.flatMap((group) => group.items).slice(0, 10);

  const channels = [
    { label: t.email, value: "trandinhkhanh0318@gmail.com", href: "mailto:trandinhkhanh0318@gmail.com", icon: Mail },
    { label: t.phone, value: "0915 368 545", href: "tel:+84915368545", icon: Phone },
    { label: t.facebook, value: "Trần Đình Khánh", href: "https://www.facebook.com/trandinhkhanh2002", icon: Facebook },
    { label: t.location, value: profile.location, icon: MapPin },
  ];

  return (
    <main className="contact-page">
      <section className="contact-resume" aria-labelledby="contact-profile-title">
        <header className="contact-resume-header">
          <div className="contact-avatar" aria-label="DK avatar placeholder"><span>DK</span><small>DEV</small></div>
          <div className="contact-identity">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 id="contact-profile-title">{profile.name}</h1>
            <p className="contact-role">{profile.role}</p>
            <div className="contact-profile-meta">
              <span><MapPin aria-hidden="true" />{profile.location}</span>
              <span className="contact-availability"><i aria-hidden="true" />{t.available}</span>
            </div>
          </div>
          <div className="contact-resume-actions">
            <button className="button button-secondary" type="button" disabled><Download aria-hidden="true" />{t.cvSoon}</button>
            <a className="button button-primary" href="#contact-form"><Send aria-hidden="true" />{t.contactCta}</a>
          </div>
        </header>

        <div className="contact-resume-grid">
          <aside className="contact-resume-sidebar">
            <section><h2>{t.about}</h2><p>{profile.summary}</p></section>
            <section><h2>{t.skills}</h2><div className="contact-skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
          </aside>
          <div className="contact-timelines">
            <Timeline title={t.experienceTitle} items={t.experience} icon={BriefcaseBusiness} />
            <Timeline title={t.educationTitle} items={t.education} icon={GraduationCap} />
          </div>
        </div>
      </section>

      <section className="contact-connect" aria-labelledby="contact-connect-title">
        <header className="contact-connect-heading">
          <p className="eyebrow">{t.connectEyebrow}</p>
          <h2 id="contact-connect-title">{t.connectTitle}</h2>
          <p>{t.connectLead}</p>
        </header>
        <div className="contact-connect-grid">
          <div className="contact-channel-list">
            {channels.map(({ label, value, href, icon: Icon }) => {
              const content = <><span className="contact-channel-icon"><Icon aria-hidden="true" /></span><span><small>{label}</small><strong>{value}</strong></span></>;
              return href ? (
                <a className="contact-channel" href={href} key={label} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{content}</a>
              ) : <article className="contact-channel" key={label}>{content}</article>;
            })}
          </div>

          <form className="contact-form-panel" id="contact-form">
            <div className="contact-form-heading">
              <span><Send aria-hidden="true" /></span>
              <div><h3>{t.formTitle}</h3><p>{t.formLead}</p></div>
            </div>
            <div className="contact-form-grid">
              <label htmlFor="contact-full-name"><span>{t.fullName}</span><input id="contact-full-name" name="fullName" placeholder={t.fullNamePlaceholder} type="text" /></label>
              <label htmlFor="contact-email"><span>{t.email}</span><input id="contact-email" name="email" placeholder={t.emailPlaceholder} type="email" /></label>
              <label htmlFor="contact-phone"><span>{t.phone}</span><input id="contact-phone" name="phone" placeholder={t.phonePlaceholder} type="tel" /></label>
              <label htmlFor="contact-project-type">
                <span>{t.projectType}</span>
                <select id="contact-project-type" name="projectType" defaultValue="">
                  <option value="" disabled>{t.projectPlaceholder}</option>
                  {t.projectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label htmlFor="contact-budget">
                <span>{t.budget}</span>
                <select id="contact-budget" name="budget" defaultValue="">
                  <option value="" disabled>{t.budgetPlaceholder}</option>
                  {t.budgetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="contact-form-message" htmlFor="contact-message"><span>{t.message}</span><textarea id="contact-message" name="message" placeholder={t.messagePlaceholder} rows={5} /></label>
            </div>
            <div className="contact-form-footer"><p>{t.formNote}</p><button className="button button-primary" type="button">{t.formCta}<Send aria-hidden="true" /></button></div>
          </form>
        </div>
      </section>
    </main>
  );
}
