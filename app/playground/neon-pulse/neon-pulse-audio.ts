import type { HitGrade } from "./neon-pulse-engine";

type ToneOptions = {
  frequency: number;
  duration: number;
  gain: number;
  type: OscillatorType;
  delay?: number;
};

export class NeonPulseAudio {
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
    }
  }

  private tone({ frequency, duration, gain, type, delay = 0 }: ToneOptions) {
    const context = this.context;
    if (!context || this.muted || context.state !== "running") return;

    try {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + delay;
      const end = start + Math.min(0.22, Math.max(0.04, duration));

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
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
      // Audio is enhancement-only. Gameplay remains available when it fails.
    }
  }

  playHit(grade: HitGrade, combo: number) {
    if (!this.context || this.muted) return;

    if (grade === "miss") {
      this.tone({
        frequency: 92,
        duration: 0.18,
        gain: 0.12,
        type: "sawtooth",
      });
      return;
    }

    if (grade === "good") {
      this.tone({
        frequency: 330,
        duration: 0.11,
        gain: 0.08,
        type: "triangle",
      });
      return;
    }

    const pentatonic = [440, 523.25, 659.25, 783.99, 880];
    const frequency = pentatonic[Math.abs(combo) % pentatonic.length];
    this.tone({
      frequency,
      duration: 0.14,
      gain: 0.1,
      type: "sine",
    });
    this.tone({
      frequency: frequency * 1.5,
      duration: 0.1,
      gain: 0.045,
      type: "triangle",
      delay: 0.025,
    });

    if (combo > 0 && combo % 5 === 0) {
      this.tone({
        frequency: frequency / 2,
        duration: 0.2,
        gain: 0.06,
        type: "square",
        delay: 0.055,
      });
    }
  }

  dispose() {
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }
}

