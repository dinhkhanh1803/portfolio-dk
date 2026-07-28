import type { MaterialTier } from "./merge-foundry-engine";

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

  playMerge(tier: MaterialTier) {
    const notes = [0, 220, 293.66, 369.99, 493.88, 659.25];
    const frequency = notes[tier];
    this.tone({
      frequency,
      duration: 0.13 + tier * 0.012,
      gain: 0.045 + tier * 0.008,
      type: tier >= 4 ? "sine" : "triangle",
    });
    if (tier >= 4) {
      this.tone({
        frequency: frequency * 1.5,
        duration: 0.11,
        gain: 0.035,
        type: "sine",
        delay: 0.025,
      });
    }
  }

  playDelivery(combo: number) {
    const sequence = [392, 493.88, 587.33, 659.25];
    const offset = Math.max(0, combo - 1) % sequence.length;
    this.tone({
      frequency: 118,
      duration: 0.07,
      gain: 0.055,
      type: "square",
    });
    this.tone({
      frequency: sequence[offset],
      duration: 0.18,
      gain: 0.075,
      type: "sine",
      delay: 0.045,
    });
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
