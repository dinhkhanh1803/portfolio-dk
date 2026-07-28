"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLanguage } from "../../language-provider";
import { MergeFoundryAudio } from "./merge-foundry-audio";
import {
  canDeliver,
  createGame,
  deliverOrder,
  slide,
  undo,
  type Direction,
  type GameState,
  type MaterialTier,
} from "./merge-foundry-engine";
import styles from "./merge-foundry.module.css";
import {
  HIGH_SCORE_KEY,
  MUTED_KEY,
  parseSavedShift,
  readStoredBoolean,
  readStoredScore,
  REDUCED_MOTION_KEY,
  serializeShift,
  SHIFT_KEY,
} from "./merge-foundry-storage";

const SWIPE_THRESHOLD = 32;
const START_SEED = 0x4d465247;
const tierKeys = ["", "scrap", "copper", "steel", "core", "prism"] as const;
const INITIAL_GAME = createGame(START_SEED);

export default function MergeFoundryGame() {
  const { language } = useLanguage();
  const stateRef = useRef<GameState>(INITIAL_GAME);
  const audioRef = useRef<MergeFoundryAudio | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const [game, setGame] = useState<GameState>(INITIAL_GAME);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [mergedIndexes, setMergedIndexes] = useState<number[]>([]);
  const [spawnedIndex, setSpawnedIndex] = useState<number | null>(null);

  const copy = language === "vi"
    ? {
        back: "Tất cả trò chơi",
        eyebrow: "PUZZLE · CHIẾN THUẬT · THƯ GIÃN",
        title: "Merge Foundry",
        intro: "Trượt vật liệu, tạo chuỗi nâng cấp và hoàn thành tám đơn chế tạo.",
        score: "Điểm",
        combo: "Combo",
        orders: "Đơn đã giao",
        moves: "Nước đi",
        board: "Bàn chế tạo",
        queue: "Đơn chế tạo",
        deliver: "Giao đơn",
        ready: "Sẵn sàng",
        notReady: "Chưa đủ vật liệu",
        undo: "Hoàn tác",
        used: "Đã dùng",
        paused: "Xưởng đang tạm dừng",
        resume: "Tiếp tục",
        won: "Hoàn thành ca sản xuất!",
        lost: "Xưởng đã hết chỗ",
        restart: "Bắt đầu ca mới",
        motion: "Giảm hiệu ứng",
        best: "Kỷ lục",
      }
    : {
        back: "All games",
        eyebrow: "PUZZLE · STRATEGY · CASUAL",
        title: "Merge Foundry",
        intro: "Slide materials, build upgrade chains, and complete eight crafting orders.",
        score: "Score",
        combo: "Combo",
        orders: "Orders",
        moves: "Moves",
        board: "Crafting board",
        queue: "Crafting orders",
        deliver: "Deliver",
        ready: "Ready",
        notReady: "Not ready",
        undo: "Undo",
        used: "Used",
        paused: "Foundry paused",
        resume: "Resume",
        won: "Shift complete!",
        lost: "The foundry is full",
        restart: "Start new shift",
        motion: "Reduce effects",
        best: "Best",
      };

  const tierLabels = language === "vi"
    ? ["", "Phế", "Đồng", "Thép", "Lõi", "Prism"]
    : ["", "Scrap", "Copper", "Steel", "Core", "Prism"];

  const publish = useCallback((next: GameState) => {
    stateRef.current = next;
    setGame(next);
    window.localStorage.setItem(SHIFT_KEY, serializeShift(next));
    if (next.status !== "playing") {
      setHighScore((current) => {
        const best = Math.max(current, next.score);
        window.localStorage.setItem(HIGH_SCORE_KEY, String(best));
        return best;
      });
    }
  }, []);

  useEffect(() => {
    const audio = new MergeFoundryAudio();
    audioRef.current = audio;
    const systemReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const nextMuted = readStoredBoolean(
      window.localStorage.getItem(MUTED_KEY),
      false,
    );
    const nextReduced = readStoredBoolean(
      window.localStorage.getItem(REDUCED_MOTION_KEY),
      systemReduced,
    );
    const saved = parseSavedShift(window.localStorage.getItem(SHIFT_KEY));
    const hydrate = window.setTimeout(() => {
      audio.setMuted(nextMuted);
      setMuted(nextMuted);
      setReducedMotion(nextReduced);
      setHighScore(readStoredScore(window.localStorage.getItem(HIGH_SCORE_KEY)));
      if (saved) {
        stateRef.current = saved;
        setGame(saved);
      }
    }, 0);
    return () => {
      window.clearTimeout(hydrate);
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
    window.localStorage.setItem(MUTED_KEY, String(muted));
  }, [muted]);

  useEffect(() => {
    window.localStorage.setItem(
      REDUCED_MOTION_KEY,
      String(reducedMotion),
    );
  }, [reducedMotion]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const lockBriefly = useCallback((duration: number) => {
    lockedRef.current = true;
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      lockedRef.current = false;
      setMergedIndexes([]);
      setSpawnedIndex(null);
    }, duration);
  }, []);

  const attemptSlide = useCallback(async (direction: Direction) => {
    if (lockedRef.current || paused) return;
    lockedRef.current = true;
    await audioRef.current?.unlock();
    const transition = slide(stateRef.current, direction);
    if (!transition.changed) {
      lockedRef.current = false;
      audioRef.current?.playInvalid();
      setAnnouncement(
        language === "vi" ? "Không thể trượt theo hướng đó." : "That move is blocked.",
      );
      return;
    }
    audioRef.current?.playSlide();
    transition.merges.forEach((merge) =>
      audioRef.current?.playMerge(merge.tier),
    );
    setMergedIndexes(transition.merges.map((merge) => merge.to));
    setSpawnedIndex(transition.spawnedIndex);
    publish(transition.state);
    setAnnouncement(
      transition.merges.length > 0
        ? language === "vi"
          ? `Đã hợp nhất ${transition.merges.length} vật liệu.`
          : `Merged ${transition.merges.length} materials.`
        : language === "vi"
          ? "Đã trượt vật liệu."
          : "Materials moved.",
    );
    if (transition.state.status === "lost") {
      audioRef.current?.playOutcome(false);
    }
    lockBriefly(reducedMotion ? 40 : 170);
  }, [language, lockBriefly, paused, publish, reducedMotion]);

  useEffect(() => {
    const directions: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      void attemptSlide(direction);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [attemptSlide]);

  const handleDelivery = useCallback(async (orderId: string) => {
    if (lockedRef.current || paused) return;
    lockedRef.current = true;
    await audioRef.current?.unlock();
    const result = deliverOrder(stateRef.current, orderId);
    if (!result.delivered) {
      lockedRef.current = false;
      audioRef.current?.playInvalid();
      return;
    }
    publish(result.state);
    audioRef.current?.playDelivery(result.state.combo);
    setAnnouncement(
      language === "vi" ? "Đơn chế tạo đã được giao." : "Crafting order delivered.",
    );
    if (result.state.status === "won") {
      audioRef.current?.playOutcome(true);
    }
    lockBriefly(reducedMotion ? 40 : 170);
  }, [language, lockBriefly, paused, publish, reducedMotion]);

  const handleUndo = useCallback(() => {
    if (lockedRef.current || paused) return;
    const next = undo(stateRef.current);
    if (next === stateRef.current) return;
    publish(next);
    setAnnouncement(language === "vi" ? "Đã hoàn tác nước đi." : "Move undone.");
  }, [language, paused, publish]);

  const restart = useCallback(() => {
    const next = createGame(Date.now() >>> 0);
    setPaused(false);
    setMergedIndexes([]);
    setSpawnedIndex(null);
    publish(next);
    setAnnouncement(language === "vi" ? "Ca mới đã bắt đầu." : "New shift started.");
  }, [language, publish]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD) return;
    const direction: Direction = Math.abs(deltaX) > Math.abs(deltaY)
      ? deltaX > 0 ? "right" : "left"
      : deltaY > 0 ? "down" : "up";
    void attemptSlide(direction);
  };

  const directionButtons = [
    { direction: "up" as const, icon: ArrowUp, label: "Up" },
    { direction: "left" as const, icon: ArrowLeft, label: "Left" },
    { direction: "down" as const, icon: ArrowDown, label: "Down" },
    { direction: "right" as const, icon: ArrowRight, label: "Right" },
  ];

  return (
    <main className={styles.gamePage} data-status={game.status} data-reduced-motion={reducedMotion}>
      <header className={styles.header}>
        <div>
          <Link href="/playground" className={styles.back}>
            <ArrowLeft size={15} /> {copy.back}
          </Link>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.intro}</span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? "Unmute game" : "Mute game"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? copy.resume : "Pause"}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </header>

      <section className={styles.layout}>
        <div className={styles.playColumn}>
          <div className={styles.hud}>
            <div><span>{copy.score}</span><strong>{game.score.toLocaleString()}</strong></div>
            <div><span>{copy.combo}</span><strong>{game.combo}x</strong></div>
            <div><span>{copy.orders}</span><strong>{game.completedOrders}/8</strong></div>
            <div><span>{copy.moves}</span><strong>{game.moveCount}</strong></div>
          </div>

          <section className={styles.boardCard} aria-label={copy.board}>
            <div className={styles.boardTop}>
              <span>{copy.board} · 5×5</span>
              <span>{copy.best}: {Math.max(highScore, game.score).toLocaleString()}</span>
            </div>
            <div
              className={styles.board}
              role="grid"
              aria-label={copy.board}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              {game.board.map((tier, index) => (
                <div className={styles.cell} role="gridcell" key={index}>
                  {tier !== null && (
                    <div
                      className={styles.tile}
                      data-tier={tier}
                      data-material={tierKeys[tier]}
                      data-merged={mergedIndexes.includes(index)}
                      data-spawned={spawnedIndex === index}
                    >
                      <span>{tierLabels[tier]}</span>
                      <b>{tier}</b>
                    </div>
                  )}
                </div>
              ))}

              {(paused || game.status !== "playing") && (
                <div className={styles.overlay}>
                  <h2>
                    {paused ? copy.paused : game.status === "won" ? copy.won : copy.lost}
                  </h2>
                  <p>{copy.score}: {game.score.toLocaleString()}</p>
                  {paused ? (
                    <button type="button" onClick={() => setPaused(false)}>
                      <Play size={17} /> {copy.resume}
                    </button>
                  ) : (
                    <button type="button" onClick={restart}>
                      <RotateCcw size={17} /> {copy.restart}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={styles.boardActions}>
              <button
                type="button"
                onClick={handleUndo}
                disabled={paused || !game.undoAvailable || !game.undoSnapshot}
              >
                <Undo2 size={16} />
                {game.undoAvailable ? copy.undo : copy.used}
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />
                {copy.motion}
              </label>
            </div>

            <div className={styles.directionPad} aria-label="Move controls">
              {directionButtons.map(({ direction, icon: Icon, label }) => (
                <button
                  type="button"
                  key={direction}
                  onClick={() => void attemptSlide(direction)}
                  aria-label={`Move ${label}`}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.orderPanel}>
          <div className={styles.orderHead}>
            <div>
              <span>{copy.queue}</span>
              <strong>{game.completedOrders}/8</strong>
            </div>
            <div className={styles.progress}>
              <i style={{ width: `${(game.completedOrders / 8) * 100}%` }} />
            </div>
          </div>

          <div className={styles.orders}>
            {game.orders.map((order, index) => {
              const ready = canDeliver(game, order.id);
              return (
                <article className={styles.order} data-ready={ready} key={order.id}>
                  <span>{index === 0 ? "ACTIVE" : `QUEUE ${index + 1}`}</span>
                  <div>
                    <strong>{order.quantity}× {tierLabels[order.tier]}</strong>
                    <small>Tier {order.tier}</small>
                  </div>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => void handleDelivery(order.id)}
                  >
                    {ready && <Check size={15} />} {ready ? copy.deliver : copy.notReady}
                  </button>
                </article>
              );
            })}
          </div>

          <div className={styles.legend}>
            {([1, 2, 3, 4, 5] as MaterialTier[]).map((tier) => (
              <div key={tier}>
                <i data-tier={tier} />
                <span>{tierLabels[tier]}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <output className={styles.srStatus} aria-live="polite">
        {announcement}
      </output>
    </main>
  );
}
