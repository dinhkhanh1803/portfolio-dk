"use client";

import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { SkyHopperAudio } from "./sky-hopper-audio";
import {
  BIRD_RADIUS,
  FLOOR_Y,
  PIPE_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceFixed,
  createGame,
  flap,
  type SkyHopperState,
} from "./sky-hopper-engine";
import {
  BEST_SCORE_KEY,
  MUTED_KEY,
  readBestScore,
  readStoredBoolean,
  REDUCED_MOTION_KEY,
} from "./sky-hopper-storage";
import styles from "./sky-hopper.module.css";

const START_SEED = 0x534b5948;
const INITIAL_GAME = createGame(START_SEED);

type SceneTheme = "light" | "dark";

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, scale: number, alpha: number) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(x, y, 31 * scale, 0, Math.PI * 2);
  context.arc(x + 38 * scale, y - 12 * scale, 42 * scale, 0, Math.PI * 2);
  context.arc(x + 84 * scale, y + 2 * scale, 29 * scale, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: SkyHopperState,
  theme: SceneTheme,
  reducedMotion: boolean,
) {
  const dark = theme === "dark";
  const gradient = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  gradient.addColorStop(0, dark ? "#071827" : "#73d7f2");
  gradient.addColorStop(0.62, dark ? "#123c4c" : "#c5f0f3");
  gradient.addColorStop(1, dark ? "#184a46" : "#e8f4cf");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  context.fillStyle = dark ? "rgba(237,248,247,.86)" : "rgba(255,239,159,.95)";
  context.beginPath();
  context.arc(585, 116, dark ? 39 : 51, 0, Math.PI * 2);
  context.fill();
  if (dark) {
    context.fillStyle = "#071827";
    context.beginPath();
    context.arc(600, 102, 38, 0, Math.PI * 2);
    context.fill();
  }

  const drift = reducedMotion ? 0 : state.elapsed * 19;
  drawCloud(context, ((90 - drift * 0.55) % 900 + 900) % 900 - 130, 170, 1.05, dark ? 0.13 : 0.55);
  drawCloud(context, ((470 - drift * 0.8) % 940 + 940) % 940 - 110, 300, 0.72, dark ? 0.1 : 0.42);
  drawCloud(context, ((760 - drift * 0.42) % 1050 + 1050) % 1050 - 150, 95, 0.85, dark ? 0.09 : 0.38);

  context.fillStyle = dark ? "#12333b" : "#8fc8aa";
  context.beginPath();
  context.moveTo(0, FLOOR_Y);
  for (let x = 0; x <= WORLD_WIDTH; x += 80) {
    context.lineTo(x, 690 + Math.sin((x + drift * 0.18) / 85) * 30);
  }
  context.lineTo(WORLD_WIDTH, FLOOR_Y);
  context.closePath();
  context.fill();

  state.pipes.forEach((pipe) => {
    const gapTop = pipe.gapY - pipe.gapSize / 2;
    const gapBottom = pipe.gapY + pipe.gapSize / 2;
    const pipeGradient = context.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    pipeGradient.addColorStop(0, dark ? "#1b8f78" : "#37b96d");
    pipeGradient.addColorStop(0.55, dark ? "#45d7a7" : "#73dc79");
    pipeGradient.addColorStop(1, dark ? "#126653" : "#218e50");
    context.fillStyle = pipeGradient;
    context.strokeStyle = dark ? "#0a463c" : "#17663c";
    context.lineWidth = 5;

    roundedRect(context, pipe.x + 8, -18, PIPE_WIDTH - 16, gapTop - 6, 13);
    context.fill();
    context.stroke();
    roundedRect(context, pipe.x - 2, gapTop - 34, PIPE_WIDTH + 4, 34, 10);
    context.fill();
    context.stroke();

    roundedRect(context, pipe.x + 8, gapBottom + 6, PIPE_WIDTH - 16, FLOOR_Y - gapBottom + 24, 13);
    context.fill();
    context.stroke();
    roundedRect(context, pipe.x - 2, gapBottom, PIPE_WIDTH + 4, 34, 10);
    context.fill();
    context.stroke();
  });

  context.save();
  context.translate(state.bird.x, state.bird.y);
  context.rotate(state.bird.rotation);
  context.fillStyle = "rgba(0,0,0,.18)";
  context.beginPath();
  context.ellipse(3, BIRD_RADIUS + 12, 30, 9, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffca4b";
  context.strokeStyle = "#7d451a";
  context.lineWidth = 4;
  context.beginPath();
  context.ellipse(0, 0, 31, 25, -0.08, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#f47b5f";
  context.beginPath();
  context.ellipse(-15, 9, 19, 11, -0.45, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#fff";
  context.beginPath();
  context.arc(14, -9, 10, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#15252c";
  context.beginPath();
  context.arc(17, -8, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ef725f";
  context.beginPath();
  context.moveTo(27, 1);
  context.lineTo(48, 8);
  context.lineTo(27, 14);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  context.fillStyle = dark ? "#173a36" : "#79be69";
  context.fillRect(0, FLOOR_Y, WORLD_WIDTH, WORLD_HEIGHT - FLOOR_Y);
  context.fillStyle = dark ? "#45d7a7" : "#b8e56e";
  context.fillRect(0, FLOOR_Y, WORLD_WIDTH, 13);
  context.fillStyle = dark ? "rgba(255,255,255,.06)" : "rgba(56,82,42,.12)";
  const stripeOffset = reducedMotion ? 0 : (state.elapsed * state.speed * 0.35) % 46;
  for (let x = -46 + stripeOffset; x < WORLD_WIDTH + 46; x += 46) {
    context.beginPath();
    context.moveTo(x, FLOOR_Y + 13);
    context.lineTo(x + 22, WORLD_HEIGHT);
    context.lineTo(x + 42, WORLD_HEIGHT);
    context.lineTo(x + 20, FLOOR_Y + 13);
    context.closePath();
    context.fill();
  }
}

export default function SkyHopperGame() {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SkyHopperState>(INITIAL_GAME);
  const audioRef = useRef<SkyHopperAudio | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const [view, setView] = useState(INITIAL_GAME);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<SceneTheme>("light");
  const [announcement, setAnnouncement] = useState("");

  const copy = useMemo(() => language === "vi" ? {
    back: "Tất cả trò chơi",
    eyebrow: "ARCADE · ENDLESS · PHẢN XẠ",
    title: "Sky Hopper",
    intro: "Chạm để bay, lách qua các cổng mây và giữ nhịp càng lâu càng tốt.",
    score: "Điểm",
    best: "Kỷ lục",
    speed: "Tốc độ",
    ready: "Chạm để cất cánh",
    readyHint: "Click, chạm màn hình hoặc nhấn Space",
    gameover: "Va chạm!",
    retry: "Bay lại",
    pause: "Tạm dừng",
    resume: "Tiếp tục",
    muted: "Bật âm thanh",
    sound: "Tắt âm thanh",
    motion: "Giảm hiệu ứng",
    newGame: "Ván mới",
  } : {
    back: "All games",
    eyebrow: "ARCADE · ENDLESS · REACTION",
    title: "Sky Hopper",
    intro: "Tap to fly, thread the cloud gates, and keep your rhythm as long as possible.",
    score: "Score",
    best: "Best",
    speed: "Speed",
    ready: "Tap to take off",
    readyHint: "Click, tap, or press Space",
    gameover: "Collision!",
    retry: "Fly again",
    pause: "Pause",
    resume: "Resume",
    muted: "Unmute",
    sound: "Mute",
    motion: "Reduce effects",
    newGame: "New run",
  }, [language]);

  const publishBest = useCallback((score: number) => {
    setBest((current) => {
      const next = Math.max(current, score);
      window.localStorage.setItem(BEST_SCORE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const audio = new SkyHopperAudio();
    audioRef.current = audio;
    const root = document.documentElement;
    const updateTheme = () => setTheme(root.dataset.theme === "dark" ? "dark" : "light");
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextMuted = readStoredBoolean(window.localStorage.getItem(MUTED_KEY), false);
    const nextReduced = readStoredBoolean(
      window.localStorage.getItem(REDUCED_MOTION_KEY),
      systemReduced,
    );
    const hydrate = window.setTimeout(() => {
      audio.setMuted(nextMuted);
      setMuted(nextMuted);
      setReducedMotion(nextReduced);
      setBest(readBestScore(window.localStorage.getItem(BEST_SCORE_KEY)));
    }, 0);
    return () => {
      window.clearTimeout(hydrate);
      observer.disconnect();
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
      if (document.hidden && stateRef.current.phase === "playing") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    const render = (time: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (canvas && context) {
        if (!paused && stateRef.current.phase === "playing") {
          const previous = stateRef.current;
          const delta = lastTimeRef.current === null ? 0 : Math.max(0, time - lastTimeRef.current);
          const advanced = advanceFixed(previous, accumulatorRef.current, delta);
          const next = advanced.state;
          accumulatorRef.current = advanced.accumulatorMs;
          stateRef.current = next;
          const hudTickChanged = Math.floor(next.elapsed * 4) !== Math.floor(previous.elapsed * 4);
          if (next.score !== previous.score) {
            audioRef.current?.playScore();
            publishBest(next.score);
            setAnnouncement(`${copy.score}: ${next.score}`);
          }
          if (next.phase !== previous.phase) {
            setPaused(false);
            audioRef.current?.playCrash();
            publishBest(next.score);
            setAnnouncement(copy.gameover);
          }
          if (next.score !== previous.score || next.phase !== previous.phase || hudTickChanged) setView(next);
        }
        drawScene(context, stateRef.current, theme, reducedMotion);
      }
      lastTimeRef.current = time;
      frameRef.current = requestAnimationFrame(render);
    };
    frameRef.current = requestAnimationFrame(render);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTimeRef.current = null;
      accumulatorRef.current = 0;
    };
  }, [copy.gameover, copy.score, paused, publishBest, reducedMotion, theme]);

  const takeAction = useCallback(() => {
    if (paused) return;
    let current = stateRef.current;
    if (current.phase === "gameover") {
      current = createGame(Date.now() >>> 0);
      accumulatorRef.current = 0;
    }
    const next = flap(current);
    stateRef.current = next;
    setView(next);
    const audio = audioRef.current;
    void audio?.unlock().then(() => {
      audio.playFlap();
      if (current.phase === "ready") audio.playStart();
    });
  }, [paused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== "ArrowUp") return;
      const target = event.target;
      if (target instanceof Element && target.closest("button, input, select, textarea, a, [contenteditable='true']")) return;
      event.preventDefault();
      void takeAction();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [takeAction]);

  const reset = useCallback(() => {
    const next = createGame(Date.now() >>> 0);
    accumulatorRef.current = 0;
    stateRef.current = next;
    setView(next);
    setPaused(false);
    setAnnouncement("");
  }, []);

  const overlayPaused = paused && view.phase === "playing";

  return (
    <main className={styles.gamePage} data-reduced-motion={reducedMotion}>
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
          <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? copy.muted : copy.sound}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-label={overlayPaused ? copy.resume : copy.pause}
                disabled={view.phase !== "playing"}
              >
                {overlayPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </header>

      <section className={styles.gameLayout} data-theme={theme}>
        <div className={styles.hud}>
          <div><span>{copy.score}</span><strong>{view.score}</strong></div>
          <div><span>{copy.best}</span><strong>{Math.max(best, view.score)}</strong></div>
          <div><span>{copy.speed}</span><strong>{(view.speed / 190).toFixed(1)}×</strong></div>
        </div>

        <div className={styles.canvasShell}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            onPointerDown={() => void takeAction()}
            role="button"
            tabIndex={0}
            aria-label={copy.readyHint}
          />

          {(view.phase === "ready" || view.phase === "gameover" || overlayPaused) && (
            <div className={styles.overlay} data-phase={overlayPaused ? "paused" : view.phase}>
              <div className={styles.overlayCard}>
                <span className={styles.birdMark}>↗</span>
                <h2>{overlayPaused ? copy.pause : view.phase === "gameover" ? copy.gameover : copy.ready}</h2>
                {view.phase === "gameover" ? (
                  <p>{copy.score}: <strong>{view.score}</strong> · {copy.best}: <strong>{Math.max(best, view.score)}</strong></p>
                ) : (
                  <p>{copy.readyHint}</p>
                )}
                <button type="button" onClick={overlayPaused ? () => setPaused(false) : () => void takeAction()}>
                  <Play size={17} /> {overlayPaused ? copy.resume : view.phase === "gameover" ? copy.retry : copy.ready}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <button type="button" onClick={reset}><RotateCcw size={15} /> {copy.newGame}</button>
          <label>
            <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
            {copy.motion}
          </label>
          <span>SPACE / TAP</span>
        </div>
      </section>

      <output className={styles.srStatus} aria-live="polite">{announcement}</output>
    </main>
  );
}
