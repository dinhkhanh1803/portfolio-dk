"use client";

import { ArrowUpRight, Gamepad2, Search, Volume2, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "../language-provider";
import styles from "./playground.module.css";

const categories = ["All", "Arcade", "Reaction", "Endless", "Skill"] as const;

export default function PlaygroundPage() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const copy = language === "vi"
    ? {
        title: "Trò chơi",
        lead: "Những game trình duyệt ngắn, mượt và có thể chơi ngay — không cài đặt, không tải dữ liệu lên máy chủ.",
        search: "Tìm trò chơi...",
        featured: "Có thể chơi ngay",
        count: "1 game đang hoạt động",
        description: "Bắt đúng nhịp sáng, giữ combo và sống sót khi pulse tăng tốc qua từng giai đoạn.",
        play: "Chơi ngay",
        empty: "Chưa có game phù hợp. Các thể loại mới sẽ được bổ sung dần.",
      }
    : {
        title: "Games",
        lead: "Short, polished browser games you can play instantly — no installs and no server uploads.",
        search: "Search games...",
        featured: "Ready to play",
        count: "1 live game",
        description: "Catch the bright zone, hold your combo, and survive as the pulse accelerates through each stage.",
        play: "Play now",
        empty: "No matching game yet. More genres will be added over time.",
      };

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchesText = !normalized || "neon pulse arcade reaction endless skill".includes(normalized);
    const matchesCategory = category === "All" || categories.slice(1).includes(category);
    return matchesText && matchesCategory;
  }, [category, query]);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.titleRow}>
          <h1>{copy.title}</h1>
          <span>1</span>
        </div>
        <p>{copy.lead}</p>
      </header>

      <section className={styles.discovery} aria-label="Game discovery">
        <label className={styles.search}>
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
          />
        </label>
        <div className={styles.filters}>
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={`${styles.filter} ${category === item ? styles.filterActive : ""}`}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item} {item === "All" ? "(1)" : ""}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sectionHead}>
        <h2>{copy.featured}</h2>
        <span>{copy.count}</span>
      </div>

      {visible ? (
        <section className={styles.gameGrid}>
          <article className={styles.gameCard}>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.liveBadge}>LIVE</span>
              <div className={styles.orbit}><strong>PULSE</strong></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.category}>ARCADE · REACTION · ENDLESS · SKILL</p>
              <h3>Neon Pulse</h3>
              <p className={styles.description}>{copy.description}</p>
              <div className={styles.features}>
                <span><Zap size={14} /> 60–90s runs</span>
                <span><Volume2 size={14} /> Web Audio</span>
                <span><Gamepad2 size={14} /> Touch + Keyboard</span>
              </div>
              <Link href="/playground/neon-pulse" className={styles.playButton}>
                {copy.play} <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        </section>
      ) : (
        <div className={styles.empty}>{copy.empty}</div>
      )}
    </main>
  );
}