"use client";

import {
  Box,
  ChevronsDown,
  MoveDown,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PIECES,
  createGame,
  getGhostY,
  hardDrop,
  holdPiece,
  movePiece,
  pieceCells,
  rotatePiece,
  softDrop,
  startGame,
  tickGame,
  togglePause,
  type Cell,
  type NeonBlocksGame as GameState,
} from "./neon-blocks-engine";
import styles from "./neon-blocks.module.css";

const BEST_KEY = "dk-neon-blocks-best-v1";
const seedNow = () => Date.now() >>> 0;

export default function NeonBlocksGame() {
  const { language } = useLanguage();
  const [game, setGame] = useState<GameState>(() => createGame(20260731));
  const [storedBest, setStoredBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const audioRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);
  const previousLinesRef = useRef(0);
  const best = Math.max(storedBest, game.score);

  const copy = language === "vi"
    ? {
        eyebrow: "GAME 09 · XẾP KHỐI ARCADE",
        lead: "Xoay, giữ và thả khối để săn combo trong một ván Tetris neon tốc độ tăng dần.",
        score: "Điểm",
        best: "Kỷ lục",
        lines: "Dòng",
        level: "Cấp",
        combo: "Combo",
        hold: "Giữ",
        next: "Tiếp theo",
        start: "Bắt đầu",
        resume: "Tiếp tục",
        paused: "Đã tạm dừng",
        gameover: "Hết lượt",
        restart: "Chơi lại",
        controls: "← → di chuyển · ↑ xoay · ↓ hạ · Space thả · C giữ · P tạm dừng",
      }
    : {
        eyebrow: "GAME 09 · ARCADE STACKER",
        lead: "Rotate, hold, and hard-drop pieces to chase combos in an accelerating neon block run.",
        score: "Score",
        best: "Best",
        lines: "Lines",
        level: "Level",
        combo: "Combo",
        hold: "Hold",
        next: "Next",
        start: "Start run",
        resume: "Resume",
        paused: "Paused",
        gameover: "Run over",
        restart: "Play again",
        controls: "← → move · ↑ rotate · ↓ soft drop · Space hard drop · C hold · P pause",
      };

  const cue = useCallback((frequency: number, duration = 0.07) => {
    if (muted || typeof window === "undefined") return;
    try {
      const AudioCtor = window.AudioContext
        ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const context = audioRef.current ?? new AudioCtor();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Audio is an optional enhancement.
    }
  }, [muted]);

  useEffect(() => {
    const syncTheme = () =>
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const loadBest = window.setTimeout(() => {
      const stored = Number(window.localStorage.getItem(BEST_KEY));
      if (Number.isSafeInteger(stored) && stored >= 0) setStoredBest(stored);
    }, 0);
    return () => { observer.disconnect(); window.clearTimeout(loadBest); };
  }, []);

  useEffect(() => {
    if (game.score <= storedBest) return;
    window.localStorage.setItem(BEST_KEY, String(game.score));
  }, [game.score, storedBest]);

  useEffect(() => {
    if (game.lines > previousLinesRef.current) cue(680 + game.level * 35, 0.13);
    previousLinesRef.current = game.lines;
  }, [cue, game.level, game.lines]);

  useEffect(() => {
    lastTickRef.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      setGame((current) => tickGame(current, elapsed));
    }, 40);
    return () => window.clearInterval(timer);
  }, []);

  const act = useCallback((action: "left" | "right" | "rotate" | "down" | "drop" | "hold" | "pause") => {
    setGame((current) => {
      if (action === "pause") return togglePause(current);
      if (current.phase === "ready") return startGame(current);
      if (action === "left") return movePiece(current, -1);
      if (action === "right") return movePiece(current, 1);
      if (action === "rotate") return rotatePiece(current, 1);
      if (action === "down") return softDrop(current);
      if (action === "hold") return holdPiece(current);
      return hardDrop(current);
    });
    if (action === "rotate") cue(420);
    else if (action === "drop") cue(175, 0.09);
    else if (action !== "pause") cue(260, 0.035);
  }, [cue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Parameters<typeof act>[0]> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "rotate",
        ArrowDown: "down",
        Space: "drop",
        KeyC: "hold",
        KeyP: "pause",
        Escape: "pause",
      };
      const action = keyMap[event.code];
      if (!action || event.repeat && action !== "down") return;
      event.preventDefault();
      act(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [act]);

  const display = useMemo(() => {
    const cells = game.board.map((row) => [...row] as Array<Cell | "ghost">);
    if (game.phase !== "gameover") {
      const ghostY = getGhostY(game);
      pieceCells({ ...game.active, y: ghostY }).forEach(({ x, y }) => {
        if (y >= 0 && y < BOARD_HEIGHT && cells[y][x] === 0) cells[y][x] = "ghost";
      });
      const color = (PIECES.indexOf(game.active.type) + 1) as Cell;
      pieceCells(game.active).forEach(({ x, y }) => {
        if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) cells[y][x] = color;
      });
    }
    return cells;
  }, [game]);

  const reset = () => {
    previousLinesRef.current = 0;
    setGame(startGame(createGame(seedNow())));
    setStoredBest((current) => Math.max(current, game.score));
    cue(520, 0.1);
  };

  const overlay = game.phase === "ready" || game.phase === "paused" || game.phase === "gameover";

  return (
    <main className={`${styles.page} ${theme === "light" ? styles.light : ""}`}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p>{copy.eyebrow}</p>
            <h1>Neon Blocks</h1>
            <span>{copy.lead}</span>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={() => act("pause")} disabled={game.phase === "ready" || game.phase === "gameover"}>
              {game.phase === "paused" ? <Play size={17} /> : <Pause size={17} />}
              {game.phase === "paused" ? copy.resume : "Pause"}
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-pressed={muted}>
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              {muted ? "Muted" : "Sound"}
            </button>
            <button type="button" onClick={reset}><RefreshCw size={17} />{copy.restart}</button>
          </div>
        </header>

        <div className={styles.stats} aria-label="Game statistics">
          <span>{copy.score}<b>{game.score.toLocaleString()}</b></span>
          <span>{copy.best}<b>{best.toLocaleString()}</b></span>
          <span>{copy.lines}<b>{game.lines}</b></span>
          <span>{copy.level}<b>{game.level}</b></span>
          <span>{copy.combo}<b>{game.combo || "—"}</b></span>
        </div>

        <div className={styles.gameLayout}>
          <aside className={styles.sideCard}>
            <p>{copy.hold}</p>
            <div className={`${styles.piecePreview} ${game.hold ? styles[`preview${game.hold}`] : ""}`}>
              <Box size={27} />
              <b>{game.hold ?? "—"}</b>
            </div>
            <button type="button" onClick={() => act("hold")} disabled={!game.canHold || game.phase !== "playing"}>
              C · {copy.hold}
            </button>
          </aside>

          <section className={styles.boardFrame} aria-label="Neon Blocks game board">
            <div className={styles.board}>
              {display.flatMap((row, y) => row.map((cell, x) => (
                <i
                  aria-hidden="true"
                  className={cell === "ghost" ? styles.ghost : cell ? styles[`piece${cell}`] : styles.empty}
                  key={`${x}-${y}`}
                />
              )))}
            </div>
            {overlay && (
              <div className={styles.overlay}>
                <Box size={38} />
                <small>{game.phase === "gameover" ? `${copy.score}: ${game.score.toLocaleString()}` : "TETROMINO SYSTEM ONLINE"}</small>
                <h2>{game.phase === "ready" ? "Neon Blocks" : game.phase === "paused" ? copy.paused : copy.gameover}</h2>
                <button type="button" onClick={game.phase === "paused" ? () => act("pause") : reset}>
                  {game.phase === "paused" ? <Play size={18} /> : <ChevronsDown size={18} />}
                  {game.phase === "paused" ? copy.resume : game.phase === "ready" ? copy.start : copy.restart}
                </button>
              </div>
            )}
          </section>

          <aside className={styles.sideCard}>
            <p>{copy.next}</p>
            <div className={styles.queue}>
              {game.queue.slice(0, 4).map((piece, index) => (
                <span className={styles[`preview${piece}`]} key={`${piece}-${index}`}>
                  <b>{piece}</b>
                </span>
              ))}
            </div>
            <small>7-BAG<br />RANDOMIZER</small>
          </aside>
        </div>

        <div className={styles.touchControls} aria-label="Touch controls">
          <button type="button" onClick={() => act("left")} aria-label="Move left">←</button>
          <button type="button" onClick={() => act("rotate")} aria-label="Rotate"><RotateCw size={20} /></button>
          <button type="button" onClick={() => act("right")} aria-label="Move right">→</button>
          <button type="button" onClick={() => act("down")} aria-label="Soft drop"><MoveDown size={20} /></button>
          <button type="button" className={styles.dropButton} onClick={() => act("drop")} aria-label="Hard drop">
            <ChevronsDown size={20} /> DROP
          </button>
        </div>
        <p className={styles.controls}>{copy.controls}</p>
        <p className={styles.srOnly} role="status" aria-live="polite">
          {game.phase}. {copy.score} {game.score}. {copy.lines} {game.lines}. {copy.level} {game.level}.
        </p>
      </section>
    </main>
  );
}
