"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RefreshCw, Volume2, VolumeX, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { GRID, SKILLS, getStage, type Difficulty } from "./neon-serpent-data";
import { advanceStage, createSerpentRun, queueDirection, startEndless, stepSerpent, type Direction, type SerpentRun } from "./neon-serpent-engine";
import { createSerpentAudio } from "./neon-serpent-audio";
import { DEFAULT_PROGRESS, MUTED_KEY, PROGRESS_KEY, parseProgress, safeRead, safeWrite, type SerpentProgress } from "./neon-serpent-storage";
import styles from "./neon-serpent.module.css";

const themeColors = (dark: boolean) => dark ? {
  arena: "#06161b", grid: "rgba(82,224,214,.09)", wall: "#18343b", snake: "#28d7c5",
  head: "#aafff4", core: "#ffcc66", danger: "#ff6685", text: "#eafffb",
} : {
  arena: "#edf9f6", grid: "rgba(9,91,91,.10)", wall: "#b9d8d5", snake: "#078e89",
  head: "#035b5d", core: "#d87c16", danger: "#c9365a", text: "#082f34",
};

function drawGame(canvas: HTMLCanvasElement, run: SerpentRun, dark: boolean, reduced: boolean) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.width * (GRID.height / GRID.width) * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(canvas.width / GRID.width, 0, 0, canvas.height / GRID.height, 0, 0);
  const cellW = GRID.width / GRID.columns;
  const cellH = GRID.height / GRID.rows;
  const colors = themeColors(dark);
  context.fillStyle = colors.arena;
  context.fillRect(0, 0, GRID.width, GRID.height);
  context.strokeStyle = colors.grid;
  context.lineWidth = 1;
  for (let x = 0; x <= GRID.columns; x += 1) { context.beginPath(); context.moveTo(x * cellW, 0); context.lineTo(x * cellW, GRID.height); context.stroke(); }
  for (let y = 0; y <= GRID.rows; y += 1) { context.beginPath(); context.moveTo(0, y * cellH); context.lineTo(GRID.width, y * cellH); context.stroke(); }
  if (run.boundaryInset) {
    context.fillStyle = "rgba(255,72,112,.16)";
    const insetX = run.boundaryInset * cellW;
    const insetY = run.boundaryInset * cellH;
    context.fillRect(0, 0, GRID.width, insetY); context.fillRect(0, GRID.height - insetY, GRID.width, insetY);
    context.fillRect(0, insetY, insetX, GRID.height - insetY * 2); context.fillRect(GRID.width - insetX, insetY, insetX, GRID.height - insetY * 2);
  }
  context.fillStyle = colors.wall;
  getStage(run.stage).walls.forEach((cell) => context.fillRect(cell.x * cellW + 3, cell.y * cellH + 3, cellW - 6, cellH - 6));
  const portals = getStage(run.stage).portals;
  portals?.forEach((cell) => {
    context.strokeStyle = "#9d7bff"; context.lineWidth = 5; context.beginPath();
    context.arc((cell.x + .5) * cellW, (cell.y + .5) * cellH, cellW * .34, 0, Math.PI * 2); context.stroke();
  });
  run.pickups.forEach((pickup) => {
    const skill = SKILLS[pickup.type]; context.fillStyle = skill.color;
    context.beginPath(); context.roundRect(pickup.cell.x * cellW + 6, pickup.cell.y * cellH + 6, cellW - 12, cellH - 12, 8); context.fill();
    context.fillStyle = "#062027"; context.font = "700 13px system-ui"; context.textAlign = "center";
    context.fillText(skill.symbol, (pickup.cell.x + .5) * cellW, (pickup.cell.y + .67) * cellH);
  });
  context.shadowBlur = reduced ? 0 : 18; context.shadowColor = colors.core; context.fillStyle = colors.core;
  context.beginPath(); context.arc((run.core.x + .5) * cellW, (run.core.y + .5) * cellH, cellW * .25, 0, Math.PI * 2); context.fill();
  context.shadowBlur = reduced ? 0 : 12; context.shadowColor = colors.snake;
  [...run.snake].reverse().forEach((cell, index) => {
    context.globalAlpha = .58 + (index / run.snake.length) * .42;
    context.fillStyle = index === run.snake.length - 1 ? colors.head : colors.snake;
    context.beginPath(); context.roundRect(cell.x * cellW + 4, cell.y * cellH + 4, cellW - 8, cellH - 8, 10); context.fill();
  });
  context.globalAlpha = 1; context.shadowBlur = 0;
  if (run.hunter) {
    context.fillStyle = colors.danger; context.beginPath();
    context.moveTo((run.hunter.x + .5) * cellW, run.hunter.y * cellH + 5);
    context.lineTo(run.hunter.x * cellW + 5, (run.hunter.y + 1) * cellH - 5);
    context.lineTo((run.hunter.x + 1) * cellW - 5, (run.hunter.y + 1) * cellH - 5); context.fill();
  }
  if (run.boss) {
    context.fillStyle = colors.text; context.font = "800 18px system-ui"; context.textAlign = "center";
    context.fillText(`${run.boss.type.toUpperCase()}  ${run.boss.shield}/${run.boss.maxShield}`, GRID.width / 2, 28);
  }
}

