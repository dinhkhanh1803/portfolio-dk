"use client";

import { Heart, Pause, Play, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import {
  createPianoRun,
  hitNote,
  startPianoRun,
  tickPianoRun,
  togglePianoPause,
  type PianoRun,
} from "./neon-keys-engine";
import { PIANO_SONGS, getPianoSong, songDurationMs, type PianoSong } from "./neon-keys-songs";
import base from "./neon-keys.module.css";
import songs from "./neon-keys-song.module.css";

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const KEYS = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
const FREQUENCIES = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88];
const BLACK = new Set([1, 3, 6, 8, 10]);
const BEST_KEY = "dk-neon-keys-best-v2";
type BestMap = Record<string, number>;

const formatDuration = (milliseconds: number) => {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export default function NeonKeysSongGame() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<"challenge" | "free">("challenge");
  const [selectedSongId, setSelectedSongId] = useState("ode-to-joy");
  const [game, setGame] = useState<PianoRun>(() => createPianoRun("ode-to-joy"));
  const [active, setActive] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [bestScores, setBestScores] = useState<BestMap>({});
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const audioRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const activeTimer = useRef<number | null>(null);
  const previewTimers = useRef<number[]>([]);
  const song = getPianoSong(selectedSongId);
  const best = Math.max(bestScores[selectedSongId] ?? 0, game.score);
  const copy = language === "vi" ? {
    eyebrow: "GAME 12 · PIANO NHỊP ĐIỆU",
    lead: "Chọn một bản nhạc, bắt đúng nốt rơi và giữ combo — hoặc chuyển sang piano tự do.",
    challenge: "Theo bài", free: "Piano tự do", choose: "Chọn bài nhạc", score: "Điểm", best: "Kỷ lục",
    time: "Còn lại", combo: "Combo", lives: "Mạng", start: "Bắt đầu", resume: "Tiếp tục",
    restart: "Chơi lại", preview: "Nghe thử", ready: "Sẵn sàng lên sân khấu?", over: "Mất nhịp rồi!",
    complete: "Hoàn thành bản nhạc!", hint: "A W S E D F T G Y H U J · Chạm phím hoặc dùng bàn phím",
  } : {
    eyebrow: "GAME 12 · RHYTHM PIANO",
    lead: "Choose a song, catch every falling note, and hold your combo — or switch to Free Play.",
    challenge: "Songs", free: "Free Play", choose: "Choose a song", score: "Score", best: "Best",
    time: "Time left", combo: "Combo", lives: "Lives", start: "Start", resume: "Resume",
    restart: "Play again", preview: "Preview", ready: "Ready for the stage?", over: "Rhythm lost!",
    complete: "Track complete!", hint: "A W S E D F T G Y H U J · Tap keys or use your keyboard",
  };

  const tone = useCallback((index: number, duration = .42) => {
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
      gain.gain.setValueAtTime(.14, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch { /* sound is optional */ }
  }, [muted]);

  const stopPreview = useCallback(() => {
    previewTimers.current.forEach((timer) => window.clearTimeout(timer));
    previewTimers.current = [];
    setPreviewing(null);
  }, []);

  const previewSong = useCallback((target: PianoSong) => {
    stopPreview();
    setPreviewing(target.id);
    const beatMs = 60_000 / target.bpm;
    target.chart.slice(0, 8).forEach((note, index) => {
      previewTimers.current.push(window.setTimeout(() => tone(note.key, .3), index * beatMs * .55));
    });
    previewTimers.current.push(window.setTimeout(() => setPreviewing(null), 8 * beatMs * .55 + 200));
  }, [stopPreview, tone]);

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const load = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(BEST_KEY) ?? "{}") as BestMap;
        if (parsed && typeof parsed === "object") setBestScores(parsed);
      } catch { /* ignore invalid records */ }
    }, 0);
    return () => {
      observer.disconnect();
      window.clearTimeout(load);
      previewTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (game.score <= (bestScores[selectedSongId] ?? 0)) return;
    const next = { ...bestScores, [selectedSongId]: game.score };
    window.localStorage.setItem(BEST_KEY, JSON.stringify(next));
  }, [bestScores, game.score, selectedSongId]);

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

  const selectSong = (id: string) => {
    stopPreview();
    setSelectedSongId(id);
    setGame(createPianoRun(id));
  };
  const restart = () => setGame(startPianoRun(createPianoRun(selectedSongId)));
  const toggle = () => setGame((current) => current.phase === "ready" ? startPianoRun(current) : togglePianoPause(current));
  const status = game.phase === "gameover" ? copy.over : game.phase === "complete" ? copy.complete : copy.ready;

  return (
    <main className={`${base.page} ${theme === "light" ? base.light : ""}`}>
      <section className={base.shell}>
        <header className={base.hero}>
          <div><p>{copy.eyebrow}</p><h1>Neon Keys</h1><span>{copy.lead}</span></div>
          <div className={base.actions}>
            <div className={base.mode}>
              <button className={mode === "challenge" ? base.selected : ""} onClick={() => setMode("challenge")}>{copy.challenge}</button>
              <button className={mode === "free" ? base.selected : ""} onClick={() => setMode("free")}>{copy.free}</button>
            </div>
            <button onClick={() => setMuted((value) => !value)} aria-label="Toggle sound">{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}Sound</button>
            <button onClick={restart}><RefreshCw size={17} />{copy.restart}</button>
          </div>
        </header>

        {mode === "challenge" && (
          <section className={songs.songSection} aria-label={copy.choose}>
            <div className={songs.songHeading}><h2>{copy.choose}</h2><span>{PIANO_SONGS.length} TRACKS</span></div>
            <div className={songs.songPicker}>
              {PIANO_SONGS.map((item) => (
                <article className={`${songs.songCard} ${item.id === selectedSongId ? songs.selectedSong : ""}`} key={item.id}>
                  <button className={songs.songSelect} onClick={() => selectSong(item.id)} aria-pressed={item.id === selectedSongId}>
                    <small>{item.difficulty}</small><b>{item.title}</b><span>{item.composer}</span>
                    <em>{item.bpm} BPM · {formatDuration(songDurationMs(item))}</em>
                  </button>
                  <button className={songs.previewButton} onClick={() => previewSong(item)} aria-label={`${copy.preview}: ${item.title}`}>
                    {previewing === item.id ? <Volume2 size={14} /> : <Play size={14} />}{copy.preview}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className={base.stats}>
          <span>{copy.score}<b>{game.score.toLocaleString()}</b></span>
          <span>{copy.best}<b>{best.toLocaleString()}</b></span>
          <span>{copy.time}<b>{formatDuration(game.remainingMs)}</b></span>
          <span>{copy.combo}<b>×{game.combo}</b></span>
          <span>{copy.lives}<b className={base.hearts}>{[0, 1, 2, 3, 4].map((life) => <Heart key={life} size={17} fill={life < game.lives ? "currentColor" : "none"} />)}</b></span>
        </div>
        <div className={base.stage}>
          <div className={base.lanes} aria-label="Falling piano notes">
            {NOTES.map((note, index) => <i key={note} className={BLACK.has(index) ? base.darkLane : ""} />)}
            {mode === "challenge" && game.notes.map((falling) => (
              <span key={falling.id} className={`${base.falling} ${BLACK.has(falling.key) ? base.sharp : ""}`} style={{ left: `${falling.key * (100 / 12)}%`, top: `${falling.progress * 100}%` }}>{NOTES[falling.key]}</span>
            ))}
            <div className={base.hitLine}><span>{game.judgement || (mode === "free" ? "FREE PLAY" : "HIT ZONE")}</span></div>
            {mode === "free" && <div className={base.freeMessage}><Volume2 /><b>NEON SYNTH</b><small>12 CHROMATIC KEYS</small></div>}
          </div>
          <div className={base.keyboard}>
            {NOTES.map((note, index) => (
              <button key={note} onPointerDown={() => press(index)} className={`${BLACK.has(index) ? base.blackKey : base.whiteKey} ${active === index ? base.active : ""}`} aria-label={`Play ${note}`}>
                <b>{note}</b><small>{KEYS[index].toUpperCase()}</small>
              </button>
            ))}
          </div>
          {mode === "challenge" && (game.phase === "ready" || game.phase === "paused" || game.phase === "gameover" || game.phase === "complete") && (
            <div className={base.overlay}>
              <small>{song.title.toUpperCase()} · {song.bpm} BPM</small><h2>{game.phase === "paused" ? "Paused" : status}</h2>
              <button onClick={game.phase === "gameover" || game.phase === "complete" ? restart : toggle}>
                {game.phase === "paused" ? <Play size={18} /> : game.phase === "ready" ? <Play size={18} /> : <RefreshCw size={18} />}
                {game.phase === "paused" ? copy.resume : game.phase === "ready" ? copy.start : copy.restart}
              </button>
            </div>
          )}
        </div>
        <div className={base.footer}>
          <p>{copy.hint}</p>
          {mode === "challenge" && game.phase === "playing" && <button onClick={toggle}><Pause size={16} />Pause</button>}
        </div>
      </section>
    </main>
  );
}
