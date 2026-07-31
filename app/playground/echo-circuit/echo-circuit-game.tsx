"use client";

import { Eye, EyeOff, Heart, Play, RefreshCw, Volume2, VolumeX, Waves } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import {
  createEchoGame,
  nextRound,
  playbackDelay,
  pressPad,
  startEchoGame,
  startInput,
  type EchoGame,
  type Pad,
} from "./echo-circuit-engine";
import styles from "./echo-circuit.module.css";

const FREQUENCIES = [261.63, 329.63, 392, 523.25];
const BEST_KEY = "dk-echo-circuit-best-v1";

export default function EchoCircuitGame() {
  const { language } = useLanguage();
  const [game, setGame] = useState<EchoGame>(() => createEchoGame(20260731));
  const [litPad, setLitPad] = useState<Pad | null>(null);
  const [muted, setMuted] = useState(false);
  const [visualAssist, setVisualAssist] = useState(true);
  const [storedBest, setStoredBest] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const audioRef = useRef<AudioContext | null>(null);
  const best = Math.max(storedBest, game.score);
  const copy = language === "vi"
    ? {
        eyebrow: "GAME 11 · GHI NHỚ ÂM THANH",
        lead: "Nghe chuỗi âm neon, ghi nhớ thứ tự và phát lại trước khi nhịp độ tăng cao.",
        score: "Điểm", best: "Kỷ lục", round: "Vòng", lives: "Mạng", combo: "Combo",
        listen: "Lắng nghe…", repeat: "Đến lượt bạn", clear: "Chính xác!", over: "Mất tín hiệu",
        start: "Bắt đầu", restart: "Chơi lại", assist: "Hỗ trợ hình ảnh",
        help: "Nhấn pad hoặc phím 1–4 · Nghe kỹ và lặp lại đúng thứ tự",
      }
    : {
        eyebrow: "GAME 11 · SOUND MEMORY",
        lead: "Listen to the neon tone sequence, remember its order, and replay it as the tempo accelerates.",
        score: "Score", best: "Best", round: "Round", lives: "Lives", combo: "Combo",
        listen: "Listen…", repeat: "Your turn", clear: "Sequence clear!", over: "Signal lost",
        start: "Start", restart: "Play again", assist: "Visual assist",
        help: "Tap a pad or press 1–4 · Listen closely and repeat the exact order",
      };

  const tone = useCallback((pad: Pad, duration = 0.22) => {
    if (muted) return;
    try {
      const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const context = audioRef.current ?? new Ctor();
      audioRef.current = context;
      if (context.state === "suspended") void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = pad === 3 ? "triangle" : "sine";
      oscillator.frequency.value = FREQUENCIES[pad];
      gain.gain.setValueAtTime(0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration);
    } catch { /* audio is optional */ }
  }, [muted]);

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const load = window.setTimeout(() => {
      const value = Number(window.localStorage.getItem(BEST_KEY));
      if (Number.isSafeInteger(value) && value >= 0) setStoredBest(value);
    }, 0);
    return () => { observer.disconnect(); window.clearTimeout(load); };
  }, []);

  useEffect(() => {
    if (game.score > storedBest) window.localStorage.setItem(BEST_KEY, String(game.score));
  }, [game.score, storedBest]);

  useEffect(() => {
    if (game.phase !== "playback") return;
    let cancelled = false;
    const timers: number[] = [];
    const delay = playbackDelay(game.round);
    game.sequence.forEach((pad, index) => {
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        tone(pad, Math.min(.3, delay / 1400));
        if (visualAssist) setLitPad(pad);
        timers.push(window.setTimeout(() => setLitPad(null), Math.round(delay * .55)));
      }, index * delay));
    });
    timers.push(window.setTimeout(() => {
      if (!cancelled) { setLitPad(null); setGame((current) => startInput(current)); }
    }, game.sequence.length * delay + 120));
    return () => { cancelled = true; timers.forEach((timer) => window.clearTimeout(timer)); };
  }, [game.phase, game.round, game.sequence, tone, visualAssist]);

  useEffect(() => {
    if (game.phase !== "roundClear") return;
    const timer = window.setTimeout(() => setGame((current) => nextRound(current)), 720);
    return () => window.clearTimeout(timer);
  }, [game.phase]);

  const choosePad = useCallback((pad: Pad) => {
    if (game.phase !== "input") return;
    tone(pad);
    setLitPad(pad);
    window.setTimeout(() => setLitPad(null), 160);
    setGame((current) => pressPad(current, pad));
  }, [game.phase, tone]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const pad = Number(event.key) - 1;
      if (pad >= 0 && pad < 4) { event.preventDefault(); choosePad(pad as Pad); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choosePad]);

  const reset = () => {
    setStoredBest((value) => Math.max(value, game.score));
    setLitPad(null);
    setGame(startEchoGame(createEchoGame(Date.now())));
  };
  const status = game.phase === "playback" ? copy.listen : game.phase === "input" ? copy.repeat : game.phase === "roundClear" ? copy.clear : game.phase === "gameover" ? copy.over : "Echo Circuit";

  return (
    <main className={`${styles.page} ${theme === "light" ? styles.light : ""}`}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div><p>{copy.eyebrow}</p><h1>Echo Circuit</h1><span>{copy.lead}</span></div>
          <div className={styles.actions}>
            <button type="button" onClick={() => setVisualAssist((value) => !value)} aria-pressed={visualAssist}>
              {visualAssist ? <Eye size={17} /> : <EyeOff size={17} />}{copy.assist}
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-pressed={muted}>
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}Sound
            </button>
            <button type="button" onClick={reset}><RefreshCw size={17} />{copy.restart}</button>
          </div>
        </header>
        <div className={styles.stats}>
          <span>{copy.score}<b>{game.score.toLocaleString()}</b></span><span>{copy.best}<b>{best.toLocaleString()}</b></span>
          <span>{copy.round}<b>{game.round}</b></span><span>{copy.lives}<b>{game.lives}</b></span><span>{copy.combo}<b>×{Math.max(1, game.combo)}</b></span>
        </div>
        <div className={styles.console}>
          <div className={styles.status}>
            <Waves size={22} /><small>{game.phase.toUpperCase()}</small><h2>{status}</h2>
            <div className={styles.progress}>{game.sequence.map((_, index) => <i className={index < game.expectedIndex ? styles.done : ""} key={index} />)}</div>
          </div>
          <div className={styles.pads} aria-label="Sound memory pads">
            {([0, 1, 2, 3] as Pad[]).map((pad) => (
              <button
                type="button" key={pad} aria-label={`Tone ${pad + 1}`}
                className={`${styles.pad} ${styles[`pad${pad + 1}`]} ${litPad === pad ? styles.lit : ""}`}
                onPointerDown={() => choosePad(pad)}
                disabled={game.phase !== "input"}
              >
                <span>{pad + 1}</span><i>{["DO", "MI", "SOL", "DO′"][pad]}</i>
              </button>
            ))}
          </div>
          <div className={styles.lives} aria-label={`${game.lives} lives remaining`}>
            {[0, 1, 2].map((life) => <Heart className={life < game.lives ? styles.alive : ""} fill={life < game.lives ? "currentColor" : "none"} key={life} />)}
          </div>
          {(game.phase === "ready" || game.phase === "gameover") && (
            <div className={styles.overlay}>
              <Volume2 size={36} /><small>SYNTH MEMORY LINK</small><h2>{game.phase === "ready" ? "Echo Circuit" : copy.over}</h2>
              <button type="button" onClick={reset}><Play size={18} />{game.phase === "ready" ? copy.start : copy.restart}</button>
            </div>
          )}
        </div>
        <p className={styles.help}>{copy.help}</p>
      </section>
    </main>
  );
}
