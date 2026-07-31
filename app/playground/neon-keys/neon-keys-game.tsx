"use client";

import { Heart, Pause, Play, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import {
  CHALLENGE_MS,
  createPianoRun,
  hitNote,
  startPianoRun,
  tickPianoRun,
  togglePianoPause,
  type PianoRun,
} from "./neon-keys-engine";
import styles from "./neon-keys.module.css";

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const KEYS = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
const FREQUENCIES = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88];
const BLACK = new Set([1, 3, 6, 8, 10]);
const BEST_KEY = "dk-neon-keys-best-v1";

export default function NeonKeysGame() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<"challenge" | "free">("challenge");
  const [game, setGame] = useState<PianoRun>(() => createPianoRun(20260731));
  const [active, setActive] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [storedBest, setStoredBest] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const audioRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const activeTimer = useRef<number | null>(null);
  const best = Math.max(storedBest, game.score);
  const copy = language === "vi" ? {
    eyebrow: "GAME 12 · PIANO NHỊP ĐIỆU", lead: "Chơi piano synth tự do hoặc bắt nhịp các nốt rơi trong thử thách 60 giây.",
    challenge: "Thử thách", free: "Piano tự do", score: "Điểm", best: "Kỷ lục", time: "Thời gian",
    combo: "Combo", lives: "Mạng", start: "Bắt đầu", resume: "Tiếp tục", restart: "Chơi lại",
    ready: "Sẵn sàng lên sân khấu?", over: "Mất nhịp rồi!", complete: "Hoàn thành bản nhạc!",
    hint: "A W S E D F T G Y H U J · Chạm phím hoặc dùng bàn phím",
  } : {
    eyebrow: "GAME 12 · RHYTHM PIANO", lead: "Play the synth piano freely or catch falling notes in a sixty-second challenge.",
    challenge: "Challenge", free: "Free Play", score: "Score", best: "Best", time: "Time",
    combo: "Combo", lives: "Lives", start: "Start", resume: "Resume", restart: "Play again",
    ready: "Ready for the stage?", over: "Rhythm lost!", complete: "Track complete!",
    hint: "A W S E D F T G Y H U J · Tap keys or use your keyboard",
  };

  const tone = useCallback((index: number) => {
    if (muted) return;
    try {
      const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const context = audioRef.current ?? new Ctor();
      audioRef.current = context;
      if (context.state === "suspended") void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = BLACK.has(index) ? "sawtooth" : "triangle";
      oscillator.frequency.value = FREQUENCIES[index];
      gain.gain.setValueAtTime(.15, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .42);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + .42);
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
    if (game.phase !== "playing") return;
    lastRef.current = performance.now();
    const animate = (now: number) => {
      const delta = Math.min(50, now - lastRef.current);
      lastRef.current = now;
      setGame((current) => tickPianoRun(current, delta));
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [game.phase]);

  const press = useCallback((index: number) => {
    tone(index);
    setActive(index);
    if (activeTimer.current) window.clearTimeout(activeTimer.current);
    activeTimer.current = window.setTimeout(() => setActive(null), 130);
    if (mode === "challenge") setGame((current) => hitNote(current, index));
  }, [mode, tone]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const index = KEYS.indexOf(event.key.toLowerCase());
      if (index >= 0 && !event.repeat) { event.preventDefault(); press(index); }
      if (event.code === "Space" && mode === "challenge") {
        event.preventDefault();
        setGame((current) => current.phase === "ready" ? startPianoRun(current) : togglePianoPause(current));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, press]);

  const restart = () => setGame(startPianoRun(createPianoRun(Date.now())));
  const toggle = () => setGame((current) => current.phase === "ready" ? startPianoRun(current) : togglePianoPause(current));
  const status = game.phase === "gameover" ? copy.over : game.phase === "complete" ? copy.complete : copy.ready;

  return (
    <main className={`${styles.page} ${theme === "light" ? styles.light : ""}`}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div><p>{copy.eyebrow}</p><h1>Neon Keys</h1><span>{copy.lead}</span></div>
          <div className={styles.actions}>
            <div className={styles.mode}>
              <button className={mode === "challenge" ? styles.selected : ""} onClick={() => setMode("challenge")}>{copy.challenge}</button>
              <button className={mode === "free" ? styles.selected : ""} onClick={() => setMode("free")}>{copy.free}</button>
            </div>
            <button onClick={() => setMuted((value) => !value)} aria-label="Toggle sound">{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}Sound</button>
            <button onClick={restart}><RefreshCw size={17} />{copy.restart}</button>
          </div>
        </header>
        <div className={styles.stats}>
          <span>{copy.score}<b>{game.score.toLocaleString()}</b></span>
          <span>{copy.best}<b>{best.toLocaleString()}</b></span>
          <span>{copy.time}<b>{Math.ceil(game.remainingMs / 1000)}s</b></span>
          <span>{copy.combo}<b>×{game.combo}</b></span>
          <span>{copy.lives}<b className={styles.hearts}>{[0,1,2,3,4].map((life) => <Heart key={life} size={17} fill={life < game.lives ? "currentColor" : "none"} />)}</b></span>
        </div>
        <div className={styles.stage}>
          <div className={styles.lanes} aria-label="Falling piano notes">
            {NOTES.map((note, index) => <i key={note} className={BLACK.has(index) ? styles.darkLane : ""} />)}
            {mode === "challenge" && game.notes.map((note) => (
              <span key={note.id} className={`${styles.falling} ${BLACK.has(note.key) ? styles.sharp : ""}`} style={{ left: `${note.key * (100 / 12)}%`, top: `${note.progress * 100}%` }}>{NOTES[note.key]}</span>
            ))}
            <div className={styles.hitLine}><span>{game.judgement || (mode === "free" ? "FREE PLAY" : "HIT ZONE")}</span></div>
            {mode === "free" && <div className={styles.freeMessage}><Volume2 /><b>NEON SYNTH</b><small>12 CHROMATIC KEYS</small></div>}
          </div>
          <div className={styles.keyboard}>
            {NOTES.map((note, index) => (
              <button key={note} onPointerDown={() => press(index)} className={`${BLACK.has(index) ? styles.blackKey : styles.whiteKey} ${active === index ? styles.active : ""}`} aria-label={`Play ${note}`}>
                <b>{note}</b><small>{KEYS[index].toUpperCase()}</small>
              </button>
            ))}
          </div>
          {mode === "challenge" && (game.phase === "ready" || game.phase === "paused" || game.phase === "gameover" || game.phase === "complete") && (
            <div className={styles.overlay}>
              <small>PIANO RUSH · {CHALLENGE_MS / 1000} SEC</small><h2>{game.phase === "paused" ? "Paused" : status}</h2>
              <button onClick={game.phase === "gameover" || game.phase === "complete" ? restart : toggle}>
                {game.phase === "paused" ? <Play size={18} /> : game.phase === "ready" ? <Play size={18} /> : <RefreshCw size={18} />}
                {game.phase === "paused" ? copy.resume : game.phase === "ready" ? copy.start : copy.restart}
              </button>
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <p>{copy.hint}</p>
          {mode === "challenge" && game.phase === "playing" && <button onClick={toggle}><Pause size={16} />Pause</button>}
        </div>
      </section>
    </main>
  );
}
