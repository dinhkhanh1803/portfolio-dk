import {
  ArrowDownRight,
  ArrowRight,
  Facebook,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

type Language = "vi" | "en";

const contactCopy = {
  vi: {
    formLabel: "Biểu mẫu liên hệ dự án",
    introLabel: "Liên hệ trực tiếp",
    introTitle: "Thông tin liên hệ",
    introText: "Liên hệ trực tiếp qua email, điện thoại hoặc Facebook. Tôi thường phản hồi trong vòng 24 giờ.",
    email: "Email",
    phone: "Điện thoại / Zalo",
    facebook: "Facebook",
    location: "Địa điểm",
    locationValue: "Đà Nẵng, Việt Nam",
    name: "Họ và tên",
    namePlaceholder: "Nguyễn Văn A",
    emailPlaceholder: "email@example.com",
    phonePlaceholder: "09xx xxx xxx",
    projectType: "Loại dự án",
    projectPlaceholder: "Chọn loại dự án",
    projects: ["Website", "Ứng dụng", "Game", "UI/UX", "Khác"],
    budget: "Ngân sách dự kiến",
    budgetPlaceholder: "Chọn khoảng ngân sách",
    budgets: [
      "Dưới 10 triệu",
      "10–30 triệu",
      "30–60 triệu",
      "Trên 60 triệu",
      "Cần tư vấn",
    ],
    message: "Nội dung cần trao đổi",
    messagePlaceholder:
      "Mô tả ngắn về mục tiêu, thời gian và yêu cầu của dự án...",
    send: "Gửi yêu cầu",
  },
  en: {
    formLabel: "Project contact form",
    introLabel: "Get in touch",
    introTitle: "Contact information",
    introText: "Reach me directly by email, phone, or Facebook. I usually reply within 24 hours.",
    email: "Email",
    phone: "Phone / Zalo",
    facebook: "Facebook",
    location: "Location",
    locationValue: "Da Nang, Vietnam",
    name: "Full name",
    namePlaceholder: "Your name",
    emailPlaceholder: "email@example.com",
    phonePlaceholder: "Your phone number",
    projectType: "Project type",
    projectPlaceholder: "Select a project type",
    projects: ["Website", "Application", "Game", "UI/UX", "Other"],
    budget: "Estimated budget",
    budgetPlaceholder: "Select a budget range",
    budgets: [
      "Under 10M VND",
      "10–30M VND",
      "30–60M VND",
      "Over 60M VND",
      "Need consultation",
    ],
    message: "Project details",
    messagePlaceholder:
      "Briefly describe your goals, timeline and project requirements...",
    send: "Send request",
  },
} as const;

export default function ContactSection({ language }: { language: Language }) {
  const t = contactCopy[language];

  return (
    <section className="contact-section section-shell" id="contact">
      <div className="contact-card glass-panel">
        <div className="contact-details">
          <div className="contact-details-intro">
            <span>{t.introLabel}</span>
            <h2>{t.introTitle}</h2>
            <p>{t.introText}</p>
          </div>

          <a
            className="contact-detail-card"
            href="mailto:trandinhkhanh0318@gmail.com"
          >
            <span className="contact-detail-icon"><Mail /></span>
            <span className="contact-detail-copy">
              <small>{t.email}</small>
              <strong>trandinhkhanh0318@gmail.com</strong>
            </span>
            <ArrowDownRight className="contact-detail-arrow" />
          </a>

          <a className="contact-detail-card" href="tel:+84915368545">
            <span className="contact-detail-icon"><Phone /></span>
            <span className="contact-detail-copy">
              <small>{t.phone}</small>
              <strong>0915 368 545</strong>
            </span>
            <ArrowDownRight className="contact-detail-arrow" />
          </a>

          <a
            className="contact-detail-card"
            href="https://www.facebook.com/trandinhkhanh2002"
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-detail-icon"><Facebook /></span>
            <span className="contact-detail-copy">
              <small>{t.facebook}</small>
              <strong>Trần Đình Khánh</strong>
            </span>
            <ArrowDownRight className="contact-detail-arrow" />
          </a>

          <div className="contact-detail-card contact-detail-location">
            <span className="contact-detail-icon"><MapPin /></span>
            <span className="contact-detail-copy">
              <small>{t.location}</small>
              <strong>{t.locationValue}</strong>
            </span>
          </div>
        </div>

        <form className="contact-form-panel" aria-label={t.formLabel}>
          <div className="contact-form-grid">
            <label className="contact-field" htmlFor="contact-name">
              <span>{t.name}</span>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={t.namePlaceholder}
              />
            </label>

            <label className="contact-field" htmlFor="contact-email">
              <span>{t.email}</span>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t.emailPlaceholder}
              />
            </label>

            <label className="contact-field" htmlFor="contact-phone">
              <span>{t.phone}</span>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t.phonePlaceholder}
              />
            </label>

            <label className="contact-field" htmlFor="contact-project-type">
              <span>{t.projectType}</span>
              <select
                id="contact-project-type"
                name="projectType"
                defaultValue=""
              >
                <option value="" disabled>{t.projectPlaceholder}</option>
                {t.projects.map((project) => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </label>

            <label
              className="contact-field contact-field-full"
              htmlFor="contact-budget"
            >
              <span>{t.budget}</span>
              <select id="contact-budget" name="budget" defaultValue="">
                <option value="" disabled>{t.budgetPlaceholder}</option>
                {t.budgets.map((budget) => (
                  <option key={budget} value={budget}>{budget}</option>
                ))}
              </select>
            </label>

            <label
              className="contact-field contact-field-full"
              htmlFor="contact-message"
            >
              <span>{t.message}</span>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                placeholder={t.messagePlaceholder}
              />
            </label>
          </div>

          <button className="contact-submit" type="button">
            {t.send}<ArrowRight size={19} />
          </button>
        </form>
      </div>
    </section>
  );
}
