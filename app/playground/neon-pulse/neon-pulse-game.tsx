"use client";

import {
  ArrowLeft,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
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
import { NeonPulseAudio } from "./neon-pulse-audio";
import {
  createGame,
  resolveHit,
  stepGame,
  type GameState,
  type HitGrade,
} from "./neon-pulse-engine";

type Particle = {
  angle: number;
  distance: number;
  speed: number;
  life: number;
  color: string;
};

const HIGH_SCORE_KEY = "neon-pulse:high-score";
const MUTED_KEY = "neon-pulse:muted";
const REDUCED_MOTION_KEY = "neon-pulse:reduced-motion";
const TAU = Math.PI * 2;

function readBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value === "true" ? true : value === "false" ? false : fallback;
}

function readScore() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function gradeLabel(grade: HitGrade | null) {
  if (grade === "perfect") return "PERFECT";
  if (grade === "good") return "GOOD";
  if (grade === "miss") return "MISS";
  return "";
}

function drawArena(
  canvas: HTMLCanvasElement,
  state: GameState,
  particles: Particle[],
  reducedMotion: boolean,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const size = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = size * 0.34;
  const pulseX = centerX + Math.cos(state.pulseAngle) * radius;
  const pulseY = centerY + Math.sin(state.pulseAngle) * radius;

  context.clearRect(0, 0, width, height);
  const glow = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.08,
    centerX,
    centerY,
    radius * 1.42,
  );
  glow.addColorStop(0, "rgba(42,157,171,.12)");
  glow.addColorStop(0.62, "rgba(20,125,122,.04)");
  glow.addColorStop(1, "rgba(4,11,16,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.translate(centerX, centerY);
  context.strokeStyle = "rgba(157,199,198,.12)";
  context.lineWidth = Math.max(2, size * 0.007);
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.stroke();

  context.strokeStyle = "rgba(42,157,171,.09)";
  context.lineWidth = 1;
  for (let ring = 0.42; ring <= 0.84; ring += 0.21) {
    context.beginPath();
    context.arc(0, 0, radius * ring, 0, TAU);
    context.stroke();
  }

  context.shadowBlur = reducedMotion ? 8 : 24;
  context.shadowColor = "#2a9dab";
  context.strokeStyle = "#36c7ca";
  context.lineCap = "round";
  context.lineWidth = Math.max(12, size * 0.027);
  context.beginPath();
  context.arc(
    0,
    0,
    radius,
    state.targetAngle - state.targetWidth,
    state.targetAngle + state.targetWidth,
  );
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255,255,255,.72)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(
    0,
    0,
    radius,
    state.targetAngle - state.targetWidth * 0.32,
    state.targetAngle + state.targetWidth * 0.32,
  );
  context.stroke();
  context.restore();

  if (!reducedMotion) {
    for (let trail = 6; trail >= 1; trail -= 1) {
      const angle = state.pulseAngle - state.direction * trail * 0.035;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      context.beginPath();
      context.fillStyle = `rgba(54,199,202,${0.035 * (7 - trail)})`;
      context.arc(x, y, Math.max(2, size * 0.005 * (7 - trail)), 0, TAU);
      context.fill();
    }
  }

  context.save();
  context.shadowBlur = reducedMotion ? 8 : 30;
  context.shadowColor =
    state.feedback === "miss" ? "#ef725f" : "#36c7ca";
  context.fillStyle = state.feedback === "miss" ? "#ef725f" : "#efffff";
  context.beginPath();
  context.arc(pulseX, pulseY, Math.max(7, size * 0.018), 0, TAU);
  context.fill();
  context.restore();

  for (const particle of particles) {
    const distance = radius + particle.distance;
    const x = centerX + Math.cos(particle.angle) * distance;
    const y = centerY + Math.sin(particle.angle) * distance;
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(x, y, Math.max(1.5, size * 0.004), 0, TAU);
    context.fill();
  }
  context.globalAlpha = 1;

  context.fillStyle = "rgba(237,245,244,.9)";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${Math.max(21, size * 0.075)}px ui-sans-serif, system-ui`;
  context.fillText(state.combo > 1 ? `${state.combo}x` : "PULSE", centerX, centerY - 8);
  context.fillStyle = "rgba(145,166,164,.88)";
  context.font = `800 ${Math.max(10, size * 0.026)}px ui-monospace, monospace`;
  context.fillText(
    state.combo > 1 ? "COMBO" : "TAP THE TARGET",
    centerX,
    centerY + Math.max(26, size * 0.066),
  );
}

export default function NeonPulseGame() {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createGame());
  const particlesRef = useRef<Particle[]>([]);
  const audioRef = useRef<NeonPulseAudio | null>(null);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const [game, setGame] = useState(stateRef.current);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const publish = useCallback((next: GameState) => {
    stateRef.current = next;
    setGame(next);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const nextMuted = readBoolean(MUTED_KEY, false);
    const nextReduced = readBoolean(REDUCED_MOTION_KEY, prefersReduced);
    setHighScore(readScore());
    setMuted(nextMuted);
    setReducedMotion(nextReduced);
    const audio = new NeonPulseAudio();
    audio.setMuted(nextMuted);
    audioRef.current = audio;
    return () => {
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
    if (game.status !== "game-over" || game.score <= highScore) return;
    setHighScore(game.score);
    window.localStorage.setItem(HIGH_SCORE_KEY, String(game.score));
  }, [game.score, game.status, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawArena(canvas, stateRef.current, particlesRef.current, reducedMotion);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    const animate = (time: number) => {
      const previous = previousTimeRef.current || time;
      previousTimeRef.current = time;
      const delta = Math.min(50, time - previous);
      const next = stepGame(stateRef.current, delta);
      stateRef.current = next;

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          distance: particle.distance + particle.speed * (delta / 1000),
          life: particle.life - delta / 520,
        }))
        .filter((particle) => particle.life > 0);

      if (time - lastUiUpdateRef.current > 70) {
        lastUiUpdateRef.current = time;
        setGame(next);
      }
      if (canvasRef.current) {
        drawArena(
          canvasRef.current,
          next,
          particlesRef.current,
          reducedMotion,
        );
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      previousTimeRef.current = 0;
    };
  }, [reducedMotion]);

  const startGame = useCallback(async () => {
    await audioRef.current?.unlock();
    particlesRef.current = [];
    publish({ ...createGame(), status: "playing" });
  }, [publish]);

  const togglePause = useCallback(() => {
    const current = stateRef.current;
    if (current.status === "playing") {
      publish({ ...current, status: "paused" });
    } else if (current.status === "paused") {
      previousTimeRef.current = 0;
      publish({ ...current, status: "playing" });
    }
  }, [publish]);

  const attemptHit = useCallback(async () => {
    const current = stateRef.current;
    if (current.status !== "playing") return;
    await audioRef.current?.unlock();
    const next = resolveHit(current);
    audioRef.current?.playHit(next.feedback ?? "miss", next.combo);
    const count =
      reducedMotion ? 3 : next.feedback === "perfect" ? 18 : next.feedback === "good" ? 10 : 7;
    const color = next.feedback === "miss" ? "#ef725f" : "#36c7ca";
    particlesRef.current.push(
      ...Array.from({ length: count }, (_, index) => ({
        angle: current.pulseAngle + (index / Math.max(1, count - 1) - 0.5) * 0.62,
        distance: 0,
        speed: 28 + (index % 5) * 12,
        life: 1,
        color,
      })),
    );
    publish(next);
  }, [publish, reducedMotion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      const status = stateRef.current.status;
      if (status === "playing") void attemptHit();
      else if (status === "paused") togglePause();
      else void startGame();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [attemptHit, startGame, togglePause]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && stateRef.current.status === "playing") {
        publish({ ...stateRef.current, status: "paused" });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [publish]);

  const copy =
    language === "vi"
      ? {
          back: "Tất cả trò chơi",
          eyebrow: "ARCADE · REACTION · ENDLESS",
          title: "Neon Pulse",
          intro:
            "Chạm đúng nhịp, giữ combo và sống sót khi tốc độ tăng dần.",
          score: "Điểm",
          best: "Kỷ lục",
          combo: "Combo",
          time: "Thời gian",
          lives: "Mạng",
          start: "Bắt đầu",
          restart: "Chơi lại",
          resume: "Tiếp tục",
          paused: "Đã tạm dừng",
          ready: "Sẵn sàng bắt nhịp?",
          readyText: "Nhấn Space, click hoặc chạm khi pulse đi vào vùng sáng.",
          over: "Kết thúc lượt chơi",
          tip: "Space / Click / Touch để đánh nhịp",
          motion: "Giảm hiệu ứng",
        }
      : {
          back: "All games",
          eyebrow: "ARCADE · REACTION · ENDLESS",
          title: "Neon Pulse",
          intro:
            "Hit the beat, hold your combo, and survive the rising speed.",
          score: "Score",
          best: "Best",
          combo: "Combo",
          time: "Time",
          lives: "Lives",
          start: "Start run",
          restart: "Play again",
          resume: "Resume",
          paused: "Run paused",
          ready: "Ready to catch the pulse?",
          readyText: "Press Space, click, or tap when the pulse enters the bright zone.",
          over: "Run complete",
          tip: "Space / Click / Touch to hit",
          motion: "Reduce effects",
        };

  return (
    <main className="neonPulseGame" data-feedback={game.feedback ?? "idle"}>
      <header className="neonPulseHeader">
        <div>
          <Link href="/playground" className="neonPulseBack">
            <ArrowLeft size={15} /> {copy.back}
          </Link>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.intro}</span>
        </div>
        <div className="neonPulseHeaderActions">
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? "Unmute game" : "Mute game"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            type="button"
            onClick={togglePause}
            disabled={!["playing", "paused"].includes(game.status)}
            aria-label={game.status === "paused" ? copy.resume : "Pause"}
          >
            {game.status === "paused" ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </header>

      <section className="neonPulseLayout">
        <div className="neonPulseArenaCard">
          <div className="neonPulseHud">
            <div><span>{copy.score}</span><strong>{game.score.toLocaleString()}</strong></div>
            <div><span>{copy.combo}</span><strong>{game.combo}x</strong></div>
            <div><span>{copy.time}</span><strong>{Math.floor(game.elapsedMs / 1000)}s</strong></div>
          </div>

          <div className="neonPulseArena">
            <canvas
              ref={canvasRef}
              onPointerDown={() => void attemptHit()}
              aria-label="Neon Pulse game arena"
            />
            <output className="neonPulseFeedback" aria-live="polite" key={game.feedbackId}>
              {gradeLabel(game.feedback)}
            </output>

            {game.status !== "playing" && (
              <div className="neonPulseOverlay">
                <Sparkles size={28} />
                <h2>
                  {game.status === "ready"
                    ? copy.ready
                    : game.status === "paused"
                      ? copy.paused
                      : copy.over}
                </h2>
                <p>
                  {game.status === "game-over"
                    ? `${copy.score}: ${game.score.toLocaleString()} · ${copy.best}: ${Math.max(highScore, game.score).toLocaleString()}`
                    : copy.readyText}
                </p>
                {game.status === "paused" ? (
                  <button type="button" onClick={togglePause}>
                    <Play size={17} /> {copy.resume}
                  </button>
                ) : (
                  <button type="button" onClick={() => void startGame()}>
                    {game.status === "game-over" ? <RotateCcw size={17} /> : <Play size={17} />}
                    {game.status === "game-over" ? copy.restart : copy.start}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="neonPulseInputHint">
            <span>SPACE</span>
            <p>{copy.tip}</p>
          </div>
        </div>

        <aside className="neonPulseStats">
          <div className="neonPulseBest">
            <span>{copy.best}</span>
            <strong>{Math.max(highScore, game.score).toLocaleString()}</strong>
          </div>
          <div className="neonPulseLives">
            <span>{copy.lives}</span>
            <div>
              {Array.from({ length: 3 }, (_, index) => (
                <Heart
                  key={index}
                  size={22}
                  fill={index < game.lives ? "currentColor" : "none"}
                  data-active={index < game.lives}
                />
              ))}
            </div>
          </div>
          <div className="neonPulseRules">
            <h2>Perfect timing</h2>
            <p>Perfect <b>+100</b></p>
            <p>Good <b>+50</b></p>
            <p>Miss <b>-1 ♥</b></p>
          </div>
          <label className="neonPulseMotion">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => setReducedMotion(event.target.checked)}
            />
            {copy.motion}
          </label>
        </aside>
      </section>
    </main>
  );
}

