"use client";

import { Bomb, Pause, Play, RefreshCw, Shield, Volume2, VolumeX, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import {
  WORLD,
  createInvadersRun,
  firePlayer,
  movePlayer,
  startRun,
  tickInvaders,
  togglePause,
  triggerBomb,
  type InvadersRun,
} from "./neon-invaders-engine";
import styles from "./neon-invaders.module.css";

const BEST_KEY = "dk-neon-invaders-best-v1";
const COLORS = { scout: "#4ae5d7", striker: "#7d83ff", elite: "#ff9d45", boss: "#ff536f" };

export default function NeonInvadersGame() {
  const { language } = useLanguage();
  const [run, setRun] = useState<InvadersRun>(() => createInvadersRun(20260731));
  const [storedBest, setStoredBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const previousRef = useRef(run);
  const best = Math.max(storedBest, run.score);
  const copy = language === "vi"
    ? {
        eyebrow: "GAME 10 · SPACE SHOOTER",
        lead: "Bảo vệ lưới neon qua 10 wave, hạ hai boss và kết hợp power-up để lập kỷ lục.",
        score: "Điểm", best: "Kỷ lục", wave: "Wave", lives: "Mạng", combo: "Combo",
        start: "Xuất kích", resume: "Tiếp tục", paused: "Tạm dừng", defeat: "Hạm đội thất thủ",
        victory: "Chiến dịch hoàn tất", restart: "Chơi lại", bomb: "Bom",
        help: "A/D hoặc ←/→ di chuyển · Space bắn · B dùng bom · P tạm dừng",
      }
    : {
        eyebrow: "GAME 10 · SPACE SHOOTER",
        lead: "Defend the neon grid through ten waves, defeat two bosses, and chain power-ups for a high score.",
        score: "Score", best: "Best", wave: "Wave", lives: "Lives", combo: "Combo",
        start: "Launch", resume: "Resume", paused: "Paused", defeat: "Fleet destroyed",
        victory: "Campaign complete", restart: "Play again", bomb: "Bomb",
        help: "A/D or ←/→ move · Space fire · B bomb · P pause",
      };

  const cue = useCallback((frequency: number, duration = 0.06, type: OscillatorType = "square") => {
    if (muted) return;
    try {
      const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const context = audioRef.current ?? new Ctor();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.04, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration);
    } catch { /* optional audio */ }
  }, [muted]);

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const load = window.setTimeout(() => {
      const stored = Number(window.localStorage.getItem(BEST_KEY));
      if (Number.isSafeInteger(stored) && stored >= 0) setStoredBest(stored);
    }, 0);
    return () => { observer.disconnect(); window.clearTimeout(load); };
  }, []);

  useEffect(() => {
    if (run.score > storedBest) window.localStorage.setItem(BEST_KEY, String(run.score));
  }, [run.score, storedBest]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const elapsed = now - last; last = now;
      setRun((current) => tickInvaders(current, elapsed));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const previous = previousRef.current;
    if (run.score > previous.score) cue(520, 0.05);
    if (run.wave > previous.wave) cue(740, 0.2, "sawtooth");
    if (run.player.lives < previous.player.lives) cue(90, 0.28, "sawtooth");
    previousRef.current = run;
  }, [cue, run]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    gradient.addColorStop(0, theme === "dark" ? "#031219" : "#dceceb");
    gradient.addColorStop(1, theme === "dark" ? "#071e27" : "#bcd8d7");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.strokeStyle = theme === "dark" ? "rgba(70,220,210,.08)" : "rgba(20,100,105,.09)";
    for (let x = 0; x < WORLD.width; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke(); }
    for (let y = 0; y < WORLD.height; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke(); }
    run.enemies.forEach((enemy) => {
      const size = enemy.kind === "boss" ? 58 : 24;
      ctx.save(); ctx.translate(enemy.x, enemy.y);
      ctx.shadowBlur = enemy.kind === "boss" ? 28 : 14; ctx.shadowColor = COLORS[enemy.kind];
      ctx.fillStyle = COLORS[enemy.kind];
      ctx.beginPath(); ctx.moveTo(0, -size * .55); ctx.lineTo(size, size * .4); ctx.lineTo(size * .45, size * .25);
      ctx.lineTo(0, size * .55); ctx.lineTo(-size * .45, size * .25); ctx.lineTo(-size, size * .4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#06151b"; ctx.fillRect(-size * .34, -2, size * .22, 7); ctx.fillRect(size * .12, -2, size * .22, 7);
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(-size, size * .7, size * 2, 5);
        ctx.fillStyle = "#ff6b7f"; ctx.fillRect(-size, size * .7, size * 2 * enemy.hp / enemy.maxHp, 5);
      }
      ctx.restore();
    });
    run.bullets.forEach((bullet) => {
      ctx.fillStyle = bullet.owner === "player" ? "#7cfff4" : "#ff6680";
      ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle; ctx.fillRect(bullet.x - 2, bullet.y - 9, 4, 18);
    });
    run.powerUps.forEach((power) => {
      ctx.fillStyle = power.type === "shield" ? "#55e8ff" : power.type === "rapid" ? "#ffcc4d" : power.type === "dual" ? "#ad77ff" : "#ff637b";
      ctx.shadowBlur = 18; ctx.shadowColor = ctx.fillStyle; ctx.beginPath(); ctx.arc(power.x, power.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#06151b"; ctx.font = "900 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText(power.type[0].toUpperCase(), power.x, power.y + 4);
    });
    ctx.save(); ctx.translate(run.player.x, run.player.y);
    ctx.globalAlpha = run.player.invulnerableMs > 0 && Math.floor(run.player.invulnerableMs / 90) % 2 ? .25 : 1;
    ctx.shadowBlur = 24; ctx.shadowColor = "#4ce7da"; ctx.fillStyle = "#56eee1";
    ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(24, 20); ctx.lineTo(8, 14); ctx.lineTo(0, 25); ctx.lineTo(-8, 14); ctx.lineTo(-24, 20); ctx.closePath(); ctx.fill();
    if (run.player.shieldMs > 0) { ctx.strokeStyle = "#63dfff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore(); ctx.shadowBlur = 0;
  }, [run, theme]);

  const fire = useCallback(() => { setRun((current) => firePlayer(current)); cue(250, 0.035); }, [cue]);
  const bomb = useCallback(() => { setRun((current) => triggerBomb(current)); cue(75, 0.35, "sawtooth"); }, [cue]);
  const reset = () => { setStoredBest((value) => Math.max(value, run.score)); setRun(startRun(createInvadersRun(Date.now()))); };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyB", "KeyP", "Escape"].includes(event.code)) event.preventDefault();
      if (event.code === "ArrowLeft" || event.code === "KeyA") setRun((current) => movePlayer(current, current.player.x - 32));
      else if (event.code === "ArrowRight" || event.code === "KeyD") setRun((current) => movePlayer(current, current.player.x + 32));
      else if (event.code === "Space") fire();
      else if (event.code === "KeyB") bomb();
      else if (event.code === "KeyP" || event.code === "Escape") setRun((current) => togglePause(current));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bomb, fire]);

  const overlay = run.phase !== "playing";
  return (
    <main className={`${styles.page} ${theme === "light" ? styles.light : ""}`}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div><p>{copy.eyebrow}</p><h1>Neon Invaders</h1><span>{copy.lead}</span></div>
          <div className={styles.actions}>
            <button type="button" onClick={() => setRun((current) => togglePause(current))} disabled={run.phase === "ready" || run.phase === "gameover" || run.phase === "victory"}>
              {run.phase === "paused" ? <Play size={17} /> : <Pause size={17} />}{run.phase === "paused" ? copy.resume : "Pause"}
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-pressed={muted}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />} Sound</button>
            <button type="button" onClick={reset}><RefreshCw size={17} />{copy.restart}</button>
          </div>
        </header>
        <div className={styles.stats}>
          <span>{copy.score}<b>{run.score.toLocaleString()}</b></span><span>{copy.best}<b>{best.toLocaleString()}</b></span>
          <span>{copy.wave}<b>{run.wave}/10</b></span><span>{copy.lives}<b>{run.player.lives}</b></span><span>{copy.combo}<b>×{Math.max(1, run.combo)}</b></span>
        </div>
        <div className={styles.arena}>
          <canvas
            ref={canvasRef} width={WORLD.width} height={WORLD.height}
            aria-label="Neon Invaders battle arena"
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setRun((current) => movePlayer(current, (event.clientX - rect.left) / rect.width * WORLD.width));
            }}
            onPointerDown={fire}
          />
          <div className={styles.powerHud}>
            <span className={run.player.shieldMs > 0 ? styles.active : ""}><Shield size={15} />Shield</span>
            <span className={run.player.rapidMs > 0 ? styles.active : ""}><Zap size={15} />Rapid</span>
            <span className={run.player.dualMs > 0 ? styles.active : ""}>Ⅱ Dual</span>
            <button type="button" onClick={bomb} disabled={!run.bombs || run.phase !== "playing"}><Bomb size={16} />{copy.bomb} ×{run.bombs}</button>
          </div>
          {overlay && (
            <div className={styles.overlay}>
              <small>SECTOR {String(run.wave).padStart(2, "0")} · {run.wave === 5 || run.wave === 10 ? "BOSS SIGNAL" : "ALIEN GRID"}</small>
              <h2>{run.phase === "ready" ? "Neon Invaders" : run.phase === "paused" ? copy.paused : run.phase === "victory" ? copy.victory : copy.defeat}</h2>
              <button type="button" onClick={run.phase === "paused" ? () => setRun((current) => togglePause(current)) : reset}><Play size={18} />{run.phase === "paused" ? copy.resume : run.phase === "ready" ? copy.start : copy.restart}</button>
            </div>
          )}
        </div>
        <div className={styles.mobileControls}>
          <button type="button" onPointerDown={() => setRun((current) => movePlayer(current, current.player.x - 42))}>←</button>
          <button type="button" className={styles.fireButton} onPointerDown={fire}>FIRE</button>
          <button type="button" onPointerDown={() => setRun((current) => movePlayer(current, current.player.x + 42))}>→</button>
          <button type="button" onPointerDown={bomb}><Bomb size={18} /></button>
        </div>
        <p className={styles.help}>{copy.help}</p>
      </section>
    </main>
  );
}
