"use client";

import {
  Anchor,
  Crosshair,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../language-provider";
import { chooseAiShot } from "./neon-fleet-ai";
import { createFleetAudio, type FleetAudioCue } from "./neon-fleet-audio";
import {
  BOARD_SIZE,
  DIFFICULTIES,
  FLEET,
  cellKey,
  type BoardState,
  type Cell,
  type Difficulty,
  type Orientation,
  type ShipId,
  type ShotResult,
} from "./neon-fleet-data";
import {
  autoPlaceEnemy,
  autoPlaceFleet,
  createMatch,
  fireAiShot,
  firePlayerShot,
  placeShip,
  removeShip,
  startBattle,
  type FleetMatch,
} from "./neon-fleet-engine";
import {
  DEFAULT_STATS,
  MUTE_KEY,
  STATS_KEY,
  parseStats,
  recordMatch,
  safeRead,
  safeWrite,
  type FleetStats,
} from "./neon-fleet-storage";
import styles from "./neon-fleet.module.css";

type Theme = "light" | "dark";
type LogEntry = { id: number; text: string };
type BoardOwner = "player" | "enemy";

const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
  x: index % BOARD_SIZE,
  y: Math.floor(index / BOARD_SIZE),
}));

const coordinates = ({ x, y }: Cell) => `${String.fromCharCode(65 + y)}${x + 1}`;
const shotCount = (board: BoardState) => Object.keys(board.shots).length;
const hitCount = (board: BoardState) => Object.values(board.shots).filter((shot) => shot !== "miss").length;
const isSunk = (ship: BoardState["ships"][number]) => ship.hits.length >= ship.length;
const isTerminalPhase = (phase: FleetMatch["phase"]) => phase === "victory" || phase === "defeat";
const displayPhase = (phase: FleetMatch["phase"]) => ({
  setup: "Deployment",
  playerTurn: "Your turn",
  aiTurn: "Enemy scan",
  victory: "Victory",
  defeat: "Defeat",
})[phase];

