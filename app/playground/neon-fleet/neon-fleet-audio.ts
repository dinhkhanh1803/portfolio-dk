export type FleetAudioCue = "radar" | "miss" | "hit" | "sunk" | "victory" | "defeat" | "click";

type CueSettings = { frequency: number; duration: number; volume: number };

const CUES: Record<FleetAudioCue, CueSettings> = {
  radar: { frequency: 280, duration: 0.12, volume: 0.035 },
  miss: { frequency: 150, duration: 0.1, volume: 0.04 },
  hit: { frequency: 90, duration: 0.14, volume: 0.05 },
  sunk: { frequency: 65, duration: 0.2, volume: 0.06 },
  victory: { frequency: 620, duration: 0.24, volume: 0.06 },
  defeat: { frequency: 110, duration: 0.22, volume: 0.05 },
  click: { frequency: 360, duration: 0.07, volume: 0.025 },
};

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const audioContextConstructor = (): typeof AudioContext | null => {
  if (typeof window === "undefined") return null;
  const browserWindow = window as AudioWindow;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext ?? null;
};

export const createFleetAudio = () => {
  let context: AudioContext | null = null;
  let muted = false;
  let disposed = false;

  const unlock = async (): Promise<void> => {
    if (disposed) return;
    try {
      const AudioContextConstructor = audioContextConstructor();
      if (!AudioContextConstructor) return;
      context ??= new AudioContextConstructor();
      if (context.state === "suspended") await context.resume();
    } catch {
      // Browser privacy policies or unavailable audio are deliberately non-fatal.
    }
  };

  const play = (cue: FleetAudioCue): void => {
    if (disposed || muted || !context || !(cue in CUES)) return;
    try {
      const settings = CUES[cue];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = cue === "miss" || cue === "defeat" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(settings.frequency, now);
      gain.gain.setValueAtTime(settings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + settings.duration + 0.01);
    } catch {
      // Individual sound effects should never interrupt gameplay.
    }
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    const closingContext = context;
    context = null;
    try {
      void closingContext?.close().catch(() => undefined);
    } catch {
      // Closing is best effort because browsers may already have shut the context down.
    }
  };

  return {
    unlock,
    setMuted: (value: boolean): void => { muted = Boolean(value); },
    play,
    dispose,
  };
};
