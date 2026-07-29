"use client";

import { ArrowLeft, Heart, Pause, Play, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { NeonBreakerAudio } from "./neon-breaker-audio";
import { LEVELS } from "./neon-breaker-levels";
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceFixed,
  createRun,
  fireLaser,
  launchBall,
  pauseRun,
  resumeRun,
  startNextLevel,
  type BreakerEvent,
  type BreakerInput,
  type BreakerState,
  type PowerUpType,
} from "./neon-breaker-engine";
import {
  DEFAULT_PROGRESS,
  MOTION_KEY,
  MUTED_KEY,
  PROGRESS_KEY,
  parseBoolean,
  parseProgress,
  safeRead,
  safeWrite,
  type BreakerProgress,
} from "./neon-breaker-storage";
import styles from "./neon-breaker.module.css";

type SceneTheme = "light" | "dark";
type Trail = { x: number; y: number; alpha: number };

const EMPTY_INPUT: BreakerInput = { left: false, right: false, pointerX: null };
const INITIAL_RUN = createRun();
const LEVEL_COUNT = LEVELS.length;
const brickColors = {
  standard: ["#2fd2cf", "#176f86"],
  reinforced: ["#ffb64c", "#e46d52"],
  indestructible: ["#879ca4", "#44555e"],
} as const;

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawGame(
  context: CanvasRenderingContext2D,
  state: BreakerState,
  theme: SceneTheme,
  trails: Trail[],
  reducedMotion: boolean,
) {
  const dark = theme === "dark";
  const background = context.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  background.addColorStop(0, dark ? "#06151b" : "#edf9f7");
  background.addColorStop(0.55, dark ? "#0a242b" : "#d9f0ed");
  background.addColorStop(1, dark ? "#101824" : "#fff2e9");
  context.fillStyle = background;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  context.strokeStyle = dark ? "rgba(92,231,224,.075)" : "rgba(19,103,108,.085)";
  context.lineWidth = 1;
  for (let x = 0; x <= WORLD_WIDTH; x += 50) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, WORLD_HEIGHT); context.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 50) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(WORLD_WIDTH, y); context.stroke();
  }

  for (const brick of state.bricks) {
    if (brick.destroyed) continue;
    const colors = brickColors[brick.kind];
    const gradient = context.createLinearGradient(brick.x, brick.y, brick.x + brick.width, brick.y + brick.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    context.save();
    context.shadowBlur = dark ? 15 : 8;
    context.shadowColor = colors[0];
    context.globalAlpha = brick.hitsRemaining === 1 && brick.kind === "reinforced" ? 0.58 : 1;
    context.fillStyle = gradient;
    roundedRect(context, brick.x, brick.y, brick.width, brick.height, 9);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.36)";
    context.stroke();
    if (brick.kind === "indestructible") {
      context.strokeStyle = "rgba(255,255,255,.35)";
      context.beginPath();
      context.moveTo(brick.x + 10, brick.y + brick.height - 8);
      context.lineTo(brick.x + brick.width - 10, brick.y + 8);
      context.stroke();
    }
    context.restore();
  }

  if (!reducedMotion) {
    for (const point of trails) {
      context.fillStyle = `rgba(79, 226, 220, ${point.alpha})`;
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.save();
  context.shadowBlur = dark ? 28 : 15;
  context.shadowColor = "#39d7d2";
  const paddleGradient = context.createLinearGradient(
    state.paddle.x,
    state.paddle.y,
    state.paddle.x + state.paddle.width,
    state.paddle.y,
  );
  paddleGradient.addColorStop(0, "#187f8b");
  paddleGradient.addColorStop(0.5, "#59e1db");
  paddleGradient.addColorStop(1, "#187f8b");
  context.fillStyle = paddleGradient;
  roundedRect(context, state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, 12);
  context.fill();
  context.restore();

  for (const ball of state.balls) {
    context.save();
    context.shadowBlur = dark ? 24 : 12;
    context.shadowColor = "#f5ffff";
    context.fillStyle = dark ? "#f5ffff" : "#17333b";
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  for (const drop of state.drops) {
    const color = {
      wide: "#54d9d3",
      slow: "#ffbb58",
      multiball: "#f37866",
      laser: "#fb6fae",
      shield: "#78a7ff",
    }[drop.type];
    context.save();
    context.shadowBlur = 18;
    context.shadowColor = color;
    context.fillStyle = color;
    context.beginPath();
    context.arc(drop.x, drop.y, drop.size / 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#092129";
    context.font = "900 14px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    const symbol = {
      wide: "W",
      slow: "S",
      multiball: "×3",
      laser: "L",
      shield: "◆",
    }[drop.type];
    context.fillText(symbol, drop.x, drop.y + 1);
    context.restore();
  }
}

export default function NeonBreakerGame() {
  const { language } = useLanguage();
  const stateRef = useRef(INITIAL_RUN);
  const [view, setView] = useState(INITIAL_RUN);
  const [progress, setProgress] = useState<BreakerProgress>(DEFAULT_PROGRESS);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<SceneTheme>("light");
  const [announcement, setAnnouncement] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<NeonBreakerAudio | null>(null);
  const inputRef = useRef<BreakerInput>({ ...EMPTY_INPUT });
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const lastEventRef = useRef(0);
  const trailsRef = useRef<Trail[]>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const copy = useMemo(() => language === "vi" ? {
    back: "Tất cả trò chơi", eyebrow: "ARCADE · PHẢN XẠ · KỸ NĂNG", title: "Neon Breaker",
    intro: "Phá sạch 10 màn gạch neon, giữ combo và săn 5 loại skill trước khi mất cả 3 mạng.",
    score: "Điểm", best: "Kỷ lục", level: "Màn", lives: "Mạng", combo: "Combo",
    ready: "Sẵn sàng phá gạch?", readyText: "Di chuyển thanh đỡ rồi phóng bóng.", launch: "Phóng bóng",
    paused: "Đã tạm dừng", resume: "Tiếp tục", clear: "Hoàn thành màn!", next: "Màn tiếp theo",
    gameover: "Hết lượt", victory: "Chinh phục Neon Breaker!", again: "Chơi lại",
    controls: "A / D hoặc ← / → để di chuyển · Space phóng bóng · P tạm dừng",
    touch: "Kéo trực tiếp trên sân để điều khiển thanh đỡ.", soundOn: "Bật âm thanh", soundOff: "Tắt âm thanh",
    pause: "Tạm dừng", restart: "Chơi lại", motion: "Giảm hiệu ứng",
    wide: "Thanh rộng", slow: "Bóng chậm", multiball: "Đa bóng",
    laser: "Laser", shield: "Khiên", serve: "Space để phát bóng",
  } : {
    back: "All games", eyebrow: "ARCADE · REACTION · SKILL", title: "Neon Breaker",
    intro: "Smash through ten handcrafted neon boards, hold your combo, and collect five skills before three lives run out.",
    score: "Score", best: "Best", level: "Level", lives: "Lives", combo: "Combo",
    ready: "Ready to break?", readyText: "Move the paddle, then launch.", launch: "Launch ball",
    paused: "Game paused", resume: "Resume", clear: "Level clear!", next: "Next level",
    gameover: "Run over", victory: "Neon Breaker conquered!", again: "Play again",
    controls: "A / D or ← / → to move · Space to launch · P to pause",
    touch: "Drag directly on the arena to move the paddle.", soundOn: "Enable sound", soundOff: "Mute sound",
    pause: "Pause", restart: "Restart", motion: "Reduce motion",
    wide: "Wide paddle", slow: "Slow ball", multiball: "Multiball",
    laser: "Laser", shield: "Shield", serve: "Press Space to launch",
  }, [language]);

  const sync = useCallback((next: BreakerState) => {
    stateRef.current = next;
    setView(next);
  }, []);

  const unlockAudio = useCallback(() => {
    audioRef.current ??= new NeonBreakerAudio();
    audioRef.current.setMuted(muted);
    void audioRef.current.unlock();
  }, [muted]);

  const launch = useCallback(() => {
    unlockAudio();
    sync(launchBall(stateRef.current));
  }, [sync, unlockAudio]);

  const activatePrimarySkill = useCallback(() => {
    const current = stateRef.current;
    if (current.phase === "ready" || current.balls.some((ball) => ball.attached)) {
      launch();
      return;
    }
    if (current.phase === "playing" && current.skills.laserShots > 0) {
      unlockAudio();
      sync(fireLaser(current, current.paddle.x + current.paddle.width / 2));
    }
  }, [launch, sync, unlockAudio]);

  const toggleMuted = useCallback(() => {
    const nextMuted = !muted;
    audioRef.current ??= new NeonBreakerAudio();
    audioRef.current.setMuted(nextMuted);
    if (!nextMuted) void audioRef.current.unlock();
    setMuted(nextMuted);
  }, [muted]);

  const reset = useCallback((level = 1) => {
    accumulatorRef.current = 0;
    trailsRef.current = [];
    sync(createRun(level));
    setAnnouncement(copy.ready);
  }, [copy.ready, sync]);

  useEffect(() => {
    const storedProgress = parseProgress(safeRead(PROGRESS_KEY));
    const storedMuted = parseBoolean(safeRead(MUTED_KEY), false);
    const storedMotion = parseBoolean(
      safeRead(MOTION_KEY),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const readTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const timer = window.setTimeout(() => {
      setProgress(storedProgress);
      setMuted(storedMuted);
      setReducedMotion(storedMotion);
      readTheme();
    }, 0);
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
    safeWrite(MUTED_KEY, String(muted));
  }, [muted]);
  useEffect(() => { safeWrite(MOTION_KEY, String(reducedMotion)); }, [reducedMotion]);
  useEffect(() => () => audioRef.current?.dispose(), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent, down: boolean) => {
      const isLeft = event.code === "ArrowLeft" || event.code === "KeyA";
      const isRight = event.code === "ArrowRight" || event.code === "KeyD";
      if (!down) {
        if (isLeft) inputRef.current.left = false;
        if (isRight) inputRef.current.right = false;
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && target.closest("button, input, select, textarea, a, [contenteditable='true']")) return;
      if (isLeft) inputRef.current.left = true;
      if (isRight) inputRef.current.right = true;
      if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (!down || event.repeat) return;
      if (event.code === "Space") activatePrimarySkill();
      if (event.code === "KeyP" || event.code === "Escape") {
        sync(stateRef.current.phase === "paused" ? resumeRun(stateRef.current) : pauseRun(stateRef.current));
      }
    };
    const down = (event: KeyboardEvent) => onKey(event, true);
    const up = (event: KeyboardEvent) => onKey(event, false);
    const visibility = () => {
      if (document.hidden) sync(pauseRun(stateRef.current));
    };
    const blur = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.pointerX = null;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [activatePrimarySkill, sync]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>("button, a"));
    controls[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (controls.length === 1) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", trap);
    return () => dialog.removeEventListener("keydown", trap);
  }, [view.phase]);

  useEffect(() => {
    const tick = (time: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      const last = lastTimeRef.current ?? time;
      lastTimeRef.current = time;
      if (stateRef.current.phase === "playing") {
        const advanced = advanceFixed(
          stateRef.current,
          accumulatorRef.current,
          Math.min(50, time - last),
          inputRef.current,
        );
        accumulatorRef.current = advanced.accumulatorMs;
        stateRef.current = advanced.state;
        setView(advanced.state);
      }
      const ball = stateRef.current.balls[0];
      if (ball && !reducedMotion) {
        trailsRef.current = [...trailsRef.current.slice(-13), { x: ball.x, y: ball.y, alpha: 0.16 }];
      } else trailsRef.current = [];
      if (context) drawGame(context, stateRef.current, theme, trailsRef.current, reducedMotion);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = null;
    };
  }, [reducedMotion, theme]);

  useEffect(() => {
    if (!view.event || view.eventId === lastEventRef.current) return;
    lastEventRef.current = view.eventId;
    const event: BreakerEvent = view.event;
    if (event === "paddle") audioRef.current?.playPaddle();
    if (event === "wall") audioRef.current?.playWall();
    if (event === "brick" || event === "power-drop") audioRef.current?.playBrick();
    if (event === "power-collect") audioRef.current?.playPowerUp();
    if (event === "life-lost") audioRef.current?.playLifeLost();
    if (event === "level-clear") audioRef.current?.playLevelClear();
    if (event === "gameover") audioRef.current?.playGameOver();
    if (event === "victory") audioRef.current?.playVictory();
    if (event === "laser") audioRef.current?.playLaser();
    if (event === "shield") audioRef.current?.playShield();
    const labels: Partial<Record<Exclude<BreakerEvent, null>, string>> = {
      "life-lost": copy.lives, "level-clear": copy.clear, gameover: copy.gameover,
      victory: copy.victory, "power-collect": "Power-up!",
      laser: copy.laser, shield: copy.shield,
    };
    if (!event || !labels[event]) return;
    const timer = window.setTimeout(() => setAnnouncement(labels[event] ?? ""), 0);
    return () => window.clearTimeout(timer);
  }, [copy, view.event, view.eventId]);

  useEffect(() => {
    if (!["level-clear", "gameover", "victory"].includes(view.phase)) return;
    const next = {
      bestScore: Math.max(progress.bestScore, view.score),
      unlockedLevel: Math.max(progress.unlockedLevel, Math.min(LEVEL_COUNT, view.phase === "level-clear" ? view.level + 1 : view.level)),
    };
    if (next.bestScore !== progress.bestScore || next.unlockedLevel !== progress.unlockedLevel) {
      const timer = window.setTimeout(() => setProgress(next), 0);
      safeWrite(PROGRESS_KEY, JSON.stringify(next));
      return () => window.clearTimeout(timer);
    }
  }, [progress, view.level, view.phase, view.score]);

  const pointerX = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const worldX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    inputRef.current.pointerX = worldX;
    return worldX;
  };
  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const targetX = pointerX(event);
    unlockAudio();
    if (stateRef.current.phase === "ready" || stateRef.current.balls.some((ball) => ball.attached)) {
      sync(launchBall(stateRef.current, targetX));
    } else if (stateRef.current.phase === "playing" && stateRef.current.skills.laserShots > 0) {
      sync(fireLaser(
        stateRef.current,
        stateRef.current.paddle.x + stateRef.current.paddle.width / 2,
      ));
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      pointerX(event);
    }
  };
  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    inputRef.current.pointerX = null;
  };

  const togglePause = () => sync(view.phase === "paused" ? resumeRun(view) : pauseRun(view));
  const displayBest = Math.max(progress.bestScore, view.score);
  const effectLabel = (type: PowerUpType) => copy[type];
  const activeEffects = [
    view.effects.wideRemainingMs > 0 ? `${effectLabel("wide")} ${Math.ceil(view.effects.wideRemainingMs / 1000)}s` : null,
    view.effects.slowRemainingMs > 0 ? `${effectLabel("slow")} ${Math.ceil(view.effects.slowRemainingMs / 1000)}s` : null,
    view.balls.length > 1 ? `${effectLabel("multiball")} ×${view.balls.length}` : null,
    view.skills.laserShots > 0 ? `${copy.laser} ×${view.skills.laserShots}` : null,
    view.skills.shieldCharges > 0 ? `${copy.shield} ◆` : null,
  ].filter(Boolean);

  return (
    <main className={styles.page} data-theme={theme} data-reduced-motion={reducedMotion}>
      <div className={styles.topbar}>
        <Link href="/playground" className={styles.back}><ArrowLeft size={15} /> {copy.back}</Link>
        <div className={styles.actions}>
          <button type="button" onClick={toggleMuted} aria-label={muted ? copy.soundOn : copy.soundOff} aria-pressed={muted}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button type="button" onClick={togglePause} disabled={!["playing", "paused"].includes(view.phase)} aria-label={copy.pause}>
            {view.phase === "paused" ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button type="button" onClick={() => reset()} aria-label={copy.restart}><RotateCcw size={17} /></button>
        </div>
      </div>

      <header className={styles.hero}>
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.intro}</span>
      </header>

      <section className={styles.gameShell}>
        <div className={styles.hud}>
          <div><span>{copy.score}</span><strong>{view.score.toLocaleString()}</strong></div>
          <div><span>{copy.best}</span><strong>{displayBest.toLocaleString()}</strong></div>
          <div><span>{copy.level}</span><strong>{view.level}/{LEVEL_COUNT}</strong></div>
          <div><span>{copy.lives}</span><strong className={styles.hearts}>{Array.from({ length: view.lives }, (_, index) => <Heart key={index} size={18} fill="currentColor" />)}</strong></div>
          <div><span>{copy.combo}</span><strong>×{view.combo.toFixed(view.combo % 1 ? 2 : 0)}</strong></div>
        </div>

        <div className={styles.arena}>
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Neon Breaker game arena"
          />
          {view.phase !== "playing"
            && !(view.phase === "ready" && ["life-lost", "shield"].includes(view.readyReason))
            && (
            <div
                className={styles.overlay}
                role="dialog"
                aria-modal="true"
                ref={dialogRef}
                onPointerDown={view.phase === "ready" ? launch : undefined}
              >
              <Zap size={28} />
              <h2>
                {view.phase === "ready" ? copy.ready
                  : view.phase === "paused" ? copy.paused
                    : view.phase === "level-clear" ? copy.clear
                      : view.phase === "victory" ? copy.victory : copy.gameover}
              </h2>
              <p>{view.phase === "ready" ? `${view.levelName} · ${copy.readyText}` : `${copy.score.toLocaleString()} ${copy.score.toLowerCase()}`}</p>
              {view.phase === "ready" && <button type="button" onClick={launch}><Play size={17} /> {copy.launch}</button>}
              {view.phase === "paused" && <button type="button" onClick={togglePause}><Play size={17} /> {copy.resume}</button>}
              {view.phase === "level-clear" && <button type="button" onClick={() => sync(startNextLevel(view))}>{copy.next} <ArrowLeft className={styles.forward} size={17} /></button>}
              {(view.phase === "gameover" || view.phase === "victory") && <button type="button" onClick={() => reset()}><RotateCcw size={17} /> {copy.again}</button>}
            </div>
          )}
          {((view.phase === "ready" && ["life-lost", "shield"].includes(view.readyReason))
            || (view.phase === "playing" && view.balls.some((ball) => ball.attached)))
            && <div className={styles.serveHint} aria-live="polite">{copy.serve}</div>}
        </div>

        <div className={styles.status}>
          <span>{copy.controls}</span>
          <b>{activeEffects.length ? activeEffects.join(" · ") : view.levelName}</b>
        </div>
        <p className={styles.touchHint}>{copy.touch}</p>
      </section>

      <div className={styles.options}>
        <label><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> {copy.motion}</label>
        <div>
          {Array.from({ length: progress.unlockedLevel }, (_, index) => (
            <button
                  type="button"
                  key={index + 1}
                  onClick={() => reset(index + 1)}
                  aria-label={`${copy.level} ${index + 1}`}
                  aria-pressed={view.level === index + 1}
                >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.srOnly} aria-live="polite">{announcement}</p>
    </main>
  );
}
