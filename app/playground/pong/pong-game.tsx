"use client";

import { ArrowLeft, Bot, Pause, Play, RotateCcw, Settings2, Users, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { PongAudio } from "./pong-audio";
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceFixed,
  createMatch,
  pauseMatch,
  resumeMatch,
  startRally,
  type PongInput,
  type PongState,
} from "./pong-engine";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  MOTION_KEY,
  MUTED_KEY,
  SETTINGS_KEY,
  STATS_KEY,
  parseBoolean,
  parseSettings,
  parseStats,
  safeRead,
  safeWrite,
  type PongSettings,
  type PongStats,
} from "./pong-storage";
import styles from "./pong.module.css";

type SceneTheme = "light" | "dark";
type TrailPoint = { x: number; y: number };

const EMPTY_INPUT: PongInput = { leftUp: false, leftDown: false, rightUp: false, rightDown: false };
const INITIAL_MATCH = createMatch(DEFAULT_SETTINGS);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: PongState,
  theme: SceneTheme,
  trail: TrailPoint[],
  reducedMotion: boolean,
) {
  const dark = theme === "dark";
  const background = context.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  background.addColorStop(0, dark ? "#06131a" : "#eef8f6");
  background.addColorStop(0.52, dark ? "#0a2229" : "#dff3f0");
  background.addColorStop(1, dark ? "#101b27" : "#f7eee8");
  context.fillStyle = background;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  context.strokeStyle = dark ? "rgba(102,229,225,.14)" : "rgba(18,112,116,.12)";
  context.lineWidth = 1;
  for (let x = 0; x <= WORLD_WIDTH; x += 64) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, WORLD_HEIGHT); context.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 64) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(WORLD_WIDTH, y); context.stroke();
  }

  context.save();
  context.setLineDash([16, 18]);
  context.strokeStyle = dark ? "rgba(232,250,248,.28)" : "rgba(20,57,65,.24)";
  context.lineWidth = 4;
  context.beginPath(); context.moveTo(WORLD_WIDTH / 2, 30); context.lineTo(WORLD_WIDTH / 2, WORLD_HEIGHT - 30); context.stroke();
  context.restore();

  if (!reducedMotion) {
    trail.forEach((point, index) => {
      const alpha = ((index + 1) / trail.length) * 0.24;
      context.fillStyle = `rgba(79, 221, 218, ${alpha})`;
      context.beginPath();
      context.arc(point.x, point.y, 4 + index * 0.45, 0, Math.PI * 2);
      context.fill();
    });
  }

  const drawPaddle = (x: number, y: number, color: string) => {
    context.save();
    context.shadowBlur = dark ? 28 : 16;
    context.shadowColor = color;
    context.fillStyle = color;
    roundedRect(context, x, y, 22, 128, 11);
    context.fill();
    context.fillStyle = "rgba(255,255,255,.34)";
    roundedRect(context, x + 4, y + 7, 4, 95, 3);
    context.fill();
    context.restore();
  };
  drawPaddle(state.leftPaddle.x, state.leftPaddle.y, "#2fc8c8");
  drawPaddle(state.rightPaddle.x, state.rightPaddle.y, "#f27662");

  context.save();
  context.shadowBlur = dark ? 26 : 14;
  context.shadowColor = "#f5ffff";
  context.fillStyle = dark ? "#f3ffff" : "#17323a";
  context.beginPath();
  context.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export default function PongGame() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<PongSettings>(DEFAULT_SETTINGS);
  const stateRef = useRef(INITIAL_MATCH);
  const [view, setView] = useState(INITIAL_MATCH);
  const [showSettings, setShowSettings] = useState(true);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<SceneTheme>("light");
  const [stats, setStats] = useState<PongStats>(DEFAULT_STATS);
  const [announcement, setAnnouncement] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<PongAudio | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const inputRef = useRef<PongInput>({ ...EMPTY_INPUT });
  const trailRef = useRef<TrailPoint[]>([]);
  const lastEventRef = useRef(0);
  const renderedAtRef = useRef(0);
  const recordedWinnerRef = useRef<string | null>(null);
  const pointerSidesRef = useRef(new Map<number, "left" | "right">());
  const modalRef = useRef<HTMLElement | null>(null);

  const copy = useMemo(() => language === "vi" ? {
    back: "Tất cả trò chơi", eyebrow: "ARCADE · KỸ NĂNG · 1–2 NGƯỜI", title: "Neon Classic Pong",
    intro: "Pong nguyên bản với bóng tăng tốc, hiệu ứng neon và ba mức AI công bằng.", left: "Người chơi 1", rightAi: "Máy", rightLocal: "Người chơi 2",
    firstTo: "Chạm", points: "điểm để thắng", mode: "Chế độ", solo: "Đấu với máy", local: "Hai người", target: "Điểm thắng", difficulty: "Độ khó",
    easy: "Dễ", normal: "Vừa", hard: "Khó", start: "Bắt đầu trận", serve: "Giao bóng", serveHint: "Space / chạm sân", paused: "Đã tạm dừng",
    resume: "Tiếp tục", winner: "Chiến thắng!", rematch: "Chơi lại", settings: "Thiết lập", pause: "Tạm dừng", soundOn: "Bật âm thanh", soundOff: "Tắt âm thanh",
    controls: "P1: W/S · P2: ↑/↓ · Space giao bóng · P tạm dừng", touch: "Trên điện thoại, kéo trực tiếp vợt trên sân.", speed: "Tốc độ bóng", stats: "Thành tích",
  } : {
    back: "All games", eyebrow: "ARCADE · SKILL · 1–2 PLAYERS", title: "Neon Classic Pong",
    intro: "Pure Pong with an accelerating ball, neon impact feedback, and three fair AI levels.", left: "Player 1", rightAi: "CPU", rightLocal: "Player 2",
    firstTo: "First to", points: "points wins", mode: "Mode", solo: "Vs CPU", local: "Local 2P", target: "Winning score", difficulty: "Difficulty",
    easy: "Easy", normal: "Normal", hard: "Hard", start: "Start match", serve: "Serve", serveHint: "Space / tap court", paused: "Match paused",
    resume: "Resume", winner: "wins!", rematch: "Rematch", settings: "Settings", pause: "Pause", soundOn: "Enable sound", soundOff: "Mute sound",
    controls: "P1: W/S · P2: ↑/↓ · Space to serve · P to pause", touch: "On mobile, drag a paddle directly on the court.", speed: "Ball speed", stats: "Record",
  }, [language]);

  const syncState = useCallback((next: PongState) => {
    stateRef.current = next;
    setView(next);
  }, []);

  const unlockAudio = useCallback(() => {
    audioRef.current ??= new PongAudio();
    audioRef.current.setMuted(muted);
    void audioRef.current.unlock();
  }, [muted]);

  const serve = useCallback(() => {
    unlockAudio();
    const next = startRally(stateRef.current);
    if (next !== stateRef.current) {
      audioRef.current?.playCountdown();
      syncState(next);
      setAnnouncement(copy.serve);
    }
  }, [copy.serve, syncState, unlockAudio]);

  const resetMatch = useCallback((nextSettings = settings) => {
    const next = createMatch(nextSettings);
    accumulatorRef.current = 0;
    trailRef.current = [];
    recordedWinnerRef.current = null;
    syncState(next);
  }, [settings, syncState]);

  useEffect(() => {
    const storedSettings = parseSettings(safeRead(SETTINGS_KEY));
    const storedMuted = parseBoolean(safeRead(MUTED_KEY), false);
    const storedMotion = parseBoolean(
      safeRead(MOTION_KEY),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const storedStats = parseStats(safeRead(STATS_KEY));
    const readTheme = () => setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
    const hydrationTimer = window.setTimeout(() => {
      setSettings(storedSettings);
      setMuted(storedMuted);
      setReducedMotion(storedMotion);
      setStats(storedStats);
      syncState(createMatch(storedSettings));
      readTheme();
    }, 0);
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      window.clearTimeout(hydrationTimer);
      observer.disconnect();
    };
  }, [syncState]);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
    safeWrite(MUTED_KEY, String(muted));
  }, [muted]);  useEffect(() => {
    if (!showSettings) return;
    const dialog = modalRef.current;
    if (!dialog) return;
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])"));
    focusables[0]?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    return () => dialog.removeEventListener("keydown", trapFocus);
  }, [showSettings, settings.mode]);

  useEffect(() => { safeWrite(MOTION_KEY, String(reducedMotion)); }, [reducedMotion]);
  useEffect(() => () => audioRef.current?.dispose(), []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      const current = stateRef.current;
      const next = pauseMatch(current);
      if (next !== current) {
        accumulatorRef.current = 0;
        syncState(next);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [syncState]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent, down: boolean) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("button, input, select, textarea, a, [contenteditable='true']")) return;
      if (["KeyW", "KeyS", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
      if (event.code === "KeyW") inputRef.current.leftUp = down;
      if (event.code === "KeyS") inputRef.current.leftDown = down;
      if (event.code === "ArrowUp") inputRef.current.rightUp = down;
      if (event.code === "ArrowDown") inputRef.current.rightDown = down;
      if (down && !event.repeat && event.code === "Space") serve();
      if (down && !event.repeat && (event.code === "KeyP" || event.code === "Escape")) {
        const current = stateRef.current;
        syncState(current.phase === "paused" ? resumeMatch(current) : pauseMatch(current));
      }
    };
    const down = (event: KeyboardEvent) => onKey(event, true);
    const up = (event: KeyboardEvent) => onKey(event, false);
    const blur = () => { inputRef.current = { ...EMPTY_INPUT }; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [serve, syncState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const frame = (time: number) => {
      const previous = lastTimeRef.current ?? time;
      lastTimeRef.current = time;
      const delta = Math.min(64, time - previous);
      if (stateRef.current.phase === "playing") {
        const advanced = advanceFixed(stateRef.current, accumulatorRef.current, delta, inputRef.current);
        stateRef.current = advanced.state;
        accumulatorRef.current = advanced.accumulatorMs;
        const current = advanced.state;
        if (!reducedMotion) trailRef.current = [...trailRef.current.slice(-11), { x: current.ball.x, y: current.ball.y }];
        if (current.eventId !== lastEventRef.current) {
          lastEventRef.current = current.eventId;
          if (current.event === "paddle") audioRef.current?.playPaddleHit();
          if (current.event === "wall") audioRef.current?.playWallBounce();
          if (current.event === "score") audioRef.current?.playScore();
          if (current.event === "victory") audioRef.current?.playVictory();
          setView(current);
        } else if (time - renderedAtRef.current > 90) {
          renderedAtRef.current = time; setView(current);
        }
      }
      drawScene(context, stateRef.current, theme, trailRef.current, reducedMotion);
      frameRef.current = requestAnimationFrame(frame);
    };
    frameRef.current = requestAnimationFrame(frame);
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); lastTimeRef.current = null; };
  }, [reducedMotion, theme]);

  useEffect(() => {
    if (view.phase !== "gameover" || !view.winner) return;
    const recordKey = `${view.winner}:${view.leftScore}:${view.rightScore}`;
    if (recordedWinnerRef.current === recordKey) return;
    recordedWinnerRef.current = recordKey;
    setStats((current) => {
      const next = { ...current };
      if (view.mode === "ai") {
        if (view.winner === "left") next.soloWins += 1;
        else next.soloLosses += 1;
      } else if (view.winner === "left") next.leftWins += 1;
      else next.rightWins += 1;
      safeWrite(STATS_KEY, JSON.stringify(next));
      return next;
    });
    setAnnouncement(`${view.winner === "left" ? copy.left : view.mode === "ai" ? copy.rightAi : copy.rightLocal} ${copy.winner}`);
  }, [copy, view]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioRef.current ??= new PongAudio();
    audioRef.current.setMuted(nextMuted);
    if (!nextMuted) void audioRef.current.unlock();
  };
  const updateSettings = <K extends keyof PongSettings>(key: K, value: PongSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next); safeWrite(SETTINGS_KEY, JSON.stringify(next));
  };
  const beginMatch = () => { unlockAudio(); resetMatch(settings); setShowSettings(false); };
  const togglePause = () => {
    const current = stateRef.current;
    syncState(current.phase === "paused" ? resumeMatch(current) : pauseMatch(current));
  };
  const openSettings = () => {
    const current = stateRef.current;
    const next = pauseMatch(current);
    if (next !== current) {
      accumulatorRef.current = 0;
      syncState(next);
    }
    setShowSettings(true);
  };
  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const worldY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    const side = pointerSidesRef.current.get(event.pointerId) ?? (settings.mode === "local" && event.clientX > rect.left + rect.width / 2 ? "right" : "left");
    const current = stateRef.current; const paddle = side === "left" ? current.leftPaddle : current.rightPaddle;
    syncState({ ...current, [side === "left" ? "leftPaddle" : "rightPaddle"]: { ...paddle, y: clamp(worldY - paddle.height / 2, 0, WORLD_HEIGHT - paddle.height) } });
  };
  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    unlockAudio(); event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    pointerSidesRef.current.set(event.pointerId, settings.mode === "local" && event.clientX > rect.left + rect.width / 2 ? "right" : "left");
    pointerMove(event); if (stateRef.current.phase === "ready") serve();
  };

  const rightName = settings.mode === "ai" ? copy.rightAi : copy.rightLocal;
  const winnerName = view.winner === "left" ? copy.left : rightName;

  return (
    <main className={styles.page} data-reduced-motion={reducedMotion}>
      <div className={styles.topbar}>
        <Link href="/playground" className={styles.back}><ArrowLeft size={16} /> {copy.back}</Link>
        <div className={styles.actions}>
          <button type="button" onClick={toggleMute} aria-label={muted ? copy.soundOn : copy.soundOff}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <button type="button" onClick={togglePause} disabled={view.phase === "ready" || view.phase === "gameover"} aria-label={view.phase === "paused" ? copy.resume : copy.pause}>{view.phase === "paused" ? <Play size={17} /> : <Pause size={17} />}</button>
          <button type="button" onClick={openSettings} aria-label={copy.settings}><Settings2 size={17} /></button>
        </div>
      </div>

      <header className={styles.hero}>
        <p>{copy.eyebrow}</p><h1>{copy.title}</h1><span>{copy.intro}</span>
      </header>

      <section className={styles.gameShell} data-theme={theme}>
        <div className={styles.scoreboard}>
          <div><span>{copy.left}</span><strong>{view.leftScore}</strong></div>
          <p>{copy.firstTo} <b>{settings.targetScore}</b> {copy.points}</p>
          <div><span>{rightName}</span><strong>{view.rightScore}</strong></div>
        </div>

        <div className={styles.court}>
          <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} onPointerDown={pointerDown} onPointerMove={(event) => { if (pointerSidesRef.current.has(event.pointerId)) pointerMove(event); }} onPointerUp={(event) => { pointerSidesRef.current.delete(event.pointerId); }} onPointerCancel={(event) => { pointerSidesRef.current.delete(event.pointerId); }} aria-label="Neon Pong game court" />
          {view.phase === "ready" && !showSettings && <div className={styles.overlay}><button type="button" onClick={serve}><Play size={19} /> {copy.serve}</button><span>{copy.serveHint}</span></div>}
          {view.phase === "paused" && <div className={styles.overlay}><h2>{copy.paused}</h2><button type="button" onClick={togglePause}><Play size={19} /> {copy.resume}</button></div>}
          {view.phase === "gameover" && <div className={styles.overlay}><h2>{winnerName} {copy.winner}</h2><p>{view.leftScore} — {view.rightScore}</p><button type="button" onClick={() => resetMatch()}><RotateCcw size={19} /> {copy.rematch}</button></div>}
        </div>

        <div className={styles.gameMeta}><span>{copy.controls}</span><b>{copy.speed}: {Math.round(view.ball.speed)}</b></div>
        <p className={styles.touchHint}>{copy.touch}</p>
      </section>

      <section className={styles.record}><strong>{copy.stats}</strong><span>{settings.mode === "ai" ? `${stats.soloWins}W · ${stats.soloLosses}L` : `P1 ${stats.leftWins} · P2 ${stats.rightWins}`}</span><label><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Reduced motion</label></section>

      {showSettings && <div className={styles.modalBackdrop} role="presentation"><section ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pong-settings-title">
        <div className={styles.modalTitle}><div><span>{copy.eyebrow}</span><h2 id="pong-settings-title">{copy.settings}</h2></div>{settings.mode === "ai" ? <Bot size={27} /> : <Users size={27} />}</div>
        <fieldset><legend>{copy.mode}</legend><div className={styles.choiceRow}><button type="button" data-active={settings.mode === "ai"} aria-pressed={settings.mode === "ai"} onClick={() => updateSettings("mode", "ai")}><Bot size={18} /> {copy.solo}</button><button type="button" data-active={settings.mode === "local"} aria-pressed={settings.mode === "local"} onClick={() => updateSettings("mode", "local")}><Users size={18} /> {copy.local}</button></div></fieldset>
        <fieldset><legend>{copy.target}</legend><div className={styles.choiceRow}>{([5, 7, 11] as const).map((score) => <button type="button" key={score} data-active={settings.targetScore === score} aria-pressed={settings.targetScore === score} onClick={() => updateSettings("targetScore", score)}>{score}</button>)}</div></fieldset>
        {settings.mode === "ai" && <fieldset><legend>{copy.difficulty}</legend><div className={styles.choiceRow}>{(["easy", "normal", "hard"] as const).map((level) => <button type="button" key={level} data-active={settings.difficulty === level} aria-pressed={settings.difficulty === level} onClick={() => updateSettings("difficulty", level)}>{copy[level]}</button>)}</div></fieldset>}
        <button type="button" className={styles.primary} onClick={beginMatch}><Play size={18} /> {copy.start}</button>
      </section></div>}
      <p className={styles.srOnly} aria-live="polite">{announcement}</p>
    </main>
  );
}
