"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { MergeFoundryAudio } from "./merge-foundry-audio";
import {
  createGame,
  slide,
  TARGET_VALUE,
  undo,
  type Direction,
  type GameState,
} from "./merge-foundry-engine";
import styles from "./merge-foundry.module.css";
import {
  GAME_KEY,
  HIGH_SCORE_KEY,
  MUTED_KEY,
  parseSavedGame,
  readStoredBoolean,
  readStoredScore,
  REDUCED_MOTION_KEY,
  serializeGame,
} from "./merge-foundry-storage";

const SWIPE_THRESHOLD = 32;
const START_SEED = 0x32303438;
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

  const copy = useMemo(() => language === "vi"
    ? {
        back: "Tất cả trò chơi",
        eyebrow: "PUZZLE · 2048 · THƯ GIÃN",
        title: "Merge Foundry 2048",
        intro: "Trượt các ô số, ghép hai ô giống nhau và chinh phục ô 2048.",
        score: "Điểm",
        best: "Kỷ lục",
        moves: "Nước đi",
        target: "Mục tiêu",
        board: "Bàn 2048",
        undo: "Hoàn tác",
        used: "Đã dùng",
        paused: "Game đang tạm dừng",
        resume: "Tiếp tục",
        won: "Bạn đã tạo được 2048!",
        lost: "Không còn nước đi",
        restart: "Chơi ván mới",
        motion: "Giảm hiệu ứng",
        help: "Dùng phím mũi tên, nút điều hướng hoặc vuốt trên bàn. Hai ô cùng số sẽ hợp nhất.",
        moved: "Đã di chuyển các ô.",
        blocked: "Không thể đi theo hướng đó.",
        merged: (count: number) => `Đã ghép ${count} cặp ô.`,
      }
    : {
        back: "All games",
        eyebrow: "PUZZLE · 2048 · CASUAL",
        title: "Merge Foundry 2048",
        intro: "Slide number tiles, merge matching pairs, and forge the 2048 tile.",
        score: "Score",
        best: "Best",
        moves: "Moves",
        target: "Target",
        board: "2048 board",
        undo: "Undo",
        used: "Used",
        paused: "Game paused",
        resume: "Resume",
        won: "You forged 2048!",
        lost: "No moves left",
        restart: "New game",
        motion: "Reduce effects",
        help: "Use arrow keys, direction buttons, or swipe. Matching number tiles merge together.",
        moved: "Tiles moved.",
        blocked: "That move is blocked.",
        merged: (count: number) => `Merged ${count} pairs.`,
      }, [language]);

  const publish = useCallback((next: GameState) => {
    stateRef.current = next;
    setGame(next);
    window.localStorage.setItem(GAME_KEY, serializeGame(next));
    setHighScore((current) => {
      const best = Math.max(current, next.score);
      window.localStorage.setItem(HIGH_SCORE_KEY, String(best));
      return best;
    });
  }, []);

  useEffect(() => {
    const audio = new MergeFoundryAudio();
    audioRef.current = audio;
    const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextMuted = readStoredBoolean(window.localStorage.getItem(MUTED_KEY), false);
    const nextReduced = readStoredBoolean(
      window.localStorage.getItem(REDUCED_MOTION_KEY),
      systemReduced,
    );
    const saved = parseSavedGame(window.localStorage.getItem(GAME_KEY));
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
      if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
    window.localStorage.setItem(MUTED_KEY, String(muted));
  }, [muted]);

  useEffect(() => {
    window.localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const lockBriefly = useCallback((duration: number) => {
    lockedRef.current = true;
    if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
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
      setAnnouncement(copy.blocked);
      return;
    }
    audioRef.current?.playSlide();
    transition.merges.forEach((merge) => audioRef.current?.playMerge(merge.value));
    setMergedIndexes(transition.merges.map((merge) => merge.to));
    setSpawnedIndex(transition.spawnedIndex);
    publish(transition.state);
    setAnnouncement(
      transition.merges.length > 0 ? copy.merged(transition.merges.length) : copy.moved,
    );
    if (transition.state.status !== "playing") {
      audioRef.current?.playOutcome(transition.state.status === "won");
    }
    lockBriefly(reducedMotion ? 40 : 170);
  }, [copy, lockBriefly, paused, publish, reducedMotion]);

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
    setAnnouncement(language === "vi" ? "Ván mới đã bắt đầu." : "New game started.");
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
    <main
      className={styles.gamePage}
      data-status={game.status}
      data-reduced-motion={reducedMotion}
    >
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

      <section className={styles.classicLayout}>
        <div className={styles.hud}>
          <div><span>{copy.score}</span><strong>{game.score.toLocaleString()}</strong></div>
          <div><span>{copy.best}</span><strong>{Math.max(highScore, game.score).toLocaleString()}</strong></div>
          <div><span>{copy.moves}</span><strong>{game.moveCount}</strong></div>
          <div><span>{copy.target}</span><strong>{TARGET_VALUE}</strong></div>
        </div>

        <section className={styles.boardCard} aria-label={copy.board}>
          <div className={styles.boardTop}>
            <span>{copy.board} · 4×4</span>
            <button type="button" onClick={restart} className={styles.newGameButton}>
              <RotateCcw size={14} /> {copy.restart}
            </button>
          </div>
          <div
            className={styles.board}
            role="grid"
            aria-label={copy.board}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {game.board.map((value, index) => (
              <div className={styles.cell} role="gridcell" key={index}>
                {value !== null && (
                  <div
                    className={styles.tile}
                    data-value={value}
                    data-merged={mergedIndexes.includes(index)}
                    data-spawned={spawnedIndex === index}
                    aria-label={String(value)}
                  >
                    <span>{value}</span>
                  </div>
                )}
              </div>
            ))}

            {(paused || game.status !== "playing") && (
              <div className={styles.overlay}>
                <h2>{paused ? copy.paused : game.status === "won" ? copy.won : copy.lost}</h2>
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

        <p className={styles.helpText}>{copy.help}</p>
      </section>

      <output className={styles.srStatus} aria-live="polite">{announcement}</output>
    </main>
  );
}