export default function NeonSerpentGame() {
  const { language } = useLanguage();
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [progress, setProgress] = useState<SerpentProgress>(DEFAULT_PROGRESS);
  const [run, setRun] = useState(() => createSerpentRun("normal"));
  const [muted, setMuted] = useState(false);
  const [dark, setDark] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef(run);
  const frameRef = useRef(0);
  const lastRef = useRef(0);
  const audioRef = useRef<ReturnType<typeof createSerpentAudio> | null>(null);
  const touchRef = useRef({ x: 0, y: 0 });
  const reducedRef = useRef(false);
  const copy = language === "vi" ? {
    lead: "Snake roguelite neon: 8 màn, 5 kỹ năng, 2 boss và Endless.",
    ready: "Nhấn phím hướng, WASD hoặc vuốt để bắt đầu", next: "Màn tiếp theo", newRun: "Chơi lại",
  } : {
    lead: "Neon Snake roguelite: 8 stages, 5 skills, 2 bosses, and Endless.",
    ready: "Press arrows, WASD, or swipe to begin", next: "Next stage", newRun: "New run",
  };

  useEffect(() => {
    const stored = parseProgress(safeRead(PROGRESS_KEY));
    const storedMuted = safeRead(MUTED_KEY) === "true";
    queueMicrotask(() => {
      setProgress(stored); setMuted(storedMuted);
    });
    audioRef.current = createSerpentAudio(); audioRef.current.setMuted(storedMuted);
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const syncTheme = () => setDark(document.documentElement.dataset.theme !== "light");
    syncTheme(); const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => { observer.disconnect(); audioRef.current?.dispose(); cancelAnimationFrame(frameRef.current); };
  }, []);

  const publish = useCallback((next: SerpentRun) => {
    runRef.current = next; setRun(next);
    if (next.event && next.event.id !== runRef.current.event?.id) audioRef.current?.play(next.event.type === "core" ? "core" : next.event.type === "damage" ? "damage" : "skill", next.combo);
    const record = {
      version: 1 as const, bestScore: Math.max(progress.bestScore, next.score),
      highestStage: Math.max(progress.highestStage, next.stage),
      campaignComplete: progress.campaignComplete || next.campaignComplete,
      endlessUnlocked: progress.endlessUnlocked || next.campaignComplete,
      bestEndlessWave: Math.max(progress.bestEndlessWave, next.mode === "endless" ? next.wave : 0),
    };
    if (JSON.stringify(record) !== JSON.stringify(progress)) { setProgress(record); safeWrite(PROGRESS_KEY, JSON.stringify(record)); }
  }, [progress]);

  const input = useCallback((direction: Direction) => {
    void audioRef.current?.unlock();
    const next = queueDirection(runRef.current, direction); runRef.current = next; setRun(next);
  }, []);

  useEffect(() => {
    const keys: Record<string, Direction> = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    const onKey = (event: KeyboardEvent) => {
      if (keys[event.code]) { event.preventDefault(); input(keys[event.code]); }
      if (event.code === "Space") { event.preventDefault(); runRef.current = { ...runRef.current, phase: runRef.current.phase === "paused" ? "playing" : "paused" }; setRun(runRef.current); }
    };
    const onVisibility = () => { if (document.hidden && runRef.current.phase === "playing") { runRef.current = { ...runRef.current, phase: "paused" }; setRun(runRef.current); } };
    window.addEventListener("keydown", onKey); document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVisibility); };
  }, [input]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const start = (event: TouchEvent) => { touchRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; };
    const end = (event: TouchEvent) => {
      const dx = event.changedTouches[0].clientX - touchRef.current.x; const dy = event.changedTouches[0].clientY - touchRef.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    };
    canvas.addEventListener("touchstart", start, { passive: true }); canvas.addEventListener("touchend", end, { passive: true });
    return () => { canvas.removeEventListener("touchstart", start); canvas.removeEventListener("touchend", end); };
  }, [input]);

  useEffect(() => {
    const loop = (time: number) => {
      const elapsed = lastRef.current ? Math.min(80, time - lastRef.current) : 0; lastRef.current = time;
      let next = runRef.current;
      const previousEventId = next.event?.id;
      if (next.phase === "playing") next = stepSerpent(next, elapsed);
      if (next.event && next.event.id !== previousEventId) {
        audioRef.current?.play(next.event.type === "core" ? "core" : next.event.type === "damage" ? "damage" : next.event.type === "shield" ? "shield" : "skill", next.combo);
      }
      runRef.current = next; setRun(next);
      if (canvasRef.current) drawGame(canvasRef.current, next, dark, reducedRef.current);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [dark]);

  const reset = (stage = 1) => { const next = createSerpentRun(difficulty, stage, Date.now()); runRef.current = next; setRun(next); };
  const nextStage = () => { const next = advanceStage(runRef.current); publish(next); };
  const toggleMute = () => { const value = !muted; setMuted(value); audioRef.current?.setMuted(value); safeWrite(MUTED_KEY, String(value)); };
  const pause = () => { runRef.current = { ...runRef.current, phase: run.phase === "paused" ? "playing" : "paused" }; setRun(runRef.current); };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>GAME 07 · SNAKE ROGUELITE</p><h1>Neon Serpent</h1><p>{copy.lead}</p></div>
        <div className={styles.headerActions}>
          <button type="button" onClick={pause}>{run.phase === "paused" ? <Play size={17} /> : <Pause size={17} />} {run.phase === "paused" ? "Resume" : "Pause"}</button>
          <button type="button" onClick={toggleMute}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />} {muted ? "Unmute" : "Mute"}</button>
          <button type="button" onClick={() => reset(run.stage)}><RefreshCw size={17} /> Restart</button>
        </div>
      </header>
      <section className={styles.shell}>
        <div className={styles.hud}>
          <span>STAGE <b>{run.mode === "endless" ? `∞ ${run.wave}` : `${run.stage}/8`}</b></span>
          <span>SCORE <b>{run.score.toLocaleString()}</b></span><span>CORE <b>{run.coresCollected}/{run.target}</b></span>
          <span>LIVES <b>{"●".repeat(run.lives)}</b></span><span>COMBO <b>x{run.combo}</b></span>
        </div>
        <div className={styles.arenaWrap}>
          <canvas ref={canvasRef} className={styles.canvas} width={GRID.width} height={GRID.height} aria-label="Neon Serpent game arena" />
          {run.phase === "ready" && <div className={styles.overlay}><Zap /><strong>{getStage(run.stage).name}</strong><span>{copy.ready}</span></div>}
          {run.phase === "paused" && <div className={styles.overlay}><Pause /><strong>Paused</strong><button type="button" onClick={pause}>Resume</button></div>}
          {run.phase === "stageClear" && <div className={styles.overlay}><strong>Stage clear</strong><span>{run.score.toLocaleString()} pts</span><button type="button" onClick={nextStage}>{copy.next}</button></div>}
          {run.phase === "victory" && <div className={styles.overlay}><strong>Campaign complete!</strong><span>Endless unlocked</span><button type="button" onClick={() => publish(startEndless(runRef.current, true))}>Play Endless</button></div>}
          {run.phase === "gameover" && <div className={styles.overlay}><strong>Signal lost</strong><span>{run.score.toLocaleString()} pts</span><button type="button" onClick={() => reset(run.stage)}>{copy.newRun}</button></div>}
        </div>
        <div className={styles.bottom}>
          <div className={styles.settings}>
            {(["easy", "normal", "hard"] as Difficulty[]).map((item) => <button type="button" aria-pressed={difficulty === item} key={item} onClick={() => { setDifficulty(item); const next = createSerpentRun(item); runRef.current = next; setRun(next); }}>{item}</button>)}
            <button type="button" disabled={!progress.endlessUnlocked} onClick={() => publish(startEndless(runRef.current, progress.endlessUnlocked))}>Endless</button>
          </div>
          <div className={styles.dpad} aria-label="Directional controls">
            <button type="button" onClick={() => input("up")}><ArrowUp /></button><span />
            <button type="button" onClick={() => input("left")}><ArrowLeft /></button>
            <button type="button" onClick={() => input("down")}><ArrowDown /></button>
            <button type="button" onClick={() => input("right")}><ArrowRight /></button>
          </div>
        </div>
        <p className={styles.status} aria-live="polite">{run.event?.label ?? `${getStage(run.stage).name} · ${run.phase}`}</p>
      </section>
    </main>
  );
}
