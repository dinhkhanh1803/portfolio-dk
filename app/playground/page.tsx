"use client";

import {
  ArrowUpRight,
  Brain,
  Gamepad2,
  Grid3X3,
  Move,
  Search,
  Timer,
  Volume2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "../language-provider";
import styles from "./playground.module.css";

const categories = [
  "All",
  "Arcade",
  "Reaction",
  "Endless",
  "Skill",
  "Puzzle",
  "Strategy",
  "Casual",
  "Multiplayer",
] as const;

type Category = (typeof categories)[number];
type FeatureIcon = "zap" | "audio" | "controls" | "time" | "brain" | "grid";

type GameCard = {
  slug: string;
  href: string;
  title: string;
  categories: Category[];
  categoryLabel: string;
  description: string;
  features: Array<{ icon: FeatureIcon; label: string }>;
  visual: "pulse" | "foundry" | "hopper" | "pong";
};

const featureIcons = {
  zap: Zap,
  audio: Volume2,
  controls: Gamepad2,
  time: Timer,
  brain: Brain,
  grid: Grid3X3,
};

export default function PlaygroundPage() {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const copy = language === "vi"
    ? {
        title: "Trò chơi",
        lead: "Những game trình duyệt ngắn, mượt và có thể chơi ngay — không cài đặt, không tải dữ liệu lên máy chủ.",
        search: "Tìm trò chơi...",
        featured: "Có thể chơi ngay",
        count: (count: number) => `${count} game đang hoạt động`,
        play: "Chơi ngay",
        empty: "Chưa có game phù hợp. Hãy thử một thể loại khác.",
      }
    : {
        title: "Games",
        lead: "Short, polished browser games you can play instantly — no installs and no server uploads.",
        search: "Search games...",
        featured: "Ready to play",
        count: (count: number) => `${count} live ${count === 1 ? "game" : "games"}`,
        play: "Play now",
        empty: "No matching game yet. Try another category.",
      };

  const games: GameCard[] = [
    {
      slug: "neon-pulse",
      href: "/playground/neon-pulse",
      title: "Neon Pulse",
      categories: ["Arcade", "Reaction", "Endless", "Skill"],
      categoryLabel: "ARCADE · REACTION · ENDLESS · SKILL",
      description: language === "vi"
        ? "Bắt đúng nhịp sáng, giữ combo và sống sót khi pulse tăng tốc qua từng giai đoạn."
        : "Catch the bright zone, hold your combo, and survive as the pulse accelerates through each stage.",
      features: [
        { icon: "zap", label: "60–90s runs" },
        { icon: "audio", label: "Web Audio" },
        { icon: "controls", label: "Touch + Keyboard" },
      ],
      visual: "pulse",
    },
    {
      slug: "merge-foundry",
      href: "/playground/merge-foundry",
      title: "Merge Foundry",
      categories: ["Puzzle", "Strategy", "Casual"],
      categoryLabel: "PUZZLE · STRATEGY · CASUAL",
      description: language === "vi"
        ? "Trượt các ô số, ghép cặp giống nhau và chinh phục ô 2048."
        : "Slide matching number tiles and build your way to the 2048 tile.",
      features: [
        { icon: "time", label: "5–10 min runs" },
        { icon: "brain", label: "Turn-based" },
        { icon: "grid", label: "Touch + Keyboard" },
      ],
      visual: "foundry",
    },
    {
      slug: "sky-hopper",
      href: "/playground/sky-hopper",
      title: "Sky Hopper",
      categories: ["Arcade", "Reaction", "Endless", "Skill"],
      categoryLabel: "ARCADE · REACTION · ENDLESS · SKILL",
      description: language === "vi"
        ? "Chạm để bay, lách qua các cổng mây và giữ nhịp khi tốc độ tăng dần."
        : "Tap to fly through cloud gates and hold your rhythm as the speed rises.",
      features: [
        { icon: "zap", label: "Endless run" },
        { icon: "audio", label: "Web Audio" },
        { icon: "controls", label: "Tap + Space" },
      ],
      visual: "hopper",
    },
    {
      slug: "pong",
      href: "/playground/pong",
      title: "Neon Classic Pong",
      categories: ["Arcade", "Reaction", "Skill", "Multiplayer"],
      categoryLabel: "ARCADE · SKILL · 1–2 PLAYERS",
      description: language === "vi"
        ? "Pong neon nguyên bản: đấu AI ba cấp độ hoặc so tài hai người ngay trên một thiết bị."
        : "Pure neon Pong against three AI levels or a friend sharing the same device.",
      features: [
        { icon: "controls", label: "1P + Local 2P" },
        { icon: "audio", label: "Web Audio" },
        { icon: "zap", label: "First to 5 / 7 / 11" },
      ],
      visual: "pong",
    },
  ];

  const normalized = query.trim().toLowerCase();
  const visibleGames = games.filter((game) => {
    const searchText = `${game.title} ${game.categoryLabel} ${game.description}`.toLowerCase();
    const matchesText = !normalized || searchText.includes(normalized);
    const matchesCategory = category === "All" || game.categories.includes(category);
    return matchesText && matchesCategory;
  });

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.titleRow}>
          <h1>{copy.title}</h1>
          <span>{games.length}</span>
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
          {categories.map((item) => {
            const count = item === "All"
              ? games.length
              : games.filter((game) => game.categories.includes(item)).length;
            return (
              <button
                type="button"
                key={item}
                className={`${styles.filter} ${category === item ? styles.filterActive : ""}`}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item} ({count})
              </button>
            );
          })}
        </div>
      </section>

      <div className={styles.sectionHead}>
        <h2>{copy.featured}</h2>
        <span>{copy.count(visibleGames.length)}</span>
      </div>

      {visibleGames.length > 0 ? (
        <section className={styles.gameGrid}>
          {visibleGames.map((game) => (
            <article className={styles.gameCard} key={game.slug}>
              <div
                className={`${styles.visual} ${game.visual === "foundry" ? styles.foundryVisual : game.visual === "hopper" ? styles.hopperVisual : game.visual === "pong" ? styles.pongVisual : ""}`}
                aria-hidden="true"
              >
                <span className={styles.liveBadge}>LIVE</span>
                {game.visual === "pulse" ? (
                  <div className={styles.orbit}><strong>PULSE</strong></div>
                ) : game.visual === "foundry" ? (
                  <div className={styles.foundryPreview}>
                    {[1, 0, 2, 0, 1, 3, 3, 0, 0, 2, 4, 0, 1, 0, 5, 0].map((tier, index) => (
                      <i data-tier={tier || undefined} key={index}>{tier ? 2 ** tier : null}</i>
                    ))}
                    <Move className={styles.mergeMark} size={23} />
                  </div>
                ) : game.visual === "hopper" ? (
                  <div className={styles.hopperPreview}>
                    <i className={styles.previewPipeTop} />
                    <span className={styles.previewBird}>↗</span>
                    <i className={styles.previewPipeBottom} />
                  </div>
                ) : (
                  <div className={styles.pongPreview}>
                    <i className={styles.pongNet} />
                    <i className={styles.pongPaddleLeft} />
                    <i className={styles.pongBall} />
                    <i className={styles.pongPaddleRight} />
                    <b>3</b><strong>2</strong>
                  </div>
                )}
              </div>
              <div className={styles.cardContent}>
                <p className={styles.category}>{game.categoryLabel}</p>
                <h3>{game.title}</h3>
                <p className={styles.description}>{game.description}</p>
                <div className={styles.features}>
                  {game.features.map((feature) => {
                    const Icon = featureIcons[feature.icon];
                    return <span key={feature.label}><Icon size={14} /> {feature.label}</span>;
                  })}
                </div>
                <Link href={game.href} className={styles.playButton}>
                  {copy.play} <ArrowUpRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>{copy.empty}</div>
      )}
    </main>
  );
}