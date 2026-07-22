import { BookOpen, ExternalLink } from "lucide-react";
import type { DocsLanguage, DocsSource } from "../docs-data";

export default function DocsSourceFooter({ sources, t }: { sources: DocsSource[]; t: DocsLanguage }) {
  return (
    <footer className="docs-source-footer">
      <div>
        <BookOpen size={18} />
        <h2>{t === "vi" ? "Nguồn tham khảo" : "References"}</h2>
      </div>
      <p>
        {t === "vi"
          ? "Nội dung được cô đọng từ đặc tả và tài liệu kỹ thuật chính thống; mở nguồn khi cần kiểm tra chi tiết hoặc hành vi biên."
          : "This guide condenses standards and authoritative engineering references; open a source when you need exact edge-case behaviour."}
      </p>
      <ul>
        {sources.map((source) => (
          <li key={source.href}>
            <a href={source.href} target="_blank" rel="noreferrer">
              {source.label}
              <ExternalLink size={13} />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
