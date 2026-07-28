import type { TileValue } from "./merge-foundry-engine";

type ToneOptions = {
  frequency: number;
  duration: number;
  gain: number;
  type: OscillatorType;
  delay?: number;
  endFrequency?: number;
};

export class MergeFoundryAudio {
  private context: AudioContext | null = null;
  private muted = false;

  async unlock() {
    if (this.muted || typeof window === "undefined") return;
    try {
      this.context ??= new window.AudioContext();
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
    } catch {
      this.context = null;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.context?.state === "running") {
      void this.context.suspend().catch(() => undefined);
    } else if (!muted && this.context?.state === "suspended") {
      void this.context.resume().catch(() => undefined);
    }
  }

  private tone({
    frequency,
    duration,
    gain,
    type,
    delay = 0,
    endFrequency,
  }: ToneOptions) {
    const context = this.context;
    if (!context || this.muted || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + delay;
      const end = start + Math.min(0.32, Math.max(0.025, duration));

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
      }
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.addEventListener(
        "ended",
        () => {
          oscillator.disconnect();
          envelope.disconnect();
        },
        { once: true },
      );
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    } catch {
      // Audio is enhancement-only; gameplay remains available.
    }
  }

  playSlide() {
    this.tone({
      frequency: 180,
      endFrequency: 112,
      duration: 0.055,
      gain: 0.025,
      type: "triangle",
    });
  }

  playMerge(value: TileValue) {
    const level = Math.log2(value);
    const frequency = Math.min(880, 150 * 1.17 ** level);
    this.tone({
      frequency,
      endFrequency: Math.min(1040, frequency * 1.16),
      duration: Math.min(0.24, 0.1 + level * 0.012),
      gain: Math.min(0.1, 0.035 + level * 0.006),
      type: level >= 8 ? "sine" : "triangle",
    });
    if (value >= 256) {
      this.tone({
        frequency: frequency * 1.5,
        duration: 0.16,
        gain: 0.035,
        type: "sine",
        delay: 0.035,
      });
    }
  }
  playInvalid() {
    this.tone({
      frequency: 104,
      endFrequency: 82,
      duration: 0.11,
      gain: 0.045,
      type: "sawtooth",
    });
  }

  playOutcome(won: boolean) {
    const notes = won ? [329.63, 493.88, 659.25] : [164.81, 130.81, 98];
    notes.forEach((frequency, index) => {
      this.tone({
        frequency,
        duration: won ? 0.22 : 0.18,
        gain: won ? 0.065 : 0.05,
        type: won ? "sine" : "triangle",
        delay: index * 0.08,
      });
    });
  }

  dispose() {
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }
}
