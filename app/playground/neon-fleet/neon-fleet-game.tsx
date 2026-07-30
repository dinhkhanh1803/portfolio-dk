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
import { NeonFleetBoard } from "./neon-fleet-board";
import { NeonFleetDialog } from "./neon-fleet-dialog";
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
import {
  attemptManualPlacement,
  buildAiKnowledge,
  buildTerminalMetrics,
  claimTerminalWrite,
  coordinateLabel,
  createMatchClock,
  createTerminalWriteGuard,
  isEnemyCellActionable,
  isShipSunk,
  pauseMatchClock,
  resetMatchClock,
  readMonotonicNow,
  resetTerminalWriteGuard,
  resumeMatchClock,
  startMatchClock,
  shouldScheduleAi,
  type TerminalMetrics,
} from "./neon-fleet-ui-state";

import styles from "./neon-fleet.module.css";

type Theme = "light" | "dark";

const readDocumentTheme = (): Theme => {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  if (root.dataset.theme === "dark" || root.classList.contains("dark")) return "dark";
  if (root.dataset.theme === "light" || root.classList.contains("light")) return "light";
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
type LogEntry = { id: number; text: string };

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
        const sunk = Boolean(ship && isShipSunk(ship));
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
  const [selectedShip, setSelectedShip] = useState<ShipId | null>("carrier");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [previewOrigin, setPreviewOrigin] = useState<Cell | null>(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState<Theme>(readDocumentTheme);
  const [stats, setStats] = useState<FleetStats>(DEFAULT_STATS);
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);
  const [announcement, setAnnouncement] = useState("Place your fleet to begin.");
  const [missionReport, setMissionReport] = useState<TerminalMetrics | null>(null);
  const [shotLocked, setShotLocked] = useState(false);
  const audioRef = useRef<ReturnType<typeof createFleetAudio> | null>(null);
  const clockRef = useRef(createMatchClock());
  const terminalGuardRef = useRef(createTerminalWriteGuard());
  const pausedRef = useRef(false);
  const shotLockedRef = useRef(false);
  const logIdRef = useRef(0);
  const pauseButtonRef = useRef<HTMLButtonElement | null>(null);
  const restartButtonRef = useRef<HTMLButtonElement | null>(null);

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
  const setPauseState = useCallback((next: boolean) => {
    if (pausedRef.current === next) return;
    const nowMs = readMonotonicNow();
    pausedRef.current = next;
    clockRef.current = next
      ? pauseMatchClock(clockRef.current, nowMs)
      : resumeMatchClock(clockRef.current, nowMs);
    setPaused(next);
  }, []);

  const rotatePlacement = useCallback(() => {
    if (match.phase !== "setup") return;
    setOrientation((current) => {
      const next = current === "horizontal" ? "vertical" : "horizontal";
      setAnnouncement(`Orientation changed to ${next}.`);
      return next;
    });
    setPreviewOrigin(null);
    void unlockAndPlay("click");
  }, [match.phase, unlockAndPlay]);

  const resetGame = useCallback((nextDifficulty: Difficulty = difficulty) => {
    const seed = Math.floor(readMonotonicNow()) >>> 0;
    terminalGuardRef.current = resetTerminalWriteGuard(terminalGuardRef.current);
    clockRef.current = resetMatchClock();
    pausedRef.current = false;
    shotLockedRef.current = false;
    logIdRef.current = 0;
    setDifficulty(nextDifficulty);
    setMatch(createMatch(nextDifficulty, seed));
    setSelectedShip("carrier");
    setOrientation("horizontal");
    setPreviewOrigin(null);
    setPaused(false);
    setShotLocked(false);
    setMissionReport(null);
    setAnnouncement("New deployment ready. Place all five ships.");
    setEventLog([]);
    void unlockAndPlay("click");
  }, [difficulty, unlockAndPlay]);

  useEffect(() => {
    audioRef.current = createFleetAudio();
    const storedStats = parseStats(safeRead(STATS_KEY));
    const storedMute = safeRead(MUTE_KEY) === "true";
    const readTheme = () => setTheme(readDocumentTheme());
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
      if (document.hidden && (match.phase === "playerTurn" || match.phase === "aiTurn")) setPauseState(true);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [match.phase, setPauseState]);

  useEffect(() => {
    const rotateWithKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.code !== "KeyR" || match.phase !== "setup" || target?.closest("input, textarea, select")) return;
      event.preventDefault();
      rotatePlacement();
    };
    window.addEventListener("keydown", rotateWithKeyboard);
    return () => window.removeEventListener("keydown", rotateWithKeyboard);
  }, [match.phase, rotatePlacement]);

  useEffect(() => {
    if (!shouldScheduleAi(match, paused)) return;
    audioRef.current?.play("radar");
    const timer = window.setTimeout(() => {
      const knowledge = buildAiKnowledge(match);
      const choice = chooseAiShot(match.difficulty, knowledge, match.seed);
      if (!choice.cell) {
        shotLockedRef.current = false;
        setShotLocked(false);
        setMatch({ ...match, phase: "playerTurn", seed: choice.seed, event: "Enemy scan exhausted" });
        appendLog(`T${match.turn}: Enemy scan - no legal target`);
        return;
      }

      const next = fireAiShot({ ...match, seed: choice.seed }, choice.cell);
      const result = next.player.shots[cellKey(choice.cell)];
      setMatch(next);
      shotLockedRef.current = false;
      setShotLocked(false);
      appendLog(`T${match.turn}: Enemy ${coordinateLabel(choice.cell)} - ${result}`);
      if (result) audioRef.current?.play(result);
      if (next.phase === "defeat") {
        setMissionReport(buildTerminalMetrics(next, clockRef.current, readMonotonicNow()));
        audioRef.current?.play("defeat");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [appendLog, match, paused]);

  useEffect(() => {
    if (!isTerminalPhase(match.phase) || !missionReport) return;
    const claim = claimTerminalWrite(terminalGuardRef.current, true);
    terminalGuardRef.current = claim.guard;
    if (!claim.shouldWrite) return;
    const next = recordMatch(stats, match.difficulty, {
      won: match.phase === "victory",
      accuracy: missionReport.accuracy,
      durationMs: Math.max(1, missionReport.durationMs),
    });
    setStats(next);
    safeWrite(STATS_KEY, JSON.stringify(next));
  }, [match, missionReport, stats]);


  const preview = useMemo(() => {
    if (!previewOrigin || !selectedShip || match.phase !== "setup") return null;
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
    if (match.phase !== "setup" || !selectedShip) return;
    const occupying = match.player.ships.find((ship) => ship.cells.some((part) => cellKey(part) === cellKey(cell)));
    if (occupying?.id === selectedShip) {
      setMatch(removeShip(match, occupying.id));
      setSelectedShip(occupying.id);
      setAnnouncement(`${occupying.name} removed. Select a new origin to place it again.`);
      void unlockAndPlay("click");
      return;
    }
    const attempt = attemptManualPlacement(match, selectedShip, cell, orientation);
    setAnnouncement(attempt.announcement);
    if (!attempt.accepted) {
      void unlockAndPlay("click");
      return;
    }
    setMatch(attempt.match);
    const nextUnplaced = FLEET.find((ship) => !attempt.match.player.ships.some((placed) => placed.id === ship.id));
    setSelectedShip(nextUnplaced?.id ?? null);
    setPreviewOrigin(null);
    void unlockAndPlay("click");
  };

  const selectDockShip = (shipId: ShipId) => {
    const definition = FLEET.find((ship) => ship.id === shipId);
    const placed = match.player.ships.some((ship) => ship.id === shipId);
    setMatch(placed ? removeShip(match, shipId) : match);
    setSelectedShip(shipId);
    setPreviewOrigin(null);
    setAnnouncement(placed ? `${definition?.name ?? "Ship"} removed and selected.` : `${definition?.name ?? "Ship"} selected for placement.`);
    void unlockAndPlay("click");
  };

  const beginBattle = () => {
    const next = startBattle(autoPlaceEnemy(match));
    if (next.phase !== "playerTurn") return;
    terminalGuardRef.current = resetTerminalWriteGuard(terminalGuardRef.current);
    clockRef.current = startMatchClock(clockRef.current, readMonotonicNow());
    pausedRef.current = false;
    shotLockedRef.current = false;
    logIdRef.current = 0;
    setShotLocked(false);
    setMissionReport(null);
    setEventLog([]);
    setPaused(false);
    setPreviewOrigin(null);
    setMatch(next);
    setAnnouncement("Battle started. Choose an untried enemy coordinate.");
    appendLog("T1: Fleet deployed - choose a target");
    void unlockAndPlay("click");
  };

  const playerFire = (cell: Cell) => {
    const key = cellKey(cell);
    if (!isEnemyCellActionable(match, cell, paused, shotLockedRef.current)) return;
    shotLockedRef.current = true;
    setShotLocked(true);
    const next = firePlayerShot(match, cell);
    if (next === match) {
      shotLockedRef.current = false;
      setShotLocked(false);
      return;
    }
    const result = next.enemy.shots[key];
    setMatch(next);
    appendLog(`T${next.turn}: You ${coordinateLabel(cell)} - ${result}`);
    void unlockAndPlay(result);
    if (next.phase === "victory") {
      setMissionReport(buildTerminalMetrics(next, clockRef.current, readMonotonicNow()));
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
    setPauseState(!pausedRef.current);
    void unlockAndPlay("click");
  };

  const autoPlacePlayerFleet = () => {
    setMatch(autoPlaceFleet(match));
    setSelectedShip(null);
    setPreviewOrigin(null);
    setAnnouncement("Fleet auto-placed. Review the board or start battle.");
    void unlockAndPlay("click");
  };

  const resetFleet = () => {
    clockRef.current = resetMatchClock();
    terminalGuardRef.current = resetTerminalWriteGuard(terminalGuardRef.current);
    pausedRef.current = false;
    shotLockedRef.current = false;
    setMatch(createMatch(difficulty, match.seed));
    setSelectedShip("carrier");
    setOrientation("horizontal");
    setPreviewOrigin(null);
    setPaused(false);
    setShotLocked(false);
    setMissionReport(null);
    setAnnouncement("Fleet reset. Place all five ships again.");
    setEventLog([]);
    void unlockAndPlay("click");
  };

  const playerShots = Object.keys(match.enemy.shots).length;
  const playerHits = Object.values(match.enemy.shots).filter((shot) => shot !== "miss").length;
  const accuracy = playerShots ? Math.round(playerHits / playerShots * 100) : 0;
  const selectedDefinition = FLEET.find((ship) => ship.id === selectedShip);
  const combat = match.phase !== "setup";
  const terminal = isTerminalPhase(match.phase);
  const difficultyStats = stats.byDifficulty[match.difficulty];

  return (
    <main suppressHydrationWarning className={`${styles.page} ${theme === "dark" ? styles.dark : styles.light}`}>
      <header className={styles.hero}>
        <div>
          <p>{copy.eyebrow}</p>
          <h1>Neon Fleet</h1>
          <span>{copy.lead}</span>
        </div>
        <div className={styles.actions}>
          <button ref={pauseButtonRef} type="button" onClick={togglePause} disabled={!combat || terminal}>
            {paused ? <Play size={17} /> : <Pause size={17} />} {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={toggleMute}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />} {muted ? "Unmute" : "Mute"}
          </button>
          <button ref={restartButtonRef} type="button" onClick={() => resetGame()}><RefreshCw size={17} /> Restart</button>
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
              <span>Selected ship: <b>{selectedDefinition?.name ?? "None"}</b> / {orientation}</span>
              <button type="button" aria-pressed={orientation === "vertical"} onClick={rotatePlacement}>
                <RotateCw size={16} /> Rotate: {orientation} <kbd>R</kbd>
              </button>
              <button type="button" onClick={autoPlacePlayerFleet}>
                <Anchor size={16} /> Auto-place
              </button>
              <button type="button" onClick={resetFleet}>Reset fleet</button>
              <button type="button" className={styles.startButton} disabled={match.player.ships.length !== FLEET.length} onClick={beginBattle}>
                <Crosshair size={16} /> Start battle
              </button>
            </div>
            <p className={styles.setupHint}>Hover or focus a cell to preview placement. Press R or right-click Your Fleet to rotate.</p>
          </section>
        )}

        <div className={`${styles.boards} ${combat ? styles.boardsCombat : ""}`}>
          <section className={styles.playerSection} aria-labelledby="player-board-title">
            <div className={styles.boardHead}><div><span>Friendly sector</span><h2 id="player-board-title">Your Fleet</h2></div><FleetReadout board={match.player} /></div>
            <NeonFleetBoard
              active={match.phase === "setup" && selectedShip !== null}
              board={match.player}
              enemy={false}
              isCellActionable={() => match.phase === "setup" && selectedShip !== null}
              label="Your Fleet"
              onCellAction={placeSelectedShip}
              onCellFocus={setPreviewOrigin}
              onMouseLeave={() => setPreviewOrigin(null)}
              onRotate={match.phase === "setup" ? rotatePlacement : undefined}
              preview={preview}
            />
          </section>
          <section className={styles.enemySection} aria-labelledby="enemy-board-title">
            <div className={styles.boardHead}><div><span>Target sector</span><h2 id="enemy-board-title">Enemy Waters</h2></div><FleetReadout board={match.enemy} concealed /></div>
            <NeonFleetBoard
              active={match.phase === "playerTurn" && !paused && !shotLocked}
              board={match.enemy}
              enemy
              isCellActionable={(cell) => isEnemyCellActionable(match, cell, paused, shotLocked)}
              label="Enemy Waters"
              onCellAction={playerFire}
              radarActive={shouldScheduleAi(match, paused)}
              revealAllShips={terminal}
            />
          </section>
        </div>

        <section className={styles.log} aria-labelledby="event-log-title">
          <div><span>Combat feed</span><h2 id="event-log-title">Event log</h2></div>
          <ol>
            {eventLog.length ? eventLog.map((entry) => <li key={entry.id}>{entry.text}</li>) : <li>Awaiting deployment coordinates.</li>}
          </ol>
        </section>

        <NeonFleetDialog
          className={styles.overlay}
          labelledBy="pause-title"
          onEscape={togglePause}
          open={paused && !terminal}
          returnFocusRef={pauseButtonRef}
        >
          <Anchor size={30} />
          <h2 id="pause-title">Operations paused</h2>
          <p>The active battle clock and enemy targeting are suspended. Paused time is excluded.</p>
          <button type="button" onClick={togglePause}><Play size={17} /> Resume</button>
        </NeonFleetDialog>

        <NeonFleetDialog
          className={styles.overlay}
          labelledBy="terminal-title"
          open={terminal && missionReport !== null}
          returnFocusRef={restartButtonRef}
        >
          {missionReport && (
            <>
              <Crosshair size={32} />
              <p>MISSION REPORT</p>
              <h2 id="terminal-title">{match.phase === "victory" ? "Victory" : "Defeat"}</h2>
              <div className={styles.report}>
                <span><b>{missionReport.shots}</b> Shots</span>
                <span><b>{missionReport.hits}</b> Hits</span>
                <span><b>{missionReport.accuracy}%</b> Accuracy</span>
                <span><b>{missionReport.yourShipsRemaining}</b> Your ships remaining</span>
                <span><b>{missionReport.enemyShipsRemaining}</b> Enemy ships remaining</span>
                <span><b>{Math.ceil(missionReport.durationMs / 1000)}s</b> Active duration</span>
              </div>
              <small>{difficultyStats.played} recorded / {difficultyStats.won} won / best {difficultyStats.bestAccuracy}%</small>
              <small>Active battle duration excludes paused and hidden time.</small>
              <button type="button" onClick={() => resetGame()}><RefreshCw size={17} /> Rematch</button>
            </>
          )}
        </NeonFleetDialog>

        <p className={styles.srStatus} aria-live="polite">{paused ? "Game paused" : match.event}</p>
        <p className={styles.srStatus} role="status" aria-live="assertive">{announcement}</p>
      </section>
    </main>
  );
}
