"use client";

import {
  ArrowLeft,
  Bomb,
  Gauge,
  Heart,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { NeonSiegeAudio } from "./neon-siege-audio";
import {
  BUILD_PADS,
  CAMPAIGN_WAVES,
  ENEMY_DEFINITIONS,
  ROUTE,
  TOWER_DEFINITIONS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Difficulty,
  type TowerType,
} from "./neon-siege-data";
import {
  activateEmp,
  activateOverclock,
  buildTower,
  createSiegeRun,
  pointAtProgress,
  queueAirstrike,
  routeLength,
  sellTower,
  startEndless,
  startWave,
  stepSiege,
  upgradeTower,
  type SiegeRun,
} from "./neon-siege-engine";
import {
  DEFAULT_PROGRESS,
  MUTED_KEY,
  PROGRESS_KEY,
  parseProgress,
  safeRead,
  safeWrite,
  type SiegeProgress,
} from "./neon-siege-storage";
import styles from "./neon-siege.module.css";

type Theme = "light" | "dark";

const towerOrder: TowerType[] = ["pulse", "frost", "tesla", "railgun"];

function drawScene(context: CanvasRenderingContext2D, state: SiegeRun, theme: Theme, selectedPad: string | null, selectedTower: number | null, airstrike: boolean) {
  const dark = theme === "dark";
  const background = context.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  background.addColorStop(0, dark ? "#061218" : "#eaf6f4");
  background.addColorStop(1, dark ? "#10152a" : "#fff4e8");
  context.fillStyle = background;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  context.strokeStyle = dark ? "rgba(92,231,224,.065)" : "rgba(18,95,106,.075)";
  context.lineWidth = 1;
  for (let x = 0; x <= WORLD_WIDTH; x += 40) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, WORLD_HEIGHT); context.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 40) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(WORLD_WIDTH, y); context.stroke();
  }

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = dark ? "#172d37" : "#b9cfcc";
  context.lineWidth = 54;
  context.beginPath();
  ROUTE.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
  context.stroke();
  context.strokeStyle = dark ? "rgba(78,220,215,.28)" : "rgba(19,126,132,.3)";
  context.setLineDash([10, 15]);
  context.lineWidth = 2;
  context.stroke();
  context.setLineDash([]);

  for (const pad of BUILD_PADS) {
    const tower = state.towers.find((item) => item.padId === pad.id);
    context.save();
    context.shadowBlur = tower ? 18 : 0;
    context.shadowColor = tower ? TOWER_DEFINITIONS[tower.type].color : "transparent";
    context.fillStyle = tower
      ? TOWER_DEFINITIONS[tower.type].color
      : selectedPad === pad.id ? "rgba(255,202,92,.28)" : dark ? "rgba(116,154,163,.13)" : "rgba(30,89,98,.1)";
    context.strokeStyle = tower
      ? "rgba(255,255,255,.7)"
      : selectedPad === pad.id ? "#ffca5c" : dark ? "rgba(183,222,222,.36)" : "rgba(20,73,82,.34)";
    context.lineWidth = selectedTower === tower?.id ? 4 : 2;
    context.beginPath();
    context.arc(pad.x, pad.y, 27, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    if (tower) {
      context.fillStyle = dark ? "#07151c" : "#f8ffff";
      context.font = "900 15px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText({ pulse: "P", frost: "F", tesla: "T", railgun: "R" }[tower.type], pad.x, pad.y);
      context.font = "800 9px monospace";
      context.fillText(`L${tower.level}`, pad.x, pad.y + 37);
    } else {
      context.fillStyle = dark ? "rgba(220,245,244,.55)" : "rgba(20,70,78,.55)";
      context.font = "800 15px monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("+", pad.x, pad.y);
    }
    context.restore();
  }

  for (const enemy of state.enemies) {
    const point = pointAtProgress(enemy.progress);
    const definition = ENEMY_DEFINITIONS[enemy.type];
    const radius = enemy.type === "boss" ? 22 : enemy.type === "tank" ? 17 : 13;
    context.save();
    context.shadowBlur = dark ? 18 : 9;
    context.shadowColor = definition.color;
    context.fillStyle = definition.color;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    if (enemy.stunRemainingMs > 0) {
      context.strokeStyle = "#e8ffff";
      context.lineWidth = 3;
      context.stroke();
    }
    context.fillStyle = dark ? "#071218" : "#ffffff";
    context.font = `900 ${enemy.type === "boss" ? 10 : 8}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(enemy.type === "boss" ? "BOSS" : enemy.type[0].toUpperCase(), point.x, point.y);
    context.shadowBlur = 0;
    context.fillStyle = dark ? "#17313b" : "#c7d5d4";
    context.fillRect(point.x - 19, point.y - radius - 11, 38, 4);
    context.fillStyle = enemy.hp / enemy.maxHp < .3 ? "#ff6477" : "#62eeae";
    context.fillRect(point.x - 19, point.y - radius - 11, 38 * Math.max(0, enemy.hp / enemy.maxHp), 4);
    context.restore();
  }

  if (state.skills.airstrike) {
    const point = pointAtProgress(state.skills.airstrike.progress);
    context.strokeStyle = "#ff657b";
    context.lineWidth = 4;
    context.beginPath(); context.arc(point.x, point.y, 54, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.moveTo(point.x - 70, point.y); context.lineTo(point.x + 70, point.y); context.stroke();
    context.beginPath(); context.moveTo(point.x, point.y - 70); context.lineTo(point.x, point.y + 70); context.stroke();
  }

  if (airstrike) {
    context.fillStyle = "rgba(255,80,105,.1)";
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.fillStyle = dark ? "#ffe7eb" : "#7d1327";
    context.font = "900 18px monospace";
    context.textAlign = "center";
    context.fillText("CHỌN ĐIỂM KHÔNG KÍCH", WORLD_WIDTH / 2, 35);
  }
}

export default function NeonSiegeGame() {
  const { language } = useLanguage();
  const [view, setView] = useState(() => createSiegeRun("normal"));
  const stateRef = useRef(view);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [theme, setTheme] = useState<Theme>("light");
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState<SiegeProgress>(DEFAULT_PROGRESS);
  const [selectedPad, setSelectedPad] = useState<string | null>(null);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [airstrikeTargeting, setAirstrikeTargeting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const audioRef = useRef<NeonSiegeAudio | null>(null);
  const lastEventRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const copy = useMemo(() => language === "vi" ? {
    back: "Tất cả trò chơi", eyebrow: "CHIẾN THUẬT · TOWER DEFENSE · 12 WAVE", title: "Neon Siege",
    intro: "Xây phòng tuyến trên các điểm cố định, nâng cấp đúng lúc và dùng kỹ năng để bảo vệ lõi năng lượng.",
    score: "Điểm", best: "Kỷ lục", wave: "Wave", core: "Lõi", credits: "Tín dụng",
    launch: "Gọi wave", early: "Gọi sớm +", paused: "Đã tạm dừng", victory: "Chiến dịch hoàn tất!",
    defeated: "Lõi đã thất thủ", resume: "Tiếp tục", again: "Chơi lại", endless: "Vào Endless",
    build: "Chọn trụ để xây", upgrade: "Nâng cấp", sell: "Bán", selectPad: "Chọn một build pad trống trên bản đồ.",
    campaign: "Chiến dịch", planning: "Chuẩn bị phòng tuyến", sound: "Âm thanh", target: "Chạm lên đường đi để thả Airstrike.",
  } : {
    back: "All games", eyebrow: "STRATEGY · TOWER DEFENSE · 12 WAVES", title: "Neon Siege",
    intro: "Build on fixed pads, upgrade at the right time, and deploy active skills to protect the energy core.",
    score: "Score", best: "Best", wave: "Wave", core: "Core", credits: "Credits",
    launch: "Call wave", early: "Early call +", paused: "Game paused", victory: "Campaign complete!",
    defeated: "Core breached", resume: "Resume", again: "Play again", endless: "Enter Endless",
    build: "Choose a tower", upgrade: "Upgrade", sell: "Sell", selectPad: "Select an empty build pad on the map.",
    campaign: "Campaign", planning: "Plan your defense", sound: "Sound", target: "Tap the route to place the Airstrike.",
  }, [language]);

  const sync = useCallback((next: SiegeRun) => {
    stateRef.current = next;
    setView(next);
  }, []);

  const unlockAudio = useCallback(() => {
    audioRef.current ??= new NeonSiegeAudio();
    audioRef.current.setMuted(muted);
    void audioRef.current.unlock();
  }, [muted]);

  const reset = useCallback((nextDifficulty = difficulty) => {
    setDifficulty(nextDifficulty);
    setSelectedPad(null);
    setSelectedTower(null);
    setAirstrikeTargeting(false);
    sync(createSiegeRun(nextDifficulty));
  }, [difficulty, sync]);

  useEffect(() => {
    const readTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const storedProgress = parseProgress(safeRead(PROGRESS_KEY));
    const storedMuted = safeRead(MUTED_KEY) === "true";
    const timer = window.setTimeout(() => { setProgress(storedProgress); setMuted(storedMuted); readTheme(); }, 0);
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
    safeWrite(MUTED_KEY, String(muted));
  }, [muted]);
  useEffect(() => () => audioRef.current?.dispose(), []);
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const controls = Array.from(overlay.querySelectorAll<HTMLElement>("button, a"));
    controls[0]?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    overlay.addEventListener("keydown", trapFocus);
    return () => { overlay.removeEventListener("keydown", trapFocus); returnFocusRef.current?.focus(); };
  }, [view.phase]);
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && stateRef.current.phase === "playing") sync({ ...stateRef.current, phase: "paused" });
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [sync]);

  useEffect(() => {
    const tick = (time: number) => {
      const last = lastTimeRef.current ?? time;
      lastTimeRef.current = time;
      if (stateRef.current.phase === "playing") {
        accumulatorRef.current += Math.min(100, time - last);
        let next = stateRef.current;
        while (accumulatorRef.current >= 20) {
          next = stepSiege(next, 20);
          accumulatorRef.current -= 20;
        }
        if (next !== stateRef.current) sync(next);
      } else accumulatorRef.current = 0;
      const context = canvasRef.current?.getContext("2d");
      if (context) drawScene(context, stateRef.current, theme, selectedPad, selectedTower, airstrikeTargeting);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = null;
    };
  }, [airstrikeTargeting, selectedPad, selectedTower, sync, theme]);

  useEffect(() => {
    if (!view.event || view.event.id === lastEventRef.current) return;
    lastEventRef.current = view.event.id;
    audioRef.current?.play(view.event.type, view.event.label);
  }, [view.event]);

  useEffect(() => {
    const next = {
      bestScore: Math.max(progress.bestScore, view.score),
      highestWave: Math.max(progress.highestWave, ["planning", "victory"].includes(view.phase) && view.mode === "campaign" ? Math.min(12, view.wave) : 0),
      campaignComplete: progress.campaignComplete || view.campaignComplete,
      endlessUnlocked: progress.endlessUnlocked || view.campaignComplete,
      bestEndlessWave: view.mode === "endless" && view.phase === "planning" ? Math.max(progress.bestEndlessWave, view.wave) : progress.bestEndlessWave,
      version: 1 as const,
    };
    if (
      next.bestScore !== progress.bestScore
      || next.highestWave !== progress.highestWave
      || next.campaignComplete !== progress.campaignComplete
      || next.endlessUnlocked !== progress.endlessUnlocked
      || next.bestEndlessWave !== progress.bestEndlessWave
    ) {
      const timer = window.setTimeout(() => setProgress(next), 0);
      safeWrite(PROGRESS_KEY, JSON.stringify(next));
      return () => clearTimeout(timer);
    }
  }, [progress, view.campaignComplete, view.mode, view.phase, view.score, view.wave]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, input, select, textarea, a")) return;
      if (event.code === "Space" && stateRef.current.phase === "planning") {
        event.preventDefault(); unlockAudio(); sync(startWave(stateRef.current, true));
      }
      if (event.code === "KeyP" || event.code === "Escape") {
        const current = stateRef.current;
        if (current.phase === "playing") sync({ ...current, phase: "paused" });
        else if (current.phase === "paused") sync({ ...current, phase: "playing" });
      }
      if (event.code === "Digit1") sync(activateEmp(stateRef.current));
      if (event.code === "Digit2") sync(activateOverclock(stateRef.current));
      if (event.code === "Digit3") setAirstrikeTargeting(true);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [sync, unlockAudio]);

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    unlockAudio();
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: (event.clientX - rect.left) / rect.width * WORLD_WIDTH,
      y: (event.clientY - rect.top) / rect.height * WORLD_HEIGHT,
    };
    if (airstrikeTargeting && view.phase === "playing") {
      let bestProgress = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let progressValue = 0; progressValue <= 1900; progressValue += 15) {
        const routePoint = pointAtProgress(progressValue);
        const distance = Math.hypot(routePoint.x - point.x, routePoint.y - point.y);
        if (distance < bestDistance) { bestDistance = distance; bestProgress = progressValue; }
      }
      sync(queueAirstrike(view, bestProgress));
      setAirstrikeTargeting(false);
      return;
    }
    const pad = BUILD_PADS.find((item) => Math.hypot(item.x - point.x, item.y - point.y) < 38);
    if (!pad) return;
    const tower = view.towers.find((item) => item.padId === pad.id);
    setSelectedPad(tower ? null : pad.id);
    setSelectedTower(tower?.id ?? null);
  };

  const chooseTower = (type: TowerType) => {
    if (!selectedPad) return;
    unlockAudio();
    const next = buildTower(view, selectedPad, type);
    sync(next);
    if (next !== view) setSelectedPad(null);
  };

  const selected = view.towers.find((tower) => tower.id === selectedTower);
  const selectedStats = selected ? TOWER_DEFINITIONS[selected.type].levels[selected.level - 1] : null;
  const nextWave = view.wave < CAMPAIGN_WAVES.length ? CAMPAIGN_WAVES[view.wave] : null;
  const wavePreview = nextWave?.groups.map((group) => `${ENEMY_DEFINITIONS[group.type].label} ×${group.count}`).join(" · ") ?? "Endless scaling";
  const start = (early = false) => { unlockAudio(); sync(startWave(view, early)); };
  const togglePause = () => sync({ ...view, phase: view.phase === "paused" ? "playing" : "paused" });
  const enterEndless = () => sync(startEndless({ ...view, campaignComplete: progress.endlessUnlocked || view.campaignComplete }, progress.endlessUnlocked || view.campaignComplete));

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/playground" className={styles.back}><ArrowLeft size={15} /> {copy.back}</Link>
        <div className={styles.actions}>
          <button type="button" onClick={() => setMuted((value) => !value)} aria-label={copy.sound}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button type="button" onClick={togglePause} aria-label={view.phase === "paused" ? copy.resume : copy.paused} disabled={!["playing", "paused"].includes(view.phase)}>
            {view.phase === "paused" ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button type="button" onClick={() => reset()} aria-label={copy.again}><RotateCcw size={17} /></button>
        </div>
      </div>

      <header className={styles.hero}>
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.intro}</span>
      </header>

      <section className={styles.shell}>
        <div className={styles.hud}>
          <div><span>{copy.score}</span><strong>{view.score.toLocaleString()}</strong></div>
          <div><span>{copy.best}</span><strong>{Math.max(progress.bestScore, view.score).toLocaleString()}</strong></div>
          <div><span>{copy.wave}</span><strong>{view.mode === "campaign" ? `${view.wave}/12` : view.wave}</strong></div>
          <div><span>{copy.core}</span><strong className={styles.health}><Heart size={16} fill="currentColor" /> {view.health}</strong></div>
          <div><span>{copy.credits}</span><strong>¢{view.credits}</strong></div>
        </div>

        <div className={styles.arena}>
          <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} onClick={onCanvasClick} aria-label="Neon Siege tower defense arena" />
          {BUILD_PADS.map((pad, index) => (
            <button
              type="button"
              key={pad.id}
              className={styles.padHit}
              style={{ left: `${pad.x / WORLD_WIDTH * 100}%`, top: `${pad.y / WORLD_HEIGHT * 100}%` }}
              aria-label={`Build pad ${index + 1}`}
              onClick={() => {
                const tower = view.towers.find((item) => item.padId === pad.id);
                setSelectedPad(tower ? null : pad.id);
                setSelectedTower(tower?.id ?? null);
              }}
            />
          ))}
          {["paused", "victory", "gameover"].includes(view.phase) && (
            <div ref={overlayRef} className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="siege-state-title">
              <Shield size={31} />
              <h2 id="siege-state-title">{view.phase === "paused" ? copy.paused : view.phase === "victory" ? copy.victory : copy.defeated}</h2>
              <p>{view.score.toLocaleString()} {copy.score.toLowerCase()}</p>
              {view.phase === "paused" && <button type="button" onClick={togglePause}><Play size={17} /> {copy.resume}</button>}
              {view.phase === "victory" && <button type="button" onClick={enterEndless}><Zap size={17} /> {copy.endless}</button>}
              {view.phase === "gameover" && <button type="button" onClick={() => reset()} aria-label={copy.again}><RotateCcw size={17} /> {copy.again}</button>}
            </div>
          )}
        </div>

        <div className={styles.command}>
          <div className={styles.towerPanel}>
            <div className={styles.panelTitle}>
              <span>{selected ? `${TOWER_DEFINITIONS[selected.type].label} · L${selected.level}` : selectedPad ? copy.build : copy.planning}</span>
              <small>{selectedStats ? `DMG ${selectedStats.damage} · RNG ${selectedStats.range} · ${(1000 / selectedStats.fireMs).toFixed(1)}/s` : selectedPad ? "" : `${copy.selectPad} · ${wavePreview}`}</small>
            </div>
            {selectedPad && (
              <div className={styles.towerGrid}>
                {towerOrder.map((type) => {
                  const tower = TOWER_DEFINITIONS[type];
                  return (
                    <button type="button" key={type} onClick={() => chooseTower(type)} disabled={view.phase !== "planning" || view.credits < tower.levels[0].cost}>
                      <i style={{ background: tower.color }} />
                      <span><b>{tower.label}</b><small>{tower.description}</small></span>
                      <strong>¢{tower.levels[0].cost}</strong>
                    </button>
                  );
                })}
              </div>
            )}
            {selected && (
              <div className={styles.manage}>
                <button type="button" onClick={() => sync(upgradeTower(view, selected.id))} disabled={view.phase !== "planning" || selected.level >= 3 || (selected.level < 3 && view.credits < TOWER_DEFINITIONS[selected.type].levels[selected.level].cost)}>
                  <Gauge size={16} /> {copy.upgrade} {selected.level < 3 ? `· ¢${TOWER_DEFINITIONS[selected.type].levels[selected.level].cost}` : "· MAX"}
                </button>
                <button type="button" disabled={view.phase !== "planning"} onClick={() => { sync(sellTower(view, selected.id)); setSelectedTower(null); }}>
                  {copy.sell} · ¢{Math.floor(selected.invested * .7)}
                </button>
              </div>
            )}
          </div>

          <div className={styles.wavePanel}>
            <div className={styles.difficulties}>
              {(["easy", "normal", "hard"] as Difficulty[]).map((item) => (
                <button type="button" key={item} aria-pressed={difficulty === item} disabled={view.wave > 0} onClick={() => reset(item)}>
                  {item}
                </button>
              ))}
            </div>
            <button type="button" className={styles.startWave} onClick={() => start(false)} disabled={view.phase !== "planning"}>
              <Play size={17} fill="currentColor" /> {copy.launch}
            </button>
            {view.wave > 0 && <button type="button" className={styles.endlessButton} onClick={() => start(true)} disabled={view.phase !== "planning"}>{copy.early}</button>}
            {progress.endlessUnlocked && view.wave === 0 && (
              <button type="button" className={styles.endlessButton} onClick={enterEndless}><Zap size={16} /> {copy.endless}</button>
            )}
          </div>
        </div>

        <div className={styles.skills}>
          <button type="button" onClick={() => { unlockAudio(); sync(activateEmp(view)); }} disabled={view.phase !== "playing" || view.skills.empCooldownMs > 0}>
            <RadioTower size={18} /><span><b>EMP</b><small>{view.skills.empCooldownMs ? `${Math.ceil(view.skills.empCooldownMs / 1000)}s` : "1"}</small></span>
          </button>
          <button type="button" onClick={() => { unlockAudio(); sync(activateOverclock(view)); }} disabled={view.phase !== "playing" || view.skills.overclockCooldownMs > 0}>
            <Gauge size={18} /><span><b>Overclock</b><small>{view.skills.overclockCooldownMs ? `${Math.ceil(view.skills.overclockCooldownMs / 1000)}s` : "2"}</small></span>
          </button>
          <button type="button" onClick={() => setAirstrikeTargeting(true)} disabled={view.phase !== "playing" || view.skills.airstrikeCooldownMs > 0}>
            <Bomb size={18} /><span><b>Airstrike</b><small>{view.skills.airstrikeCooldownMs ? `${Math.ceil(view.skills.airstrikeCooldownMs / 1000)}s` : "3"}</small></span>
          </button>
          {airstrikeTargeting && <div className={styles.targetButtons}>{[.25, .5, .75].map((ratio, index) => <button type="button" key={ratio} onClick={() => { sync(queueAirstrike(view, routeLength() * ratio)); setAirstrikeTargeting(false); }}>Airstrike {index + 1}</button>)}</div>}
          <p>{airstrikeTargeting ? copy.target : `${copy.campaign} · Space: ${copy.early} · 1 / 2 / 3: Skills`}</p>
        </div>
      </section>
      <p className={styles.srOnly} aria-live="polite">{view.event?.label ?? ""}</p>
    </main>
  );
}