function FleetReadout({ board, concealed = false }: { board: BoardState; concealed?: boolean }) {
  return (
    <div className={styles.fleetReadout} aria-label={concealed ? "Enemy remaining fleet" : "Your remaining fleet"}>
      {FLEET.map((definition) => {
        const ship = board.ships.find((item) => item.id === definition.id);
        const sunk = Boolean(ship && isSunk(ship));
        return (
          <div key={definition.id} data-sunk={sunk || undefined}>
            <span aria-hidden="true">{Array.from({ length: definition.length }, (_, index) => <i key={index} />)}</span>
            <small>{concealed ? `${definition.length}-cell vessel` : definition.name}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function NeonFleetGame() {
  const { language } = useLanguage();
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [match, setMatch] = useState(() => createMatch("normal"));
  const [selectedShip, setSelectedShip] = useState<ShipId>("carrier");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [previewOrigin, setPreviewOrigin] = useState<Cell | null>(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [stats, setStats] = useState<FleetStats>(DEFAULT_STATS);
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);
  const [durationMs, setDurationMs] = useState(0);
  const audioRef = useRef<ReturnType<typeof createFleetAudio> | null>(null);
  const startedAtRef = useRef(0);
  const recordedRef = useRef(false);
  const shotLockedRef = useRef(false);
  const logIdRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const copy = useMemo(() => language === "vi" ? {
    eyebrow: "GAME 08 · CHIẾN THUẬT CỔ ĐIỂN",
    lead: "Triển khai hạm đội, đọc tín hiệu radar và đánh chìm toàn bộ chiến hạm AI.",
  } : {
    eyebrow: "GAME 08 · CLASSIC STRATEGY",
    lead: "Deploy your fleet, read the radar, and sink the AI armada before it finds you.",
  }, [language]);

  const appendLog = useCallback((text: string) => {
    logIdRef.current += 1;
    setEventLog((current) => [...current, { id: logIdRef.current, text }].slice(-4));
  }, []);

  const unlockAndPlay = useCallback(async (cue: FleetAudioCue = "click") => {
    const audio = audioRef.current;
    if (!audio) return;
    await audio.unlock();
    audio.play(cue);
  }, []);

  const resetGame = useCallback((nextDifficulty: Difficulty = difficulty) => {
    const seed = Date.now() >>> 0;
    recordedRef.current = false;
    shotLockedRef.current = false;
    startedAtRef.current = 0;
    logIdRef.current = 0;
    setDifficulty(nextDifficulty);
    setMatch(createMatch(nextDifficulty, seed));
    setSelectedShip("carrier");
    setOrientation("horizontal");
    setPreviewOrigin(null);
    setPaused(false);
    setDurationMs(0);
    setEventLog([]);
    void unlockAndPlay("click");
  }, [difficulty, unlockAndPlay]);

  useEffect(() => {
    audioRef.current = createFleetAudio();
    const storedStats = parseStats(safeRead(STATS_KEY));
    const storedMute = safeRead(MUTE_KEY) === "true";
    const readTheme = () => {
      const root = document.documentElement;
      setTheme(root.dataset.theme === "dark" || root.classList.contains("dark") ? "dark" : "light");
    };
    audioRef.current.setMuted(storedMute);
    const hydrateTimer = window.setTimeout(() => {
      setStats(storedStats);
      setMuted(storedMute);
      readTheme();
    }, 0);
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => {
      window.clearTimeout(hydrateTimer);
      observer.disconnect();
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && (match.phase === "playerTurn" || match.phase === "aiTurn")) setPaused(true);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [match.phase]);

  useEffect(() => {
    const rotateWithKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.code !== "KeyR" || match.phase !== "setup" || target?.closest("input, textarea, select")) return;
      event.preventDefault();
      setOrientation((current) => current === "horizontal" ? "vertical" : "horizontal");
      void unlockAndPlay("click");
    };
    window.addEventListener("keydown", rotateWithKeyboard);
    return () => window.removeEventListener("keydown", rotateWithKeyboard);
  }, [match.phase, unlockAndPlay]);

  useEffect(() => {
    if (match.phase !== "aiTurn" || paused) return;
    audioRef.current?.play("radar");
    const timer = window.setTimeout(() => {
      const knowledge = {
        shots: match.player.shots,
        remainingLengths: match.player.ships
          .filter((ship) => !isSunk(ship))
          .map((ship) => ship.length),
      };
      const choice = chooseAiShot(match.difficulty, knowledge, match.seed);
      if (!choice.cell) {
        shotLockedRef.current = false;
        setMatch({ ...match, phase: "playerTurn", seed: choice.seed, event: "Enemy scan exhausted" });
        appendLog(`T${match.turn}: Enemy scan - no legal target`);
        return;
      }

      const next = fireAiShot({ ...match, seed: choice.seed }, choice.cell);
      const result = next.player.shots[cellKey(choice.cell)];
      setMatch(next);
      shotLockedRef.current = false;
      appendLog(`T${match.turn}: Enemy ${coordinates(choice.cell)} - ${result}`);
      if (result) audioRef.current?.play(result);
      if (next.phase === "defeat") {
        const elapsed = Math.max(1, window.performance.now() - startedAtRef.current);
        setDurationMs(elapsed);
        audioRef.current?.play("defeat");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [appendLog, match, paused]);

  useEffect(() => {
    if (!isTerminalPhase(match.phase) || recordedRef.current) return;
    recordedRef.current = true;
    const shots = shotCount(match.enemy);
    const hits = hitCount(match.enemy);
    const elapsed = Math.max(1, durationMs || window.performance.now() - startedAtRef.current);
    const next = recordMatch(stats, match.difficulty, {
      won: match.phase === "victory",
      accuracy: shots ? hits / shots * 100 : 0,
      durationMs: elapsed,
    });
    setStats(next);
    safeWrite(STATS_KEY, JSON.stringify(next));
  }, [durationMs, match, stats]);

  useEffect(() => {
    if (!paused && !isTerminalPhase(match.phase)) return;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [match.phase, paused]);

  const preview = useMemo(() => {
    if (!previewOrigin || match.phase !== "setup") return null;
    const candidate = placeShip(match, selectedShip, previewOrigin, orientation);
    const placed = candidate.player.ships.find((ship) => ship.id === selectedShip);
    if (candidate !== match && placed) return { valid: true, keys: new Set(placed.cells.map(cellKey)) };

    const definition = FLEET.find((ship) => ship.id === selectedShip);
    const desired = Array.from({ length: definition?.length ?? 0 }, (_, index) => ({
      x: previewOrigin.x + (orientation === "horizontal" ? index : 0),
      y: previewOrigin.y + (orientation === "vertical" ? index : 0),
    })).filter((cell) => cell.x >= 0 && cell.x < BOARD_SIZE && cell.y >= 0 && cell.y < BOARD_SIZE);
    return { valid: false, keys: new Set(desired.map(cellKey)) };
  }, [match, orientation, previewOrigin, selectedShip]);

  const placeSelectedShip = (cell: Cell) => {
    if (match.phase !== "setup") return;
    const occupying = match.player.ships.find((ship) => ship.cells.some((part) => cellKey(part) === cellKey(cell)));
    if (occupying) {
      setMatch(removeShip(match, occupying.id));
      setSelectedShip(occupying.id);
      void unlockAndPlay("click");
      return;
    }
    const next = placeShip(match, selectedShip, cell, orientation);
    if (next === match) return;
    setMatch(next);
    const nextUnplaced = FLEET.find((ship) => !next.player.ships.some((placed) => placed.id === ship.id));
    if (nextUnplaced) setSelectedShip(nextUnplaced.id);
    setPreviewOrigin(null);
    void unlockAndPlay("click");
  };

  const selectDockShip = (shipId: ShipId) => {
    const placed = match.player.ships.some((ship) => ship.id === shipId);
    setMatch(placed ? removeShip(match, shipId) : match);
    setSelectedShip(shipId);
    setPreviewOrigin(null);
    void unlockAndPlay("click");
  };

  const beginBattle = (startedAt: number) => {
    const next = startBattle(autoPlaceEnemy(match));
    if (next.phase !== "playerTurn") return;
    recordedRef.current = false;
    shotLockedRef.current = false;
    startedAtRef.current = startedAt;
    logIdRef.current = 0;
    setDurationMs(0);
    setEventLog([]);
    setPaused(false);
    setPreviewOrigin(null);
    setMatch(next);
    appendLog("T1: Fleet deployed - choose a target");
    void unlockAndPlay("click");
  };

  const playerFire = (cell: Cell, firedAt: number) => {
    const key = cellKey(cell);
    if (paused || match.phase !== "playerTurn" || match.enemy.shots[key] || shotLockedRef.current) return;
    shotLockedRef.current = true;
    const next = firePlayerShot(match, cell);
    if (next === match) {
      shotLockedRef.current = false;
      return;
    }
    const result = next.enemy.shots[key];
    setMatch(next);
    appendLog(`T${next.turn}: You ${coordinates(cell)} - ${result}`);
    void unlockAndPlay(result);
    if (next.phase === "victory") {
      const elapsed = Math.max(1, firedAt - startedAtRef.current);
      setDurationMs(elapsed);
      void unlockAndPlay("victory");
    }
  };

  const toggleMute = () => {
    const next = !muted;
    void audioRef.current?.unlock();
    setMuted(next);
    audioRef.current?.setMuted(next);
    safeWrite(MUTE_KEY, String(next));
    if (!next) void unlockAndPlay("click");
  };

  const togglePause = () => {
    if (match.phase !== "playerTurn" && match.phase !== "aiTurn") return;
    setPaused((current) => !current);
    void unlockAndPlay("click");
  };

  const resetFleet = () => {
    setMatch(createMatch(difficulty, match.seed));
    setSelectedShip("carrier");
    setOrientation("horizontal");
    setPreviewOrigin(null);
    setEventLog([]);
    void unlockAndPlay("click");
  };

  const renderBoard = (owner: BoardOwner) => {
    const board = match[owner];
    const enemy = owner === "enemy";
    const canTarget = enemy && match.phase === "playerTurn" && !paused;
    const terminal = isTerminalPhase(match.phase);
    return (
      <div
        className={`${styles.board} ${enemy && match.phase === "aiTurn" && !paused ? styles.radarActive : ""}`}
        role="grid"
        aria-label={enemy ? "Enemy Waters" : "Your Fleet"}
        onMouseLeave={() => !enemy && setPreviewOrigin(null)}
        onContextMenu={(event) => {
          if (enemy || match.phase !== "setup") return;
          event.preventDefault();
          setOrientation((current) => current === "horizontal" ? "vertical" : "horizontal");
          void unlockAndPlay("click");
        }}
      >
        {cells.map((cell) => {
          const key = cellKey(cell);
          const ship = board.ships.find((item) => item.cells.some((part) => cellKey(part) === key));
          const shot: ShotResult | undefined = board.shots[key];
          const revealShip = Boolean(ship && (!enemy || shot === "sunk" || terminal));
          const placement = !enemy && preview?.keys.has(key) ? (preview.valid ? "valid" : "invalid") : undefined;
          const interactiveSetupCell = !enemy && match.phase === "setup";
          const disabled = enemy ? !canTarget || Boolean(shot) : !interactiveSetupCell;
          return (
            <button
              type="button"
              role="gridcell"
              key={key}
              data-ship={revealShip || undefined}
              data-shot={shot}
              data-preview={placement}
              disabled={disabled}
              aria-label={`${enemy ? "Enemy" : "Your"} ${String.fromCharCode(65 + cell.y)}${cell.x + 1}, ${shot ?? (revealShip ? "ship" : "untried")}`}
              onMouseEnter={() => interactiveSetupCell && setPreviewOrigin(cell)}
              onFocus={() => interactiveSetupCell && setPreviewOrigin(cell)}
              onClick={(event) => enemy ? playerFire(cell, event.timeStamp) : placeSelectedShip(cell)}
            >
              {shot === "miss" && <span className={styles.missMark} aria-hidden="true" />}
              {(shot === "hit" || shot === "sunk") && <span className={styles.hitMark} aria-hidden="true">&times;</span>}
            </button>
          );
        })}
        {enemy && match.phase === "aiTurn" && !paused && <span className={styles.radarSweep} aria-hidden="true" />}
      </div>
    );
  };

  const playerShots = shotCount(match.enemy);
  const playerHits = hitCount(match.enemy);
  const accuracy = playerShots ? Math.round(playerHits / playerShots * 100) : 0;
  const selectedDefinition = FLEET.find((ship) => ship.id === selectedShip) ?? FLEET[0];
  const combat = match.phase !== "setup";
  const terminal = isTerminalPhase(match.phase);
  const elapsed = durationMs;
  const difficultyStats = stats.byDifficulty[match.difficulty];

  return (
    <main className={`${styles.page} ${theme === "dark" ? styles.dark : styles.light}`}>
      <header className={styles.hero}>
        <div>
          <p>{copy.eyebrow}</p>
          <h1>Neon Fleet</h1>
          <span>{copy.lead}</span>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={togglePause} disabled={!combat || terminal}>
            {paused ? <Play size={17} /> : <Pause size={17} />} {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={toggleMute}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />} {muted ? "Unmute" : "Mute"}
          </button>
          <button type="button" onClick={() => resetGame()}><RefreshCw size={17} /> Restart</button>
        </div>
      </header>

      <section className={styles.shell}>
        <div className={styles.status} aria-label="Battle status">
          <div><span>Phase</span><strong>{displayPhase(match.phase)}</strong></div>
          <div><span>Turn</span><strong>{Math.max(1, match.turn)}</strong></div>
          <div><span>Difficulty</span><strong>{DIFFICULTIES[match.difficulty].label}</strong></div>
          <div><span>Shots</span><strong>{playerShots}</strong></div>
          <div><span>Hits</span><strong>{playerHits}</strong></div>
          <div><span>Accuracy</span><strong>{accuracy}%</strong></div>
        </div>

        {match.phase === "setup" && (
          <section className={styles.setup} aria-labelledby="deployment-title">
            <div className={styles.setupHead}>
              <div><span>Deployment console</span><strong id="deployment-title">Select and place five vessels</strong></div>
              <div className={styles.difficulties} aria-label="Choose Easy, Normal, or Hard difficulty">
                {(["easy", "normal", "hard"] as Difficulty[]).map((item) => (
                  <button type="button" key={item} aria-pressed={difficulty === item} disabled={match.phase !== "setup"} onClick={() => resetGame(item)}>
                    {DIFFICULTIES[item].label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.dock}>
              {FLEET.map((ship) => {
                const placed = match.player.ships.some((item) => item.id === ship.id);
                return (
                  <button type="button" key={ship.id} aria-pressed={selectedShip === ship.id} data-placed={placed || undefined} onClick={() => selectDockShip(ship.id)}>
                    <span>{ship.name}<small>Length {ship.length}</small></span>
                    <b>{placed ? "Placed - select to remove" : "Ready"}</b>
                  </button>
                );
              })}
            </div>
            <div className={styles.setupControls}>
              <span>Selected ship: <b>{selectedDefinition.name}</b> / {orientation}</span>
              <button type="button" onClick={() => { setOrientation((current) => current === "horizontal" ? "vertical" : "horizontal"); void unlockAndPlay("click"); }}>
                <RotateCw size={16} /> Rotate <kbd>R</kbd>
              </button>
              <button type="button" onClick={() => { setMatch(autoPlaceFleet(match)); setPreviewOrigin(null); void unlockAndPlay("click"); }}>
                <Anchor size={16} /> Auto-place
              </button>
              <button type="button" onClick={resetFleet}>Reset fleet</button>
              <button type="button" className={styles.startButton} disabled={match.player.ships.length !== FLEET.length} onClick={(event) => beginBattle(event.timeStamp)}>
                <Crosshair size={16} /> Start battle
              </button>
            </div>
            <p className={styles.setupHint}>Hover or focus a cell to preview placement. Press R or right-click Your Fleet to rotate.</p>
          </section>
        )}

        <div className={`${styles.boards} ${combat ? styles.boardsCombat : ""}`}>
          <section className={styles.playerSection} aria-labelledby="player-board-title">
            <div className={styles.boardHead}><div><span>Friendly sector</span><h2 id="player-board-title">Your Fleet</h2></div><FleetReadout board={match.player} /></div>
            {renderBoard("player")}
          </section>
          <section className={styles.enemySection} aria-labelledby="enemy-board-title">
            <div className={styles.boardHead}><div><span>Target sector</span><h2 id="enemy-board-title">Enemy Waters</h2></div><FleetReadout board={match.enemy} concealed /></div>
            {renderBoard("enemy")}
          </section>
        </div>

        <section className={styles.log} aria-labelledby="event-log-title">
          <div><span>Combat feed</span><h2 id="event-log-title">Event log</h2></div>
          <ol>
            {eventLog.length ? eventLog.map((entry) => <li key={entry.id}>{entry.text}</li>) : <li>Awaiting deployment coordinates.</li>}
          </ol>
        </section>

        {paused && !terminal && (
          <div ref={dialogRef} className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="pause-title">
            <Anchor size={30} />
            <h2 id="pause-title">Operations paused</h2>
            <p>Timers and enemy targeting are safely suspended.</p>
            <button type="button" onClick={togglePause}><Play size={17} /> Resume</button>
          </div>
        )}

        {terminal && (
          <div ref={dialogRef} className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="terminal-title">
            <Crosshair size={32} />
            <p>MISSION REPORT</p>
            <h2 id="terminal-title">{match.phase === "victory" ? "Victory" : "Defeat"}</h2>
            <div className={styles.report}>
              <span><b>{playerShots}</b> shots</span><span><b>{playerHits}</b> hits</span><span><b>{accuracy}%</b> accuracy</span><span><b>{Math.ceil(elapsed / 1000)}s</b> duration</span>
            </div>
            <small>{difficultyStats.played} recorded / {difficultyStats.won} won / best {difficultyStats.bestAccuracy}%</small>
            <button type="button" onClick={() => resetGame()}><RefreshCw size={17} /> Rematch</button>
          </div>
        )}

        <p className={styles.srStatus} aria-live="polite">{paused ? "Game paused" : match.event}</p>
      </section>
    </main>
  );
}
